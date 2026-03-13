# Zent App

Frontend client for **Zent** — a self-hosted Discord alternative. React SPA with Electron desktop support, real-time WebSocket gateway, and voice/video via LiveKit.

## Quick Start

```bash
npm install
cp .env.example .env  # fill in API URLs
npm run dev
```

Opens at `http://localhost:3000`. Requires [zent-server](https://github.com/akadon/zent-server) running for the backend API.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript |
| Build | Vite 7 (vinext) |
| Styling | TailwindCSS 3 |
| State | Zustand 5 |
| Data Fetching | TanStack Query 5 |
| Voice/Video | LiveKit Client |
| Desktop | Electron 33 |
| E2E Tests | Playwright |
| Unit Tests | Vitest |

## Structure

```
src/
  components/           UI components
    layout/             App shell, sidebar, header
    channel/            Channel list, sidebar, voice controls
    message/            Message list, input, actions, markdown
    voice/              Voice channel, stage, soundboard
    settings/           User/guild settings panels
    guild/              Guild management (roles, members, moderation)
  hooks/                Custom React hooks (keyboard shortcuts, media queries)
  stores/               Zustand stores (auth, guild, theme, voice, notifications)
  lib/                  API client, utilities
  gateway/              WebSocket client (auto-reconnect, event dispatch)
  types/                TypeScript interfaces
electron/               Electron main process
packages/               Shared workspace packages (types, permissions, gateway-types)
tests/                  Playwright E2E tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Production SPA build |
| `npm run dev:desktop` | Electron dev mode |
| `npm run build:desktop` | Package Electron app |
| `npm run test` | Playwright E2E tests |
| `npm run test:unit` | Vitest unit tests |

## Environment Variables

```env
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
VITE_CDN_URL=http://localhost:4000
```

All URLs are baked in at build time via Vite. Never hardcode production URLs in source — use `.env` files or CI variables.

## Deployment

Static SPA deployed to **Oracle Cloud Always Free** infrastructure. Served by nginx with Cloudflare (Free plan) as CDN. GitHub Actions builds on push to main and deploys via self-hosted runner over private VCN.

## License

Private. All rights reserved.
