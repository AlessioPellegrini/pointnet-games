# Mahjong Arcade — Changelog & Note di Sviluppo

> **Versione corrente: 0.9.1** — vedi `manifest.json`, `index.html` e `README.md`.
> File per lo **storico essenziale**, i vincoli di design e le istruzioni di estensione.
> Gli script di verifica sono permanenti in `games/mahjong/tests/` (non in /tmp).

---

## Test (script permanenti)

```bash
# Verifica layout builder: 0 tile flottanti, coordinate valide
node games/mahjong/tests/test-layouts.js

# Verifica progressione: drop <= 8, tutte le figure usate, finale boss 124
node games/mahjong/tests/test-progression.js

# Verifica blackout: zona 225+, alternanza, obscured solo su z=0, auto-reveal
node games/mahjong/tests/test-blackout.js

# Regressione off-by-one HALF: (0,0) libera, (0,4) bloccata
node games/mahjong/tests/test-free.js
```

Gli script caricano `layouts.js` + `data.js` + `engine.js` in Node `vm` e chiamano
le funzioni REALI del gioco (`validateSupport`, `buildProgression`).

---

## Changelog

### v0.9.1 — Fix off-by-one HALF + playability guard + temple_steps (HEAD)
- **Fix critico `hasHalfCoverAbove`/`isFreeForSolver`/`hasFullCoverAbove`**: l'off-by-one ricercava la HALF coprente a `y+1` invece di `y-1` → la prima riga del piano base risultava iper-bloccata ("tile libere ma non risultano tali") e l'ultima ipo-bloccata ("tile bloccate ma cliccabili"). Colpiva i layout con HALF (halfcover, checker, temple_steps).
- **`generateLevel` playability guard (nuovo)**: dopo l'applicazione di `covered`, se tra le tile libere e scoperte non esiste almeno UNA COPPIA lo shuffle viene rigirato. Senza questo check, il `covered` casuale poteva coprire tutte le potenziali coppie libere → livelli bloccati all'avvio (es. livello 175).
- **`temple_steps` ridisegnato**: geometria ziggurat con HALF che partono dalla fila 0 della base (tagliano a metà la prima fila, niente "fluttuazione"), piani centrati, conteggi multipli di 4: small 24 / medium 40 / large 56.
- Rimosso `hasHalfSupports` (funzione inutilizzata).
- Nuovo test permanente `tests/test-free.js`: verifica `halfcover/small` (0,0) libera e (0,4) bloccata — con la vecchia logica erano INVERTITE.

### v0.9.0 — Blackout + stacking classico a offset
- **BLACKOUT**: piano base `z=0` tutto OSCURATO nei livelli 225–299 (alternati); le tile si auto-rivelano quando diventano libere (auto-reveal in `ui.js`), convivono con `covered`.
- **Stacking classico a offset**: in `engine.js` una FULL può poggiare sull'incrocio di 4 HALF (validateSupport + isFree + solver) → "half su half" multi-livello.
- Nuovo layout **`temple_steps`** (38 totali): FULL→HALF→FULL→HALF, 20/40/68 tile.
- Fix commento `applyFaceDown`: selezione covered CASUALE (non "una per coppia").
- Nuovo test permanente `tests/test-blackout.js` (zona, alternanza, z=0, %4, auto-reveal).

### v0.8.2 — Progressione monotona + 9 nuove figure
- Tile-count MAI in calo > 8 tra livelli adiacenti (era `124 → 56`).
- Floor globale = quantile dei tile-count reali del pool (`tileLevels`), curva `progress^2.2`.
- Banda `[minTiles, minTiles+16]`, cap 108: `spiral/medium` (124 tile) come FINALE BOSS (ultimi 3 livelli).
- 9 nuove figure: `chalice, mushroom, ship, anchor, windmill, harp, lyre, skyscraper, crane`.
- Test eseguiti: 37 figure, 0 floaters, tutte usate, worst drop 8.
- Creati script di test permanenti in `games/mahjong/tests/`.

### v0.8.1 — Fix half-tile offset
- Half-tile centrata tra due righe di supporto (spostata mezza riga in basso), `engine.js` fix di `shiftY` + `boardSize`.

### v0.8.0 — Audio, punteggio cumulativo, split moduli
- `audio.js` musica (playlist loop, toggle in localStorage).
- Punteggio cumulativo per livello (`bestScores`).
- Split `game.js` in `app/ui/input/progress.js`; builder estratti da `data.js` in `layouts.js`.

### v0.7.x — Deck classico, combo, shuffle, stelle
- v0.7.1: 4 copie per simbolo (2 coppie matchable), layout multipli di 4.
- v0.7.0: combo chain (entro 3s → x1..x5), shuffle power-up (3 usi/livello), stelle 1-3.

### v0.6.x — Progressione automatica 300 livelli
- `buildProgression(300)`: pool layout×variante, quartili, half ogni 7 livelli, maxStaging 4→3→2, quads da 200+.
- Nuove figure: `lotus, sphinx, crown, galaxy, totem`.

### v0.5.x — 50 step × 4 livelli
- Nuove figure: `pagoda, butterfly, arrow, star, hourglass, castle, zigzag, rings, temple`.

### v0.4.x — 15 layout, rebalance
- Split in 5 file; figure `diamond, wall, labyrinth, pyramid_half, checker, bridge, spiral, helix`; XL; 25-step/100 livelli.

### v0.3.x — Half-cover & polish
- Half-cover centrata nell'incrocio di 4 tile, auto-match faccia-giù 250ms, drag-to-peek, 3D tile.

### v0.2.x — Prototipo giocabile
- Staging 4 slot, face-down, drag-to-peek, flight, solver DFS, hint/undo.

### v0.1.x — Scaffolding
- Nome progetto, vanilla JS da zero.

---

## Convenzioni coordinate (obbligatorie per nuove figure)
- FULL: x **pari** (0,2,4,6,8,10), y >= 0, strato z.
- HALF (`isHalf:true`): incrocio di 4 FULL (x±1,y e x±1,y+1).
- FULL a z>0 richiede FULL identica a (z-1,x,y).
- Griglia: max 6 colonne × 9 righe. `evenTrim` toglie 1 tile se dispari; la progressione arrotonda a multipli di 4.

## Come aggiungere una figura
1. Aggiungi builder in `layouts.js`:
   ```js
   'nome': { 'small': function () { ... return pts; }, 'medium': ... }
   ```
   (FULL sopra FULL, nessuna tile sospesa).
2. Entra automaticamente nel pool della progressione.
3. Verifica:
   ```bash
   node games/mahjong/tests/test-layouts.js
   node games/mahjong/tests/test-progression.js
   node --check games/mahjong/layouts.js
   ```

## Version bump checklist
1. `manifest.json` → `version`
2. `index.html` → `style.css?v=`, badge splash `<sup class="splash-version">v…</sup>`, 7 `<script>`: layouts, data, engine, app, ui, input, progress (audio.js senza `?v=`)
3. `README.md` → riga `> **Version: …**`
4. `CHANGELOG.md` → nuova voce in cima