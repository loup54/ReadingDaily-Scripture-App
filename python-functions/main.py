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
import re
import pytz
import requests

# Google Play Billing imports (lazy - loaded inside function to avoid slow startup)

# Import scraper modules
from scrapers.usccb_scraper import USCCBScraper
from scrapers.validator import validate_reading, calculate_checksum

# Initialize Firebase Admin (lazily in functions)
# Will be initialized on first function call

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Admin secret for protecting admin-only HTTP endpoints
ADMIN_SECRET = os.environ.get('ADMIN_SECRET', '')

RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000  # 1 hour in milliseconds


def verify_admin_token(req: https_fn.Request) -> bool:
    """Check Authorization: Bearer <token> against ADMIN_SECRET."""
    if not ADMIN_SECRET:
        logger.warning('ADMIN_SECRET not configured')
        return False
    auth_header = req.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return False
    return auth_header[7:] == ADMIN_SECRET


def check_rate_limit(key: str, fn_name: str, limit: int) -> bool:
    """
    Firestore-backed rate limiter. Returns True if allowed, False if exceeded.
    Uses a fixed 1-hour window per key+function pair.
    """
    db = get_db()
    doc_ref = db.collection('rateLimits').document(f'{key}_{fn_name}')

    @firestore.transactional
    def update_in_transaction(transaction):
        doc = doc_ref.get(transaction=transaction)
        now_ms = int(datetime.utcnow().timestamp() * 1000)

        if not doc.exists:
            transaction.set(doc_ref, {'count': 1, 'limit': limit, 'resetAt': now_ms + RATE_LIMIT_WINDOW_MS})
            return True

        data = doc.to_dict()
        if now_ms > data.get('resetAt', 0):
            transaction.set(doc_ref, {'count': 1, 'limit': limit, 'resetAt': now_ms + RATE_LIMIT_WINDOW_MS})
            return True

        if data.get('count', 0) >= limit:
            return False

        transaction.update(doc_ref, {'count': data['count'] + 1})
        return True

    transaction = db.transaction()
    return update_in_transaction(transaction)

# TTS voice to match the app's default voice (en-US-Wavenet-C = female primary)
TTS_VOICE_NAME = 'en-US-Wavenet-C'
TTS_LANGUAGE_CODE = 'en-US'

# Reading types to generate timings for
TIMING_READING_TYPES = ['gospel', 'firstReading', 'psalm', 'secondReading']


def get_db():
    """Get Firestore client (lazy initialization)"""
    try:
        return firestore.client()
    except:
        # Initialize app if not done
        initialize_app()
        return firestore.client()


def _build_ssml(text: str) -> tuple:
    """
    Build SSML with <mark> tags before each word.
    Returns (ssml_string, original_words_list).
    """
    words = re.split(r'\s+', text.strip())
    words = [w for w in words if w]

    escaped = (
        text.strip()
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;')
        .replace("'", '&apos;')
    )
    escaped_words = re.split(r'\s+', escaped)
    escaped_words = [w for w in escaped_words if w]

    parts = ['<speak>']
    for i, word in enumerate(escaped_words):
        parts.append(f'<mark name="w{i}"/>{word} ')
    parts.append('</speak>')

    return ''.join(parts), words


