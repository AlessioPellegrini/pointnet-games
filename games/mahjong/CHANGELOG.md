# Mahjong Arcade — Changelog & Note di Sviluppo

> **Versione corrente: 0.9.4** — vedi `manifest.json`, `index.html` e `README.md`.
> File per lo **storico essenziale**, i vincoli di design e le istruzioni di estensione.
> Gli script di verifica sono permanenti in `games/mahjong/tests/` (non in /tmp).

---

## Test (script permanenti)

```bash
# Verifica layout builder: 0 tile flottanti, coordinate valide
node games/mahjong/tests/test-layouts.js

# Verifica progressione: drop <= 8, tutte le figure usate, finale boss 124
node games/mahjong/tests/test-progression.js

# Verifica blackout: zona 101+, alternanza, obscured solo su z=0, auto-reveal
node games/mahjong/tests/test-blackout.js

# Regressione off-by-one HALF: (0,0) libera, (0,4) bloccata
node games/mahjong/tests/test-free.js

# Rendering FULL-su-HALF: onHalf, centratura sull'incrocio, apice dritto
node games/mahjong/tests/test-temple-steps.js
```

Gli script caricano `layouts.js` + `data.js` + `engine.js` in Node `vm` e chiamano
le funzioni REALI del gioco (`validateSupport`, `buildProgression`).

---

## Changelog

### v0.9.4 — UI mobile compatta + action drawer (HEAD)
- **Header rimosso** (titolo già nella splash): più spazio verticale al board.
- **Action drawer**: Hint/Undo/Shuffle/New/Level spostati in un pannello apribile con ⚙️ (fixed bottom, slide-up) — il board occupa tutto lo spazio che prima era dell'action bar.
- **Staging box più leggibile**: slot ingranditi (44×52 desktop, 38×46 mobile) e `min-height` ridotto → più spazio senza rimpicciolire le tile in staging.
- **Status bar compatta**: gap e padding ridotti.
- `index.html`/`style.css`/`input.js` modificati; gli ID dei bottoni sono invariati (i listener esistenti restano validi). Bump **0.9.4** su `manifest.json`/`index.html`/`README.md`/`CHANGELOG.md`.

### v0.9.3 — Blackout HALF esteso + copertura layout
- **Blackout anticipato da ~101 in poi** (`buildProgression`: `n >= 100`, alternato — prima era solo 225+): i livelli oscurati passano da 38 a **100** e ora compaiono in tutta la seconda metà del gioco, non solo nel finale.
- **Preferenza HALF nei blackout** (effetto "half sopra base oscurata", richiesto): metà dei blackout sceglie un layout HALF con base libera (alternanza `blackCount % 2`), l'altra metà un qualsiasi layout `freeBase`. Ora **~50 dei 100 blackout usano HALF** (prima 3 su 38) e ~82 livelli totali hanno HALF. `halfcover` (28→~42 occorrenze), `checker` e `temple_steps` diventano molto più frequenti.
- **Garanzia di copertura dei 38 layout**: la preferenza HALF/rotazione blackout poteva escludere per sempre layout piccoli (es. `crown`, `star`, `harp`). Prima della scelta, se esiste un layout mai usato nella banda corrente (rispettando `freeBase` nei blackout) viene selezionato → **38/38 layout usati** (verificato da `test-progression`).
- **`test-blackout.js` aggiornato**: soglia 100 (da 224), campioni ampliati (100, 99, 120, 224, 249, 274, 298).
- **Playlist musica**: aggiunta traccia "Zen Arcade" in `audio.js` (il file mp3 resta locale, non versionato).
- `README.md`/`CHANGELOG.md`/`manifest.json`/`index.html`: bump **0.9.3**, zona blackout aggiornata a 101–299.

### v0.9.2 — Rendering FULL-su-HALF + zero duplicati
- **Fix critico rendering stacking a offset** (`layoutPos` + geografia `rowOff`/`stackDepth`/`onHalf` in `buildBoard`, `engine.js`): le FULL che poggiano sull'incrocio di 4 HALF (temple_steps z2) venivano disegnate con l'offset 3D delle FULL dritte → in alto a destra, lontano dai supporti. Le HALF sotto *sembravano* libere ma erano correttamente bloccate ("libere ma non cliccabili", es. livello 175). Ora ogni tile della **scala a offset** è centrata sul proprio incrocio (z1 HALF → ½ riga, z2 FULL-su-HALF → 1 riga) e le FULL dritte **ereditano il rowOff del supporto** (stackDepth per l'effetto 3D): così anche l'apice z3 di `temple_steps/large` resta appena SOPRA la FULL che lo sostiene (8px) invece di "volare" in alto lasciandola apparentemente libera (es. livello 210).
- **Fix layout `lyre`** (layouts.js): i bracci partivano da y=0 e la traversa ripushava `(0,0)` e `(8,0)` → 2 tile nella stessa cella (parità rotta). Ora bracci da y=1: small 16 e medium 20 tile **uniche**.
- **Zero duplicati su tutti i builder**: audit `test-layouts.js` esteso con controllo coordinate ripetute → corretti con `dedupePts` anche `helix` (small/medium), `bridge/medium`, `spiral/medium`, `labyrinth/medium`, `mushroom/medium`, `windmill/medium`, `harp` (small/medium), `crane/medium`. Prima ogni duplicato creava 2 tile nella stessa cella (tile fantasma nel deck).
- **Progressione blackout sicura** (`buildProgression` + helper `hasFreeBase`): i livelli blackout (225+) scelgono solo layout con **almeno una tile z0 libera** all'avvio, altrimenti nessuna tile oscurata si auto-rivela e il livello parte bloccato (es. labyrinth/medium su L275).
- Nuovo test permanente `tests/test-temple-steps.js`: onHalf su FULL z2, centratura sull'incrocio in `layoutPos`, apice z3 come stacking dritto, conteggi %4.

### v0.9.1 — Fix off-by-one HALF + playability guard + temple_steps
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