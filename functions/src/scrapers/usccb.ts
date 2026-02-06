/**
 * USCCB Daily Readings Scraper (TypeScript)
 * Scrapes liturgical readings from United States Conference of Catholic Bishops
 *
 * URL format: https://bible.usccb.org/bible/readings/MMDDYY.cfm
 * Special solemnities with multiple Masses use: MMDDYY-MassType.cfm
 */

import * as cheerio from 'cheerio';
import * as functions from 'firebase-functions';

const logger = functions.logger;

interface Reading {
  reference: string;
  citation: string;
  text: string;
  title: string;
  audioUrl: string | null;
  response?: string; // Only for psalms
}

interface LiturgicalDate {
  season: string;
  dayOfWeek: string;
  feastDay: string | null;
  liturgicalTitle: string;
  color: string;
}

interface ReadingData {
  date: string;
  liturgicalDate: LiturgicalDate;
  firstReading: Reading | null;
  psalm: Reading | null;
  secondReading: Reading | null;
  gospel: Reading | null;
  metadata: {
    source: string;
    sourceUrl: string;
  };
}

export class USCCBScraper {
  private static readonly BASE_URL = 'https://bible.usccb.org/bible/readings';

  // Solemnities with multiple Mass options (use "Day" Mass by default)
  private static readonly MULTI_MASS_DATES: Record<string, string> = {
    '12-25': 'Day',      // Christmas Day → Mass during the Day
    '04-20': 'Day',      // Easter Sunday 2025
    '04-12': 'Day',      // Easter Sunday 2026
    '03-28': 'Day',      // Easter Sunday 2027
  };