def _call_tts_with_timepoints(ssml: str) -> list:
    """
    Call Google Cloud TTS v1beta1 REST API with SSML mark timepoints enabled.
    enableTimePointing is a top-level field (not inside audioConfig) in v1beta1.
    Returns list of {markName, timeSeconds} dicts.
    Uses Application Default Credentials (automatic in Cloud Functions).
    """
    from google.auth import default as google_auth_default
    from google.auth.transport.requests import Request as GoogleAuthRequest

    # v1beta1 required — enableTimePointing not available in v1
    TTS_REST_URL = 'https://texttospeech.googleapis.com/v1beta1/text:synthesize'

    # Get ADC access token (automatic service account in Cloud Functions)
    credentials, _ = google_auth_default(
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    credentials.refresh(GoogleAuthRequest())

    body = {
        'input': {'ssml': ssml},
        'voice': {
            'languageCode': TTS_LANGUAGE_CODE,
            'name': TTS_VOICE_NAME,
        },
        'audioConfig': {
            'audioEncoding': 'MP3',
        },
        'enableTimePointing': ['SSML_MARK'],  # top-level field in v1beta1
    }

    # x-goog-user-project sets the billing/quota project
    # Required locally; in Cloud Functions the service account project is used automatically
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT', '')
    headers = {
        'Authorization': f'Bearer {credentials.token}',
        'Content-Type': 'application/json',
    }
    if project_id:
        headers['x-goog-user-project'] = project_id

    response = requests.post(
        TTS_REST_URL,
        json=body,
        headers=headers,
        timeout=60,
    )
    response.raise_for_status()
    data = response.json()
    return data.get('timepoints', [])


def generate_word_timings(text: str, date_str: str, reading_type: str, db) -> bool:
    """
    Generate word-level timing data using Google Cloud TTS SSML marks.
    Calls the TTS REST API with enableTimePointing to capture exact word timestamps.
    Stores result in Firestore at /readings/{date}/timings/{reading_type}.
    Returns True on success, False on failure.
    """
    try:
        if not text or not text.strip():
            logger.warning(f"Empty text for {date_str}/{reading_type}")
            return False

        ssml, words = _build_ssml(text)

        if not words:
            return False

        timepoints = _call_tts_with_timepoints(ssml)

        if not timepoints:
            logger.warning(f"No timepoints returned for {date_str}/{reading_type}")
            return False

        # Build WordTiming array aligned to original words
        word_timings = []
        char_offset = 0

        for i, tp in enumerate(timepoints):
            if i >= len(words):
                break

            word = words[i]
            start_ms = int(tp['timeSeconds'] * 1000)

            # End time = start of next word, or +500ms for the last word
            if i + 1 < len(timepoints):
                end_ms = int(timepoints[i + 1]['timeSeconds'] * 1000)
            else:
                end_ms = start_ms + 500

            word_timings.append({
                'word': word,
                'startMs': start_ms,
                'endMs': end_ms,
                'index': i,
                'charOffset': char_offset,
                'charLength': len(word),
            })

            # Advance character offset (word + space)
            char_offset += len(word) + 1

        if not word_timings:
            logger.warning(f"No word timings built for {date_str}/{reading_type}")
            return False

        duration_ms = word_timings[-1]['endMs']

        # Store in Firestore subcollection: /readings/{date}/timings/{readingType}
        timing_doc = {
            'readingType': reading_type,
            'date': date_str,
            'words': word_timings,
            'durationMs': duration_ms,
            'wordCount': len(word_timings),
            'voice': TTS_VOICE_NAME,
            'ttsProvider': 'google',
            'generatedAt': datetime.utcnow().isoformat() + 'Z',
            'version': '1.0',
            'status': 'ready',
        }

        db.collection('readings').document(date_str) \
          .collection('timings').document(reading_type) \
          .set(timing_doc)

        logger.info(f"✅ Timings generated: {date_str}/{reading_type} ({len(word_timings)} words, {duration_ms}ms)")
        return True

    except Exception as e:
        logger.error(f"Failed to generate timings for {date_str}/{reading_type}: {str(e)}")
        return False


def generate_timings_for_date(date_str: str, reading_data: dict, db, force: bool = False) -> dict:
    """
    Generate word timings for all reading types in a date's reading document.
    Skips reading types that already have timing data unless force=True.
    Returns dict with counts: {success, skipped, failed}
    """
    success = 0
    skipped = 0
    failed = 0

    reading_type_map = {
        'gospel': 'gospel',
        'firstReading': 'firstReading',
        'psalm': 'psalm',
        'secondReading': 'secondReading',
    }

    for reading_key, timing_key in reading_type_map.items():
        section = reading_data.get(reading_key)
        if not section:
            skipped += 1
            continue

        text = section.get('text', '')
        if not text:
            skipped += 1
            continue

        # Skip if timing data already exists (unless force)
        if not force:
            existing = db.collection('readings').document(date_str) \
                         .collection('timings').document(timing_key).get()
            if existing.exists and existing.to_dict().get('status') == 'ready':
                skipped += 1
                logger.info(f"Skipping existing timing: {date_str}/{timing_key}")
                continue

        ok = generate_word_timings(text, date_str, timing_key, db)
        if ok:
            success += 1
        else:
            failed += 1

    return {'success': success, 'skipped': skipped, 'failed': failed}


@scheduler_fn.on_schedule(schedule="0 0 * * *", timezone="Australia/Sydney")
def daily_scrape(event: scheduler_fn.ScheduledEvent) -> None:
    """
    Daily scrape at midnight Sydney time.
    Scrapes the next 30 days, skipping dates already in Firestore.
    Generates word-level timing data for newly scraped readings.
    """
    try:
        aest = pytz.timezone("Australia/Sydney")
        today = datetime.now(aest).date()
        db = get_db()
        success_count = 0
        skip_count = 0
        fail_count = 0
        timing_success = 0
        timing_fail = 0

        for i in range(30):
            target_date = today + timedelta(days=i)
            date_str = target_date.isoformat()

            # Skip if already stored with valid content
            doc_ref = db.collection('readings').document(date_str)
            existing = doc_ref.get()
            if existing.exists:
                # Re-scrape if gospel text is suspiciously short (likely wrong section was stored)
                gospel_text = existing.to_dict().get('gospel', {}).get('text', '')
                if len(gospel_text) >= 300:
                    # Reading exists — but check if timings are missing and generate if so
                    timings_ref = db.collection('readings').document(date_str).collection('timings')
                    existing_timings = timings_ref.limit(1).get()
                    if not existing_timings:
                        logger.info(f"📋 Reading exists for {date_str} but timings missing — generating")
                        result = generate_timings_for_date(date_str, existing.to_dict(), db)
                        timing_success += result['success']
                        timing_fail += result['failed']
                    skip_count += 1
                    continue
                logger.warning(f"⚠️ Existing gospel for {date_str} is too short ({len(gospel_text)} chars) — re-scraping")

            reading = scrape_reading_for_date(target_date)
            if reading:
                is_valid, errors = validate_reading(reading)
                if is_valid:
                    checksum = calculate_checksum(reading)
                    reading['metadata'] = {
                        'scrapedAt': datetime.utcnow().isoformat() + 'Z',
                        'source': reading.get('metadata', {}).get('source', 'USCCB'),
                        'checksum': checksum,
                        'validated': True,
                        'version': '1.0',
                        'scheduledScrape': True,
                    }
                    doc_ref.set(reading)
                    success_count += 1
                    logger.info(f"✅ Scraped {date_str}")

                    # Generate word timings for newly scraped reading
                    result = generate_timings_for_date(date_str, reading, db)
                    timing_success += result['success']
                    timing_fail += result['failed']
                else:
                    fail_count += 1
                    logger.warning(f"⚠️ Validation failed for {date_str}: {errors}")
            else:
                fail_count += 1
                logger.warning(f"⚠️ Scrape failed for {date_str}")

        logger.info(
            f"Daily scrape done: {success_count} new, {skip_count} skipped, {fail_count} failed | "
            f"Timings: {timing_success} ok, {timing_fail} failed"
        )

    except Exception as e:
        logger.error(f"Daily scrape error: {str(e)}")
        raise


@https_fn.on_request()
def manual_scrape(req: https_fn.Request) -> https_fn.Response:
    """
    Manual trigger endpoint for scraping specific date
    Usage: POST /manual_scrape with JSON body: {"date": "2025-10-01"}
    """
    if not verify_admin_token(req):
        return https_fn.Response(
            json.dumps({'error': 'Unauthorized'}),
            status=401,
            headers={'Content-Type': 'application/json'}
        )
    if not check_rate_limit('_global', 'manual_scrape', 10):
        return https_fn.Response(
            json.dumps({'error': 'Too many requests. Please try again later.'}),
            status=429,
            headers={'Content-Type': 'application/json'}
        )
    try:
        # Parse request
        data = req.get_json()
        if not data or 'date' not in data:
            return https_fn.Response(
                json.dumps({'error': 'Missing date parameter'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        # Parse and validate date
        date_str = data['date']
        import re as _re
        if not _re.fullmatch(r'\d{4}-\d{2}-\d{2}', date_str):
            return https_fn.Response(
                json.dumps({'error': 'Invalid date format. Use YYYY-MM-DD'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
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
                db = get_db()
                doc_ref = db.collection('readings').document(date_str)
                doc_ref.set(reading)

                # Generate word timings
                timing_result = generate_timings_for_date(date_str, reading, db)

                return https_fn.Response(
                    json.dumps({
                        'success': True,
                        'date': date_str,
                        'source': reading['metadata']['source'],
                        'timings': timing_result,
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


@https_fn.on_request()
def generate_timings(req: https_fn.Request) -> https_fn.Response:
    """
    Generate word-level timing data for a specific date.
    Use for backfilling existing readings that have no timing data.

    POST body:
    {
        "date": "2026-03-15",          # required
        "readingType": "gospel",       # optional - omit to generate all types
        "force": false                 # optional - overwrite existing timings
    }
    """
    if not verify_admin_token(req):
        return https_fn.Response(
            json.dumps({'error': 'Unauthorized'}),
            status=401,
            headers={'Content-Type': 'application/json'}
        )
    if not check_rate_limit('_global', 'generate_timings', 10):
        return https_fn.Response(
            json.dumps({'error': 'Too many requests. Please try again later.'}),
            status=429,
            headers={'Content-Type': 'application/json'}
        )
    try:
        data = req.get_json()
        if not data or 'date' not in data:
            return https_fn.Response(
                json.dumps({'error': 'Missing date parameter'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        date_str = data['date']
        import re as _re
        if not _re.fullmatch(r'\d{4}-\d{2}-\d{2}', date_str):
            return https_fn.Response(
                json.dumps({'error': 'Invalid date format. Use YYYY-MM-DD'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        reading_type = data.get('readingType')  # None = generate all
        valid_reading_types = {'gospel', 'firstReading', 'secondReading', 'psalm'}
        if reading_type is not None and reading_type not in valid_reading_types:
            return https_fn.Response(
                json.dumps({'error': f'Invalid readingType. Must be one of: {", ".join(sorted(valid_reading_types))}'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        force = data.get('force', False)

        db = get_db()

        # Fetch reading document
        doc = db.collection('readings').document(date_str).get()
        if not doc.exists:
            return https_fn.Response(
                json.dumps({'error': f'No reading found for {date_str}'}),
                status=404,
                headers={'Content-Type': 'application/json'}
            )

        reading_data = doc.to_dict()

        # Generate for one type or all
        if reading_type:
            section = reading_data.get(reading_type)
            if not section:
                return https_fn.Response(
                    json.dumps({'error': f'No {reading_type} found for {date_str}'}),
                    status=404,
                    headers={'Content-Type': 'application/json'}
                )
            text = section.get('text', '')
            ok = generate_word_timings(text, date_str, reading_type, db)
            result = {'success': 1 if ok else 0, 'skipped': 0, 'failed': 0 if ok else 1}
        else:
            result = generate_timings_for_date(date_str, reading_data, db, force=force)

        return https_fn.Response(
            json.dumps({
                'success': True,
                'date': date_str,
                'readingType': reading_type or 'all',
                'result': result,
            }),
            status=200,
            headers={'Content-Type': 'application/json'}
        )

    except Exception as e:
        logger.error(f"generate_timings error: {str(e)}")
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
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from firebase_admin import auth as firebase_auth

    # Verify Firebase ID token
    auth_header = req.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return https_fn.Response(
            json.dumps({'valid': False, 'error': 'Authentication required'}),
            status=401,
            headers={'Content-Type': 'application/json'}
        )
    try:
        id_token = auth_header[7:]
        decoded_token = firebase_auth.verify_id_token(id_token)
        caller_uid = decoded_token['uid']
    except Exception:
        return https_fn.Response(
            json.dumps({'valid': False, 'error': 'Invalid or expired token'}),
            status=401,
            headers={'Content-Type': 'application/json'}
        )

    if not check_rate_limit(caller_uid, 'validate_google_receipt', 10):
        return https_fn.Response(
            json.dumps({'valid': False, 'error': 'Too many requests. Please try again later.'}),
            status=429,
            headers={'Content-Type': 'application/json'}
        )

    try:
        # Parse request
        data = req.get_json()

        if not data:
            return https_fn.Response(
                json.dumps({'valid': False, 'error': 'Missing request body'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        package_name = 'com.readingdaily.scripture'
        product_id = data.get('productId')
        purchase_token = data.get('purchaseToken')

        valid_product_ids = {
            'com.readingdaily.lifetime.access',
            'com.readingdaily.basic.monthly',
            'com.readingdaily.basic.yearly',
        }

        if not product_id or product_id not in valid_product_ids:
            return https_fn.Response(
                json.dumps({'valid': False, 'error': 'Invalid product ID'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        if not purchase_token:
            return https_fn.Response(
                json.dumps({'valid': False, 'error': 'Missing productId or purchaseToken'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        logger.info(f"Validating Google Play receipt for product: {product_id}")

        # Load service account credentials
        service_account_path = os.path.join(os.path.dirname(__file__), 'secrets', 'google-play-service-account.json')

        if not os.path.exists(service_account_path):
            logger.error(f"Service account file not found: {service_account_path}")
            return https_fn.Response(
                json.dumps({'valid': False, 'error': 'Service account not configured'}),
                status=500,
                headers={'Content-Type': 'application/json'}
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
            headers={'Content-Type': 'application/json'}
        )

    except Exception as e:
        logger.error(f"Google Play validation error: {str(e)}")
        return https_fn.Response(
            json.dumps({'valid': False, 'error': str(e)}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )
