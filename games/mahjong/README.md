# Mahjong Solitaire

Classic Mahjong Solitaire tile-matching game with progressive arcade levels, optimized for mobile without pan/zoom.

> **Status: Planned** — The game engine will be extracted from [ffalt/mah](https://github.com/ffalt/mah) (MIT), rewritten in vanilla TypeScript/JS and converted into an arcade progression system.

## Attribution

- Engine base: [ffalt/mah](https://github.com/ffalt/mah) — "a html5 mahjong solitaire game" — **MIT License**
- Copyright (C) ffalt — original MIT notice retained in the engine source
- Game logic, arcade progression, UI, scoring and mobile optimization: **PointNet Games** — **GPL-2.0+**

## Roadmap

### Phase 1 — Engine extraction (in progress)
- [ ] Fork `ffalt/mah`
- [ ] Extract pure engine (board, builder, random-layout, solver, game state, rng)
- [ ] Remove Angular, compile to vanilla TypeScript/JS
- [ ] Minimal playable UI: solvable board via SVG tiles
- [ ] `manifest.json` + `index.html` registering the game in the plugin
- [ ] Include MIT LICENSE file for the extracted engine

### Phase 2 — Tiles & Hints
- [ ] 3-4 selectable tile back variants (classic, flowers, bamboo, animals)
- [ ] Hint feature: highlight two matching tiles (already in engine)
- [ ] Top bar: timer ⏱️, removed tiles, available moves
- [ ] Vanilla CSS, no dependencies

### Phase 3 — Arcade Levels & Scoring
- [ ] 100+ levels with gradual difficulty curve
- [ ] Progressive parameters: layers (3→5), shapes (2→7), visible pairs ratio (70%→40%)
- [ ] Undo/hint limits per level (5→0)
- [ ] Score system: removed tiles × time bonus, penalty for hints/undo
- [ ] Splash + level bar UI (same style as minesweeper-arcade)
- [ ] **No pan/zoom**: board resizes to fit the viewport

### Phase 4 — Registered User Persistence
- [ ] Save progress via `submitScore()` for leaderboard
- [ ] Logged-in users resume from their saved level
- [ ] Anonymous users always start from Level 1 (pure arcade)
- [ ] Level stored in `wp_user_meta` (`_pointnet_games_mahjong_level`)

### Phase 5 — Mobile Optimization & Polish
- [ ] Touch targets ≥ 44px
- [ ] Board scales to fill the viewport (no pan, no pinch-zoom)
- [ ] Tile size: `calc(min(44px, (viewport_width - padding) / max_tiles_per_row))`
- [ ] 3 lives / game over flow
- [ ] Confetti + tile remove animations
- [ ] Dark theme consistent with the plugin

## Level Design

The difficulty progression uses the engine's procedural layout generators:

| Level range | Layers | Base shapes | Tiles | Visible pairs |
|---|---|---|---|---|
| 1–10 | 3 | 2–3 | 36–48 | ~70% |
| 11–20 | 3 | 3 | 48–72 | ~65% |
| 21–35 | 4 | 3 | 72–96 | ~60% |
| 36–50 | 4 | 4 | 96–144 | ~55% |
| 51–75 | 5 | 5 | 144 | ~50% |
| 76–100+ | 5 | 5+ | 144 | ~40% |

All boards are generated with the solver to guarantee solvability.

## Technical Notes

- **Engine**: pure TypeScript, compiled to a single self-contained JS bundle
- **No runtime dependencies**: static HTML + JS + CSS served via iframe
- **No pan/zoom**: the board always fits the viewport, tiles scale responsively
- **API integration**: `window.pointnetGamesAPI.submitScore()` for leaderboard (Phase 4)
- **License**: dual — MIT for extracted engine, GPL-2.0+ for original additions

## Changelog

### v0.1.0 — Planned
- Project scaffolding: this doc only. Engine extraction and playable build scheduled for Phase 1.

---

by PointNet · compatible with PointNet Games WordPress plugin