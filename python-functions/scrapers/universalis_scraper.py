"""
Universalis Daily Readings Scraper
Fallback scraper for when USCCB is unavailable.

Notes:
- Jerusalem Bible translation for readings (vs NABRE from USCCB)
- Psalm text is copyright-blocked on the web (Grail Psalter); fetched from
  bible-api.com (World English Bible, public domain) when Universalis blocks it
- URL: https://universalis.com/YYYYMMDD/Mass.htm
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)
BIBLE_API_BASE = 'https://bible-api.com'


def _fetch_psalm_from_api(reference):
    """
    Fetch psalm text from bible-api.com (WEB translation, public domain).
    reference: string like "Psalm 18(19):2-5" or "Psalm 113B(115):3-10"
    Returns (text, response_line) or (None, None).
    """
    try:
        # Extract Hebrew/Protestant number from parentheses if present: "18(19)" → 19
        m = re.search(r'\((\d+)\)', reference)
        if m:
            psalm_num = m.group(1)
        else:
            # Try to extract plain number: "Psalm 117:1-2"
            m2 = re.search(r'Psalm\s+(\d+)', reference, re.I)
            psalm_num = m2.group(1) if m2 else None

        if not psalm_num:
            return None, None

        # Extract verse range (everything after the colon)
        m3 = re.search(r':(.+)$', reference)
        if not m3:
            return None, None
        verses = m3.group(1).strip()
        # Remove letter suffixes from verse numbers (e.g. 13b → 13)
        verses = re.sub(r'([0-9])[a-z]', r'\1', verses)

        # bible-api.com rejects discontinuous ranges ("1-5, 10-11") — fetch each segment
        segments = [s.strip() for s in verses.split(',')]
        all_texts = []
        all_verse_objs = []
        for seg in segments:
            api_ref = f'psalms+{psalm_num}:{seg}'
            resp = requests.get(f'{BIBLE_API_BASE}/{api_ref}', timeout=10)
            if resp.status_code != 200:
                continue
            data = resp.json()
            seg_text = data.get('text', '').strip()
            if seg_text:
                all_texts.append(seg_text)
            all_verse_objs.extend(data.get('verses', []))

        if not all_texts:
            return None, None

        text = '\n'.join(all_texts)
        response_line = all_verse_objs[0]['text'].strip() if all_verse_objs else text.split('\n')[0]

        return text, response_line

    except Exception as e:
        logger.warning(f'bible-api.com psalm fetch failed for "{reference}": {e}')
        return None, None


class UniversalisScraper:
    """
    Scraper for Universalis daily Mass readings.
    Fallback when USCCB is blocked.
    """

    BASE_URL = 'https://universalis.com'

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        })

    def scrape(self, date):
        """
        Scrape readings for a specific date.
        Args:
            date: datetime.date object
        Returns:
            dict with reading data or None if failed
        """
        try:
            date_str_url = date.strftime('%Y%m%d')
            url = f'{self.BASE_URL}/{date_str_url}/Mass.htm'

            logger.info(f'Scraping Universalis: {url}')
            response = self.session.get(url, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Universalis returns 200 for future/unpublished dates but serves a
            # placeholder page with no reading tables — raise_for_status() misses this
            if not soup.find('table', class_='each'):
                logger.warning(f'Universalis placeholder page for {date} — no reading tables (future date not yet published)')
                return None

            # Select the right reading set (day of feast > vigil)
            reading_set = self._select_reading_set(soup)

            # Extract individual readings
            sections = self._parse_reading_sections(soup, reading_set)

            first = sections.get('First reading')
            psalm = sections.get('Responsorial Psalm')
            second = sections.get('Second reading')
            gospel = sections.get('Gospel')

            if not gospel or not first:
                logger.error(f'Missing required readings (gospel/first) from Universalis for {date}')
                return None

            liturgical = self._extract_liturgical_info(soup, date)

            return {
                'date': date.isoformat(),
                'liturgicalDate': liturgical,
                'firstReading': first,
                'psalm': psalm,
                'secondReading': second,
                'gospel': gospel,
                'metadata': {
                    'source': 'Universalis',
                    'sourceUrl': url,
                }
            }

        except requests.exceptions.RequestException as e:
            logger.error(f'Network error scraping Universalis for {date}: {e}')
            return None
        except Exception as e:
            logger.error(f'Error scraping Universalis for {date}: {e}')
            return None

    def _select_reading_set(self, soup):
        """
        For choice days (feast with vigil + day options), return the soup
        starting from the "day of the feast" rubric. Returns full soup otherwise.
        """
        # Look for "day of the feast itself" rubric
        for p in soup.find_all('p', class_='rubric'):
            text = p.get_text(strip=True).lower()
            if 'day of the feast' in text:
                return p  # reading set starts at this element
        return None  # no choice — use full soup

    def _find_tables_after(self, soup, start_element):
        """
        Find all table.each elements after a start element (or all if start_element=None).
        """
        all_tables = soup.find_all('table', class_='each')
        if start_element is None:
            return all_tables

        # Find the first table after start_element
        in_range = False
        result = []
        for tag in soup.descendants:
            if tag == start_element:
                in_range = True
            if in_range and tag.name == 'table' and 'each' in (tag.get('class') or []):
                result.append(tag)
        return result

    def _parse_reading_sections(self, soup, start_element):
        """
        Parse all reading sections. Returns dict keyed by reading type
        (e.g. 'First reading', 'Gospel').
        """
        tables = self._find_tables_after(soup, start_element)
        sections = {}

        # Check if psalm text is available (copyright notice means no text)
        psalm_blocked = self._is_psalm_blocked(soup)

        for table in tables:
            ths = table.find_all('th')
            if not ths:
                continue

            reading_type = ths[0].get_text(strip=True)

            # Skip acclamation sections
            if 'Acclamation' in reading_type or 'Or:' == reading_type:
                continue

            # Get reference (second th on same row, or second row's th)
            reference = ''
            if len(ths) > 1:
                reference = ths[1].get_text(strip=True)
            else:
                # Reference might be on a second <tr>
                rows = table.find_all('tr')
                if len(rows) > 1:
                    second_ths = rows[1].find_all('th')
                    if second_ths:
                        reference = second_ths[-1].get_text(strip=True)

            if reading_type == 'Responsorial Psalm':
                psalm_data = self._parse_psalm(table, reference, psalm_blocked)
                sections['Responsorial Psalm'] = psalm_data
            else:
                reading_data = self._parse_reading(table, reading_type, reference)
                if reading_data:
                    if reading_type in sections:
                        logger.warning(f'Duplicate reading type "{reading_type}" — keeping first, skipping subsequent')
                    else:
                        sections[reading_type] = reading_data

        return sections

    def _is_psalm_blocked(self, soup):
        """Return True if Universalis is showing the psalm copyright notice."""
        for p in soup.find_all('p', class_='rubric'):
            if 'responsorial psalms' in p.get_text(strip=True).lower():
                return True
        return False

    def _parse_reading(self, table, reading_type, reference):
        """
        Parse a non-psalm reading section (first, second, gospel).
        Returns dict or None.
        """
        try:
            # Title: h4 among immediate siblings before next table.each
            # (find_next would scan entire doc and grab a wrong heading)
            title = ''
            _sib = table.next_sibling
            while _sib:
                if hasattr(_sib, 'name'):
                    if _sib.name == 'table' and 'each' in (_sib.get('class') or []):
                        break
                    if _sib.name == 'h4':
                        title = _sib.get_text(strip=True)
                        break
                _sib = _sib.next_sibling

            # Text: prose (div.p, div.pi) and verse lines (div.v, div.vi)
            # Universalis uses div.p for prose paragraphs and div.v for poetry/verse lines
            text_lines = []
            sibling = table.next_sibling
            while sibling:
                if hasattr(sibling, 'name'):
                    if sibling.name == 'table' and 'each' in (sibling.get('class') or []):
                        break
                    if sibling.name == 'div':
                        cls = sibling.get('class') or []
                        if any(c in cls for c in ('p', 'pi', 'v', 'vi')):
                            # Skip audioclip divs that may be nested
                            if 'audioclip' not in cls:
                                raw = sibling.get_text(separator=' ', strip=True)
                                raw = re.sub(r'\xa0+', ' ', raw)
                                raw = re.sub(r'\s+', ' ', raw).strip()
                                if raw:
                                    text_lines.append(raw)
                    elif sibling.name == 'hr':
                        if text_lines:
                            break
                sibling = sibling.next_sibling

            # Prose paragraphs join with blank line; verse lines join with newline
            # Detect by checking if we have many short lines (verse) vs fewer long (prose)
            has_long_lines = any(len(l) > 120 for l in text_lines)
            sep = '\n\n' if has_long_lines else '\n'
            full_text = sep.join(text_lines)

            if not full_text:
                logger.warning(f'No text found for {reading_type} ({reference})')
                return None

            title_map = {
                'First reading': 'First Reading',
                'Second reading': 'Second Reading',
                'Gospel': 'Gospel',
            }

            return {
                'reference': reference,
                'citation': reference,
                'text': full_text,
                'title': title_map.get(reading_type, reading_type),
                'audioUrl': None,
            }
        except Exception as e:
            logger.warning(f'Error parsing {reading_type}: {e}')
            return None

    def _parse_psalm(self, table, reference, blocked):
        """
        Parse the responsorial psalm section.
        If blocked, falls back to bible-api.com (WEB translation).
        """
        if blocked:
            text, response = _fetch_psalm_from_api(reference)
            if text:
                logger.info(f'Psalm text from bible-api.com for {reference}')
                return {
                    'reference': reference,
                    'citation': reference,
                    'text': text,
                    'response': response or '',
                    'title': 'Responsorial Psalm',
                    'audioUrl': None,
                }
            return {
                'reference': reference,
                'citation': reference,
                'text': '',
                'response': '',
                'title': 'Responsorial Psalm',
                'audioUrl': None,
            }

        try:
            # Response: first div.v with <i> inside
            response = ''
            text_lines = []

            sibling = table.next_sibling
            while sibling:
                if hasattr(sibling, 'name'):
                    if sibling.name == 'table' and 'each' in (sibling.get('class') or []):
                        break
                    if sibling.name == 'div':
                        cls = sibling.get('class') or []
                        if 'v' in cls or 'vi' in cls:
                            # Response line has italic tag
                            italic = sibling.find('i')
                            line = sibling.get_text(separator=' ', strip=True)
                            line = re.sub(r'\xa0+', ' ', line).strip()
                            if line:
                                if italic and not response:
                                    response = italic.get_text(strip=True)
                                text_lines.append(line)
                sibling = sibling.next_sibling

            full_text = '\n'.join(text_lines)

            return {
                'reference': reference,
                'citation': reference,
                'text': full_text,
                'response': response,
                'title': 'Responsorial Psalm',
                'audioUrl': None,
            }
        except Exception as e:
            logger.warning(f'Error parsing psalm: {e}')
            return {
                'reference': reference,
                'citation': reference,
                'text': '',
                'response': '',
                'title': 'Responsorial Psalm',
                'audioUrl': None,
            }

    def _extract_liturgical_info(self, soup, date):
        """Extract liturgical season, color, feast day info."""
        try:
            # Day name from dateblock
            dateblock = soup.find('div', id='dateblock')
            dateblock_text = dateblock.get_text(strip=True) if dateblock else ''

            # feastname + feastrank may be children of dateblock or separate
            feastname_el = soup.find('div', id='feastname')
            feastrank_el = soup.find('div', id='feastrank')

            feast_day = None
            if feastname_el:
                strong = feastname_el.find('strong')
                feast_day = strong.get_text(strip=True) if strong else feastname_el.get_text(strip=True)
            elif dateblock_text:
                # dateblock concatenates feast name + rank: "Saint Thomas, ApostleFeast"
                # "Optional Memorial" before "Memorial" to avoid partial match;
                # regex lookbehind prevents matching rank words mid-feast-name
                ranks = ['Optional Memorial', 'Solemnity', 'Feast', 'Memorial', 'Commemoration']
                name = dateblock_text
                for rank in ranks:
                    m = re.search(r'(?<![A-Za-z])' + re.escape(rank) + r'$', name)
                    if m:
                        feast_day = name[:m.start()].strip()
                        break

            liturgical_title = dateblock_text or 'Daily Readings'
            if feastrank_el:
                rank_text = feastrank_el.get_text(strip=True)
                if rank_text:
                    liturgical_title = f'{feast_day or dateblock_text} ({rank_text})'

            # Liturgical color from rubric
            color = 'green'
            season = 'Ordinary Time'
            for p in soup.find_all('p', class_='rubric'):
                text = p.get_text(strip=True)
                m = re.search(r'Liturgical Colour:\s*(\w+)', text, re.I)
                if m:
                    colour_word = m.group(1).lower()
                    color_map = {
                        'green': 'green',
                        'red': 'red',
                        'purple': 'purple',
                        'violet': 'purple',
                        'white': 'white',
                        'gold': 'white',
                        'rose': 'rose',
                        'pink': 'rose',
                    }
                    color = color_map.get(colour_word, 'green')
                    break

            # Determine season from title / color
            lt = liturgical_title.lower()
            if 'advent' in lt:
                season = 'Advent'
            elif 'christmas' in lt or 'nativity' in lt or 'epiphany' in lt:
                season = 'Christmas'
            elif 'lent' in lt or 'ash' in lt or 'passion' in lt:
                season = 'Lent'
            elif 'easter' in lt or 'ascension' in lt or 'pentecost' in lt:
                season = 'Easter'
            elif 'ordinary' in lt:
                season = 'Ordinary Time'
            elif color == 'purple' and date.month in [11, 12, 1, 2, 3]:
                season = 'Advent' if date.month in [11, 12] else 'Lent'
            elif color == 'white':
                season = 'Christmas' if date.month in [12, 1] else 'Easter'

            return {
                'season': season,
                'dayOfWeek': date.strftime('%A'),
                'feastDay': feast_day,
                'liturgicalTitle': liturgical_title or 'Daily Readings',
                'color': color,
            }
        except Exception as e:
            logger.warning(f'Error extracting liturgical info from Universalis: {e}')
            return {
                'season': 'Ordinary Time',
                'dayOfWeek': date.strftime('%A'),
                'feastDay': None,
                'liturgicalTitle': 'Daily Readings',
                'color': 'green',
            }
