// Service to detect complex/difficult words in text
// Uses linguistic patterns, word frequency, and morphological complexity

// Top 3000 most common English words (simplified set for performance)
const COMMON_ENGLISH_WORDS = new Set([
  // Top 500 most common words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
  'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
  'were', 'said', 'did', 'having', 'may', 'should', 'am', 'being', 'many', 'much', 'more', 'such',
  'very', 'same', 'own', 'through', 'where', 'before', 'between', 'both', 'each', 'few', 'under',
  'while', 'those', 'during', 'without', 'however', 'another', 'too', 'made', 'must', 'still',
  'found', 'used', 'here', 'every', 'going', 'called', 'never', 'place', 'world', 'little', 'right',
  'old', 'great', 'being', 'thing', 'called', 'put', 'hand', 'down', 'away', 'again', 'off', 'went',
  'got', 'came', 'left', 'let', 'big', 'long', 'night', 'day', 'man', 'men', 'woman', 'women',
  'child', 'children', 'life', 'home', 'house', 'part', 'last', 'three', 'four', 'five', 'number',
  'always', 'city', 'earth', 'water', 'light', 'keep', 'head', 'learn', 'real', 'seem', 'help',
  'show', 'hear', 'play', 'move', 'live', 'night', 'point', 'need', 'become', 'turn', 'begin',
  'sure', 'fact', 'kind', 'done', 'feel', 'since', 'high', 'form', 'different', 'small', 'large',
  'next', 'early', 'young', 'important', 'until', 'around', 'possible', 'together', 'often',
  'face', 'case', 'run', 'group', 'might', 'later', 'quite', 'start', 'though', 'along', 'almost',
  'try', 'read', 'already', 'order', 'white', 'least', 'half', 'best', 'better', 'true', 'nothing',
  'tell', 'problem', 'room', 'second', 'name', 'set', 'line', 'word', 'end', 'does', 'main', 'area',
  'money', 'story', 'change', 'yet', 'power', 'side', 'against', 'everything', 'body', 'book',
  'once', 'given', 'fact', 'state', 'open', 'love', 'country', 'family', 'seen', 'school', 'ask',
  'watch', 'idea', 'something', 'anything', 'member', 'party', 'stop', 'pay', 'believe', 'close',
  'hold', 'today', 'bring', 'happen', 'question', 'office', 'president', 'mother', 'father',
  'reason', 'door', 'course', 'moment', 'company', 'system', 'least', 'voice', 'toward', 'service',
  'during', 'present', 'public', 'morning', 'table', 'sometimes', 'week', 'night', 'war', 'bit',
  'matter', 'stand', 'rather', 'answer', 'remember', 'talk', 'walk', 'across', 'care', 'whole',
  'late', 'rest', 'speak', 'front', 'car', 'write', 'meet', 'ago', 'cut', 'soon', 'soon', 'enough',
  'government', 'information', 'program', 'understand', 'business', 'music', 'development',
  'water', 'itself', 'itself', 'themselves', 'himself', 'herself', 'myself', 'yourself', 'today',
  'usually', 'north', 'south', 'east', 'west', 'above', 'below', 'inside', 'outside', 'behind',
  // Common verbs
  'said', 'went', 'came', 'made', 'found', 'gave', 'told', 'felt', 'became', 'left', 'called',
  'seemed', 'asked', 'knew', 'kept', 'saw', 'must', 'began', 'looked', 'heard', 'brought', 'thought',
  'taken', 'seen', 'being', 'having', 'done', 'gone', 'known', 'written', 'given', 'shown', 'spoken',
  // Common adjectives
  'new', 'old', 'good', 'bad', 'great', 'small', 'large', 'big', 'little', 'long', 'short',
  'high', 'low', 'young', 'full', 'whole', 'free', 'clear', 'sure', 'true', 'real', 'hard',
  'easy', 'strong', 'special', 'simple', 'certain', 'private', 'recent', 'past', 'final', 'able',
  // Common nouns
  'time', 'year', 'people', 'way', 'day', 'man', 'thing', 'woman', 'life', 'child', 'world',
  'school', 'state', 'family', 'student', 'group', 'country', 'problem', 'hand', 'part', 'place',
  'case', 'week', 'company', 'system', 'program', 'question', 'work', 'government', 'number',
  'night', 'point', 'home', 'water', 'room', 'mother', 'area', 'money', 'story', 'fact', 'month',
  'lot', 'right', 'study', 'book', 'eye', 'job', 'word', 'business', 'issue', 'side', 'kind',
  'head', 'house', 'service', 'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member',
  'law', 'car', 'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body',
  'information', 'back', 'parent', 'face', 'others', 'level', 'office', 'door', 'health', 'person',
  'art', 'war', 'history', 'party', 'result', 'change', 'morning', 'reason', 'research', 'girl',
  'guy', 'moment', 'air', 'teacher', 'force', 'education'
]);

