# Mahjong Arcade — Changelog & Note di Sviluppo

> **Versione corrente: 1.2.5** — vedi `manifest.json`, `index.html` e `README.md`.
> File per lo **storico essenziale**, i vincoli di design e le istruzioni di estensione.
> Gli script di verifica sono permanenti in `games/mahjong/tests/` (non in /tmp).

---

## Test (script permanenti)

```bash
# Verifica layout builder: 0 tile flottanti, coordinate valide (39 layout)
node games/mahjong/tests/test-layouts.js

# Verifica progressione: 330 livelli, 33 classic, drop <= 8, tutte le figure usate
node games/mahjong/tests/test-progression.js

# Verifica blackout: zona 101+, alternanza, obscured solo su z=0, auto-reveal
node games/mahjong/tests/test-blackout.js

# Regressione off-by-one HALF: (0,0) libera, (0,4) bloccata
node games/mahjong/tests/test-free.js

# Rendering FULL-su-HALF: onHalf, centratura sull'incrocio, apice dritto
node games/mahjong/tests/test-temple-steps.js

# Precompute solvability: 330 livelli, generazione veloce (<250ms), giocabile
node games/mahjong/tests/test-solvable.js
```

Gli script caricano `layouts.js` + `data.js` + `engine.js` in Node `vm` e chiamano
le funzioni REALI del gioco (`validateSupport`, `buildProgression`).

---

## Changelog

### v1.2.5 — Ripristino CSS Splash Button & Registrazione Obbligatoria (HEAD)
- **Classifica Esclusiva Utenti Registrati**: solo gli utenti autenticati possono inviare record e scalare la classifica; per gli ospiti è visibile un invito a registrarsi/accedere nel modal di vittoria.
- **Fix Splash Play Button**: corretta la chiusura della regola CSS `.splash-version` nel blocco `<style>` di `index.html` e reso lo stile del pulsante `🎮 PLAY` completamente autonomo e visibile.

### v1.2.4 — Ergonomia Player Audio & Card Volume Dedicata
- **Distinzione Visiva Timeline & Volume**:
  - **Timeline Brano**: formattata come nei lettori moderni (Spotify/YouTube) con i timer laterali `0:00` (tempo trascorso a sinistra) e `3:48` (durata totale a destra) che incorniciano la barra scrubber cyan.
  - **Volume Card Dedicata**: inserita in un card/pill box dedicato con etichetta `VOLUME MUSICA`, pulsante rapido muto/audio `🔊` dinamico (`🔇`/`🔉`/`🔊`), slider a tonalità ambra e percentuale in tempo reale `35%`. Zero ambiguità visiva.

### v1.2.3 — Automatic Fallback Playlist & 404 Recovery
- **Supporto `fallbackPlaylist` in `PointNetMusicPlayer`**: se i file di una playlist danno 404, il player passa istantaneamente alla playlist di riserva.

### v1.2.2 — Cache-Bust & Anti-Recursion Reentrancy Fix
- **Anti-Recursion Reentrancy Guard**: aggiunto `isUpdatingUI` in `PointNetMusicPlayer` e disaccoppiato `updateSfxButtons()` da `onStateChange()` per azzerare qualsiasi loop di aggiornamento.
- **Aggiornamento Cache Assets**: bump a `v1.2.2` su tutti gli script e link per forzare il refresh immediato nei browser.

### v1.2.1 — PointNetMusicPlayer Modulare & Seek Progress Bar
- **Modulo Standalone `PointNetMusicPlayer` (`assets/js/pointnet-music-player.js` e `games/mahjong/player.js`)**: componente autonomo, riutilizzabile e plug-and-play per tutti i giochi del plugin.
- **Seek Progress Bar Interattiva**: barra di avanzamento che scorre in percentuale sul brano e consente lo scrubbing/seek trascinando il cursore.
- **Visualizzazione Durate**: timer in tempo reale `currentTime / duration` (es. `1:24 / 3:45`) e calcolo automatico della durata dei brani nel menu a tendina della playlist (`1. Zen Remix (3:45)`).

### v1.2.0 — Jukebox Zen Player Integrato
- **Mini Jukebox Zen nel Drawer (`☰`)**: interfaccia compatta con titolo traccia in esecuzione, pulsanti di controllo `⏮️`, `⏯️`, `⏭️`, `🔀` (riproduzione casuale), menu dropdown con l'elenco completo delle tracce e slider per la regolazione fine del volume.
- **Sincronizzazione globale**: il toggle rapido dalla barra superiore (`🎵`) e il Jukebox rimangono sempre sincronizzati in tempo reale.

