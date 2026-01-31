// Service to fetch word definitions from Wiktionary API with multilingual support

export interface WordDefinition {
  partOfSpeech: string;
  language: string;
  definitions: {
    definition: string;
    examples?: string[];
  }[];
}

export interface WiktionaryResponse {
  [language: string]: WordDefinition[];
}

const cache = new Map<string, WiktionaryResponse>();

// Patterns that indicate useless definitions (grammatical forms)
const USELESS_PATTERNS = [
  /^plural\s+(of|form\s+of)\s+/i,
  /^simple\s+past(\s+tense)?\s+(of|form\s+of)\s+/i,
  /^past\s+participle\s+(of|form\s+of)\s+/i,
  /^present\s+participle\s+(of|form\s+of)\s+/i,
  /^comparative\s+(of|form\s+of)\s+/i,
  /^superlative\s+(of|form\s+of)\s+/i,
  /^alternative\s+(spelling|form)\s+of\s+/i,
  /^inflection\s+of\s+/i,
  /^third-person\s+singular\s+/i,
  // French grammatical forms
  /^forme\s+(du|de)\s+/i,
  /^pluriel\s+(du|de)\s+/i,
  /^féminin\s+(du|de)\s+/i,
  /^masculin\s+(du|de)\s+/i,
  // German grammatical forms
  /^Plural\s+(von|des)\s+/i,
  /^Genitiv\s+(von|des)\s+/i,
  /^Dativ\s+(von|des)\s+/i,
  // Spanish grammatical forms
  /^plural\s+de\s+/i,
  /^forma\s+(del|de)\s+/i,
];

// Wiktionary language codes mapping
const WIKTIONARY_LANG_CODES: Record<string, string> = {
  'en': 'en',
  'fr': 'fr',
  'de': 'de',
  'es': 'es',
  'it': 'it',
  'pt': 'pt',
  'nl': 'nl',
  'ru': 'ru',
  'ja': 'ja',
  'zh': 'zh',
  'ko': 'ko',
  'ar': 'ar',
  'hi': 'hi',
  'pl': 'pl',
  'tr': 'tr',
  'sv': 'sv',
  'da': 'da',
  'no': 'no',
  'fi': 'fi',
  'cs': 'cs',
  'el': 'el',
  'he': 'he',
  'th': 'th',
  'vi': 'vi',
  'id': 'id',
  'ms': 'ms',
};

// Check if a definition is useless
function isUselessDefinition(definition: string): boolean {
  return USELESS_PATTERNS.some(pattern => pattern.test(definition.trim()));
}

// Filter out useless definitions from a word definition
function filterUselessDefinitions(wordDef: WordDefinition): WordDefinition | null {
  const filteredDefs = wordDef.definitions.filter(d => !isUselessDefinition(d.definition));

  if (filteredDefs.length === 0) {
    return null;
  }

  return {
    ...wordDef,
    definitions: filteredDefs
  };
}

// Fetch from Dictionary API (English only fallback)
async function fetchFromDictionaryAPI(word: string): Promise<WiktionaryResponse | null> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const wordDefinitions: WordDefinition[] = [];

    for (const entry of data) {
      if (!entry.meanings) continue;

      for (const meaning of entry.meanings) {
        const definitions = meaning.definitions?.map((def: any) => ({
          definition: def.definition || '',
          examples: def.example ? [def.example] : []
        })) || [];

        if (definitions.length > 0) {
          wordDefinitions.push({
            partOfSpeech: meaning.partOfSpeech || 'unknown',
            language: 'en',
            definitions: definitions.slice(0, 3)
          });
        }
      }
    }

    if (wordDefinitions.length === 0) {
      return null;
    }

    return { en: wordDefinitions };
  } catch (error) {
    return null;
  }
}

