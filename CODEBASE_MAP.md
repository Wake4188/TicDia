# TicDia Codebase Map

> **Quick reference guide for navigating the TicDia project structure**

## 📁 Project Structure

```
TicDia/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth, Language, Theme)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components (routes)
│   ├── services/          # API & business logic
│   └── index.css          # Global styles
├── supabase/              # Database migrations
└── public/                # Static assets
```

## 🗂️ Key Directories

### `/src/pages/` - Main Pages
| File | Route | Purpose |
|------|-------|---------|
| `Index.tsx` | `/` | Home page with article feed |
| `Discover.tsx` | `/discover` | Article discovery page |
| `Auth.tsx` | `/auth` | Login/signup page |
| `Profile.tsx` | `/profile` | User profile & settings |
| `Today.tsx` | `/today` | Today's articles |
| `Recap.tsx` | `/recap` | Year in review (currently disabled) |

### `/src/components/` - UI Components
| Component | Purpose |
|-----------|---------|
| `Sidebar.tsx` | Left navigation sidebar |
| `RightSidebar.tsx` | Article actions (Save, Share, Edit) |
| `ArticleItem.tsx` | Article card in feed |
| `AnalyticsStats.tsx` | Analytics dashboard with XP/Levels |
| `BadgeDisplay.tsx` | User badges & achievements |
| `ErrorBoundary.tsx` | Error handling wrapper |
| `LazyImage.tsx` | Optimized image loading |

### `/src/services/` - Business Logic
| Service | Purpose |
|---------|---------|
| `analyticsService.ts` | User analytics & tracking |
| `userPreferencesService.ts` | User settings (theme, font, liquid glass) |
| `votingService.ts` | Article voting system |
| `textToSpeechService.ts` | TTS functionality |

### `/src/hooks/` - Custom Hooks
| Hook | Purpose |
|------|---------|
| `useUserPreferences.tsx` | Manage user preferences |
| `useAnalyticsTracking.tsx` | Track user analytics |
| `useChallengeTracking.tsx` | Track user challenges |

### `/src/contexts/` - React Contexts
| Context | Purpose |
|---------|---------|
| `AuthContext.tsx` | User authentication state |
| `LanguageContext.tsx` | Internationalization |
| `ThemeContext.tsx` | Theme management |

## 🎨 Styling

- **Global Styles**: `/src/index.css`
- **Tailwind Config**: `/tailwind.config.ts`
- **CSS Variables**: Defined in `index.css` under `:root`

### Key CSS Classes
- `.liquid-glass` - Glassmorphism effect (Apple-style)
- `.glass-panel` - Glass panel base style
- `.sidebar-icon` - Sidebar icon styling

## 🗄️ Database (Supabase)

### Migrations
Located in `/supabase/migrations/`
- `20251120180000_add_feed_type.sql` - Adds feed preference column
- `20251120181000_add_liquid_glass_mode.sql` - Adds liquid glass mode column

### Key Tables
- `user_analytics` - User activity tracking
- `user_preferences` - User settings
- `article_votes` - Article voting data
- `saved_articles` - User's saved articles

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server (localhost:8080)
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npx supabase db push    # Apply migrations (requires link)
```

## 🔑 Key Features & Their Files

### Feature 1: Gamified Analytics
- **Component**: `src/components/AnalyticsStats.tsx`
- **Service**: `src/services/analyticsService.ts`
- **Hook**: `src/hooks/useAnalyticsTracking.tsx`

### Feature 2: Feed Preferences
- **UI**: `src/pages/Profile.tsx` (Settings tab)
- **Service**: `src/services/userPreferencesService.ts`
- **Types**: `feedType: 'random' | 'curated' | 'mixed'`

### Feature 3: Liquid Glass Mode
- **UI**: `src/pages/Profile.tsx` (Settings tab)
- **Styles**: `src/index.css` (`.liquid-glass` class)
- **App**: `src/App.tsx` (applies class conditionally)

## 🐛 Common Issues & Solutions

### Issue: Build fails with Tailwind error
**Solution**: Check `src/index.css` for invalid `@apply` syntax with arbitrary values

### Issue: Black screen / ReferenceError
**Solution**: Ensure hooks are used inside components, not at module level

### Issue: Database column missing
**Solution**: Run migrations in `supabase/migrations/`

## 📝 Code Patterns

### Adding a new user preference:
1. Update `UserPreferences` interface in `src/services/userPreferencesService.ts`
2. Add to `loadUserPreferences` and `saveUserPreferences` functions
3. Add UI control in `src/pages/Profile.tsx`
4. Create migration in `supabase/migrations/`

### Adding a new page:
1. Create component in `src/pages/`
2. Add lazy import in `src/App.tsx`
3. Add route in `src/App.tsx` Routes

## 🔗 External Services

- **Supabase**: Database & Auth
- **Vercel**: Hosting & Deployment
- **Google Analytics**: Analytics tracking

---

**Last Updated**: 2025-11-20
