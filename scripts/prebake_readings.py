#!/usr/bin/env python3
"""
Pre-bake Mass readings into Firestore for all future dates.

Uses Universalis (Jerusalem Bible + WEB psalms via bible-api.com) — works from
any IP without blocking. Falls back to USCCB scraper when available.

Usage:
    source ~/.config/secrets/firebase-cli.env   # exports FIREBASE_CLIENT_SECRET
    cd ~/ReadingDaily-Scripture-App
    python scripts/prebake_readings.py
    python scripts/prebake_readings.py --start 2026-08-01   # resume from date
    python scripts/prebake_readings.py --end 2027-12-31     # shorter run
    python scripts/prebake_readings.py --source universalis  # force Universalis
    python scripts/prebake_readings.py --source usccb        # force USCCB
"""

import sys
import os
import json
import time
import datetime
import argparse
import urllib.request
import urllib.parse
from pathlib import Path

# Add python-functions to path for scraper + validator imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'python-functions'))
from scrapers.usccb_scraper import USCCBScraper
from scrapers.universalis_scraper import UniversalisScraper
from scrapers.validator import validate_reading, calculate_checksum

PROJECT_ID = 'readingdaily-scripture-fe502'
FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
FIREBASE_CLIENT_SECRET = os.environ.get('FIREBASE_CLIENT_SECRET', '')  # firebase-tools' public OAuth client secret; kept out of the repo
TOKEN_TTL = 3000  # refresh token every 50 minutes


def get_access_token():
    if not FIREBASE_CLIENT_SECRET:
        sys.exit("FIREBASE_CLIENT_SECRET not set. Run: source ~/.config/secrets/firebase-cli.env")
    config_path = Path.home() / '.config' / 'configstore' / 'firebase-tools.json'
    config = json.loads(config_path.read_text())
    rt = config['tokens']['refresh_token']

    data = urllib.parse.urlencode({
        'client_id': FIREBASE_CLIENT_ID,
        'client_secret': FIREBASE_CLIENT_SECRET,
        'refresh_token': rt,
        'grant_type': 'refresh_token',
    }).encode()

    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    resp = urllib.request.urlopen(req, timeout=15)
    result = json.loads(resp.read())
    if 'access_token' not in result:
        raise RuntimeError(f'Token refresh failed: {result}')
    return result['access_token']


def to_firestore_value(v):
    if v is None:
        return {'nullValue': None}
    elif isinstance(v, bool):
        return {'booleanValue': v}
    elif isinstance(v, int):
        return {'integerValue': str(v)}
    elif isinstance(v, float):
        return {'doubleValue': v}
    elif isinstance(v, str):
        return {'stringValue': v}
    elif isinstance(v, dict):
        return {'mapValue': {'fields': {k: to_firestore_value(val) for k, val in v.items()}}}
    elif isinstance(v, list):
        return {'arrayValue': {'values': [to_firestore_value(item) for item in v]}}
    return {'stringValue': str(v)}


def write_to_firestore(date_str, data, token):
    fields = {k: to_firestore_value(v) for k, v in data.items()}
    body = json.dumps({'fields': fields}).encode()

    url = (
        f'https://firestore.googleapis.com/v1/projects/{PROJECT_ID}'
        f'/databases/(default)/documents/readings/{date_str}'
    )
    req = urllib.request.Request(url, data=body, method='PATCH')
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')

    resp = urllib.request.urlopen(req, timeout=15)
    return resp.status in (200, 201)


def doc_exists_and_valid(date_str, token):
    url = (
        f'https://firestore.googleapis.com/v1/projects/{PROJECT_ID}'
        f'/databases/(default)/documents/readings/{date_str}'
    )
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        gospel_text = (
            data.get('fields', {})
                .get('gospel', {})
                .get('mapValue', {})
                .get('fields', {})
                .get('text', {})
                .get('stringValue', '')
        )
        return len(gospel_text) >= 300
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', default='2026-07-01', help='Start date YYYY-MM-DD')
    parser.add_argument('--end', default=(datetime.date.today() + datetime.timedelta(days=10)).isoformat(), help='End date YYYY-MM-DD')
    parser.add_argument('--delay', type=float, default=2.0, help='Seconds between requests')
    parser.add_argument('--source', default='universalis', choices=['universalis', 'usccb'],
                        help='Scraper source (default: universalis, no IP blocking)')
    args = parser.parse_args()

    start_date = datetime.date.fromisoformat(args.start)
    end_date = datetime.date.fromisoformat(args.end)
    total_days = (end_date - start_date).days + 1

    print(f'Pre-baking {start_date} → {end_date} ({total_days} dates)')
    print(f'Source: {args.source} | Delay: {args.delay}s between requests')
    print()

    token = get_access_token()
    token_refresh_at = time.time() + TOKEN_TTL

    scraper = UniversalisScraper() if args.source == 'universalis' else USCCBScraper()

    success = 0
    skipped = 0
    failed = 0
    current = start_date
    day_num = 0

    while current <= end_date:
        date_str = current.isoformat()
        day_num += 1

        # Refresh token proactively
        if time.time() > token_refresh_at:
            print('  [token refresh]')
            token = get_access_token()
            token_refresh_at = time.time() + TOKEN_TTL

        # Check if already exists
        if doc_exists_and_valid(date_str, token):
            print(f'  SKIP  {date_str}  ({day_num}/{total_days})')
            skipped += 1
            current += datetime.timedelta(days=1)
            continue

        # Scrape from USCCB
        reading = scraper.scrape(current)

        if reading:
            is_valid, errors = validate_reading(reading)
            if is_valid:
                checksum = calculate_checksum(reading)
                reading['metadata'] = {
                    'scrapedAt': datetime.datetime.utcnow().isoformat() + 'Z',
                    'source': reading.get('metadata', {}).get('source', 'USCCB'),
                    'checksum': checksum,
                    'validated': True,
                    'version': '1.0',
                    'prebaked': True,
                }
                try:
                    write_to_firestore(date_str, reading, token)
                    gospel_ref = reading.get('gospel', {}).get('reference', '?')
                    print(f'  OK    {date_str}  {gospel_ref}  ({day_num}/{total_days})')
                    success += 1
                except Exception as e:
                    print(f'  FAIL  {date_str}  write error: {e}  ({day_num}/{total_days})')
                    failed += 1
            else:
                print(f'  FAIL  {date_str}  validation: {errors}  ({day_num}/{total_days})')
                failed += 1
        else:
            print(f'  FAIL  {date_str}  scrape returned None  ({day_num}/{total_days})')
            failed += 1

        current += datetime.timedelta(days=1)
        time.sleep(args.delay)

    print()
    print(f'Done: {success} scraped, {skipped} skipped, {failed} failed')
    print(f'Total: {success + skipped + failed} / {total_days} dates processed')


if __name__ == '__main__':
    main()