// Fetch from Wiktionary in a specific language
async function fetchFromWiktionary(word: string, langCode: string): Promise<WiktionaryResponse | null> {
  const wiktionaryLang = WIKTIONARY_LANG_CODES[langCode] || 'en';

  try {
    const response = await fetch(
      `https://${wiktionaryLang}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      return null;
    }

    const data: WiktionaryResponse = await response.json();

    // Get definitions in the target language first, then fall back to others
    const targetLangKey = langCode;
    let definitions = data[targetLangKey];

    // If no definitions in target language, try to find any definitions
    if (!definitions || definitions.length === 0) {
      // Look for any language definitions
      const availableLanguages = Object.keys(data);
      for (const lang of availableLanguages) {
        if (data[lang] && data[lang].length > 0) {
          definitions = data[lang];
          break;
        }
      }
    }

    if (!definitions || definitions.length === 0) {
      return null;
    }

    // Filter out useless definitions
    const filteredDefinitions = definitions
      .map(filterUselessDefinitions)
      .filter((def): def is WordDefinition => def !== null);

    if (filteredDefinitions.length === 0) {
      return null;
    }

    return { [langCode]: filteredDefinitions };
  } catch (error) {
    return null;
  }
}

// Fetch from Merriam-Webster via Edge Function (English only)
async function fetchFromMerriamWebster(word: string): Promise<WiktionaryResponse | null> {
  try {
    const response = await fetch(
      `https://rtuxaekhfwvpwmvmdaul.supabase.co/functions/v1/dictionary-lookup?word=${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.definitions || data.definitions.length === 0) {
      return null;
    }

    // Transform to WiktionaryResponse format
    const wordDefinitions: WordDefinition[] = data.definitions.map((def: any) => ({
      partOfSpeech: def.partOfSpeech || 'unknown',
      language: 'en',
      definitions: def.definitions?.map((d: any) => ({
        definition: d.definition || '',
        examples: d.examples || []
      })) || []
    }));

    return { en: wordDefinitions };
  } catch (error) {
    console.error('Merriam-Webster lookup error:', error);
    return null;
  }
}

export async function lookupWord(word: string, languageCode: string = 'en'): Promise<WiktionaryResponse | null> {
  const normalizedWord = word.toLowerCase().trim();
  const cacheKey = `${languageCode}:${normalizedWord}`;

  // Check cache first
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    // For English, try Merriam-Webster first via Edge Function
    if (languageCode === 'en') {
      const mwResult = await fetchFromMerriamWebster(normalizedWord);
      if (mwResult) {
        cache.set(cacheKey, mwResult);
        return mwResult;
      }

      // Fallback to Wiktionary for English
      const wiktionaryResult = await fetchFromWiktionary(normalizedWord, 'en');
      if (wiktionaryResult) {
        cache.set(cacheKey, wiktionaryResult);
        return wiktionaryResult;
      }

      // Final fallback to free Dictionary API
      const dictionaryResult = await fetchFromDictionaryAPI(normalizedWord);
      if (dictionaryResult) {
        cache.set(cacheKey, dictionaryResult);
        return dictionaryResult;
      }

      return null;
    }

    // For non-English, use Wiktionary
    const wiktionaryResult = await fetchFromWiktionary(normalizedWord, languageCode);
    if (wiktionaryResult) {
      cache.set(cacheKey, wiktionaryResult);
      return wiktionaryResult;
    }

    // Try English Wiktionary as final fallback (it often has entries for foreign words)
    const englishWiktionaryResult = await fetchFromWiktionary(normalizedWord, 'en');
    if (englishWiktionaryResult) {
      cache.set(cacheKey, englishWiktionaryResult);
      return englishWiktionaryResult;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Helper to get definitions in a specific language
export function getDefinitions(response: WiktionaryResponse | null, languageCode: string = 'en'): WordDefinition[] {
  if (!response) {
    return [];
  }

  // Try the exact language first
  if (response[languageCode]) {
    return response[languageCode];
  }

  // Return definitions from any available language
  const availableLanguages = Object.keys(response);
  if (availableLanguages.length > 0) {
    return response[availableLanguages[0]];
  }

  return [];
}

// Legacy helper for backwards compatibility
export function getEnglishDefinitions(response: WiktionaryResponse | null): WordDefinition[] {
  return getDefinitions(response, 'en');
}
