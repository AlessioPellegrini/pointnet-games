# Mahjong Arcade

Classic Mahjong Solitaire tile-matching with a modern twist: a 4-slot staging box, face-down memory tiles, drag-to-peek and guaranteed solvable boards. Mobile-first, no pan/zoom.

> **Version: 0.2.0** — Playable prototype. Original implementation written from scratch in vanilla JS, inspired by the algorithms of [ffalt/mah](https://github.com/ffalt/mah) (MIT). The arcade engine, UI, progression, memory/staging mechanics and scoring are entirely PointNet's own work (GPL-2.0+).

## Attribution

- Algorithms studied and inspired by: [ffalt/mah](https://github.com/ffalt/mah) — "a html5 mahjong solitaire game" — **MIT License**
- Original implementation, arcade progression, UI, scoring and mobile optimization: **PointNet Games** — **GPL-2.0+**
- No code is copied: the engine is written from scratch in vanilla JavaScript with zero dependencies.

## Gameplay & Mechanics

### Classic rule
- A tile is **free** when nothing is stacked above it **and** at least one side is free (left or right)
- Free tiles can be sent to the staging box

### Staging Box (4 slots)
- Click a free tile → it **flies** to the staging box with a 300ms bounce animation
- Two tiles with the **same symbol** in the box → **auto-match**: both disappear, +100 points
- **4 tiles in the box without a match** → **game over** (retry from the current level)
- Tiles in the staging box can be moved before matching — they unlock tiles underneath

### Face-Down Memory Tiles
- Some pairs start **covered** (dark blue back with "?" pattern)
- **1st click** on a covered tile → reveals the symbol, stays on the board
- Click on another covered tile → the previous one re-covers, the new one reveals
- **2nd click** on the revealed tile → sends it to the staging box
- If the revealed tile's match is already in the staging box → **auto-match** instantly

### Drag-to-Peek
- Grab any free tile with mouse or finger → lift it above the stack
- See what's underneath, release → it snaps back with a soft animation
- Movement < 4px is treated as a normal click

### Rendering
- Pure DOM tiles (no canvas, no SVG) with identical pixel geometry
- 3D effect via layered box-shadows: right/bottom side faces, deep ambient shadow, top inner edge
- Face gradients + rounded corners for a realistic "tile" look
- Whole board scales (up and down) to fill the viewport on both desktop and mobile

## Roadmap

### Phase 1 — Core engine ✅ (in progress)
- [x] Study `ffalt/mah` algorithms (board, solver, random-layout)
- [x] Design vanilla JS engine: tile model, board layers, matching rules
- [x] Implement solver (DFS + pruning, solvability check)
- [x] Playable UI: DOM tiles with 3D styling
- [x] `manifest.json` + `index.html` registering the game in the plugin
- [ ] Implement procedural layout generator (shapes, layers, difficulty curve)

### Phase 2 — Tiles & Hints ✅ (mostly done)
- [x] Hint feature: highlight two matching tiles
- [x] Top bar: timer ⏱️, pairs left, score
- [x] Staging box with auto-match and game-over
- [x] Face-down memory tiles
- [x] Drag-to-peek
- [x] Flight animation to staging box
- [x] Vanilla CSS, no dependencies
- [ ] 3-4 selectable tile back variants (classic, flowers, bamboo, animals)

### Phase 3 — Arcade Levels & Scoring
- [ ] 100+ levels with gradual difficulty curve
- [ ] Progressive parameters: layers (3→5), shapes (2→7), face-down pairs (1→8)
- [ ] Undo/hint limits per level (5→0)
- [ ] Staging box size variation (3 slots early → 6 slots late)
- [ ] Score system: removed tiles × time bonus, penalty for hints/undo
- [ ] Splash + level bar UI (same style as minesweeper-arcade)
- [ ] **No pan/zoom**: board resizes to fit the viewport ✅

### Phase 4 — Registered User Persistence
- [ ] Save progress via `submitScore()` for leaderboard
- [ ] Logged-in users resume from their saved level
- [ ] Anonymous users always start from Level 1 (pure arcade)
- [ ] Level stored in `wp_user_meta` (`_pointnet_games_mahjong_level`)

### Phase 5 — Polish & Extra Mechanics
- [ ] **Half-cover tiles**: tiles can cover exactly half of two tiles below
- [ ] 3 lives / game over flow
- [ ] Confetti + tile remove animations
- [ ] Sound effects (match, flip, game over)
- [ ] Dark theme consistent with the plugin

## Level Design

The difficulty progression uses the engine's procedural layout generators:

| Level range | Layers | Tiles | Face-down pairs |
|---|---|---|---|
| 1–10 | 3 | 36–48 | 1–2 |
| 11–20 | 3 | 48–72 | 3–4 |
| 21–35 | 4 | 72–96 | 4–6 |
| 36–50 | 4 | 96–144 | 6–8 |
| 51–75 | 5 | 144 | 8 |
| 76–100+ | 5 | 144 | 8 |

All boards are generated with the solver to guarantee solvability.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full engine design document: data model, generator, solver, scoring, rendering and level parameters.

## Technical Notes

- **Engine**: vanilla JavaScript, single self-contained HTML file (no build step)
- **No runtime dependencies**: static HTML + JS + CSS served via iframe
- **No pan/zoom**: the board always fits the viewport, tiles scale responsively
- **API integration**: `window.pointnetGamesAPI.submitScore()` for leaderboard (Phase 4)
- **License**: GPL-2.0+ — original implementation inspired by ffalt/mah (MIT)

## Changelog

### v0.2.0 — Playable prototype (current)
- Staging box (4 slots): auto-match, game over at 4 tiles without match
- Face-down memory tiles (1 pair covered, reveal on tap, 2nd tap → staging)
- Auto-match between revealed tile and staging content
- Drag-to-peek with pointer events (mouse + touch)
- Flight animation: tile flies from board to staging box (300ms bounce)
- Board scaling: fills viewport on desktop and mobile (no 1.0 clamp)
- Mobile responsive CSS (@media max-width 480px)
- 3D tile rendering: layered shadows, gradients, rounded corners, soft side faces
- DFS solver guaranteeing solvability (shuffle + re-roll)
- Top bar: timer, pairs left, score
- Hint and undo buttons

### v0.1.0 — Project scaffolding
- Project scaffolding: this doc only. Name: Mahjong Arcade. From-scratch vanilla JS implementation decided.

---

by PointNet · compatible with PointNet Games WordPress plugin