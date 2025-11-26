"""
USCCB Daily Readings Scraper
Scrapes liturgical readings from United States Conference of Catholic Bishops
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)


class USCCBScraper:
    """
    Scraper for USCCB daily readings
    URL format: https://bible.usccb.org/bible/readings/MMDDYY.cfm
    """

    BASE_URL = "https://bible.usccb.org/bible/readings"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        })

    def scrape(self, date):
        """
        Scrape reading for a specific date
        Args:
            date: datetime.date object
        Returns:
            dict with reading data or None if failed
        """
        try:
            # Format URL: MMDDYY (e.g., 100125 for Oct 1, 2025)
            date_str = date.strftime('%m%d%y')
            url = f"{self.BASE_URL}/{date_str}.cfm"

            logger.info(f"Scraping USCCB: {url}")

            # Fetch page
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract readings
            reading_data = {
                'date': date.isoformat(),
                'liturgicalDate': self._extract_liturgical_info(soup, date),
                'firstReading': self._extract_reading(soup, 'first'),
                'psalm': self._extract_psalm(soup),
                'secondReading': self._extract_reading(soup, 'second'),
                'gospel': self._extract_reading(soup, 'gospel'),
                'metadata': {
                    'source': 'USCCB',
                    'sourceUrl': url
                }
            }

            # Validate we got at least gospel and first reading
            if not reading_data['gospel'] or not reading_data['firstReading']:
                logger.error(f"Missing required readings for {date}")
                return None

            return reading_data

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error scraping USCCB for {date}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error scraping USCCB for {date}: {str(e)}")
            return None

    def _extract_liturgical_info(self, soup, date):
        """
        Extract liturgical season, feast day info
        """
        try:
            # Find liturgical date header (e.g., "Wednesday of the Twenty-seventh Week in Ordinary Time")
            header = soup.find('h1', class_='page-title')
            if not header:
                header = soup.find('h1')

            liturgical_title = header.get_text(strip=True) if header else ""

            # Extract day of week
            day_of_week = date.strftime('%A')

            # Determine liturgical season (simplified)
            season = self._determine_season(liturgical_title, date)

            # Check for feast day
            feast_day = None
            if 'feast' in liturgical_title.lower() or 'solemnity' in liturgical_title.lower():
                feast_day = liturgical_title

            return {
                'season': season,
                'dayOfWeek': day_of_week,
                'feastDay': feast_day,
                'liturgicalTitle': liturgical_title,
                'color': self._get_liturgical_color(season, feast_day)
            }

        except Exception as e:
            logger.warning(f"Error extracting liturgical info: {str(e)}")
            return {
                'season': 'Ordinary Time',
                'dayOfWeek': date.strftime('%A'),
                'feastDay': None,
                'liturgicalTitle': '',
                'color': 'green'
            }

    def _extract_reading(self, soup, reading_type):
        """
        Extract a reading (first, second, or gospel)
        """
        try:
            # Find reading section
            if reading_type == 'first':
                section = soup.find('div', class_='content-body')
            elif reading_type == 'second':
                # Second reading only on Sundays/Solemnities
                # USCCB uses "Reading 2" or "Second Reading" depending on page
                section = soup.find('h3', string=re.compile(r'(Reading 2|Second Reading)', re.I))
                if not section:
                    return None
                section = section.find_next('div', class_='content-body')
            elif reading_type == 'gospel':
                section = soup.find('h3', string=re.compile('Gospel', re.I))
                if section:
                    section = section.find_next('div', class_='content-body')
                else:
                    # Sometimes gospel is last section
                    sections = soup.find_all('div', class_='content-body')
                    section = sections[-1] if sections else None

            if not section:
                return None

            # Extract citation (e.g., "Luke 9:57-62")
            citation_elem = section.find_previous('div', class_='address')
            citation = citation_elem.get_text(strip=True) if citation_elem else ""

            # Extract text content
            paragraphs = section.find_all('p')
            text_parts = []

            for p in paragraphs:
                # Clean text (remove verse numbers, extra whitespace)
                text = p.get_text(separator=' ', strip=True)
                text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
                if text:
                    text_parts.append(text)

            full_text = '\n\n'.join(text_parts)

            if not full_text:
                return None

            # Determine title
            if reading_type == 'first':
                title = 'First Reading'
            elif reading_type == 'second':
                title = 'Second Reading'
            else:
                title = 'Gospel'

            return {
                'reference': citation,
                'citation': citation,
                'text': full_text,
                'title': title,
                'audioUrl': None
            }

        except Exception as e:
            logger.warning(f"Error extracting {reading_type} reading: {str(e)}")
            return None

    def _extract_psalm(self, soup):
        """
        Extract responsorial psalm (special handling for response)
        """
        try:
            # Find psalm section
            psalm_header = soup.find('h3', string=re.compile('Responsorial Psalm', re.I))
            if not psalm_header:
                return None

            section = psalm_header.find_next('div', class_='content-body')
            if not section:
                return None

            # Extract citation
            citation_elem = section.find_previous('div', class_='address')
            citation = citation_elem.get_text(strip=True) if citation_elem else ""

            # Extract response (usually first line starting with R.)
            response = ""
            text_parts = []

            paragraphs = section.find_all('p')
            for p in paragraphs:
                text = p.get_text(separator=' ', strip=True)
                text = re.sub(r'\s+', ' ', text)

                # Check if this is the response line
                if text.startswith('R.') or text.startswith('℟.'):
                    if not response:
                        response = text
                    text_parts.append(text)
                elif text:
                    text_parts.append(text)

            full_text = '\n\n'.join(text_parts)

            return {
                'reference': citation,
                'citation': citation,
                'text': full_text,
                'response': response,
                'title': 'Responsorial Psalm',
                'audioUrl': None
            }

        except Exception as e:
            logger.warning(f"Error extracting psalm: {str(e)}")
            return None

    def _determine_season(self, liturgical_title, date):
        """
        Determine liturgical season based on title and date
        """
        title_lower = liturgical_title.lower()

        if 'advent' in title_lower:
            return 'Advent'
        elif 'christmas' in title_lower:
            return 'Christmas'
        elif 'lent' in title_lower or 'ash wednesday' in title_lower:
            return 'Lent'
        elif 'easter' in title_lower:
            return 'Easter'
        elif 'ordinary time' in title_lower:
            return 'Ordinary Time'
        else:
            # Default based on month (rough approximation)
            month = date.month
            if month in [11, 12]:
                return 'Advent'
            elif month in [1]:
                return 'Christmas'
            elif month in [2, 3]:
                return 'Lent'
            elif month in [4]:
                return 'Easter'
            else:
                return 'Ordinary Time'

    def _get_liturgical_color(self, season, feast_day):
        """
        Determine liturgical color based on season
        """
        if feast_day and ('mary' in feast_day.lower() or 'virgin' in feast_day.lower()):
            return 'white'

        season_colors = {
            'Advent': 'purple',
            'Christmas': 'white',
            'Lent': 'purple',
            'Easter': 'white',
            'Ordinary Time': 'green'
        }

        return season_colors.get(season, 'green')