// Common French words
const COMMON_FRENCH_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'est', 'en', 'que', 'qui', 'dans',
  'ce', 'il', 'elle', 'on', 'ne', 'pas', 'plus', 'son', 'se', 'que', 'pour', 'par', 'sur',
  'avec', 'tout', 'mais', 'faire', 'comme', 'être', 'avoir', 'aller', 'voir', 'savoir', 'pouvoir',
  'vouloir', 'venir', 'dire', 'prendre', 'cette', 'bien', 'aussi', 'leur', 'deux', 'ces', 'nous',
  'vous', 'ils', 'elles', 'très', 'autre', 'même', 'temps', 'après', 'avant', 'sous', 'entre',
  'sans', 'tous', 'peu', 'encore', 'alors', 'toujours', 'depuis', 'chez', 'moins', 'donc', 'vers',
  'quand', 'jour', 'vie', 'homme', 'femme', 'enfant', 'fois', 'monde', 'part', 'main', 'chose',
  'mot', 'oui', 'non', 'petit', 'grand', 'bon', 'nouveau', 'premier', 'dernier', 'jeune', 'vieux',
  'beau', 'long', 'haut', 'seul', 'chaque', 'notre', 'votre', 'quelque', 'quel', 'dont', 'contre'
]);

// Common German words
const COMMON_GERMAN_WORDS = new Set([
  'der', 'die', 'das', 'und', 'in', 'zu', 'den', 'ist', 'von', 'nicht', 'mit', 'es', 'sie',
  'auf', 'für', 'als', 'auch', 'er', 'an', 'werden', 'aus', 'sein', 'haben', 'ich', 'nach',
  'bei', 'um', 'am', 'oder', 'wie', 'nur', 'noch', 'aber', 'wenn', 'was', 'kann', 'man',
  'wir', 'sind', 'einem', 'einer', 'hat', 'war', 'durch', 'bis', 'vor', 'werden', 'mehr',
  'diese', 'so', 'dass', 'weil', 'zum', 'zur', 'unter', 'über', 'zwischen', 'selbst', 'jetzt',
  'wieder', 'schon', 'immer', 'heute', 'hier', 'dort', 'sehr', 'gut', 'Jahr', 'Zeit', 'Tag'
]);

// Common Spanish words  
const COMMON_SPANISH_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'que', 'y', 'en', 'a', 'es', 'se', 'no',
  'por', 'con', 'para', 'su', 'al', 'lo', 'como', 'más', 'pero', 'fue', 'son', 'del',
  'este', 'ha', 'todo', 'esta', 'era', 'también', 'ser', 'muy', 'ya', 'sin', 'sobre', 'entre',
  'cuando', 'hay', 'donde', 'desde', 'todos', 'están', 'uno', 'dos', 'hacer', 'tiempo', 'vida',
  'año', 'día', 'hombre', 'mujer', 'vez', 'mundo', 'país', 'forma', 'parte', 'caso', 'cosa',
  'mismo', 'otro', 'nuevo', 'primer', 'grande', 'bueno', 'mejor', 'cual', 'mientras', 'después'
]);

// Language-specific common word sets
const COMMON_WORDS_BY_LANGUAGE: Record<string, Set<string>> = {
  'en': COMMON_ENGLISH_WORDS,
  'fr': COMMON_FRENCH_WORDS,
  'de': COMMON_GERMAN_WORDS,
  'es': COMMON_SPANISH_WORDS,
};

// Prefixes and suffixes that often indicate complex/academic words
const COMPLEX_PREFIXES = [
  'anti', 'auto', 'bio', 'circum', 'contra', 'cyber', 'dis', 'electro', 'geo', 'hydro',
  'hyper', 'infra', 'inter', 'intra', 'macro', 'meta', 'micro', 'mono', 'multi', 'neo',
  'neuro', 'omni', 'para', 'peri', 'poly', 'post', 'pre', 'proto', 'pseudo', 'psycho',
  'quasi', 'retro', 'semi', 'socio', 'sub', 'super', 'supra', 'techno', 'tele', 'thermo',
  'trans', 'ultra', 'uni'
];

const COMPLEX_SUFFIXES = [
  'aceous', 'ation', 'ological', 'ology', 'ification', 'isation', 'ization', 'aneous',
  'escent', 'itious', 'eous', 'ious', 'uous', 'ular', 'ible', 'able', 'ment', 'ness',
  'ity', 'ism', 'ist', 'ive', 'ful', 'less', 'ward', 'wise', 'like'
];

// LRU cache for complex word detection results
const complexWordsCache = new Map<string, ComplexWord[]>();
const MAX_CACHE_SIZE = 50;

