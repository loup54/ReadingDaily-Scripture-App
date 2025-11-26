/**
 * Translation Word Lists for ESL Learning
 *
 * Difficulty levels based on CEFR (Common European Framework of Reference):
 * - A1: Beginner (basic words)
 * - A2: Elementary (everyday expressions)
 * - B1: Intermediate (common topics)
 *
 * These lists are used to identify difficult words and provide inline learning hints.
 */

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'advanced';

/**
 * A1 Level: Basic everyday words (most common 500 words)
 * These words should NOT be highlighted as difficult
 */
export const A1_WORDS = new Set([
  // Common verbs
  'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'done',
  'go', 'goes', 'went', 'gone', 'come', 'came', 'see', 'saw',
  'get', 'got', 'make', 'made', 'know', 'knew', 'known',
  'think', 'thought', 'take', 'took', 'taken', 'give', 'gave', 'given',
  'say', 'said', 'tell', 'told', 'want', 'wanted',
  'use', 'used', 'find', 'found', 'ask', 'asked',
  'work', 'worked', 'call', 'called', 'try', 'tried',
  'need', 'needed', 'feel', 'felt', 'become', 'became',
  'leave', 'left', 'put', 'help', 'helped', 'show', 'showed',

  // Common nouns
  'time', 'person', 'year', 'way', 'day', 'thing', 'man', 'woman',
  'life', 'child', 'world', 'school', 'hand', 'part', 'place',
  'work', 'week', 'case', 'point', 'house', 'home', 'room',
  'mother', 'father', 'family', 'friend', 'book', 'water',
  'food', 'name', 'number', 'people', 'word', 'city',

  // Common adjectives
  'good', 'new', 'first', 'last', 'long', 'great', 'little',
  'old', 'different', 'small', 'large', 'big', 'young',
  'few', 'public', 'bad', 'same', 'able', 'happy', 'sad',

  // Pronouns & determiners
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'a', 'an', 'the',
  'some', 'any', 'all', 'each', 'every', 'other', 'another',

  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by',
  'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'over',

  // Conjunctions & others
  'and', 'or', 'but', 'if', 'when', 'where', 'how', 'what',
  'who', 'which', 'why', 'because', 'as', 'so', 'than',
  'not', 'no', 'yes', 'very', 'too', 'can', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall',
]);

/**
 * A2 Level: Elementary words (common 1000-2000 words)
 * These may be highlighted for A1 learners
 */
export const A2_WORDS = new Set([
  'understand', 'believe', 'remember', 'begin', 'keep', 'hold',
  'write', 'stand', 'hear', 'let', 'mean', 'set', 'meet',
  'include', 'continue', 'learn', 'change', 'lead', 'turn',
  'start', 'run', 'move', 'live', 'bring', 'happen', 'write',
  'provide', 'sit', 'lose', 'pay', 'send', 'expect', 'build',
  'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest',
  'raise', 'pass', 'sell', 'require', 'report', 'decide',
  'pull', 'buy', 'wear', 'speak', 'explain', 'hope', 'develop',

  // Common religious words (for Catholic readings)
  'god', 'jesus', 'christ', 'lord', 'spirit', 'holy', 'faith',
  'pray', 'prayer', 'church', 'heaven', 'angel', 'soul',
  'bless', 'blessed', 'blessing', 'grace', 'mercy', 'love',
  'peace', 'hope', 'truth', 'light', 'glory', 'kingdom',
]);

/**
 * B1 Level: Intermediate words (2000-3000 words)
 * These should be highlighted for A1-A2 learners
 */
export const B1_WORDS = new Set([
  'achieve', 'acquire', 'admire', 'affect', 'announce', 'appear',
  'appreciate', 'approach', 'appropriate', 'arrange', 'assume',
  'attach', 'attempt', 'attend', 'attitude', 'attract', 'available',
  'avoid', 'aware', 'basis', 'benefit', 'brief', 'capable',
  'celebrate', 'challenge', 'character', 'claim', 'combine',
  'comment', 'commit', 'communicate', 'compare', 'compete',
  'complain', 'complete', 'complex', 'concentrate', 'concern',
  'conclude', 'condition', 'conduct', 'confident', 'confirm',
  'connect', 'consider', 'consist', 'constant', 'construct',
  'contain', 'contemporary', 'content', 'context', 'contract',

  // Religious B1 words
  'disciple', 'apostle', 'prophet', 'scripture', 'covenant',
  'forgive', 'forgiveness', 'repent', 'repentance', 'salvation',
  'righteous', 'righteousness', 'sacrifice', 'redeem', 'redemption',
  'witness', 'testify', 'testimony', 'proclaim', 'revelation',
]);

/**
 * Get difficulty level for a word
 * @param word - Word to check (will be converted to lowercase)
 * @returns Difficulty level
 */
export function getWordDifficulty(word: string): DifficultyLevel {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');

  if (A1_WORDS.has(normalized)) {
    return 'A1';
  }

  if (A2_WORDS.has(normalized)) {
    return 'A2';
  }

  if (B1_WORDS.has(normalized)) {
    return 'B1';
  }

  return 'advanced';
}

/**
 * Check if a word should be highlighted for learning
 * @param word - Word to check
 * @param userLevel - User's current level
 * @returns True if word should be highlighted
 */
export function shouldHighlightWord(
  word: string,
  userLevel: DifficultyLevel = 'A1'
): boolean {
  const difficulty = getWordDifficulty(word);

  // A1 learners: highlight A2, B1, and advanced
  if (userLevel === 'A1') {
    return difficulty !== 'A1';
  }

  // A2 learners: highlight B1 and advanced
  if (userLevel === 'A2') {
    return difficulty === 'B1' || difficulty === 'advanced';
  }

  // B1 learners: only highlight advanced
  if (userLevel === 'B1') {
    return difficulty === 'advanced';
  }

  return false;
}

/**
 * Extract difficult words from text
 * @param text - Text to analyze
 * @param userLevel - User's current level
 * @returns Array of difficult words with their difficulty levels
 */
export function extractDifficultWords(
  text: string,
  userLevel: DifficultyLevel = 'A1'
): Array<{ word: string; difficulty: DifficultyLevel }> {
  // Split into words and clean
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length > 2); // Ignore very short words

  // Remove duplicates
  const uniqueWords = Array.from(new Set(words));

  // Filter and map to difficult words
  return uniqueWords
    .filter(word => shouldHighlightWord(word, userLevel))
    .map(word => ({
      word,
      difficulty: getWordDifficulty(word),
    }))
    .sort((a, b) => {
      // Sort by difficulty level (advanced first)
      const order = { advanced: 0, B1: 1, A2: 2, A1: 3 };
      return order[a.difficulty] - order[b.difficulty];
    });
}

/**
 * Get difficulty badge color
 * @param difficulty - Difficulty level
 * @returns Hex color code
 */
export function getDifficultyColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'A1':
      return '#4CAF50'; // Green - easy
    case 'A2':
      return '#FFC107'; // Yellow - elementary
    case 'B1':
      return '#FF9800'; // Orange - intermediate
    case 'advanced':
      return '#F44336'; // Red - difficult
    default:
      return '#9E9E9E'; // Gray - unknown
  }
}

/**
 * Get difficulty label
 * @param difficulty - Difficulty level
 * @returns Human-readable label
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'A1':
      return 'Basic';
    case 'A2':
      return 'Elementary';
    case 'B1':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    default:
      return 'Unknown';
  }
}