### v1.1.2 — Nuova Traccia Zen Remix Main Arcade Melody
- **Integrazione nuova traccia Arcade**: rinominata e normalizzata in formato web-safe `zen-remix-main-arcade-melody.mp3` e posizionata come brano di apertura nella playlist Arcade.

### v1.1.1 — Playlist Dedicata Modalità Classic (assets/music/classic/)
- **Switch Automatico Tracce Classic**: quando si gioca una sfida Classic (livelli 10, 20, 30...) il player musicale carica ed esegue automaticamente la playlist dedicata in `assets/music/classic/`.
- **Fallback Automatico Robusto**: se i brani in `classic/` non sono presenti o in attesa di upload, il player ritorna in modo trasparente alla musica Arcade standard.

### v1.1.0 — Audio SFX Naturali Zen (Bambù & Gocce d'Acqua)
- **Suono Click Naturale in Bambù**: sintesi di tocco secco e cavo in bambù (*Shishi-odoshi*), morbido e piacevole.
- **Suono Match Goccia d'Acqua**: sintesi acustica di una goccia d'acqua (*Suikinkutsu*) che cade in una ciotola di ceramica con leggera risonanza armoniosa.
- **Combo & Vittoria Zen**: gocce d'acqua a cascata su scala pentatonica e campane a vento giapponesi (*Fūrin*) in sottofondo alla vittoria.

### v1.0.9 — Controlli Separati Musica 🎵 & Effetti 🔊
- **Doppio controllo audio separato**: aggiunti pulsanti indipendenti per la **Musica di sottofondo (🎵)** e per gli **Effetti Sonori (🔊)** sia nella barra superiore (`.status-controls`) che nell'Action Drawer (`☰`).
- **Persistenza preferenze**: salvati separatamente `musicMuted` e `sfxMuted` in `localStorage`.

### v1.0.8 — Procedural Web Audio SFX, Visual Particles & Modal Shuffle Recovery
- **Motore SFX sintetizzato (Web Audio API)**: integrati effetti sonori procedurali a latenza zero per click tessere ("clack" realistico avorio/pietra), match armonico orientale, combo con pitch crescente (×2..×5), shuffle rustle, stallo/deadlock e fanfara di vittoria arpeggiata.
- **Effetti Particellari & Celebrazioni**: animazioni particellari composite GPU (`particleBurst` e `spawnVictoryConfetti`) con scintille dorate e coriandoli al match e al completamento del livello.
- **Recupero Game Over con Shuffle**: se si incorre in uno stallo (deadlock o staging pieno), il modal visualizza il pulsante `🔀 Usa Shuffle (xN) e Continua`, che sblocca il tabellone e permette di continuare la run senza perdere i punti.

### v1.0.5 — Fix Sovrapposizione Fullscreen Plugin & Toggle Audio Singolo
- **Eliminato doppio listener toggle audio**: rimosso il listener duplicato in `app.js` che causava la doppia esecuzione immediata di `toggleMusic()` (attivava e disattivava istantaneamente nello stesso click).
- **Spostato pulsante fullscreen del plugin WordPress**: il bottone di overlay `.pointnet-games-fullscreen-btn` è stato spostato in basso a destra (`bottom: 12px; right: 12px`), liberando completamente l'angolo superiore destro da qualsiasi sovrapposizione e lasciando liberi i clic sul menu `☰` e sull'audio `🔊`.

### v1.0.4 — Hamburger Menu ☰, Fix Fullscreen Close & Audio Unmute Logic
- **Menu Hamburger (☰)**: sostituito il vecchio ingranaggio `⚙️` con l'icona menu a 3 linee `☰` standard mobile.
- **Risolta sovrapposizione Fullscreen**: il pulsante di chiusura `✕` (`#fs-close`) è ora integrato elegantemente nei controlli di stato (`.status-controls`), senza più sovrapporsi al menu o alla barra.
- **Fix toggle audio & sblocco mute**: risolto il loop di stato audio che forzava l'icona a `🔇`; URL delle tracce risolti con percorso assoluto `document.baseURI` per iframe e WordPress.

### v1.0.3 — UI Header Integrata & Dual Audio Control
- **Icona audio sempre visibile**: spostati i controlli `#btn-music` e `#btn-actions` (⚙️) all'interno della barra superiore di stato (`.status-bar` → `.status-controls`), eliminando sovrapposizioni e problemi di visualizzazione su mobile e iframe.
- **Doppio controllo**: aggiunto il toggle `🔊 Musica: ON / 🔇 Musica: OFF` direttamente anche dentro l'Action Drawer (⚙️).
- **Fix path tracce audio**: normalizzati i percorsi playlist (senza spazi) e gestione sincrona stato player.

