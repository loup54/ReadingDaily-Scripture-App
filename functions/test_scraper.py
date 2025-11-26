#!/usr/bin/env python3
"""
USCCB Scraper Test Script

Tests the scraper with today's date and displays results.
Usage: python test_scraper.py
"""

import sys
from datetime import date, datetime, timedelta
from scrapers.usccb_scraper import USCCBScraper
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)

logger = logging.getLogger(__name__)


def print_separator():
    """Print a visual separator"""
    print("=" * 80)


def print_reading_data(data):
    """Pretty print reading data"""
    if not data:
        print("❌ No data returned from scraper")
        return

    print_separator()
    print("📅 SCRAPING RESULTS")
    print_separator()

    # Date and liturgical info
    print(f"\n📆 Date: {data.get('date', 'Unknown')}")

    liturgical = data.get('liturgicalDate', {})
    if liturgical:
        print(f"🎨 Liturgical Season: {liturgical.get('season', 'Unknown')}")
        print(f"📖 Liturgical Title: {liturgical.get('liturgicalTitle', 'Unknown')}")
        print(f"🎨 Liturgical Color: {liturgical.get('color', 'Unknown')}")
        if liturgical.get('feastDay'):
            print(f"✨ Feast Day: {liturgical['feastDay']}")

    print_separator()

    # First Reading
    first_reading = data.get('firstReading')
    if first_reading:
        print("\n📖 FIRST READING")
        print(f"Title: {first_reading.get('title', 'Unknown')}")
        print(f"Reference: {first_reading.get('reference', 'Unknown')}")
        print(f"Text: {first_reading.get('text', 'Unknown')[:200]}...")
    else:
        print("\n❌ No first reading found")

    # Psalm
    psalm = data.get('psalm')
    if psalm:
        print("\n🎵 RESPONSORIAL PSALM")
        print(f"Title: {psalm.get('title', 'Unknown')}")
        print(f"Reference: {psalm.get('reference', 'Unknown')}")
        if psalm.get('response'):
            print(f"Response: {psalm['response']}")
        print(f"Text: {psalm.get('text', 'Unknown')[:200]}...")
    else:
        print("\n⚠️  No psalm found")

    # Second Reading (optional)
    second_reading = data.get('secondReading')
    if second_reading:
        print("\n📖 SECOND READING")
        print(f"Title: {second_reading.get('title', 'Unknown')}")
        print(f"Reference: {second_reading.get('reference', 'Unknown')}")
        print(f"Text: {second_reading.get('text', 'Unknown')[:200]}...")
    else:
        print("\n⚠️  No second reading (weekday - expected)")

    # Gospel
    gospel = data.get('gospel')
    if gospel:
        print("\n✝️  GOSPEL")
        print(f"Title: {gospel.get('title', 'Unknown')}")
        print(f"Reference: {gospel.get('reference', 'Unknown')}")
        print(f"Text: {gospel.get('text', 'Unknown')[:200]}...")
    else:
        print("\n❌ No gospel found")

    # Metadata
    metadata = data.get('metadata', {})
    if metadata:
        print_separator()
        print("\n🔍 METADATA")
        print(f"Source: {metadata.get('source', 'Unknown')}")
        print(f"Source URL: {metadata.get('sourceUrl', 'Unknown')}")

    print_separator()


def test_scraper(test_date=None):
    """
    Test the USCCB scraper

    Args:
        test_date: date object (defaults to today)
    """
    if test_date is None:
        test_date = date.today()

    print_separator()
    print(f"🔍 Testing USCCB Scraper for {test_date.strftime('%B %d, %Y')}")
    print_separator()

    try:
        # Initialize scraper
        scraper = USCCBScraper()
        logger.info("✅ Scraper initialized")

        # Scrape data
        logger.info(f"📡 Fetching readings for {test_date}...")
        data = scraper.scrape(test_date)

        # Display results
        print_reading_data(data)

        # Validation
        if data:
            required_fields = ['date', 'firstReading', 'gospel']
            missing = [f for f in required_fields if not data.get(f)]

            if missing:
                print(f"\n⚠️  Missing required fields: {', '.join(missing)}")
                return False

            print("\n✅ Scraper test PASSED")
            return True
        else:
            print("\n❌ Scraper test FAILED - No data returned")
            return False

    except Exception as e:
        logger.error(f"❌ Scraper test FAILED with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_multiple_dates():
    """Test scraper with multiple dates"""
    print("\n🔍 Testing multiple dates...\n")

    today = date.today()
    test_dates = [
        today,
        today - timedelta(days=1),  # Yesterday
        today - timedelta(days=7),  # Last week
    ]

    results = []
    for test_date in test_dates:
        print(f"\nTesting {test_date.strftime('%B %d, %Y')}...")
        success = test_scraper(test_date)
        results.append((test_date, success))
        print()

    # Summary
    print_separator()
    print("📊 TEST SUMMARY")
    print_separator()

    for test_date, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_date.strftime('%B %d, %Y')}: {status}")

    passed = sum(1 for _, success in results if success)
    total = len(results)

    print_separator()
    print(f"\nResults: {passed}/{total} tests passed")
    print_separator()


if __name__ == "__main__":
    import sys

    # Check for command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == "--multiple":
        test_multiple_dates()
    else:
        # Test today's date
        success = test_scraper()
        sys.exit(0 if success else 1)
