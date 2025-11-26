/**
 * English Stop Words for Pronunciation Feature
 *
 * Common English words that don't need pronunciation assistance.
 * ESL learners typically know these words; focus pronunciation on
 * proper nouns, technical terms, and uncommon vocabulary.
 *
 * Phase: Word Pronunciation Feature (Phase 1)
 */

// Articles
const articles = ['a', 'an', 'the'];

// Prepositions
const prepositions = [
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around',
  'at', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond',
  'by', 'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into',
  'near', 'of', 'off', 'on', 'out', 'outside', 'over', 'since', 'through',
  'to', 'toward', 'under', 'underneath', 'until', 'up', 'upon', 'with',
  'within', 'without'
];

// Conjunctions
const conjunctions = [
  'and', 'but', 'or', 'nor', 'yet', 'so', 'because', 'if', 'unless',
  'while', 'although', 'though', 'as', 'once', 'since'
];

// Common verbs (base forms)
const commonVerbs = [
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing',
  'can', 'could', 'may', 'might', 'will', 'would', 'shall', 'should',
  'must', 'ought',
  'go', 'get', 'make', 'come', 'take', 'give', 'see', 'know', 'think',
  'say', 'tell', 'show', 'ask', 'work', 'call', 'try', 'use', 'find',
  'want', 'need', 'feel', 'like', 'leave', 'put', 'mean', 'keep', 'let',
  'begin', 'seem', 'help', 'talk', 'turn', 'start', 'lose', 'meet', 'include',
  'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch',
  'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend',
  'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider',
  'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build',
  'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise',
  'pass', 'sell', 'require', 'report', 'decide', 'pull', 'explain', 'develop',
  'carry', 'break', 'receive', 'agree', 'support', 'hit', 'produce'
];

// Pronouns
const pronouns = [
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours',
  'you', 'your', 'yours',
  'he', 'him', 'his',
  'she', 'her', 'hers',
  'it', 'its',
  'they', 'them', 'their', 'theirs',
  'who', 'whom', 'whose',
  'what', 'which', 'that',
  'this', 'these', 'that', 'those',
  'one', 'ones', 'something', 'someone', 'anybody', 'everyone'
];

// Common adverbs
const commonAdverbs = [
  'not', 'no', 'yes', 'very', 'more', 'most', 'less', 'least',
  'so', 'too', 'just', 'only', 'also', 'then', 'now', 'here', 'there',
  'where', 'when', 'why', 'how', 'up', 'down', 'in', 'out', 'back',
  'forward', 'away', 'around', 'still', 'already', 'yet', 'even',
  'never', 'always', 'often', 'sometimes', 'ever', 'far', 'near',
  'well', 'fast', 'slow', 'hard', 'easily', 'quickly', 'slowly',
  'together', 'alone', 'almost', 'really', 'very', 'quite', 'rather'
];

// Common adjectives
const commonAdjectives = [
  'good', 'bad', 'big', 'small', 'large', 'little', 'new', 'old',
  'long', 'short', 'high', 'low', 'strong', 'weak', 'fast', 'slow',
  'hot', 'cold', 'warm', 'cool', 'wet', 'dry', 'clean', 'dirty',
  'happy', 'sad', 'angry', 'afraid', 'sick', 'well', 'young', 'old',
  'rich', 'poor', 'dark', 'light', 'heavy', 'light', 'easy', 'hard',
  'same', 'different', 'other', 'next', 'last', 'first', 'second',
  'third', 'whole', 'half', 'right', 'wrong', 'true', 'false'
];

// Numbers and quantifiers
const numbers = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty',
  'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred',
  'thousand', 'million', 'zero', 'first', 'second', 'third', 'fourth',
  'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'all', 'each',
  'every', 'both', 'neither', 'none', 'some', 'many', 'few', 'several',
  'several', 'several', 'enough'
];

// Common interjections and discourse markers
const interjections = [
  'oh', 'ah', 'eh', 'um', 'uh', 'well', 'now', 'then', 'well', 'yes', 'no',
  'okay', 'ok', 'indeed'
];

// Combine all into one set for efficient lookup
const allStopWords = new Set([
  ...articles,
  ...prepositions,
  ...conjunctions,
  ...commonVerbs,
  ...pronouns,
  ...commonAdverbs,
  ...commonAdjectives,
  ...numbers,
  ...interjections
].map(word => word.toLowerCase()));

/**
 * Check if a word should have pronunciation assistance
 * @param word - The word to check
 * @returns true if word should have pronunciation, false if it's a common word
 */
export const shouldIncludePronunciation = (word: string): boolean => {
  if (!word || word.trim().length === 0) {
    return false;
  }

  // Normalize: lowercase and remove extra whitespace
  const normalizedWord = word.trim().toLowerCase();

  // If word is in stop words list, don't include pronunciation
  if (allStopWords.has(normalizedWord)) {
    return false;
  }

  // Otherwise, include pronunciation (proper nouns, technical terms, etc.)
  return true;
};

/**
 * Get description of why a word would have pronunciation
 * Useful for debugging/testing
 */
export const getPronunciationReason = (word: string): string => {
  if (!word || word.trim().length === 0) {
    return 'Empty word';
  }

  const normalizedWord = word.trim().toLowerCase();

  if (allStopWords.has(normalizedWord)) {
    return 'Common English word (stop word)';
  }

  // Check if it looks like a proper noun (starts with capital letter)
  if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
    return 'Proper noun (capitalized)';
  }

  return 'Uncommon/technical word';
};

export default allStopWords;