  /**
   * Scrape reading for a specific date
   */
  async scrape(date: Date): Promise<ReadingData | null> {
    try {
      // Check if this is a multi-mass date (e.g., Christmas, Easter)
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);

      const dateKey = `${month}-${day}`;
      const dateStr = `${month}${day}${year}`;

      let url: string;
      if (dateKey in USCCBScraper.MULTI_MASS_DATES) {
        const massType = USCCBScraper.MULTI_MASS_DATES[dateKey];
        url = `${USCCBScraper.BASE_URL}/${dateStr}-${massType}.cfm`;
        logger.info(`Multi-mass date detected, using ${massType} Mass: ${url}`);
      } else {
        url = `${USCCBScraper.BASE_URL}/${dateStr}.cfm`;
        logger.info(`Scraping USCCB: ${url}`);
      }

      // Fetch page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        logger.error(`HTTP error ${response.status} for ${url}`);
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract readings
      const readingData: ReadingData = {
        date: date.toISOString().split('T')[0],
        liturgicalDate: this.extractLiturgicalInfo($, date),
        firstReading: this.extractReading($, 'first'),
        psalm: this.extractPsalm($),
        secondReading: this.extractReading($, 'second'),
        gospel: this.extractReading($, 'gospel'),
        metadata: {
          source: 'USCCB',
          sourceUrl: url,
        },
      };

      // Validate we got at least gospel and first reading
      if (!readingData.gospel || !readingData.firstReading) {
        logger.error(`Missing required readings for ${date.toISOString()}`);
        return null;
      }

      return readingData;

    } catch (error) {
      logger.error(`Error scraping USCCB for ${date.toISOString()}:`, error);
      return null;
    }
  }

  private extractLiturgicalInfo($: cheerio.CheerioAPI, date: Date): LiturgicalDate {
    try {
      // Find liturgical date header
      const header = $('h1.page-title').first();
      const liturgicalTitle = header.length > 0 ? header.text().trim() : $('h1').first().text().trim();

      // Extract day of week
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

      // Determine liturgical season
      const season = this.determineSeason(liturgicalTitle, date);

      // Check for feast day
      const liturgicalLower = liturgicalTitle.toLowerCase();
      const feastDay = (liturgicalLower.includes('feast') || liturgicalLower.includes('solemnity'))
        ? liturgicalTitle
        : null;

      return {
        season,
        dayOfWeek,
        feastDay,
        liturgicalTitle,
        color: this.getLiturgicalColor(season, feastDay),
      };

    } catch (error) {
      logger.warn('Error extracting liturgical info:', error);
      return {
        season: 'Ordinary Time',
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        feastDay: null,
        liturgicalTitle: '',
        color: 'green',
      };
    }
  }

  private extractReading($: cheerio.CheerioAPI, readingType: 'first' | 'second' | 'gospel'): Reading | null {
    try {
      let section: cheerio.Cheerio<any> | null = null;

      if (readingType === 'first') {
        section = $('.content-body').first();
      } else if (readingType === 'second') {
        // Second reading only on Sundays/Solemnities
        const header = $('h3').filter((_, el) => /Reading 2|Second Reading/i.test($(el).text()));
        if (header.length > 0) {
          section = header.first().parent().next('.content-body');
        } else {
          return null;
        }
      } else if (readingType === 'gospel') {
        const header = $('h3').filter((_, el) => /Gospel/i.test($(el).text()));
        if (header.length > 0) {
          section = header.first().parent().next('.content-body');
        } else {
          // Sometimes gospel is last section
          const sections = $('.content-body');
          section = sections.length > 0 ? sections.last() : null;
        }
      }

      if (!section || section.length === 0) {
        // Enhanced diagnostics for HTML structure changes
        logger.error(`Failed to find ${readingType} section. HTML structure may have changed.`);
        logger.error(`Diagnostics for ${readingType}:`);
        logger.error(`  - H3 headers found: ${$('h3').map((_, el) => $(el).text().trim()).get().join(', ')}`);
        logger.error(`  - .content-body elements: ${$('.content-body').length}`);
        logger.error(`  - .content-header elements: ${$('.content-header').length}`);
        if (readingType === 'gospel') {
          const gospelH3 = $('h3').filter((_, el) => /Gospel/i.test($(el).text()));
          logger.error(`  - Gospel H3 found: ${gospelH3.length > 0}`);
          if (gospelH3.length > 0) {
            logger.error(`  - Gospel H3 parent tag: ${gospelH3.parent().prop('tagName')}`);
            logger.error(`  - Gospel H3 parent class: ${gospelH3.parent().attr('class')}`);
            logger.error(`  - Next sibling of parent: ${gospelH3.parent().next().prop('tagName')}`);
          }
        }
        return null;
      }

      // Extract citation - it's in the content-header div before the content-body
      const citationElem = section.prev('.content-header').find('.address');
      const citation = citationElem.length > 0 ? citationElem.text().trim() : '';

      // Extract text content
      const paragraphs = section.find('p');
      const textParts: string[] = [];

      paragraphs.each((_, p) => {
        const text = $(p).text().trim().replace(/\s+/g, ' ');
        if (text) {
          textParts.push(text);
        }
      });

      const fullText = textParts.join('\n\n');

      if (!fullText) {
        return null;
      }

      // Determine title
      const titles = {
        first: 'First Reading',
        second: 'Second Reading',
        gospel: 'Gospel',
      };

      return {
        reference: citation,
        citation,
        text: fullText,
        title: titles[readingType],
        audioUrl: null,
      };

    } catch (error) {
      logger.warn(`Error extracting ${readingType} reading:`, error);
      return null;
    }
  }

  private extractPsalm($: cheerio.CheerioAPI): Reading | null {
    try {
      // Find psalm section
      const psalmHeader = $('h3').filter((_, el) => /Responsorial Psalm/i.test($(el).text()));
      if (psalmHeader.length === 0) {
        return null;
      }

      const section = psalmHeader.first().parent().next('.content-body');
      if (section.length === 0) {
        logger.error('Failed to find Responsorial Psalm section. HTML structure may have changed.');
        logger.error('Psalm diagnostics:');
        logger.error(`  - Psalm H3 found: ${psalmHeader.length > 0}`);
        if (psalmHeader.length > 0) {
          logger.error(`  - Psalm H3 parent tag: ${psalmHeader.parent().prop('tagName')}`);
          logger.error(`  - Psalm H3 parent class: ${psalmHeader.parent().attr('class')}`);
        }
        return null;
      }

      // Extract citation - it's in the content-header div before the content-body
      const citationElem = section.prev('.content-header').find('.address');
      const citation = citationElem.length > 0 ? citationElem.text().trim() : '';

      // Extract response and text
      let response = '';
      const textParts: string[] = [];

      const paragraphs = section.find('p');
      paragraphs.each((_, p) => {
        const text = $(p).text().trim().replace(/\s+/g, ' ');

        // Check if this is the response line
        if (text.startsWith('R.') || text.startsWith('℟.')) {
          if (!response) {
            response = text;
          }
          textParts.push(text);
        } else if (text) {
          textParts.push(text);
        }
      });

      const fullText = textParts.join('\n\n');

      return {
        reference: citation,
        citation,
        text: fullText,
        response,
        title: 'Responsorial Psalm',
        audioUrl: null,
      };

    } catch (error) {
      logger.warn('Error extracting psalm:', error);
      return null;
    }
  }

  private determineSeason(liturgicalTitle: string, date: Date): string {
    const titleLower = liturgicalTitle.toLowerCase();

    if (titleLower.includes('advent')) return 'Advent';
    if (titleLower.includes('christmas')) return 'Christmas';
    if (titleLower.includes('lent') || titleLower.includes('ash wednesday')) return 'Lent';
    if (titleLower.includes('easter')) return 'Easter';
    if (titleLower.includes('ordinary time')) return 'Ordinary Time';

    // Default based on month (rough approximation)
    const month = date.getMonth() + 1;
    if (month === 11 || month === 12) return 'Advent';
    if (month === 1) return 'Christmas';
    if (month === 2 || month === 3) return 'Lent';
    if (month === 4) return 'Easter';

    return 'Ordinary Time';
  }

  private getLiturgicalColor(season: string, feastDay: string | null): string {
    if (feastDay) {
      const feastLower = feastDay.toLowerCase();
      if (feastLower.includes('mary') || feastLower.includes('virgin')) {
        return 'white';
      }
    }

    const seasonColors: Record<string, string> = {
      'Advent': 'purple',
      'Christmas': 'white',
      'Lent': 'purple',
      'Easter': 'white',
      'Ordinary Time': 'green',
    };

    return seasonColors[season] || 'green';
  }
}
