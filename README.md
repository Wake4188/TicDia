# TicDia - Discover Wikipedia in TikTok Style 📚✨

> **Experience Wikipedia like never before** - A modern, engaging platform that transforms educational content into an addictive vertical feed experience.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://ticdia.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️%20in%20France-red)](https://github.com/Wake4188)

## 🎯 What is TicDia?

TicDia is an innovative web application that reimagines how we consume educational content. By combining Wikipedia's vast knowledge base with TikTok's engaging vertical scroll interface, TicDia makes learning addictive, accessible, and fun.

**Live Application:** [https://ticdia.vercel.app/](https://ticdia.vercel.app/)

## ✨ Key Features

### 📖 Content Discovery
- **Vertical Feed Interface** - Swipe through Wikipedia articles like social media stories
- **Smart Search** - Find articles instantly with intelligent search suggestions
- **Category Browsing** - Explore content by topics: Science, History, Technology, Arts, Sports, Nature, Philosophy, Politics, and Literature
- **Related Articles** - Discover connected content based on your reading history
- **Today's Highlights** - Curated daily selection of interesting articles

### 🌍 Multilingual Support
- **10 Languages Supported**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, and Arabic
- **RTL Support** - Full right-to-left text support for Arabic
- **Dynamic Translation** - UI automatically adapts to selected language
- **Wikipedia Integration** - Access articles in their native language from respective Wikipedia domains

### 🎨 Personalization
- **Custom Reading Preferences**
  - 12+ font options (Inter, Georgia, Merriweather, Lora, etc.)
  - 10+ highlight color themes
  - Adjustable background opacity (10-100%)
  - Text size customization (12-24px)
- **Cloud Sync** - Preferences saved to your account via Supabase
- **Theme Customization** - Dark mode with customizable accent colors

### 🔊 Text-to-Speech
- **ElevenLabs Integration** - High-quality AI voice synthesis
- **Multi-language TTS** - Listen to articles in their native language
- **Audio Player** - Full playback controls with progress tracking
- **Streaming Support** - Efficient audio streaming for faster playback

### 👤 User Features
- **Authentication** - Secure email/password authentication via Supabase
- **Profile Management** - Personalized user profiles with reading statistics
- **Saved Articles** - Bookmark articles for later reading
- **Reading Analytics** - Track your reading habits and progress
- **Daily Challenges** - Gamified learning with achievement badges
- **Voting System** - Community-driven content curation

### 📊 Analytics & Insights
- **Reading Statistics** - Track articles read, time spent, and topics explored
- **Progress Tracking** - Visualize your learning journey
- **Achievement System** - Unlock badges for reading milestones
- **Google Analytics** - Integrated analytics for usage insights
- **Vercel Speed Insights** - Real-time performance monitoring

### 🚀 Performance Optimizations
- **Lazy Loading** - Code splitting for faster initial load
- **Image Optimization** - Responsive images with lazy loading
- **Caching Strategy** - Smart caching for API responses and assets
- **Service Worker** - PWA support with offline capabilities
- **CDN Delivery** - Optimized asset delivery via Vercel Edge Network

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.1 with SWC for fast compilation
- **Routing**: React Router v6 with lazy-loaded routes
- **State Management**: 
  - React Context API for global state (Auth, Language, Theme)
  - TanStack Query (React Query) for server state management
- **UI Components**: 
  - shadcn/ui with Radix UI primitives
  - Tailwind CSS for styling
  - Framer Motion for animations
- **Forms**: React Hook Form with Zod validation

### Backend Services (Supabase)
- **Database**: PostgreSQL with real-time subscriptions
- **Authentication**: Supabase Auth with email/password
- **Edge Functions**:
  - `text-to-speech` - ElevenLabs TTS integration
  - `rss-feed` - News feed generation
  - `daily-article-selection` - Curated daily content
  - `translate` - Translation services
  - `explain-article` - AI-powered article explanations
  - `fetch-news` - External news aggregation

### External APIs
- **Wikipedia API** - Article content and search
- **ElevenLabs** - Text-to-speech synthesis
- **Google Analytics** - Usage tracking
- **Vercel Analytics** - Performance monitoring

### Database Schema
Key tables:
- `profiles` - User profile information
- `saved_articles` - Bookmarked articles
- `article_views` - Reading analytics
- `user_preferences` - Personalization settings
- `daily_challenges` - Gamification data
- `votes` - Community voting records

## 📦 Project Structure

```
TicDia/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ArticleViewer.tsx
│   │   ├── Navigation.tsx
│   │   ├── AudioPlayer.tsx
│   │   └── ...
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAnalyticsTracking.tsx
│   │   ├── useUserPreferences.tsx
│   │   └── ...
│   ├── pages/              # Route components
│   │   ├── Index.tsx       # Main feed
│   │   ├── Discover.tsx    # Category browsing
│   │   ├── Profile.tsx     # User profile
│   │   ├── Today.tsx       # Daily highlights
│   │   ├── Auth.tsx        # Authentication
│   │   └── Recap.tsx       # Reading recap
│   ├── services/           # API and business logic
│   │   ├── wikipediaService.ts
│   │   ├── textToSpeechService.ts
│   │   ├── analyticsService.ts
│   │   ├── translations.ts
│   │   └── ...
│   ├── utils/              # Utility functions
│   │   ├── performance.ts
│   │   └── errorTracking.ts
│   └── integrations/       # Third-party integrations
│       └── supabase/
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── index.html             # Entry HTML
├── vite.config.ts         # Vite configuration
├── vercel.json            # Vercel deployment config
├── CODEBASE_MAP.md        # 📍 Developer navigation guide
└── package.json           # Dependencies

```

## 🗺️ For Developers

New to the codebase? Check out **[CODEBASE_MAP.md](CODEBASE_MAP.md)** for:
- Quick file location reference
- Feature implementation guides
- Common code patterns
- Troubleshooting tips

```

## 🛠️ Technologies Used

### Core
- **React** 18.3.1 - UI library
- **TypeScript** 5.5.3 - Type safety
- **Vite** 5.4.1 - Build tool
- **Tailwind CSS** 3.4.11 - Styling

### UI & Components
- **shadcn/ui** - Component library
- **Radix UI** - Accessible primitives
- **Framer Motion** 11.11.11 - Animations
- **Lucide React** - Icons
- **Recharts** - Data visualization

### State & Data
- **TanStack Query** 5.56.2 - Server state
- **React Router** 6.26.2 - Routing
- **React Hook Form** 7.53.0 - Forms
- **Zod** 3.23.8 - Validation

### Backend & Services
- **Supabase** 2.54.0 - Backend as a Service
- **Vercel** - Hosting & Edge Functions
- **ElevenLabs** - Text-to-speech
- **Google Analytics** - Analytics

### Developer Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TS linting
- **Terser** - Code minification
- **Rollup Visualizer** - Bundle analysis

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun package manager
- Supabase account (for backend features)
- ElevenLabs API key (for TTS)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/TicDia.git
cd TicDia
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

4. **Run development server**
```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
# or
bun run build
```

Preview production build:
```bash
npm run preview
```

## 📱 Mobile Support

TicDia is built as a Progressive Web App (PWA) with:
- **Responsive Design** - Optimized for all screen sizes
- **Touch Gestures** - Swipe navigation for mobile
- **Offline Support** - Service worker caching
- **Install Prompt** - Add to home screen
- **Capacitor Integration** - Native Android app support

## 🌐 Deployment

TicDia is deployed on **Vercel** with automatic deployments from the main branch.

### Deployment Configuration
- **Framework**: Vite
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Node Version**: 18.x

### Performance Optimizations
- **Cache Headers** - 1-year cache for static assets
- **Code Splitting** - Lazy-loaded routes and components
- **Image Optimization** - Responsive images with lazy loading
- **Bundle Analysis** - Monitored with Rollup Visualizer
- **Core Web Vitals** - Optimized for LCP, CLS, and FID

See [DEPLOYMENT_FIXES.md](DEPLOYMENT_FIXES.md) and [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) for detailed optimization strategies.

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and improvements, including:
- Enhanced personalization with AI recommendations
- Social features (sharing, following, discussions)
- Advanced reading features (highlighting, notes, exports)
- Native mobile apps (iOS/Android)
- Premium features and monetization
- Educational platform integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Noa Wilhide**
- Made with ❤️ in France

## 🙏 Acknowledgments

- **Wikipedia** - For providing free access to knowledge
- **ElevenLabs** - For high-quality text-to-speech
- **Supabase** - For backend infrastructure
- **Vercel** - For hosting and edge functions
- **shadcn/ui** - For beautiful UI components
- **GPT Engineer** - Initial project scaffolding
- **Ben Camewell** - For UI Ideas

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

## License

All rights reserved. No use, redistribution, or modification is permitted
without explicit permission from the author. See LICENSE file for more information

---

**Note**: This is an educational project and is not affiliated with Wikipedia or TikTok. All Wikipedia content is used under the Creative Commons license.


