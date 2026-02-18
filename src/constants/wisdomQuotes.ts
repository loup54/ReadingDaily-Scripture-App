/**
 * Wisdom Quotes for Loading Screens
 *
 * Inspirational quotes from the Book of Wisdom and Psalms
 * Used to enhance loading experience with spiritual content
 *
 * Security: No user input, safe static content
 * Source: Catholic Biblical texts (Book of Wisdom, Psalms)
 */

export interface WisdomQuote {
  text: string;
  reference: string;
}

/**
 * Array of wisdom quotes from sacred scripture
 * Rotated during app loading to provide inspiration
 */
export const WISDOM_QUOTES: WisdomQuote[] = [
  {
    text: "In your light, we see light",
    reference: "Psalm 36:9"
  },
  {
    text: "The beginning of wisdom is the fear of the Lord",
    reference: "Proverbs 9:10"
  },
  {
    text: "For wisdom is more mobile than any motion",
    reference: "Wisdom 7:24"
  },
  {
    text: "The Lord's word is tested; He is a shield to all who take refuge in Him",
    reference: "Psalm 18:31"
  },
  {
    text: "Your word is a lamp to my feet, a light for my path",
    reference: "Psalm 119:105"
  },
  {
    text: "The law of the Lord is perfect, refreshing the soul",
    reference: "Psalm 19:8"
  },
  {
    text: "Wisdom teaches moderation and prudence, justice and fortitude",
    reference: "Wisdom 8:7"
  },
  {
    text: "In every generation she passes into holy souls",
    reference: "Wisdom 7:27"
  },
  {
    text: "Happy those who find wisdom and gain understanding",
    reference: "Proverbs 3:13"
  },
  {
    text: "The fear of the Lord is the beginning of knowledge",
    reference: "Proverbs 1:7"
  }
];

/**
 * Get a random wisdom quote
 * Uses Math.random() for simple, non-cryptographic randomness
 *
 * @returns Random WisdomQuote object
 */
export function getRandomQuote(): WisdomQuote {
  const randomIndex = Math.floor(Math.random() * WISDOM_QUOTES.length);
  return WISDOM_QUOTES[randomIndex];
}

/**
 * Get quote by index with wrapping
 * Useful for sequential rotation
 *
 * @param index - Index to retrieve (wraps around if out of bounds)
 * @returns WisdomQuote at the specified index
 */
export function getQuoteByIndex(index: number): WisdomQuote {
  const safeIndex = index % WISDOM_QUOTES.length;
  return WISDOM_QUOTES[safeIndex];
}
