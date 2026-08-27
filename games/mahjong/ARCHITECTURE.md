# Mahjong Arcade — Engine Architecture

Design document for the vanilla JavaScript engine. Written from scratch, inspired by the algorithms of [ffalt/mah](https://github.com/ffalt/mah) (MIT) but simplified for an arcade-level progression game.

## Design Principles

1. **Zero dependencies** — plain HTML/CSS/JS files, no build step, no frameworks
2. **Mobile-first, no pan/zoom** — the board always fits the viewport; tiles scale
3. **Progression by parameters** — difficulty comes from generator parameters, not artistic complexity
4. **Solvability guaranteed by regeneration** — we control the generator, so we can afford to re-roll
5. **Deterministic seeds** — every level can be reproduced from a seed (share, verify, debug)

## File Structure

```
games/mahjong/
├── index.html          ← shell HTML (markup + script/css loads)
├── style.css           ← all CSS (tiles, 3D, responsive, staging, jukebox)
├── layouts.js          ← 39 layout figure builders (including classic_144)
├── solvable-levels.js  ← precomputed deterministic solvable seeds & layouts
├── data.js             ← symbols (144 tiles + wildcards), progression (330 levels)
├── engine.js           ← board model, solver, geometry math, wildcard matching
├── app.js              ← constants, DOM refs, shared state, flow (startGame, splash)
├── ui.js               ← tile DOM creation, board rebuild, fitting, particle bursts
├── input.js            ← staging box / direct classic match, undo/hint, shuffle, drag
├── progress.js         ← star rating, persistence, cumulative scores, WP bridge, boot
├── player.js           ← PointNetMusicPlayer (modular jukebox, seek bar, time, volume)
├── audio.js            ← Web Audio synthesized SFX (bamboo, water drop) + playlist bridge
├── manifest.json       ← plugin registration
├── ARCHITECTURE.md     ← this document
├── README.md           ← roadmap + changelog
└── tests/              ← automated permanent test suite (6 test runners)
```

Since v1.0.0+ the engine supports dual **Arcade & Classic Modes**:
- **layouts.js** — 39 layout builders plus `evenTrim()`/`dedupePts()` helpers (loaded first)
- **solvable-levels.js** — precomputed seed database for instant (<25ms) loading of guaranteed solvable boards
- **data.js** — symbols, `SYMBOL_SETS`, traditional 144-tile set (Flowers & Seasons wildcards), progression (330 progressive levels)
- **engine.js** — DOM-free logic: board, solver, wildcard matching, pixel geometry
- **app.js** — constants, DOM refs, `app` state, `startGame`, fullscreen/splash
- **ui.js** — `createTileEl`, `rebuildBoard`, `updateStates`, `fitBoard`/`refitUntilStable`, particle celebration
- **input.js** — staging box (Arcade) / direct matching (Classic), deadlock detection, undo/hint, shuffle, drag-to-peek
- **progress.js** — star rating, arcade/WP persistence, cumulative scores with $\times 1.5$ classic multiplier, boot sequence
- **player.js** — `PointNetMusicPlayer`: modular media player with interactive seek scrubbing, real-time $m:ss$ time display, playlist duration calculation, and volume control card
- **audio.js** — procedural Web Audio synthesized Zen sound effects (Shishi-odoshi bamboo, Suikinkutsu water drops, combo streams, wind chimes) and playlist bridge
- Load order: `layouts.js` → `solvable-levels.js` → `data.js` → `engine.js` → `app.js` → `ui.js` → `input.js` → `progress.js` → `player.js` → `audio.js` (dependencies flow downward)

## Core Data Model

### Tile

```js
// tile = { z, x, y, value, groupId }
```

| Field | Type | Meaning |
|---|---|---|
| `z` | `int ≥ 0` | Layer / depth (0 = base) |
| `x` | `int ≥ 0` | Column on 1-step grid |
| `y` | `int ≥ 0` | Row on 1-step grid |
| `value` | `int` | Face value (1..N) used for rendering |
| `groupId` | `int` | Match group: tiles with same `groupId` are identical and matchable |

### Board

```
board: Map<String, Tile>   // key = `${z},${x},${y}` → Tile
tilesLeft: int
```

No grid array: only a `Map` of placed tiles. Adjacency queries use neighbor lookups in `board`.

## Matching Rules (isFree)

A tile is **free** (playable) when:

```
NOT ( ∃ full tile at (z+1, x, y) )            // nothing directly above
NOT ( ∃ half-cover tile at (z+1, x±1, y±1) )  // nothing half-covering
AND NOT ( blocker on BOTH left AND right )
   where  blocker(left)  = ∃ tile at (z, x-2, y)
     and  blocker(right) = ∃ tile at (z, x+2, y)
```

**Rendering aligns with the logic**: layers stack almost vertically (no horizontal offset, small RISE), so a tile visually covered by a tile above is always logically blocked. Blocked tiles are dimmed via a **darker face colour** (fully opaque — no transparency, never see through).

### Half-Cover Tiles

A half-cover tile is an upper-layer tile placed exactly on the **crossing of 4 base tiles** below:

```
half-cover at (z, x, y) requires support tiles at
    (z-1, x-1, y), (z-1, x+1, y), (z-1, x-1, y+1), (z-1, x+1, y+1)
```

**Blocking**: a live half-cover tile at `(z, x, y)` blocks all four support tiles simultaneously. `isFree()` checks the four positions `(z+1, x±1, y)` and `(z+1, x±1, y+1)`; the solver mirrors this via `hasLiveHalf()`.

**Rendering centering**: in `layoutPos()`, half-cover tiles receive `shiftX = 0` (they are already horizontally centered by their odd grid x) and `shiftY = round(STEP_Y / 2)` (vertically centered between the two base rows). This gives pixel-perfect geometric centering in both axes — the tile appears exactly at the midpoint of its 4 support tiles.

## Layout Generator

Two-phase generation, parameterised by level.

### Phase 1 — Base Layer (z=0)

15 hand-authored layouts in `LAYOUT_BUILDERS`, each with small/medium/large/XL variants:

| Shape | Description | Difficulty |
|---|---|---|
| `dragon` | Tapered rows (head + tail) | Easy |
| `cross` | Orthogonal arms from center | Easy |
| `pyramid` | Concentric rectangles, every layer smaller | Easy/Medium |
| `turtle` | Rounded carapace with head/tail/legs | Medium |
| `halfcover` | Base grid + upper half-cover tiles | Medium |
| `fortress` | Hollow square with corner towers | Medium/Hard |
| `diamond` | Concentric diamond | Medium |
| `checker` | Checkerboard full + half-cover holes | Medium |
| `pyramid_half` | Pyramid with half-cover layers | Medium/Hard |
| `bridge` | Two towers connected by a half-cover bridge | Hard |
| `spiral` | Spiral wrapping inwards over layers | Hard |
| `helix` | Intertwined double helix | Hard |
| `labyrinth` | Serpentine path, few free tiles | Hard |
| `wall` | Dense wall with strategic gaps, 4 layers | Very hard |
| `cross XL / pyramid XL / fortress XL` | Grids up to 6×9 | Very hard |

Grid limits (mobile-first): **max 6 columns × 9 rows**. Each shape is a function:

```js
shape(area) → Array<[x, y]>   // list of base positions (isHalf flag for half-cover)
```

### Phase 2 — Upper Layers

```
fillUpperLayers(base, layers, targetTiles):
    for z in 1..layers-1:
        candidates = positions (x,y) inside the convex hull of layer z-1
                     that are empty at this z
                     and have support (≥1 tile at z-1 in 3×3 area)
        shuffle(candidates)
        budget = remaining_tiles / remaining_layers   // even number
        place tiles until budget reached or no candidates
```

**No overhangs** (the 25% overhang feature of ffalt/mah is deliberately dropped): every tile always has direct support below, which keeps layouts compact and readable on mobile.

### Target Tile Count per Level (v0.4.0)

25 steps × 4 levels (100 total). Tile count grows 12 → 130; face-down pairs 0 → 8; staging slots 4 → 2:

| Step | Levels | Shape | Variant | Tiles | Face-down | Staging |
|---|---|---|---|---|---|---|
| 1–5 | 1–20 | dragon, cross, pyramid, turtle, checker | small | 12–25 | 0–2 | 4 |
| 6–10 | 21–40 | halfcover, diamond, cross, pyramid_half, dragon | small/medium | 10–32 | 2–3 | 3–4 |
| 11–15 | 41–60 | labyrinth, bridge, pyramid, spiral, turtle | small/medium | 22–50 | 4–5 | 3 |
| 16–20 | 61–80 | diamond, wall, helix, fortress, pyramid | medium/large | 38–62 | 5–7 | 3 |
| 21–25 | 81–100 | cross, labyrinth, pyramid, wall | XL/large/XL | 48–130 | 7–8 | 2–3 |

The generator accepts a target tile count and adjusts the base density accordingly. Tile count is always even (complete pairs).

## Tile Assignment

After a solvable mapping is generated:

```
groupIds = distinct group IDs needed   // count = tileCount / 2  normally, 4 per group
tiles    = build deck: for each groupId, push 2 copies (or 4 for variety later)
shuffle(deck, rng(seed))
assign: for each placed tile position, pop from deck
```

Invariant: **every group has an even number of tiles on the board**, so the game can always be cleared in theory.

## Solver (Solvability Check)

A **DFS with pruning**, deliberately simpler than ffalt/mah's `sureSolve`:

```
solve(board):
    if board empty: return true
    freeTiles = board.free()                    // tiles where isFree() === true
    if freeTiles.length === 0: return false     // dead end
    // group free tiles by groupId; try the groups with the FEWEST free tiles first
    for each groupId in sortedGroups(freeTiles):
        for each pair (a, b) in pairsOf(groupId, freeTiles):
            remove(a, b)
            if solve(board): return true
            restore(a, b)
    return false
```

**Why this is fast enough for us**: we control the generator. We don't need a sophisticated solver to find the *best* pairing — we only need a yes/no answer. If the DFS says "not solvable", we re-roll the seed and generate a new board. On the small boards (36–72 tiles) the DFS completes in < 5ms; even at 144 tiles it's typically under 50ms.

**Loop**:

```
generateLevel(level):
    for attempt in 1..100:
        mapping  = generateLayout(levelParameters)
        board    = assignTiles(mapping, seed)
        if solver(board) === true:
            return { board, seed }
    // emergency fallback: simple 36-tile cross board (always solvable)
    return fallbackBoard()
```

## Hint & Undo

### Hint

```
hint():
    freeTiles = board.free()
    groups = groupBy(freeTiles, groupId)
    pick the group with most free tiles
    highlight the two tiles of that group that are free
```

Same concept as ffalt/mah but simplified: single group selection (no "next hint" cycling through groups).

### Undo

```
history: Array<[tileA, tileB]>     // each element is a removed pair

undo():
    if history empty: return
    [a, b] = history.pop()
    restore(a); restore(b)
```

Limits per level: `level < 10 → 5 undos`, decreasing to `0` at high levels (Phase 3).

## Scoring (Phase 3)

```
levelScore =
    (boardSize / 2) × 100                    // base: pairs × 100
    + max(0, levelTimeLimit - elapsed) × 10  // time bonus
    - hintsUsed × 200
    - undosUsed × 100
```

Multiplied by a level factor growing with `levelIndex`.

### Duration of a level

- Early levels (36–48 tiles): **time limit ~120s** — a beginner must finish
- Higher levels: no hard limit, but the score bonus decreases with time
- Timer starts on first tile tap (like minesweeper)

## Persistence & Progression (Phase 4)

```
State saved:
{ levelIndex, highScore, lastScore, seed, history, elapsed }

Guest / Local  → localStorage key: `wp_mahjong_arcade_level`, `wp_mahjong_arcade_scores`
Registered WP  → save/load via pointnetGamesAPI (server-side persistence + leaderboard)
```

On load:
- Guest users: resume from localStorage with prompt to log in for leaderboard
- Logged-in users: resume from plugin user meta (`_pointnet_games_progress`) and submit cumulative records to the leaderboard

## RNG (Seeded)

Simple LCG (Linear Congruential Generator):

```js
function createRng(seed) {
    let s = seed >>> 0;
    return {
        next() {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;   // [0, 1)
        },
        reset() { s = seed >>> 0; }
    };
}
```

Used for: shape generation, candidate shuffling, deck shuffling. The seed is stored in the save so a level can be exactly reproduced.

## Rendering

- **SVG tiles**, drawn as inner `<div>`s inside a `position: absolute` container sized to the level extents
- Tile pixel size computed responsively:
  ```
  tileSize = min(44px, (viewportWidth - padding) / maxTilesPerRow)
  ```
- Board container scales via CSS `transform: scale()` to fit the viewport height, never scrolls, never pans
- Layers rendered back-to-front: z=0 first, z=highest last (SVG naturally handles this)
- Free tiles get slight lift (translateY(-2px)) + glow; blocked tiles are dimmed

## Level Parameters (Phase 3)

```js
const LEVELS = [
    { layers: 3, shape: 'cross', tiles: 36,  timeLimit: 120, hints: 5, undos: 5 },
    { layers: 3, shape: 'lines', tiles: 40,  timeLimit: 120, hints: 5, undos: 5 },
    ...
    { layers: 5, shape: 'shapes', tiles: 144, timeLimit: 300, hints: 0, undos: 0 },
];
```

The parameters table is data — the engine is level-agnostic.

## Comparison Table: ffalt/mah vs Ours

| Aspect | ffalt/mah | Mahjong Arcade |
|---|---|---|
| Build | Angular 22 + TS | Vanilla JS, 5 static files |
| Runtime deps | rxjs, ngx-translate, confetti, zzfx | None |
| Solver | Backtracking + randomSolve + sureSolve + pairing classes | DFS + pruning; re-roll on failure |
| Generator | 8 shapes + mirror + overhangs + optimize | 15 layouts + XL variants, no mirror, no overhangs, parameterised |
| Tile count | Fixed 144 | 12 → 130 (per level) |
| Pan/zoom | Required (36×16 grid) | None (board fits viewport) |
| Difficulty | Not applicable (free game) | Progressive via level params (25 steps) |
| Persistence | localStorage | localStorage + plugin API |
| Licensing | MIT | GPL-2.0+ (our implementation) |

---

*Documented after studying ffalt/mah `src/app/model/` (board, solver/*, random-layout/*, builder/*). No code was copied — the design decisions above are derived but simplified for the arcade use case.*