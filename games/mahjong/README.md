# Mahjong Arcade

Classic Mahjong Solitaire tile-matching with a modern twist: a 4-slot staging box, face-down memory tiles, drag-to-peek and guaranteed solvable boards. Mobile-first, no pan/zoom.

> **Version: 0.8.0** — 28 layout figure (lotus, sphinx, crown, galaxy, totem, pagoda, butterfly, arrow, star, hourglass, castle, zigzag, rings, temple + 14 classici) con **300 livelli progressivi a difficoltà automatica**, combo chain, shuffle power-up, valutazione a stelle, **punteggio cumulativo per livello**, **deck classico 4 copie per simbolo** e fino a 130 tile. Original implementation written from scratch in vanilla JS, inspired by the algorithms of [ffalt/mah](https://github.com/ffalt/mah) (MIT). The arcade engine, UI, progression, memory/staging mechanics, half-cover tiles and scoring are entirely PointNet's own work (GPL-2.0+).

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
- Tiles in the staging box are removed from the board and **unblock** the tiles underneath

### Half-Cover Tiles
- An upper-layer tile sits exactly on the **crossing of 4 base tiles** below (x±1, y±1)
- It blocks all four tiles at the same time — geometrically centered in BOTH axes
- Removing a half-cover tile unlocks 4 tiles at once — powerful and tactical

### Face-Down Memory Tiles
- Some pairs start **covered** (dark blue back with "?" pattern)
- **1st click** on a covered tile → reveals the symbol, stays on the board
- Click on another covered tile → the previous one re-covers, the new one reveals
- **If the two revealed tiles match** → both auto-match to staging after a brief 250ms pause (no extra click needed)
- **2nd click** on the revealed tile → sends it to the staging box
- If a revealed tile's match is already in the staging box → **auto-match** instantly

### Combo Chain (v0.7.0)
- Match entro **3 secondi** dal precedente → la combo aumenta: ×1 → ×2 → ×3 → ×4 → ×5
- Ogni match durante una combo vale `100 × combo` punti (combo ×5 = 500 punti)
- Indicatore 🔥 con conteggio combo nella barra di stato; la combo **si resetta** se passano più di 3s

### Shuffle Power-Up (v0.7.0)
- **3 usi per livello** (pulsante 🔀 in alto a destra, contatore ×3)
- Rimescola i simboli delle tile rimanenti (non in staging, non rimosse) mantenendo il **multiset** — le coppie restano sempre complete e risolvibili
- Resetta la combo e ricopre temporaneamente i tile rivelati (peek)
- Usalo quando il tabellone sembra bloccato o per sbloccare situazioni difficili

### Star Rating (v0.7.0)
- **1★** — completare il livello
- **2★** — completare sotto il par tempo (2s per coppia rimasta, minimo 10s)
- **3★** — completare senza usare **undo**
- Il miglior punteggio a stelle per livello è salvato in `localStorage` e mostrato nel modal di completamento

### Cumulative Score (v0.8.0)
- **Best score per livello**: salva il miglior punteggio di ogni livello completato in `localStorage` (`wp_mahjong_arcade_scores`) e, per gli utenti loggati, sul server (via `wp_user_meta` `_pointnet_games_progress`)
- **Totale cumulativo**: il punteggio inviato alla leaderboard è la **somma dei migliori punteggi di tutti i livelli** (`computeCumulative()`), coerente tra i dispositivi grazie al merge server-side
- Il popup di completamento mostra "Next: Level Y" — il bottone "▶ Next level" avanza al livello successivo

### Drag-to-Peek
- Grab any free tile with mouse or finger → lift it above the stack
- See what's underneath, release → it snaps back with a soft animation
- Movement < 4px is treated as a normal click
- Drag movement is **1:1** with the pointer, regardless of board scaling

### Rendering
- Pure DOM tiles (no canvas, no SVG) with identical pixel geometry
- 3D effect via layered box-shadows: right/bottom side faces, deep ambient shadow, top inner edge
- Face gradients + rounded corners for a realistic "tile" look
- Blocked tiles are dimmed via a **darker face color** (fully opaque — never see through)
- Whole board scales (up and down) to fill the viewport on both desktop and mobile

## Roadmap

### Phase 1 — Core engine ✅
- [x] Study `ffalt/mah` algorithms (board, solver, random-layout)
- [x] Design vanilla JS engine: tile model, board layers, matching rules
- [x] Implement solver (DFS + pruning, solvability check)
- [x] Playable UI: DOM tiles with 3D styling
- [x] `manifest.json` + `index.html` registering the game in the plugin
- [x] Half-cover tiles: geometric centering + blocking of 4 tiles below
- [x] Procedural layout generator: 28 builders (shapes, layers, difficulty curve)

### Phase 2 — Tiles & Hints ✅
- [x] Hint feature: highlight two matching tiles
- [x] Top bar: timer ⏱️, pairs left, score
- [x] Staging box with auto-match and game-over
- [x] Face-down memory tiles with auto-match pause
- [x] Drag-to-peek
- [x] Flight animation to staging box
- [x] Vanilla CSS, no dependencies
- [x] Tile theme sets chosen automatically by the game (emoji themes + SVG classic/black)

### Phase 3 — Arcade Levels & Scoring ✅
- [x] 300 levels with automatic difficulty curve (`buildProgression`)
- [x] Progressive parameters: covered pairs (0→8), deck classico 4 copie per simbolo (2 coppie), staging per-livello
- [x] Undo/hint limits: hint attivo, undo limitato, 3★ richiede zero undo
- [x] Staging box: massimo 4 slot, ridotti a 3 e 2 nei livelli alti (4→3→2)
- [x] Score system: combo chain (×1..×5) + star rating (par time, no undo)
- [x] Splash + level bar UI (same style as minesweeper-arcade)
- [x] **No pan/zoom**: board resizes to fit the viewport ✅

### Phase 4 — Registered User Persistence ✅
- [x] Save progress via `submitScore()` for leaderboard
- [x] Logged-in users resume from their saved level (`wp_user_meta` `_pointnet_games_progress`)
- [x] Anonymous users always start from Level 1 (pure arcade, localStorage)

### Phase 5 — Polish & Extra Mechanics
- [ ] Pyramid/brick-wall layouts with full staggered upper layers
- [ ] 3 lives / game over flow
- [ ] Confetti + tile remove animations
- [ ] Sound effects (match, flip, game over)
- [ ] Dark theme consistent with the plugin

## Level Design

**v0.6.0+**: `buildProgression(300)` genera 300 livelli dal pool di **~67 combinazioni layout×variante**, ordinate per `computeDifficulty()` (0..100) e divise in **4 zone** di difficoltà:

| Zone | Levels | Difficulty |
|---|---|---|
| 1 | 1–75 | facile |
| 2 | 76–150 | media |
| 3 | 151–225 | grande |
| 4 | 226–300 | molto grande |

- **Round-robin** dentro ogni zona: mai due livelli consecutivi con lo stesso layout
- `covered` (coppie coperte) cresce in modo proporzionale alla zona; `maxStaging` scende **4 → 3 → 2** con soglie 1–150 / 151–225 / 226–300
- **Deck classico (v0.7.1)**: ogni simbolo appare **sempre 4 volte** (2 coppie matchabili), come nel Mahjong Solitaire tradizionale — niente più quad-mode selettivo
- La tabella storica qui sotto documenta l'ordine "soft difficulty" degli step originali v0.4.0 (1..100)

| Step | Levels | Layout | Variant | Tiles | Face-down pairs | Staging slots |
|---|---|---|---|---|---|---|
| 1 | 1–4 | dragon | small | 12–16 | 0 | 4 |
| 2 | 5–8 | cross | small | 12–14 | 0 | 4 |
| 3 | 9–12 | pyramid | small | 12–14 | 1 | 4 |
| 4 | 13–16 | turtle | small | 16–20 | 1 | 4 |
| 5 | 17–20 | checker | small | 20–25 | 2 | 4 |
| 6 | 21–24 | halfcover | small | 10–12 | 2 | 3 |
| 7 | 25–28 | diamond | small | 18–22 | 2 | 3 |
| 8 | 29–32 | cross | medium | 26–32 | 3 | 3 |
| 9 | 33–36 | pyramid_half | small | 24–29 | 3 | 3 |
| 10 | 37–40 | dragon | medium | 22–28 | 3 | 3 |
| 11 | 41–44 | labyrinth | small | 24–30 | 4 | 3 |
| 12 | 45–48 | bridge | small | 24–30 | 4 | 3 |
| 13 | 49–52 | pyramid | medium | 24–30 | 4 | 3 |
| 14 | 53–56 | spiral | small | 22–28 | 5 | 3 |
| 15 | 57–60 | turtle | medium | 40–50 | 5 | 3 |
| 16 | 61–64 | diamond | medium | 38–48 | 5 | 3 |
| 17 | 65–68 | wall | medium | 46–58 | 6 | 3 |
| 18 | 69–72 | helix | small | 26–32 | 6 | 3 |
| 19 | 73–76 | fortress | large | 50–62 | 6 | 3 |
| 20 | 77–80 | pyramid | large | 44–56 | 7 | 3 |
| 21 | 81–84 | cross | xl | 48–60 | 7 | 3 |
| 22 | 85–88 | labyrinth | medium | 50–62 | 7 | 2 |
| 23 | 89–92 | pyramid | xl | 72–90 | 8 | 2 |
| 24 | 93–96 | wall | large | 78–98 | 8 | 2 |
| 25 | 97–100 | wall | xl | 104–130 | 8 | 2 |

All boards are generated with the solver to guarantee solvability.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full engine design document: data model, generator, solver, scoring, rendering and level parameters.

## Technical Notes

- **Engine**: vanilla JavaScript, 8 static files (index.html + style.css + data.js + engine.js + **app.js + ui.js + input.js + progress.js**), no build step, no modules/IIFE — shared global scope loaded as sequential `<script>` tags
- **No runtime dependencies**: static HTML + JS + CSS served via iframe
- **No pan/zoom**: the board always fits the viewport, tiles scale responsively
- **API integration**: `window.pointnetGamesAPI.submitScore()` for leaderboard (Phase 4)
- **License**: GPL-2.0+ — original implementation inspired by ffalt/mah (MIT)

## Changelog

### v0.8.0 — Modular split + cumulative score (current)
- **Refactor**: `game.js` (ex monolith, ~1029 righe) diviso in 4 moduli a focus singolo — `app.js` (stato/flusso/fullscreen), `ui.js` (tile DOM/fitting), `input.js` (staging/click/undo/hint/shuffle/drag), `progress.js` (stelline/persistenza/bridge WP/boot). `index.html` aggiornato: `data.js → engine.js → app.js → ui.js → input.js → progress.js` (cache-bust `?v=0.8.0`)
- **Cumulative score**: best score per livello + totale cumulativo inviato alla leaderboard; merge server-side dei `scores` per utenti loggati (`_pointnet_games_progress`)
- **UX**: popup di completamento con "Next: Level Y"; bottone rinominato "▶ Next level" (prima "Play again" — ambiguo)
- `game.js` rimosso dal repo (sostituito dai 4 moduli); `ARCHITECTURE.md`/`README.md` aggiornati alla struttura v0.8.0

### v0.7.1 — Deck classico 4 copie per simbolo
- **Deck classico**: ogni simbolo appare **sempre 4 volte** (2 coppie matchabili) su tutti i 300 livelli, come nel Mahjong Solitaire tradizionale; rimosso il quad-mode selettivo dei livelli ≥200
- `maxStaging` ridefinito: **4** (livelli 1–150), **3** (151–225), **2** (226–300)
- Rimossi dalla roadmap: varianti dorso selezionabili (il gioco propone i set) e staging box 5–6 slot (si resta a max 4, a scalare)
- Verifica automatizzata: 10 livelli campione su tutte le zone con esattamente 4 copie per simbolo e conteggi pari

### v0.7.0 — Combo chain, shuffle power-up & star ratings
- **Combo Chain**: match entro 3s dal precedente → moltiplicatore ×1..×5, ogni match vale `100 × combo` punti, badge 🔥 animato nella barra di stato, reset oltre 3s
- **Shuffle Power-Up**: pulsante 🔀 con 3 usi per livello; rimescola i simboli delle tile rimanenti mantenendo il multiset (coppie sempre complete e risolvibili), resetta la combo e ricopre i tile rivelati
- **Star Rating**: 1★ clear, 2★ sotto il par tempo (2s/coppia, minimo 10s), 3★ senza undo; miglior risultato salvato in `localStorage` e mostrato nel modal di completamento
- `undo()` ora incrementa `undoUsed` e può negare la 3★; `computeStars()` calcola le stelle al completamento
- 5 nuovi layout figura: **lotus, sphinx, crown, galaxy, totem** (totale 28)

### v0.6.1 — 5 nuovi layout figura
- Nuovi layout: **lotus** (44/56), **sphinx** (48), **crown** (54), **galaxy** (60/78), **totem** (40/50)
- Tutti verificati con script: zero tile sospese, parità pari, zero duplicati

### v0.6.0 — Round-robin progression, quads fix & physics fixes
- Progressione **round-robin**: ~67 combinazioni layout×variante ordinate per difficoltà, divise in 4 zone (1–75, 76–150, 151–225, 226–300); mai due layout uguali di fila
- Fix **quads mode**: simboli duplicati nei set tematici (es. 🦁×3 in "gold") ora vengono deduplicati → 4 copie esatte per simbolo (40/40)
- Fix fisica: `checker/medium` 15 mezzetile sospese → base piena; `bridge/medium` 2 tile ponte senza piloni → supporti Z1

### v0.5.0 — 300 livelli automatici, nuovi layout figura
- Progressione riscritta: `buildProgression(300)` con difficoltà automatica (covered 0→8, quads nei livelli alti) al posto della lista manuale di 100
- Cap livelli alzato a 300 in `game.js` (4 punti) + selettore livello max 300 in `index.html`
- `computeDifficulty()`: punteggio 0..100 per ogni combinazione layout×variante (tile, layer, covered, densità)
- 9 nuovi layout figura: pagoda, butterfly, arrow, star, hourglass, castle, zigzag, rings, temple
- Fix fisica spirali: `spiral/medium` ora ha il supporto Z2 sotto il centro rialzato (0 sospese); `spiral/small` anello aperto (corridoio a S)
- Verifica solvability con criterio reale del gioco (risolvibile OR ≥4 tile libere) su tutti gli step

### v0.4.1 — Splash screen & crisp rendering
- Splash screen with title, description, PLAY button and version badge (`v0.4.1` in superscript after the title), matching the minesweeper-arcade pattern
- Fullscreen request on PLAY (postMessage bridge / inline class) + `pointnet-games:start` support for the plugin's mobile "GIOCA" button
- WordPress `pointnetGamesAPI` shim (postMessage) with `getNickname()` / `isUserLoggedIn()` / `_setGameId()`
- Board rendered only after PLAY (not at init) so `fitBoard()` reads the final viewport size
- Board scale applied in **two phases** (remove transform → next paint → re-apply) so the browser re-rasterizes tiles at the current viewport resolution — fixes low-res tiles when the iframe grows to fullscreen on WordPress
- Tiles use **2D transforms only** (`translate()` instead of `translate3d()`): the whole board stays one composited layer, no per-tile GPU layer upscaling
- `transform-origin: top left` on `#board` keeps the scaled board perfectly centred
- `refitUntilStable()` re-fits after the async iframe fullscreen resize

### v0.4.0 — 15 layouts, difficulty rebalance & 5-file split
- Code split into 5 files: `index.html` (shell) + `style.css` + `data.js` + `engine.js` + `game.js` (was a single self-contained HTML)
- New layouts: diamond, wall, labyrinth, pyramid_half, checker, bridge, spiral, helix (15 total)
- XL variants for cross, pyramid and fortress — grids up to 6×9 (max 6 columns, 9 rows on mobile)
- Symbol sets expanded to 70 emoji per theme (up to 65 pairs without recycling)
- 25-step progression: 100 levels with progressive tile counts (12 → 130), face-down pairs (0 → 8) and reduced staging slots on high levels (4 → 2)
- Level 100 is now a wall XL board with 130 tiles, 8 covered pairs and 2 staging slots — substantially harder
- Board vertical centering fix (TOP_PAD_EXTRA = 2, board sits higher)
- Staging box size is now per-level (4 slots early → 3 → 2 on high levels)

### v0.3.0 — Half-cover & polish
- Half-cover tiles: geometrically centered on the crossing of 4 base tiles (both axes)
- Half-cover tiles block all 4 tiles below (x±1, y±1)
- Face-down auto-match: two matching covered tiles match directly with a 250ms visual pause
- Blocked tiles: opaque darker face color instead of opacity 0.5 (no see-through)
- Drag-to-peek: scale-aware 1:1 pointer tracking (board scaling compensation)
- Layout expanded: 4×4 base + 3×3 half-cover upper + 1 detached tile (26 tiles = 13 pairs)
- Symbols expanded to 18 unique emoji

### v0.2.0 — Playable prototype
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