// Count syllables in a word (improved algorithm)
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 2) return 1;

  // Remove silent e at the end
  word = word.replace(/(?:[^laeiouy]e)$/i, '');
  // Remove ed endings that don't add syllables
  word = word.replace(/(?:[^aeiou]ed)$/i, '');
  // Handle -le endings (like "table", "bottle")
  word = word.replace(/le$/i, 'l');
  // Initial y doesn't count as vowel
  word = word.replace(/^y/, '');

  const vowelGroups = word.match(/[aeiouy]+/gi);
  const count = vowelGroups ? vowelGroups.length : 1;

  return Math.max(1, count);
}

// Check if word has complex morphology
function hasComplexMorphology(word: string): boolean {
  const lowerWord = word.toLowerCase();

  // Check for complex prefixes
  for (const prefix of COMPLEX_PREFIXES) {
    if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length + 3) {
      return true;
    }
  }

  // Check for complex suffixes
  for (const suffix of COMPLEX_SUFFIXES) {
    if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length + 3) {
      return true;
    }
  }

  return false;
}

// Calculate word complexity score (0-100)
function getComplexityScore(word: string, languageCode: string = 'en'): number {
  const lowerWord = word.toLowerCase();
  let score = 0;

  // 1. Length factor (0-25 points)
  // Words 8+ chars start getting points, max at 15+ chars
  const lengthScore = Math.min(25, Math.max(0, (word.length - 7) * 5));
  score += lengthScore;

  // 2. Syllable factor (0-30 points)
  // 3+ syllables start getting points
  const syllables = countSyllables(word);
  const syllableScore = Math.min(30, Math.max(0, (syllables - 2) * 10));
  score += syllableScore;

  // 3. Morphological complexity (0-25 points)
  if (hasComplexMorphology(word)) {
    score += 25;
  }

  // 4. Uncommon letter patterns (0-20 points)
  // Words with unusual letter combinations
  const uncommonPatterns = /(?:ough|tion|sion|eous|ious|uous|aque|sche|scle|ght|ph)/i;
  if (uncommonPatterns.test(lowerWord)) {
    score += 15;
  }

  // Double consonants in unusual positions
  if (/([bcdfghjklmnpqrstvwxyz])\1/i.test(lowerWord)) {
    score += 5;
  }

  // 5. Penalize if it's a common word in the language (-50 points)
  const commonWords = COMMON_WORDS_BY_LANGUAGE[languageCode] || COMMON_ENGLISH_WORDS;
  if (commonWords.has(lowerWord)) {
    score -= 50;
  }

  return Math.max(0, Math.min(100, score));
}

export interface ComplexWord {
  word: string;
  originalText: string;
  index: number;
  score: number;
}

export function detectComplexWords(text: string, languageCode: string = 'en'): ComplexWord[] {
  const cacheKey = `${languageCode}:${text}`;

  // Check cache first
  if (complexWordsCache.has(cacheKey)) {
    return complexWordsCache.get(cacheKey)!;
  }

  // Split text into words while preserving punctuation context
  const wordPattern = /\b[a-zA-ZÀ-ÿ]+(?:[''][a-zA-ZÀ-ÿ]+)?\b/g;
  const matches = Array.from(text.matchAll(wordPattern));

  const complexWords: ComplexWord[] = [];
  const seenWords = new Set<string>();

  // Complexity threshold - words need score >= 40 to be considered complex
  const COMPLEXITY_THRESHOLD = 40;

  for (const match of matches) {
    const word = match[0];
    const normalizedWord = word.toLowerCase();

    // Skip if we've already processed this word
    if (seenWords.has(normalizedWord)) {
      continue;
    }
    seenWords.add(normalizedWord);

    // Skip very short words
    if (word.length < 5) {
      continue;
    }

    // Skip proper nouns (capitalized words not at sentence start)
    const charBefore = match.index! > 0 ? text[match.index! - 1] : '';
    const twoCharsBefore = match.index! > 1 ? text.slice(match.index! - 2, match.index!) : '';
    const isAfterSentenceEnd = /[.!?]\s*$/.test(twoCharsBefore) || charBefore === '';

    if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase() && !isAfterSentenceEnd) {
      // This is likely a proper noun, skip it
      continue;
    }

    // Calculate complexity score
    const score = getComplexityScore(word, languageCode);

    if (score >= COMPLEXITY_THRESHOLD) {
      complexWords.push({
        word: normalizedWord,
        originalText: word,
        index: match.index!,
        score
      });
    }
  }

  // Sort by score (most complex first) and limit to top 10
  complexWords.sort((a, b) => b.score - a.score);
  const topComplexWords = complexWords.slice(0, 10);

  // Add to cache with LRU eviction
  if (complexWordsCache.size >= MAX_CACHE_SIZE) {
    const firstKey = complexWordsCache.keys().next().value;
    if (firstKey) complexWordsCache.delete(firstKey);
  }
  complexWordsCache.set(cacheKey, topComplexWords);

  return topComplexWords;
}
