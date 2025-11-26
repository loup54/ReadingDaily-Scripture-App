"""
Firebase Cloud Functions for ReadingDaily Scripture App
Main scraper and data processing functions
"""

from firebase_functions import scheduler_fn, https_fn
from firebase_admin import initialize_app, firestore
from datetime import datetime, timedelta
import logging
import hashlib
import json
import os
import pytz

# Google Play Billing imports
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Import scraper modules
from scrapers.usccb_scraper import USCCBScraper
from scrapers.validator import validate_reading, calculate_checksum

# Initialize Firebase Admin (lazily in functions)
# Will be initialized on first function call

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db():
    """Get Firestore client (lazy initialization)"""
    try:
        return firestore.client()
    except:
        # Initialize app if not done
        initialize_app()
        return firestore.client()


@https_fn.on_request()
def manual_scrape(req: https_fn.Request) -> https_fn.Response:
    """
    Manual trigger endpoint for scraping specific date
    Usage: POST /manual_scrape with JSON body: {"date": "2025-10-01"}
    """
    try:
        # Parse request
        data = req.get_json()
        if not data or 'date' not in data:
            return https_fn.Response(
                json.dumps({'error': 'Missing date parameter'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        # Parse date
        date_str = data['date']
        target_date = datetime.fromisoformat(date_str).date()

        logger.info(f"Manual scrape requested for {date_str}")

        # Scrape reading
        reading = scrape_reading_for_date(target_date)

        if reading:
            # Validate
            is_valid, errors = validate_reading(reading)

            if is_valid:
                # Calculate checksum
                checksum = calculate_checksum(reading)

                # Add metadata
                reading['metadata'] = {
                    'scrapedAt': datetime.utcnow().isoformat() + 'Z',
                    'source': reading.get('metadata', {}).get('source', 'USCCB'),
                    'checksum': checksum,
                    'validated': True,
                    'version': '1.0',
                    'manualTrigger': True
                }

                # Store in Firestore
                doc_ref = get_db().collection('readings').document(date_str)
                doc_ref.set(reading)

                return https_fn.Response(
                    json.dumps({
                        'success': True,
                        'date': date_str,
                        'source': reading['metadata']['source']
                    }),
                    status=200,
                    headers={'Content-Type': 'application/json'}
                )
            else:
                return https_fn.Response(
                    json.dumps({
                        'success': False,
                        'error': 'Validation failed',
                        'details': errors
                    }),
                    status=500,
                    headers={'Content-Type': 'application/json'}
                )
        else:
            return https_fn.Response(
                json.dumps({
                    'success': False,
                    'error': 'Scraping failed'
                }),
                status=500,
                headers={'Content-Type': 'application/json'}
            )

    except Exception as e:
        logger.error(f"Manual scrape error: {str(e)}")
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


def scrape_reading_for_date(date):
    """
    Attempt to scrape reading from multiple sources
    Returns reading dict or None if all sources fail
    """
    # Try USCCB first
    scraper = USCCBScraper()
    reading = scraper.scrape(date)

    if reading:
        logger.info(f"✅ Scraped from USCCB for {date}")
        return reading

    # TODO: Add fallback scrapers (Catholic.org, Universalis, etc.)
    logger.warning(f"⚠️ All scrapers failed for {date}")
    return None


def cleanup_old_readings(cutoff_date):
    """
    Delete readings older than cutoff date to save storage
    """
    try:
        cutoff_str = cutoff_date.isoformat()

        # Query old readings
        old_readings = get_db().collection('readings').where('date', '<', cutoff_str).stream()

        deleted_count = 0
        for doc in old_readings:
            doc.reference.delete()
            deleted_count += 1

        if deleted_count > 0:
            logger.info(f"🗑️ Cleaned up {deleted_count} old readings before {cutoff_str}")

    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}")


@https_fn.on_request()
def validate_google_receipt(req: https_fn.Request) -> https_fn.Response:
    """
    Validate Google Play purchase receipt

    Expected POST body:
    {
        "packageName": "com.readingdaily.scripture",
        "productId": "lifetime_access_001",
        "purchaseToken": "..."
    }

    Returns:
    {
        "valid": true/false,
        "purchaseState": 0/1, # 0 = purchased, 1 = cancelled
        "consumptionState": 0/1, # 0 = yet to be consumed, 1 = consumed
        "orderId": "...",
        "purchaseTime": timestamp
    }
    """
    try:
        # Parse request
        data = req.get_json()

        if not data:
            return https_fn.Response(
                json.dumps({'valid': False, 'error': 'Missing request body'}),
                status=400,
                headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
            )

        package_name = data.get('packageName', 'com.readingdaily.scripture')
        product_id = data.get('productId')
        purchase_token = data.get('purchaseToken')

        if not product_id or not purchase_token:
            return https_fn.Response(
                json.dumps({'valid': False, 'error': 'Missing productId or purchaseToken'}),
                status=400,
                headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
            )

        logger.info(f"Validating Google Play receipt for product: {product_id}")

        # Load service account credentials
        service_account_path = os.path.join(os.path.dirname(__file__), 'secrets', 'google-play-service-account.json')

        if not os.path.exists(service_account_path):
            logger.error(f"Service account file not found: {service_account_path}")
            return https_fn.Response(
                json.dumps({'valid': False, 'error': 'Service account not configured'}),
                status=500,
                headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
            )

        # Create credentials
        credentials = service_account.Credentials.from_service_account_file(
            service_account_path,
            scopes=['https://www.googleapis.com/auth/androidpublisher']
        )

        # Build the Android Publisher API service
        service = build('androidpublisher', 'v3', credentials=credentials)

        # Verify the purchase
        result = service.purchases().products().get(
            packageName=package_name,
            productId=product_id,
            token=purchase_token
        ).execute()

        logger.info(f"Google Play API response: {result}")

        # Check purchase state (0 = purchased, 1 = cancelled)
        purchase_state = result.get('purchaseState', 1)
        is_valid = purchase_state == 0

        # Acknowledge the purchase if not already acknowledged
        if is_valid and result.get('acknowledgementState', 0) == 0:
            try:
                service.purchases().products().acknowledge(
                    packageName=package_name,
                    productId=product_id,
                    token=purchase_token
                ).execute()
                logger.info(f"Purchase acknowledged: {product_id}")
            except Exception as ack_error:
                logger.warning(f"Could not acknowledge purchase: {str(ack_error)}")

        # Store purchase in Firestore
        if is_valid:
            try:
                purchase_doc = {
                    'packageName': package_name,
                    'productId': product_id,
                    'purchaseToken': purchase_token,
                    'orderId': result.get('orderId'),
                    'purchaseTime': result.get('purchaseTimeMillis'),
                    'purchaseState': purchase_state,
                    'consumptionState': result.get('consumptionState', 0),
                    'validated': True,
                    'validatedAt': datetime.utcnow().isoformat() + 'Z',
                    'platform': 'google_play'
                }

                # Store with orderId as document ID
                order_id = result.get('orderId', purchase_token[:20])
                get_db().collection('purchases').document(order_id).set(purchase_doc)
                logger.info(f"Purchase stored: {order_id}")

            except Exception as store_error:
                logger.error(f"Failed to store purchase: {str(store_error)}")

        # Return validation result
        response_data = {
            'valid': is_valid,
            'purchaseState': purchase_state,
            'consumptionState': result.get('consumptionState', 0),
            'orderId': result.get('orderId'),
            'purchaseTime': result.get('purchaseTimeMillis'),
            'acknowledgementState': result.get('acknowledgementState', 0)
        }

        return https_fn.Response(
            json.dumps(response_data),
            status=200,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        )

    except Exception as e:
        logger.error(f"Google Play validation error: {str(e)}")
        return https_fn.Response(
            json.dumps({'valid': False, 'error': str(e)}),
            status=500,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        )
