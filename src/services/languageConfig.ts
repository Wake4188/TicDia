
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  wikipediaDomain: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', wikipediaDomain: 'en.wikipedia.org' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', wikipediaDomain: 'es.wikipedia.org' },
  { code: 'fr', name: 'French', nativeName: 'Français', wikipediaDomain: 'fr.wikipedia.org' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', wikipediaDomain: 'de.wikipedia.org' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', wikipediaDomain: 'it.wikipedia.org' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', wikipediaDomain: 'pt.wikipedia.org' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', wikipediaDomain: 'ru.wikipedia.org' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', wikipediaDomain: 'ja.wikipedia.org' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', wikipediaDomain: 'zh.wikipedia.org' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', wikipediaDomain: 'ar.wikipedia.org', rtl: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', wikipediaDomain: 'ko.wikipedia.org' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', wikipediaDomain: 'hi.wikipedia.org' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', wikipediaDomain: 'tr.wikipedia.org' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', wikipediaDomain: 'nl.wikipedia.org' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', wikipediaDomain: 'sv.wikipedia.org' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', wikipediaDomain: 'pl.wikipedia.org' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', wikipediaDomain: 'uk.wikipedia.org' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', wikipediaDomain: 'vi.wikipedia.org' },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // English
