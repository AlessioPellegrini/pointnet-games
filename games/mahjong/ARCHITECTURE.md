# Mahjong Arcade — Engine Architecture

Design document for the vanilla JavaScript engine. Written from scratch, inspired by the algorithms of [ffalt/mah](https://github.com/ffalt/mah) (MIT) but simplified for an arcade-level progression game.

## Design Principles

1. **Zero dependencies** — single self-contained `index.html` file
2. **Mobile-first, no pan/zoom** — the board always fits the viewport; tiles scale
3. **Progression by parameters** — difficulty comes from generator parameters, not artistic complexity
4. **Solvability guaranteed by regeneration** — we control the generator, so we can afford to re-roll
5. **Deterministic seeds** — every level can be reproduced from a seed (share, verify, debug)

## File Structure

```
games/mahjong/
├── index.html          ← single self-contained entry (engine + UI + styles)
├── manifest.json       ← plugin registration
├── ARCHITECTURE.md     ← this document
├── README.md           ← roadmap + changelog
└── [tests/]            ← optional dev-only unit tests (not shipped)
```

All code lives in `index.html` as `<script>` blocks (no build step). For maintainability the script uses a single `Mahjong` namespace with `'use strict'`.

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
NOT ( ∃ tile at (z+1, x±1, y±1) )    // nothing above (3×3 area — classic rule)
AND NOT ( blocker on BOTH left AND right )
   where  blocker(left)  = ∃ tile at (z, x-2, y±1)
     and  blocker(right) = ∃ tile at (z, x+2, y±1)
```

**Rendering aligns with the logic**: layers stack almost vertically (no horizontal offset, small RISE), so a tile visually covered by a tile above is always logically blocked. Blocked tiles are dimmed (brightness 0.4, opacity 0.55, no shadow) — impossible to misread as playable.

## Layout Generator

Two-phase generation, parameterised by level.

### Phase 1 — Base Layer (z=0)

Shapes (our set, reduced from 8 to 4):

| Shape | Description | Difficulty |
|---|---|---|
| `cross` | Orthogonal arms from center | Easy |
| `lines` | Parallel rows with spacings | Easy |
| `rings` | Concentric rectangles | Medium |
| `shapes` | Clusters of small blocks scattered | Medium/Hard |

Each shape is a function:

```js
shape(area) → Array<[x, y]>   // list of base positions
```

Only `cross` and `lines` are used in early levels; `rings` and `shapes` unlock later.

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

### Target Tile Count per Level

Level scaling (mobile-friendly):

| Level range | Layers | Shape | Target tiles |
|---|---|---|---|
| 1–10 | 3 | cross / lines | 36–48 |
| 11–20 | 3 | cross / rings | 48–72 |
| 21–35 | 4 | rings / shapes | 72–96 |
| 36–50 | 4 | shapes | 96–120 |
| 51–75 | 5 | shapes | 120–144 |
| 76–100+ | 5 | shapes | 144 |

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

Anonymous users  → localStorage key: `wp_mahjong_arcade_save`
Logged-in users  → save/load via pointnetGamesAPI (submitted with score)
```

On load:
- Anonymous: resume from localStorage
- Logged-in: resume from plugin user meta (`_pointnet_games_mahjong_level`)

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
| Build | Angular 22 + TS | Vanilla JS, single HTML |
| Runtime deps | rxjs, ngx-translate, confetti, zzfx | None |
| Solver | Backtracking + randomSolve + sureSolve + pairing classes | DFS + pruning; re-roll on failure |
| Generator | 8 shapes + mirror + overhangs + optimize | 4 shapes, no mirror, no overhangs, parameterised |
| Tile count | Fixed 144 | 36 → 144 (per level) |
| Pan/zoom | Required (36×16 grid) | None (board fits viewport) |
| Difficulty | Not applicable (free game) | Progressive via level params |
| Persistence | localStorage | localStorage + plugin API |
| Licensing | MIT | GPL-2.0+ (our implementation) |

---

*Documented after studying ffalt/mah `src/app/model/` (board, solver/*, random-layout/*, builder/*). No code was copied — the design decisions above are derived but simplified for the arcade use case.*