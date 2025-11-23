// Service to fetch word definitions from Wiktionary API

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

export async function lookupWord(word: string): Promise<WiktionaryResponse | null> {
    const normalizedWord = word.toLowerCase().trim();

    // Check cache first
    if (cache.has(normalizedWord)) {
        return cache.get(normalizedWord)!;
    }

    try {
        const response = await fetch(
            `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(normalizedWord)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Word not found
            }
            throw new Error(`Wiktionary API error: ${response.status}`);
        }

        const data: WiktionaryResponse = await response.json();

        // Cache the result
        cache.set(normalizedWord, data);

        return data;
    } catch (error) {
        console.error('Error fetching word definition:', error);
        return null;
    }
}

// Helper to get English definitions only
export function getEnglishDefinitions(response: WiktionaryResponse | null): WordDefinition[] {
    if (!response || !response.en) {
        return [];
    }
    return response.en;
}
