# Nagrik

> A hyperlocal civic engagement platform empowering citizens to report, track, and resolve community issues using AI-powered analysis and community verification.

---

## Overview

Nagrik is a mobile-first web application that bridges the gap between citizens and local governance. Citizens can report civic issues through multiple input modes (images, video, voice, text), which are then analyzed by Google Gemini AI to extract structured data including severity, category, root cause analysis, and priority scoring. Reports are geotagged, community-verified, and tracked through a transparent timeline until resolution.

---

## Features

### Issue Reporting
- **Multi-modal input** — Report via photo, video, voice recording, or text description
- **AI-powered analysis** — Gemini AI extracts title, category, severity, priority score, root cause, and confidence level
- **Geolocation tagging** — Automatic GPS coordinates with manual address override
- **Duplicate detection** — AI checks new reports against existing issues to prevent duplicates
- **8 issue categories** — Road damage, water, waste, lighting, drainage, noise, safety, other

### Interactive Map
- **Leaflet map** with multiple tile layers (dark, satellite, terrain)
- **Search & geocode** — Nominatim-powered place search biased toward India
- **Fullscreen mode** with locate-me and category filters
- **Issue markers** with severity-based color coding and click-to-view details

### Community Verification
- **Crowd-sourced validation** — Citizens verify issues as "still exists" or "resolved"
- **Confidence scoring** — Dynamic confidence calculated from verification ratio
- **Auto-resolution** — Issues automatically marked resolved when verification threshold met
- **Timeline tracking** — Full event history from report through verification to resolution

### AI Assistant & Analysis Resiliency
- **"Ask Your Area"** — Conversational AI that answers local civic questions using real issue data without hallucinations or refusals
- **Context-aware** — Injects community pulse, issue counts, and category data into prompts
- **Robust API Retry** — Implemented exponential backoff for all Gemini API routes (pulse and assistant) to handle high-demand 503 spikes gracefully
- **Dynamic Local Fallback** — In case of complete AI failure, calculates category pulse scores and emergency alerts locally from actual issue dataset

### Multilingual Support
- **Extensive Translations** — Support for major Indian languages including Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Odia, Malayalam, Punjabi, etc.
- **Bilingual AI Outputs** — Assistant and Pulse generate narratives in both English and the user's selected local language.

### City Pulse Dashboard
- **Community pulse scores** — Per-category health scores (roads, water, waste, lighting, drainage, safety)
- **Flash alerts** — Critical/warning/info alerts with affected population estimates
- **Predictive insights** — AI-generated forecasts and trend analysis
- **City mood card** — Narrative summary of current civic conditions

### User Profile
- **Impact score** — Composite metric based on reports, verifications, and activity
- **Stats tracking** — Reports created, issues verified, resolution rate
- **Achievement system** — Badges and milestones
- **Recent activity** feed

### Additional Features
- **Nearby issues** — Location-based issue discovery
- **Issue detail sheets** — Full issue view with timeline, verification controls, and citizen verification counts
- **Demo seeder** — Realistic Indian city data for testing without Supabase
- **PWA support** — Installable as a Progressive Web App

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Animation | Framer Motion |
| AI | Google Gemini (Generative AI SDK) |
| Database | Supabase (PostgreSQL, Auth, SSR) |
| Maps | Leaflet + react-leaflet |
| Icons | Lucide React |
| Fonts | Geist (Vercel) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- A [Supabase](https://supabase.com) project (optional — app runs with mock data without it)
- A [Google Gemini](https://aistudio.google.com/apikey) API key

### Installation

```bash
git clone https://github.com/your-org/nagrik.git
cd nagrik
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

> **Note:** The app works without Supabase by falling back to mock/demo data. Only `GEMINI_API_KEY` is strictly required for AI features.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
nagrik/
├── public/
│   └── manifest.json              # PWA manifest
├── supabase/                      # Supabase config (migrations, seed)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main app shell (routing, state, geolocation)
│   │   ├── layout.tsx             # Root layout with fonts and metadata
│   │   └── api/
│   │       ├── assistant/route.ts # AI chat assistant endpoint
│   │       ├── duplicates/route.ts# Duplicate issue detection
│   │       ├── issues/route.ts    # Issues CRUD (GET list, POST create)
│   │       ├── places/route.ts    # Geocoding proxy (Nominatim)
│   │       ├── pulse/route.ts     # City pulse analysis
│   │       ├── report/route.ts    # AI report analysis
│   │       └── verify/route.ts    # Citizen verification
│   ├── components/
│   │   ├── pages/
│   │   │   ├── home-page.tsx      # Dashboard (pulse, alerts, feed, map, insights)
│   │   │   ├── report-page.tsx    # Issue reporting (image/video/voice/text)
│   │   │   ├── assistant-page.tsx # AI chat interface
│   │   │   ├── map-page.tsx       # Interactive Leaflet map
│   │   │   └── profile-page.tsx   # User profile, stats, achievements
│   │   └── ui/                    # shadcn/ui components
│   └── lib/
│       ├── gemini.ts              # Google Gemini client setup
│       ├── supabase/
│       │   ├── client.ts          # Browser Supabase client
│       │   └── server.ts          # Server-side Supabase client
│       ├── types.ts               # TypeScript types + CATEGORY_ICONS
│       ├── utils.ts               # Utility functions
│       ├── mock-data.ts           # Static mock data for UI
│       └── demo-seeder.ts         # Realistic demo data generator
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/report` | Analyze a civic report (image/video/audio/text) via Gemini AI |
| `GET` | `/api/issues` | List issues with optional `category`, `status`, `limit` filters |
| `POST` | `/api/issues` | Create a new issue (authenticated or mock mode) |
| `POST` | `/api/verify` | Verify an issue as `still_exists` or `resolved` |
| `POST` | `/api/pulse` | Generate city pulse summary and alerts from issue data |
| `POST` | `/api/duplicates` | Check a new report against existing issues for duplicates |
| `POST` | `/api/assistant` | Chat with AI assistant about local civic data |
| `GET` | `/api/places` | Search places via Nominatim geocoding (India-biased) |

---

## Issue Categories

| Category | Icon | Description |
|---|---|---|
| `road_damage` | 🛣️ | Potholes, cracked roads, construction hazards |
| `water` | 💧 | Supply issues, contamination, leakages |
| `waste` | 🗑️ | Garbage accumulation, missed collection |
| `lighting` | 💡 | Non-functional streetlights, dark areas |
| `drainage` | 🌊 | Blocked drains, flooding, waterlogging |
| `noise` | 🔊 | Excessive noise from construction, traffic |
| `safety` | 🛡️ | Public safety hazards, crime concerns |
| `other` | 📋 | Issues not fitting other categories |

---

## How It Works

1. **Report** — Citizen captures a photo/video, records voice, or describes an issue in text
2. **AI Analysis** — Gemini AI extracts structured data: title, category, severity, priority, root cause
3. **Duplicate Check** — New report is compared against existing issues to merge duplicates
4. **Publish** — Issue is saved to Supabase with geotag and timeline event
5. **Community Verify** — Nearby citizens confirm "still exists" or "resolved"
6. **Track** — Full timeline from report → verification → resolution with confidence scoring
7. **Insights** — AI aggregates all issues to generate city pulse, alerts, and predictive insights

---

## Deployment

### Vercel (Recommended)

```bash
npx vercel
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) for automatic deployments.

### Environment Variables for Production

Set these in your Vercel dashboard or deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

---

## License

MIT
