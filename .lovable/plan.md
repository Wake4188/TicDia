
# Plan: Integrate Merriam-Webster Dictionary API

## Overview
Replace Wiktionary and dictionaryapi.dev as the primary English definition source with Merriam-Webster Collegiate Dictionary API. The API key will be stored securely as a Supabase secret, and a new Edge Function will proxy requests to keep the key private.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  wiktionaryService.ts                                          │  │
│  │                                                                │  │
│  │  lookupWord(word, lang)                                        │  │
│  │    │                                                           │  │
│  │    ├── lang === "en"                                           │  │
│  │    │   └── Call Edge Function /dictionary-lookup               │  │
│  │    │       ├── Success → Return Merriam-Webster definitions    │  │
│  │    │       └── Failure → Fallback to Wiktionary               │  │
│  │    │                                                           │  │
│  │    └── lang !== "en"                                           │  │
│  │        └── Call Wiktionary API directly (unchanged)            │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Edge Function (Deno)                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  dictionary-lookup                                             │  │
│  │    │                                                           │  │
│  │    ├── Validate word parameter                                 │  │
│  │    ├── Call Merriam-Webster API with secret key                │  │
│  │    ├── Parse MW response format                                │  │
│  │    └── Transform to WordDefinition format                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Merriam-Webster Collegiate API                         │
│  https://dictionaryapi.com/api/v3/references/collegiate/json/{word} │
└─────────────────────────────────────────────────────────────────────┘
```

## Components Affected

| Component | Current Behavior | New Behavior |
|-----------|-----------------|--------------|
| `WordFeed.tsx` | Fetches definitions via `lookupWord` | No changes needed - uses same interface |
| `HighlightedText.tsx` | Verifies words via `lookupWord` | No changes needed - uses same interface |
| `WordDefinitionTooltip.tsx` | Displays definitions from `lookupWord` | No changes needed - uses same interface |
| `wiktionaryService.ts` | Calls Wiktionary/dictionaryapi.dev | Will call Edge Function for English |

## Implementation Steps

### Step 1: Add Merriam-Webster API Key as Secret
Store the API key `7db69ea5-6998-4d64-8031-95eb68aa3546` as a Supabase secret named `MERRIAM_WEBSTER_API_KEY`

### Step 2: Create Edge Function
Create `supabase/functions/dictionary-lookup/index.ts`:
- Accept `word` query parameter
- Fetch from Merriam-Webster API: `https://dictionaryapi.com/api/v3/references/collegiate/json/{word}?key={key}`
- Parse the response (extract `fl` for part of speech, `shortdef` for definitions)
- Return in the existing `WordDefinition` format for compatibility

### Step 3: Update wiktionaryService.ts
Modify `lookupWord` function:
- For English (`en`): Call the new Edge Function first
- If Edge Function fails: Fall back to existing Wiktionary/dictionaryapi.dev
- For other languages: Continue using Wiktionary directly (no change)

### Step 4: Add Preconnect Hint
Add to `index.html`:
```html
<link rel="preconnect" href="https://dictionaryapi.com">
```

## Technical Details

### Merriam-Webster Response Format
The API returns an array of entries. Each entry contains:
- `fl`: Part of speech (noun, verb, adjective, etc.)
- `shortdef`: Array of short definition strings (easy to use)
- `def`: Detailed definition structure with examples (optional to parse)

Example response structure:
```json
[{
  "meta": { "id": "test:1" },
  "fl": "noun",
  "shortdef": [
    "a means of testing",
    "something that tries or proves"
  ]
}]
```

### Edge Function Response Format
```typescript
{
  success: true,
  definitions: [{
    partOfSpeech: "noun",
    language: "en",
    definitions: [
      { definition: "a means of testing", examples: [] },
      { definition: "something that tries or proves", examples: [] }
    ]
  }]
}
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/dictionary-lookup/index.ts` | Create | Edge Function to proxy Merriam-Webster API |
| `src/services/wiktionaryService.ts` | Modify | Add Edge Function call for English lookups |
| `index.html` | Modify | Add preconnect for dictionaryapi.com |

## Benefits
- Higher quality, authoritative English definitions from Merriam-Webster
- API key secured server-side in Edge Function
- Zero changes needed to UI components (WordFeed, tooltips, etc.)
- Graceful fallback to Wiktionary if Merriam-Webster fails
- Non-English languages continue working via Wiktionary
