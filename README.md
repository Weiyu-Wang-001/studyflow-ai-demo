# StudyFlow AI

> An interactive learning resource management web app for university students, featuring AI-powered Q&A and data visualization.

---

## Features

- **User Authentication** — Register/login system with SHA-256 password hashing and JSON file storage
- **Resource Management** — Support for 6 resource types: PDF, Slides, Image, Link, Notes, Video
- **Unified Search** — Keyword search + type filters + course categories + multi-dimensional sorting
- **Favorites** — One-click bookmark/unbookmark with quick access to high-value resources
- **Detail Drawer** — Slide-out panel displaying full resource details, tags, and progress
- **AI Assistant** — Powered by Tongyi Qianwen API for resource summarization and free-form Q&A
- **Data Visualization** — ECharts with multiple chart types (pie, bar, radar, heatmap, etc.)
- **Responsive Layout** — Optimized for desktop and tablet screens

---

## Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| Frontend | React 18 + TypeScript | Component-based architecture |
| UI Library | MUI v5 (@mui/material) | Material Design components |
| Visualization | ECharts + echarts-for-react | Multi-type charts |
| HTTP Client | Axios | Frontend-backend communication |
| Build Tool | Vite 5 | Fast HMR development |
| Backend | Node.js + Express 5 | API proxy + auth service |
| AI Integration | Tongyi Qianwen (qwen-plus) | Server-side proxy, key not exposed |
| User Storage | JSON file | Lightweight user data persistence |

---

## Project Structure

```
studyflow-highscore-demo/
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx        # Login / Registration page
│   │   ├── TopBar.tsx          # Top navigation bar (brand + user info)
│   │   ├── HeroSection.tsx     # Hero area + selected resource preview
│   │   ├── StatsGrid.tsx       # Stats cards (total / favorites / visible / progress)
│   │   ├── ResourceLibrary.tsx # Resource library (search / filter / sort / card grid)
│   │   ├── ResourceCard.tsx    # Individual resource card
│   │   ├── DetailDrawer.tsx    # Resource detail side drawer
│   │   ├── AIAssistant.tsx     # AI assistant chat panel
│   │   ├── DataCharts.tsx      # ECharts data visualizations
│   │   ├── InsightColumn.tsx   # Right-side insight column
│   │   └── EmptyState.tsx      # Empty state placeholder
│   ├── types/index.ts          # TypeScript type definitions
│   ├── data/resources.ts       # Mock resource data
│   ├── utils/
│   │   ├── api.ts              # API call utilities
│   │   └── icons.tsx           # Resource type icon mapping
│   ├── App.tsx                 # Main application entry
│   ├── main.tsx                # React mount point
│   └── styles.css              # Global styles
├── server/
│   ├── index.js                # Express server entry
│   ├── routes/
│   │   ├── ai.js               # AI chat / summarize API
│   │   └── auth.js             # User register / login API
│   └── data/
│       └── users.json          # User data storage
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend Server

```bash
npm run server
```

The backend starts at `http://localhost:3008` and exposes the following APIs:

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| POST | /api/ai/chat | AI conversation |
| POST | /api/ai/summarize | AI resource summarization |

### 3. Start the Frontend Dev Server

```bash
npm run dev
```

The frontend starts at `http://localhost:5173` and automatically proxies `/api` requests to the backend.

### 4. Build for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

---

## Usage

1. Open `http://localhost:5173` to reach the login page
2. Click **Sign Up** to create a new account (username >= 3 chars, password >= 6 chars)
3. After successful registration, switch to the login form and sign in
4. Once logged in, browse resources, search/filter, view details, and use the AI assistant
5. User info is displayed in the top-right corner; click the logout icon to sign out

---

## Development Notes

- The frontend uses Vite's proxy to forward `/api` requests to `http://localhost:3008` (see `vite.config.ts`)
- AI features rely on the Tongyi Qianwen API; the API key is stored server-side only and never exposed to the client
- User data is stored as a JSON file at `server/data/users.json` with SHA-256 hashed passwords
- Login state is persisted via `localStorage` and survives page refreshes
