# TicDia

**Wikipedia meets vertical scroll.** TicDia transforms the world's largest encyclopedia into a feed you can't put down -- swipe through articles, historical events, and surprising facts the same way you'd scroll through short-form video.

[Live app](https://ticdia.vercel.app/) · Made with care in France

---

## What it does

TicDia pulls content from Wikipedia's API and presents it in a full-screen, snap-scrolling interface optimized for phones. No login required to start reading, but signing in unlocks personalization, saved articles, and reading stats.

### Feeds

| Feed | Source | What you get |
|------|--------|-------------|
| **Main** | Wikipedia random + curated | Full article cards with images, audio, and voting |
| **Words** | Wiktionary + word complexity engine | A daily deep-dive into an interesting word -- etymology, pronunciation, usage |
| **On This Day** | Wikipedia `/feed/onthisday` | Historical events, births, and deaths tagged with context ("Died on this day, 3 years ago") |
| **Did You Know?** | Wikipedia random summaries | Bite-sized facts from across every domain |

All feeds share the same vertical snap-scroll UX with background imagery, glass-morphism cards, and smooth transitions.

### Highlights

- **10 languages** with full RTL support for Arabic
- **Text-to-speech** via ElevenLabs -- listen to articles in their native language
- **Deep personalization** -- fonts, highlight colors, text size, background opacity, all synced to your account
- **Daily challenges and badges** -- gamified reading streaks
- **Community voting** -- upvote the best articles to surface them for others
- **Search** with instant suggestions across Wikipedia
- **Category browsing** -- Science, History, Technology, Arts, Sports, Nature, Philosophy, Politics, Literature
- **PWA** with offline support and install prompt

---

## Architecture

```
React 18 + TypeScript + Vite
    |
    |-- Tailwind CSS + shadcn/ui + Framer Motion
    |-- TanStack Query for server state
    |-- React Router v6 with lazy-loaded routes
    |
Supabase (backend)
    |-- PostgreSQL: profiles, saved_articles, analytics, challenges, votes, preferences
    |-- Auth: email/password
    |-- Edge Functions: TTS, translation, article selection, news, RSS
    |
External APIs
    |-- Wikipedia REST API (articles, search, on-this-day, random)
    |-- Wiktionary (word definitions)
    |-- ElevenLabs (speech synthesis)
```

### Key tables

`profiles` `saved_articles` `user_analytics` `user_preferences` `daily_challenges` `user_achievements` `article_votes` `word_of_the_day` `announcements` `content_moderation` `feed_curation` `feature_flags`

### Edge functions

`text-to-speech` `tts-stream` `translate` `explain-article` `daily-article-selection` `fetch-news` `rss-feed` `dictionary-lookup`

---

## Project structure

```
src/
  components/     UI components (ArticleViewer, Navigation, AudioPlayer, FeedDropdown, ...)
    ui/           shadcn/ui primitives
    admin/        Admin panel components
    profile/      Profile views (mobile + desktop)
  contexts/       Auth, Language, Theme, UserPreferences
  hooks/          Custom hooks (analytics, articles, challenges, feature flags, ...)
  pages/          Route components (Index, Discover, Today, Profile, WordFeed, OnThisDayFeed, DidYouKnowFeed, ...)
  services/       API clients and business logic (wikipedia, tts, voting, search, ...)
  utils/          Security, performance, error tracking
supabase/
  functions/      Deno edge functions
  migrations/     Database migrations
```

For a detailed map of what lives where, see [CODEBASE_MAP.md](CODEBASE_MAP.md).

---

## Running locally

Requires Node 18+ or Bun.

```bash
git clone https://github.com/yourusername/TicDia.git && cd TicDia
npm install   # or bun install
```

Create `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

```bash
npm run dev     # http://localhost:8080
npm run build   # production build
npm run preview # preview production build
```

---

## Deployment

Hosted on Vercel with automatic deploys from `main`. Static assets get 1-year cache headers. Routes are lazy-loaded and code-split. Bundle size is monitored with Rollup Visualizer.

See [DEPLOYMENT_FIXES.md](DEPLOYMENT_FIXES.md) and [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) for specifics.

---

## Mobile

TicDia is a PWA with responsive design, touch gestures, and Capacitor support for native Android builds. See [ANDROID_README.md](ANDROID_README.md) for the native build process.

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) -- AI recommendations, social features, native apps, and more.

---

## Contributing

Fork, branch (`feature/your-thing`), commit, push, PR. That's it.

---

## Credits

Built by **Noa Wilhide**. Powered by Wikipedia, ElevenLabs, Supabase, and Vercel. UI ideas by Ben Camewell.

## License

All rights reserved. No use, redistribution, or modification without explicit permission. See [LICENSE](LICENSE).

---

*Not affiliated with Wikipedia or TikTok. Wikipedia content used under Creative Commons.*
