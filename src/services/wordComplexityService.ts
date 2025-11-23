// Service to detect complex/difficult words in text

const COMMON_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
    'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
    'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
    'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
    'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did',
    'having', 'may', 'should', 'am', 'being', 'many', 'much', 'more', 'such',
    'very', 'same', 'own', 'through', 'where', 'before', 'between', 'both', 'each',
    'few', 'under', 'while', 'those', 'because', 'during', 'without', 'however',
    'another', 'much', 'too', 'own', 'same', 'made', 'over', 'before', 'must'
]);

// Count syllables in a word (rough estimation)
function countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed)$/i, ''); // Remove silent e
    word = word.replace(/^y/, ''); // Initial y counts as consonant

    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
}

export interface ComplexWord {
    word: string;
    originalText: string;
    index: number;
}

export function detectComplexWords(text: string): ComplexWord[] {
    // Split text into words while preserving punctuation context
    const wordPattern = /\b[a-zA-Z]+(?:[''][a-zA-Z]+)?\b/g;
    const matches = Array.from(text.matchAll(wordPattern));

    const complexWords: ComplexWord[] = [];

    for (const match of matches) {
        const word = match[0];
        const normalizedWord = word.toLowerCase();

        // Skip if it's a common word
        if (COMMON_WORDS.has(normalizedWord)) {
            continue;
        }

        // Skip proper nouns (capitalized words not at sentence start)
        const beforeWord = match.index! > 0 ? text[match.index! - 1] : '';
        if (word[0] === word[0].toUpperCase() && beforeWord !== '.' && beforeWord !== '!' && beforeWord !== '?') {
            continue;
        }

        // Detect complexity based on:
        // 1. Word length (>= 10 characters)
        // 2. Syllable count (>= 4 syllables)
        const syllableCount = countSyllables(word);
        const isComplex = word.length >= 10 || syllableCount >= 4;

        if (isComplex) {
            complexWords.push({
                word: normalizedWord,
                originalText: word,
                index: match.index!
            });
        }
    }

    return complexWords;
}