### v1.0.2 — Tessere SVG Vettoriali Tradizionali per Fiori e Stagioni
- **Nuovi set SVG dedicati per Fiori e Stagioni**: rimpiazzate le emoji di sistema (che stridevano visivamente) con **16 nuove tessere vettoriali SVG ad altissima definizione** (8 in `assets/regular/` e 8 in `assets/black/`).
  - **Fiori (梅, 蘭, 菊, 竹)**: Plum Blossom (1), Orchid (2), Chrysanthemum (3), Bamboo (4) in rosso tradizionale `#b93c3c` con badge numerico e calligrafia autentica.
  - **Stagioni (春, 夏, 秋, 冬)**: Spring (1), Summer (2), Autumn (3), Winter (4) in verde smeraldo `#1b7340` e blu reale `#142896`.
- **Perfetta armonia visiva**: tutte le 144 tessere del set Classic condividono ora la stessa identica estetica, tipografia orientale e profondità 3D del set ufficiale Riichi.

### v1.0.1 — Fix robustezza Audio Player & Autoplay Policy
- **Ripristino audio & autoplay unlock**: aggiunto listener globale alla prima interazione dell'utente (`pointerdown`/`keydown`) per sbloccare la riproduzione audio in conformità alle policy del browser.
- **Toggle audio migliorato**: se la traccia non era partita (o era in pausa), cliccare il pulsante del volume avvia/riprende immediatamente l'audio caricando la traccia corretta.
- **Inizializzazione all'avvio**: `initAudio()` eseguito automaticamente al caricamento per sincronizzare subito lo stato del bottone con le preferenze di `localStorage`.

### v1.0.0 — Modalità Classic + Staging Fisso Arcade + 330 Livelli
- **Modalità Classic (Sfide Speciali)**: compaiono **ogni 10 livelli** (10, 20, 30... per un totale di 33 sfide su 330 livelli).
  - Meccanica fedele tradizionale: match diretto a 2 click a terra senza staging box.
  - Deck tradizionale completo da 144 tessere (136 tessere standard Riichi/Classic + 4 Fiori + 4 Stagioni).
  - Regola Jolly per Fiori e Stagioni: qualsiasi fiore matcha con qualsiasi fiore, qualsiasi stagione matcha con qualsiasi stagione.
  - Rilevamento automatico di Deadlock: Game Over se non rimangono mosse valide (con opzione di usare Shuffle per sbloccare il tabellone).
  - Layout dedicato a 5 strati `classic_144` (144 tessere, zero tile flottanti).
  - Tema visivo e badge "CLASSIC" nell'interfaccia.
- **Punteggio Unico Cumulato**: i punti delle sfide Classic si sommano alla classifica arcade con moltiplicatore bonus **$\times 1.5$**.
- **Fix Staging Arcade**: ripristinato `maxStaging` fisso a **4 slot** per tutti i livelli Arcade (rimossa la riduzione 3→2→1 per un gameplay più divertente e accessibile).
- **Precompute Solvability 330 Livelli**: aggiornato `tools/build-solvable.js` per calcolare offline tutti i 330 livelli (Arcade + Classic con jolly).
- **Suite di Test Completa**: tutti i 6 test suite aggiornati e verificati con successo al 100%.
- Bump **1.0.0** su `manifest.json`, `index.html`, `README.md`, `CHANGELOG.md`.

### v0.9.5 — Precompute solvability + staging ridotto + commenti in inglese
- **Precompute solvability (Piano A)**: nuovo `tools/build-solvable.js` genera offline `solvable-levels.js` con, per ogni livello, l'attempt (seed) vincente + metriche (maxZ, tile libere all'avvio, sepoltura %, layout/variant). `generateLevel` legge dal precompute e **non chiama più `solveBoard` a runtime** → i livelli si generano in **~25ms** (prima 3-6s sui densi, decine di secondi su mobile). Il seed è deterministico, quindi il risultato è identico per tutti.
- **Metriche difficoltà**: salvate per livello (sepoltura %, tile libere all'avvio, maxZ) — base oggettiva per tarare la difficoltà futura.
- **Staging ridotto**: `maxStaging` 4→3→2 diventa **3→2→1** (più strategia classica, meno parcheggio).
- **Commenti tradotti in inglese** in tutti i file del gioco (coerenza col resto del progetto).
- Nuovo test `tests/test-solvable.js`: copertura 300 livelli, generazione <250ms (nessun DFS runtime), giocabilità campioni.
- Bump **0.9.5** su `manifest.json`/`index.html`/`README.md`/`CHANGELOG.md` + tag `mahjong-v0.9.5` e plugin `v0.1.9`.

### v0.9.4 — UI mobile compatta + action drawer
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