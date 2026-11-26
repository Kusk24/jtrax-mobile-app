# JTrax mobile

The JTrax student and parent app for iPhone and Android — an Expo port of
the web portals in [`jtrax-web-app`](https://github.com/Kusk24/jtrax-web-app).
Expo SDK 57, expo-router, NativeWind, use-intl (English and Thai).

## Run it on the iOS simulator

You need, once:

- **macOS with Xcode** and an iOS simulator runtime (Xcode → Settings →
  Components). Open Xcode once so it finishes installing.
- **Node 22 or 24.** The tests need 22.12 or later; Node 20 runs the app but
  not `pnpm test`.
- **pnpm** — `corepack enable` turns on the version pinned in `package.json`.
- **Go**, to run the backend locally (see its `go.mod` for the version).

### 1. Start the backend

The app needs the JTrax API. Clone
[`jtrax-backend`](https://github.com/Kusk24/jtrax-backend) next to this repo
and start it with demo data:

```bash
cd ../jtrax-backend
PORT=8790 JTRAX_DB=/tmp/jtrax-dev.db go run ./cmd/server
```

On first startup the backend fills an empty local database with a demo academy: a parent, two
children, classes, puzzles. Every seeded account shares one development
password, `DevPassword` in `jtrax-backend/internal/db/seed.go`.

### 2. Install and configure

```bash
cd ../jtrax-mobile-app
pnpm install
cp .env.example .env.local
```

The defaults point the iOS simulator at the local backend. Run the following app commands from this repository root.

### 3. Open it

```bash
pnpm ios
```

This runs `expo run:ios`, builds the native iOS app, and opens it on the simulator. Sign in with a seeded local account:

| Who | Sign in with |
| --- | --- |
| A student | `penny@jca.ac.th` |
| A parent | `sandy01234@gmail.com` |

If the app shows an old screen after switching branches, restart Metro with
`pnpm start --clear` and reopen the app.

## Environment

Read from `.env.local` (git-ignored), or set per build:

| Variable | What it does |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | The JTrax backend. Defaults to `http://localhost:8790`, which works on the simulator but not on a real phone — a phone cannot reach the laptop's `localhost`, so use the laptop's LAN address or the deployed API. |
| `EXPO_PUBLIC_MODEL_BASE_URL` | Where the two trained chess models and onnxruntime-web are served from — the same host the web app's `NEXT_PUBLIC_MODEL_BASE_URL` points at. Must be an absolute `https://` URL. Without it, **Play with Robot** offers the Advanced robot (Stockfish) only; Beginner and Intermediate say they could not be loaded. |

The web app’s `pnpm models:setup` stages `novice_int8.onnx`, `strong_fp16.onnx`, and the WASM files under `ort/`. The mobile WebView also loads `ort/ort.min.js`; copy it from the matching web app dependency at `node_modules/onnxruntime-web/dist/ort.min.js` into the hosted `ort/` directory.

## Push notifications

Use a native build on a physical device to test remote push delivery. The in-app inbox can be tested separately.

## Commands

| Command | |
| --- | --- |
| `pnpm ios` / `pnpm android` | Build and launch the native app locally |
| `pnpm start` | Start the Metro development server |
| `pnpm test` | Unit tests (vitest) |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Typecheck |

## Where things are

- `src/app/` — screens, by route (`student/`, `parent/`, `tournament/`).
- `src/components/` — shared pieces; `student/` and `parent/` for each portal.
- `src/lib/` — API clients and logic, each with its tests beside it.
- `src/messages/en.json`, `th.json` — every string, in both languages.

Design decisions and the history behind them are in the JTrax vault
(`jtrax-docs`), not here.
