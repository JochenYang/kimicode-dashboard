# Kimi Code Usage Dashboard

**English** | [简体中文](./README.zh-CN.md)

Local, privacy-safe usage dashboard for [Kimi Code](https://www.kimi.com/) CLI data under `~/.kimi-code` (or `%USERPROFILE%\.kimi-code` on Windows).

**Author:** Jochen · **Version:** 1.2.0

### Build with

[![Node](https://img.shields.io/badge/NODE-18%2B-339933?style=flat-square&labelColor=1F2937&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/REACT-19-61DAFB?style=flat-square&labelColor=1F2937&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/VITE-6-646CFF?style=flat-square&labelColor=1F2937&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/TAILWIND-3-38BDF8?style=flat-square&labelColor=1F2937&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Rust](https://img.shields.io/badge/RUST-stable-DEA584?style=flat-square&labelColor=1F2937&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/TAURI-2-FFC131?style=flat-square&labelColor=1F2937&logo=tauri&logoColor=black)](#desktop-tauri)

[![Platform](https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-6B7280?style=flat-square&labelColor=1F2937)](#desktop-tauri)
[![License](https://img.shields.io/badge/LICENSE-MIT-22C55E?style=flat-square&labelColor=1F2937)](./LICENSE)

It only reads **model name, timestamps, and token counts** from `usage.record`, plus a **restricted** model-alias map from `config.toml`.  
It does **not** display or log prompts, replies, code, API keys, or provider credentials.

![Kimi Code Usage Dashboard screenshot](./assets/screenshot.png)

## Features

- **Token breakdown** — non-cache input (`inputOther`), output, cache read, cache creation
- **Ranges** — today / last 7 days / last 30 days / all time
- **Charts & tables** — daily trend, model stats, cache hit rate, recent requests, year heatmap
- **i18n** — English & Simplified Chinese; auto-detect system language or switch in-app
- **Cost estimate** — official [Kimi API Platform](https://platform.kimi.ai/) list prices (USD / 1M tokens)
- **Model mapping** — `config.toml` aliases, `KIMI_MODEL_NAME`, `__kimi_env_model__`
- **Data home** — auto-detect `KIMI_CODE_HOME`, `~/.kimi-code`, Windows user profile; or pick another folder in the UI
- **Session manager** — list sessions by workspace, archive / restore, permanent delete, safe text preview (no tools/credentials)
- **Desktop (optional)** — Tauri 2 shell (Windows / macOS / Linux) with the same UI; GitHub Actions workflow for multi-OS builds

## Default data directory

| Platform | Path |
| --- | --- |
| macOS / Linux | `~/.kimi-code` |
| Windows | `%USERPROFILE%\.kimi-code` |

Override with env `KIMI_CODE_HOME`, CLI `--home`, or the in-app path control.

## Requirements

- **Web / Node server:** Node.js **18+**
- **Desktop (optional):** Rust stable, [Tauri CLI 2](https://v2.tauri.app/), platform WebView (WebView2 on Windows)

## Quick start (Web)

```bash
cd kimicode-dashboard
npm install
npm run build    # React UI → dist/
npm start        # local API + static UI on 127.0.0.1:3847
```

Open **http://127.0.0.1:3847/**

### Development (API + Vite in one command)

```bash
npm run dev
# API  : http://127.0.0.1:3847/
# Web  : http://127.0.0.1:5173/  (/api proxied to the API)
```

Split processes if needed: `npm run dev:api` / `npm run dev:web`.

```bash
# Custom home & port
node src/server.js --home "C:\Users\you\.kimi-code" --port 3847 --no-open
```

## Desktop (Tauri)

```bash
npm install
npm run build          # frontend assets for bundle
npm run tauri:dev      # development window
npm run tauri:build    # platform installers under desktop/src-tauri/target/
```

In the desktop app, the UI talks to **Rust commands** (same JSON shape as `/api/*`).  
In the browser, it uses **HTTP** via `web/src/lib/backend.js`.

CI: `.github/workflows/desktop.yml` builds on Windows / Ubuntu / macOS (tags `v*` can publish release assets).

## UI stack

- React + Vite + Tailwind
- shadcn-style primitives (Radix + CVA)
- Dark Linear-like theme, teal accent, fine scrollbars
- Framer Motion entrances (respects `prefers-reduced-motion`)
- Usage tab + Sessions tab in one shell

### Session manager

- Top nav **Sessions**
- Workspaces isolated under `sessions/wd_*`
- Archive path: `sessions/.kcd-archive/<workspace>/`
- Delete removes on-disk data and best-effort scrub of `session_index.jsonl`
- Preview shows truncated user/assistant text only — no tool dumps, no secrets

## Data source

Scans `<home>/sessions/**/wire.jsonl` and only aggregates records like:

```json
{
  "type": "usage.record",
  "model": "provider/model",
  "usage": {
    "inputOther": 0,
    "output": 0,
    "inputCacheRead": 0,
    "inputCacheCreation": 0
  },
  "usageScope": "turn",
  "time": 0
}
```

Only `usageScope === "turn"` is counted (avoids double-counting session rollups).

Model map reads `default_model` and `[models."…"]` `provider` / `model` / `display_name` from `config.toml`, plus env `KIMI_MODEL_NAME` for `__kimi_env_model__`. Secret-looking fields are stripped before use.

## Cost table (reference)

USD per **1M** tokens (see [platform.kimi.ai](https://platform.kimi.ai/) for the source of truth):

| Model | Cache hit | Input | Output |
| --- | ---: | ---: | ---: |
| kimi-k3 | 0.30 | 3.00 | 15.00 |
| kimi-k2.7-code | 0.19 | 0.95 | 4.00 |
| kimi-k2.6 | 0.16 | 0.95 | 4.00 |
| kimi-k2.5 | 0.10 | 0.60 | 3.00 |
| kimi-k2* | 0.15 | 0.60 | 2.50 |

Non-Kimi models fall back to K2.6 rates and are marked **estimated** in the UI.

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Serve API + built UI (`127.0.0.1:3847`) |
| `npm run dev` | API + Vite HMR together |
| `npm run build` | Production frontend → `dist/` |
| `npm test` | Node test suite |
| `npm run tauri:dev` | Tauri desktop dev |
| `npm run tauri:build` | Tauri release bundle |

## Privacy

- No cloud upload — local HTTP binds to **`127.0.0.1`** by default
- No message bodies, tool argument dumps, or full log text in the usage pipeline
- No API keys / provider credentials in the UI
- Session preview redacts likely secret patterns

## License

This project is released under the [MIT License](./LICENSE).
