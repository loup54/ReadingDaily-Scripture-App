#!/usr/bin/env python3
"""
Populate Firestore with Daily Readings
Scrapes and stores readings for a 28-day window (7 days back, 21 days forward)
"""

import sys
import os
from datetime import datetime, timedelta
from scrapers.usccb_scraper import USCCBScraper
from firebase_admin import credentials, firestore, initialize_app
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Initialize Firebase Admin using environment variable for project
os.environ['GOOGLE_CLOUD_PROJECT'] = 'readingdaily-scripture-fe502'

try:
    # Try to initialize without credentials (will use Firebase CLI credentials)
    initialize_app()
    logger.info("✅ Firebase initialized successfully")
except Exception as e:
    logger.error(f"❌ Firebase initialization failed: {e}")
    logger.error("Please ensure you're logged into Firebase CLI with: firebase login")
    sys.exit(1)

db = firestore.client()

def populate_readings():
    """Populate Firestore with 28-day window of readings"""

    scraper = USCCBScraper()
    today = datetime.now().date()
    start_date = today - timedelta(days=7)
    end_date = today + timedelta(days=21)

    success_count = 0
    failure_count = 0

    logger.info(f"📅 Populating readings from {start_date} to {end_date}")
    logger.info("=" * 80)

    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()

        try:
            logger.info(f"Processing {date_str}...")

            # Scrape reading
            reading = scraper.scrape(current_date)

            if reading:
                # Store in Firestore
                doc_ref = db.collection('readings').document(date_str)
                doc_ref.set(reading)

                logger.info(f"✅ Successfully stored {date_str}")
                success_count += 1
            else:
                logger.error(f"❌ Failed to scrape {date_str}")
                failure_count += 1

        except Exception as e:
            logger.error(f"❌ Error processing {date_str}: {str(e)}")
            failure_count += 1

        current_date += timedelta(days=1)

    logger.info("=" * 80)
    logger.info(f"✅ Complete! Success: {success_count}, Failed: {failure_count}")

if __name__ == '__main__':
    populate_readings()
