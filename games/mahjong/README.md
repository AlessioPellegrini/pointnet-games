# Mahjong Arcade

Classic Mahjong Solitaire tile-matching with a modern twist: a 4-slot staging box, face-down memory tiles, drag-to-peek and guaranteed solvable boards. Mobile-first, no pan/zoom.

> **Version: 1.5.0** — **Arcade & Classic Modes + Conveyor Ring Dynamic Boards**: 41 layout figure (compreso il layout speciale `classic_144` a 5 strati e i nuovi circuiti chiusi a nastro `conveyor_ring` e `conveyor_inset`) con **330 livelli progressivi**, **sfide speciali Classic ogni 10 livelli** (10, 20, 30...) e **sfide Arcade Conveyor ogni 10 livelli sui numeri 5** (15, 25, 35, 45...) con nastro rotante ad avanzamento step-by-step sbloccato a "spiraglio". **PointNetMusicPlayer Modulare & Standalone** integrato nell'Action Drawer (`☰`) con seek progress bar interattiva, timer $m:ss$, visualizzazione della durata dei brani nella playlist, controlli di navigazione (`⏮️ ⏯️ ⏭️ 🔀`), selettore traccia e slider volume. Deck completo tradizionale da 144 tessere con grafica vettoriale SVG autentica per Fiori e Stagioni, animazioni 3D di dissolvenza, rilevamento deadlock e moltiplicatore **$\times 1.5$** integrato nel punteggio cumulato. Effetti sonori organici Zen (bambù e gocce d'acqua), controlli separati per Musica (🎵) ed Effetti (🔊), particelle visive e recupero tramite **Shuffle** nel modal di Game Over.

## 🔖 Version bump checklist

Quando cambi la versione del gioco, aggiorna **tutti** questi punti:

1. `manifest.json` → campo `"version"`
2. `index.html` → **10 occorrenze**: `style.css?v=…` (1 `<link>`), badge splash `<sup class="splash-version">v…</sup>`, e gli 8 `<script>` `layouts.js?v=…`, `data.js?v=…`, `engine.js?v=…`, `app.js?v=…`, `ui.js?v=…`, `input.js?v=…`, `progress.js?v=…`, `player.js?v=…`
3. `README.md` → riga `> **Version: …**` + nuova voce in cima al changelog

Nota: il plugin fa già il cache-bust di `index.html` con il timestamp dei file (`get_game_dir_mtime`), quindi l'iframe si aggiorna da solo; i `?v=…` manuali servono solo per i sub-asset (CSS/JS) dentro l'HTML.

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

### Classic Mode Challenges (v1.0.0)
- Occur **every 10 levels** (10, 20, 30... up to 330)
- Traditional direct match: tap a free tile to select, tap a matching free tile to remove directly (no staging box)
- 144 tiles with **Flower and Season wildcards**: any flower matches any flower, any season matches any season
- Deadlock detection: automatic game over if no moves remain (shuffle power-up can be used to unlock)
- **1.5x score bonus** added to the cumulative leaderboard total

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
- [x] Staging box: 4 slot fissi in Arcade
- [x] Score system: combo chain (×1..×5) + star rating (par time, no undo)
- [x] Splash + level bar UI (same style as minesweeper-arcade)
- [x] **No pan/zoom**: board resizes to fit the viewport ✅

### Phase 4 — Registered User Persistence & Leaderboard ✅
- [x] Save progress via `submitScore()` for global leaderboard (registered and logged-in users only)
- [x] Logged-in users resume from their saved level (`wp_user_meta` `_pointnet_games_progress`)
- [x] Guest users play in casual mode via localStorage with prompt to register/login for global rankings

### Phase 5 — Arcade & Classic Modes Integration ✅
- [x] **Fase 1 — Fix Staging Arcade**: `maxStaging` fisso a 4 slot per tutta la modalità Arcade.
- [x] **Fase 2 — Regole Modalità Classic**: match diretto tra 2 tessere libere senza staging box, `covered=0`, `blackout=false`, gestione deadlock / game over quando non ci sono mosse valide, shuffle opzionale.
- [x] **Fase 3 — Stile & Musica Classic**: tema CSS dedicato per i livelli Classic, badge/indicatore di sfida, supporto switch audio (`setMusicMode('classic')`).
- [x] **Fase 4 — Set Classic 144 Tile (Jolly)**: set tradizionale da 144 tessere con famiglie Fiori e Stagioni, estensione di `canMatch` per permettere l'abbinamento incrociato tra qualsiasi Fiore e qualsiasi Stagione.
- [x] **Fase 5 — Progressione & Mode Flag**: inserimento automatico delle sfide Classic ogni 10 livelli (10, 20, 30...) con incremento del totale livelli a 330; esposizione di `mode: 'classic' | 'arcade'` in `getLevelDef()`.
- [x] **Fase 6 — Punteggio Cumulato con Moltiplicatore**: unificazione dello score arcade per i livelli Classic con applicazione del moltiplicatore bonus **×1.5**.
- [x] **Fase 7 — Taratura Difficoltà & Metriche**: bilanciamento fine dei livelli avanzati con le metriche di sepoltura e tile libere all'avvio.
- [x] **Fase 8 — Precompute & Test Suite**: rigenerazione offline di `solvable-levels.js` compatibile con i jolly e le sfide Classic; aggiornamento ed estensione dei test automatizzati in `tests/`.

### Phase 6 — Polish & Extra Mechanics 🚀
- [x] **Effetti sonori dedicati (SFX sintetizzati via Web Audio)**: click morbido in bambù naturale (Shishi-odoshi), match a goccia d'acqua Zen (Suikinkutsu), cascata di gocce per le combo, fruscio di foglie/tessere e campane a vento (Fūrin) per la vittoria.
- [x] **Modulo PointNetMusicPlayer Standalone & Riutilizzabile**: componente autonomo per la gestione musicale in tutti i giochi con seek bar di avanzamento interattiva, timer $m:ss$ in tempo reale, durate calcolate dei brani nella playlist e persistenza volume.
- [x] **Supporto Playlist Modalità Classic**: gestione cartella `assets/music/classic/` per le tracce tradizionali durante le sfide Classic.
- [x] **Animazioni di feedback & particelle**: esplosioni di scintille stellari al match, scia combo e cascata di coriandoli/stelle su vittoria.
- [x] **Recupero Game Over tramite Shuffle**: opzione nel modal di usare una carica di Shuffle 🔀 per continuare la partita senza azzerare il livello.
- [ ] Dark theme opzionale coordinato con il plugin WordPress

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

- **Engine**: vanilla JavaScript, 10 static files (index.html + style.css + **layouts.js** + data.js + engine.js + **app.js + ui.js + input.js + progress.js + player.js**), no build step, no modules/IIFE — shared global scope loaded as sequential `<script>` tags
- **No runtime dependencies**: static HTML + JS + CSS served via iframe
- **No pan/zoom**: the board always fits the viewport, tiles scale responsively
- **API integration**: `window.pointnetGamesAPI.submitScore()` for leaderboard (Phase 4)
- **License**: GPL-2.0+ — original implementation inspired by ffalt/mah (MIT)

## Changelog

### v1.5.0 — Modalità Arcade Dinamica: Anello Rotante "Conveyor Ring" (current)
- **Nuovi Layout Rettangolari a Nastro (`conveyor_ring` e `conveyor_inset`)**: inseriti nuovi circuiti chiusi a forma di rettangolo continuo su `z=0` (small, medium, large, xl) con strutture centrali multipiano progressive.
- **Logica di Sblocco a "Spiraglio Libero"**: l'anello si attiva non appena compare almeno una tessera libera o uno slot aperto sul nastro (`isConveyorUnlocked`), permettendo di avviare la rotazione subito dopo i primi tocchi strategici.
- **Avanzamento a Step**: ogni tessera inviata allo staging muove il nastro di 1 passo in avanti in senso orario; i match diretti o combinati muovono il nastro di 2 passi (`stepConveyor`).
- **Scorrimento Fluido & Binari Visivi**: transizione fluida CSS a 280ms (`.tile.conveyor-moving`) e guide grafiche sul tavolo da gioco (`.conveyor-slot-indicator`) con badge `🔄 CONVEYOR` in testata.
- **Integrazione nei Livelli "5"**: sfide Conveyor integrate ogni 10 livelli sui numeri 5 (15, 25, 35... 325) con difficoltà crescente e piena compatibilità con Blackout e Quads.

### v1.4.8 — Aggiunta Traccia Arcade "Mahjong Zen (Secondary Theme)" e URI Encoding Robusto
- **Nuovo Brano Playlist Arcade**: integrata la traccia `Mahjong Zen - secondary theme.mp3` con titolo visualizzato pulito `Mahjong Zen (Secondary Theme)`.
- **Supporto Nomi con Spazi (`player.js`)**: potenziata la funzione `getFullUrl` con `encodeURI(decodeURI(relPath))` per caricare in modo resiliente qualsiasi file audio contenente spazi o caratteri speciali.

### v1.4.7 — Animazione Luminosa e Dissolvenza Coppie Classic
- **Animazione Match Classic 3D**: quando viene abbinata una coppia in modalità classica, i cloni delle due tessere si sollevano con un bagliore luminoso ciano/oro (`brightness(1.6)`, `translateY(-24px)`) dissolvendosi fluidamente in volo con particelle, dando un feedback tattile soddisfacente ed eliminando la sparizione a scatto.

### v1.4.6 — Rimozione Simboli Doppi e ZWJ nei Set Emoji
- **Sanitizzazione Set Simboli (`data.js`)**: rimossi i caratteri composti da doppie emoji (`🐦🔥` e `❤️‍🔥`), sostituiti con simboli singoli puliti e universali (`🏎️` e `❣️`), garantendo che ogni tessera contenga esattamente un unico glifo isolato e leggibile su ogni sistema operativo.

### v1.4.5 — Pulsante Rapido Reset Livello 1
- **Pulsante `⏮️ Reset a Livello 1`**: integrato nel pannello sviluppatore un pulsante one-tap per azzerare istantaneamente il livello salvato e ripartire dal livello 1 in tutta comodità.

### v1.4.4 — Margini Interni Ottimizzati a 7px
- **Raffinamento Inset 7px**: aumentato il margine interno a `inset: 7px; width: calc(100% - 14px); height: calc(100% - 14px);` per `.tile-svg` e `calc(100% - 10px)` per lo staging box, garantendo una spaziatura visiva generosa ed equilibrata rispetto ai bordi smussati 3D della tessera.

### v1.4.3 — Margini Interni Eleganti per Tessere SVG Traditional
- **Margine Interno Inset 4px**: applicato `inset: 4px; width: calc(100% - 8px); height: calc(100% - 8px); object-fit: contain;` a `.tile-svg`, lasciando un bordo interno naturale ed elegante che distanzia i simboli dai bordi smussati della tessera.
- **Staging Box Inset**: applicato `width: calc(100% - 6px); height: calc(100% - 6px); object-fit: contain;` anche agli slot dello staging box.

### v1.4.2 — Risoluzione Errore Sintassi CSS & Sblocco Completo
- **Fix Critico Sintassi CSS (`style.css`)**: aggiunta la parentesi graffa chiusa `}` mancante su `.tile-overlay` a riga 320 che bloccava il parsing di tutti i selettori successivi (`.tile-svg`, `.action-panel.open`, `.dev-tools-card`, toast notifications).
- **Attivazione Diretta Dev Mode**: toccando il numerino di versione o il livello in cima si attiva/disattiva istantaneamente la modalità sviluppatore con alert a schermo.
- **Riapertura Immediata Action Drawer ☰**: risolto il conflitto di rendering CSS; l'hamburger menu si apre e chiude con fluidità immediata.

### v1.4.1 — Risposta Eventi Drawer & Tap Segreti Multipiattaforma
- **Hamburger Menu ☰ Immediato**: collegato l'evento del drawer a gestione unificata `click` e `pointerdown` con isolamento propagation, prevenendo conflitti con i listener del board.
- **Gesture Segreta Multi-Elemento**: abilitata la sequenza dei 5 tap segreti per attivare la Modalità Sviluppatore sia sul badge di versione (`.splash-version`), sia sul titolo (`.splash-title`), sull'emoji (`.splash-emoji`), sul badge di livello (`#level-label`) e sul titolo del drawer (`.score-cmp-title`), con supporto touch/pointer e timeout a 3 secondi.

### v1.4.0 — Perfetto Rendering SVG Mahjong Traditional
- **Scala SVG Perfetta 100%**: ripristinato il posizionamento `top: 0; left: 0; width: 100%; height: 100%` per `.tile-svg`, consentendo alla grafica vettoriale SVG di scalare in modo fluido e naturale sulla faccia di ciascuna tessera $48\times 64\text{px}$ senza ritagli o ingigantimenti.

### v1.3.9 — Contenimento SVG e Overflow Tessere Rigido
- **Bounding Box Rigido `.tile`**: aggiunto `overflow: hidden` a `.tile` per impedire a qualsiasi elemento figlio (SVG / emoji) di fuoriuscire dai confini della tessera.
- **Dimensionamento Assoluto `.tile-svg`**: vincolate le dimensioni dell'immagine SVG a `40x56px` con `max-width: 40px` e `max-height: 56px`, bloccando l'espansione intrinseca del canvas SVG.

### v1.3.8 — Fix Board Map Initialization & Layout Scaling
- **Risolto Crash `board.get is not a function`**: ripristinata correttamente la chiamata `app.board = buildBoard(app.tiles)` all'avvio del livello in `app.js`, consentendo il completamento di `rebuildBoard()` e `fitBoard()` e il corretto ridimensionamento vettoriale di tutte le tessere SVG.

### v1.3.7 — Correzione Dimensioni e Inset Dorso Tessere
- **Dimensioni Pixel-Identiche**: aggiunto `box-sizing: border-box` a `.tile` e rimosso il bordo esterno che ingrandiva le tessere coperte; tutte le tessere ora mantengono esattamente le dimensioni native ($48\times 64\text{px}$) senza allargamenti.
- **Dorso Proporzionato**: ridimensionata l'icona interna del dorso (`font-size: 18px` per `?` e `13px` per `🔒`), perfettamente proporzionata alla tessera.

### v1.3.6 — Rendering Dorso Tessere Autentico & Pulizia Badge Numerici
- **Autentico Dorso Mahjong**: rimosso il contrasto errato e renderizzato il vero dorso blu profondo con emblema centrale 🀄 (e 🔒 per le coperte bloccate).
- **Badge Numeri Puliti**: i badge numerici degli strati (`plane-badge`) e delle etichette (`num-badge`) sono stati nascosti sia per i giocatori normali sia su tutte le tessere a faccia in giù/blackout, lasciando la superficie delle tessere pulita e impeccabile.

### v1.3.5 — Modalità Sviluppatore Nascosta & Menu Giocatore Pulito
- **Menu Giocatore Pulito**: rimossi gli strumenti di debug e il salto livello dalla vista standard; il pulsante `🔄 Riavvia Livello` permette di riprovare la tavola corrente senza alterare la progressione.
- **Attivazione Modalità Sviluppatore (5 Tap Segreti)**: toccando 5 volte rapidamente il numerino di versione nella schermata iniziale o il titolo nel drawer si abilita/disabilita la modalità sviluppatore, con persistenza in `localStorage` e toast alert.
- **Pannello Dev Strumenti**: quando attiva, mostra nel menu il selettore libero di livello (`[ 1..330 ] Vai`), i metadati tecnici in tempo reale della tavola (`layout`, `variant`, `tessere`, `strati`, `blackout`) e il tasto `⚡ Win` per testare le vittorie.

### v1.3.4 — Punteggio Strategico, Confronto Record & Classifica Top 10 nel Menu
- **Confronto Record vs Punteggio Attuale nel Drawer**: inserita nell'Hamburger Menu `☰` una card live con il confronto tra il tuo record personale del livello e i punti della partita in corso con badge di stato in tempo reale.
- **Classifica Top 10 Assoluta nel Drawer**: integrato il pannello con la classifica dei primi 10 giocatori del gioco con medaglie (🥇, 🥈, 🥉), nickname e punteggio, aggiornabile con il tasto `🔄`.
- **Punteggio Strategico & Finestra Combo Dinamica**: la finestra combo cresce con la dimensione del tavolo ($3.5\text{s} \rightarrow 5.5\text{s} \rightarrow 8.0\text{s}$) permettendo di pianificare le mosse sui tavoli grandi senza fretta; aggiunti il **Layer Depth Bonus** ($+50\dots+75\text{ pt}$ per gli strati superiori $z>0$) e i **Bonus Strategia di Fine Livello** ($+1.500\text{ pt}$ No Shuffle, $+1.000\text{ pt}$ No Undo).
- **Schermata Finale Epica al Livello 330**: al completamento del gioco si attiva la schermata celebrativa "Campione Supremo" con il computo totale delle stelle (su 990 ⭐) e il punteggio cumulativo totale.

### v1.3.3 — Bilanciamento Progressivo Deck Classic 144 "Boss Fight"
- **Symbol Concentration nei 144 Tessere**: scalata la concentrazione dei simboli unici per i 33 livelli Classic (Boss Fight ogni 10 livelli):
  - **Zona 1 (Livelli 10..60)**: 12 simboli unici $\times 12$ copie (tavola scorrevole, tantissime coppie aperte, zero blocchi per i primi boss).
  - **Zona 2 (Livelli 70..150)**: 17 simboli unici $\times 8$ copie $+$ 4 Fiori $+$ 4 Stagioni (difficoltà media con introduzione jolly).
  - **Zona 3 (Livelli 160..250)**: 20 simboli unici $+$ 4 Fiori $+$ 4 Stagioni (sfida strategica avanzata).
  - **Zona 4 (Livelli 260..330)**: 34 simboli unici $\times 4$ copie $+$ 4 Fiori $+$ 4 Stagioni (set tradizionale Mahjong completo a 144 tessere).

### v1.3.2 — Curva di Difficoltà & Densità Tessere Fluida e Monotona
- **Crescita Lineare Uniforme**: riscritta la curva di progressione in `data.js` legando il target floor all'indice reale della progressione ($12 \rightarrow 124$ tessere).
- **Eliminazione Cali Improvvisi a Livelli Avanzati**: i filtri blackout e half-cover ora rispettano rigidamente la fascia di tessere minima del livello corrente, eliminando la ricomparsa anomala di schemi piccoli (24–28 tessere) a metà e fine gioco.
- **Transizione Fluida 4 Zone**: Zona 1 ($12\dots36$), Zona 2 ($40\dots64$), Zona 3 ($68\dots96$), Zona 4 ($100\dots124/144$).

### v1.3.1 — Riprogettazione Completa Tartarughe Arcade (Small, Medium, Large)
- **Autentica Silhouette Tartaruga per Arcade**: riprogettate tutte e 3 le varianti della figura `turtle` (Arcade):
  - **`small` (28 tessere)**: testa, 4 zampe, rientri ascellari/inguinali, coda e guscio centrale rialzato a 2 strati (Livelli 15, 93, 131).
  - **`medium` (48 tessere)**: cupola a 3 strati con ampia apertura carapace, 4 zampe isolate, testa e coda (Livelli 74, 118, 167, 223).
  - **`large` (60 tessere)**: grande tartaruga verticale a 3 strati con silhouette simmetrica perfetta (Livelli 64, 186, 188, 239).
- **Risoluzione Asimmetrie Storiche**: eliminata la vecchia configurazione con testa laterale asimmetrica e blocchi rettangolari informi.

### v1.3.0 — Supporto Invio Selettore Livello & Sincronizzazione Live
- **Tasto Invio / Go nel Selettore Livello**: ora è possibile premere `Invio` (o `Go` / `Invio` sulla tastiera virtuale mobile) direttamente nel campo di input del livello per avviare subito la partita senza dover cliccare il pulsante "Level".
- **Sincronizzazione Live del Livello**: il campo di input nel cassetto azioni viene ora sincronizzato automaticamente con il numero del livello corrente all'avvio di ogni partita.

### v1.2.9 — Spazi Vuoti e Sagoma Netta Tartaruga Mobile
- **Sagoma Iconica con Spazi Negativi**: inseriti i vuoti ascellari ($y=2$, $x=0,10$ vuoti) e inguinali ($y=6$, $x=0,10$ vuoti) e staccate le 4 zampe ($x=0$ e $x=10$) dal collo/pelvi. La testa, le 4 zampe, la coda e la cupola centrale a 5 strati (144 tessere totali) sono ora perfettamente sagomate e visibili a colpo d'occhio su mobile.

### v1.2.8 — Layout Autentico Tartaruga Mobile a 144 Tessere
- **Riprogettazione Layout `classic_144`**: trasformato il vecchio blocco rettangolare in una vera **Tartaruga verticale a 5 strati (144 tessere)** ottimizzata per smartphone (Testa a $y=0$, 4 Zampe/Pinne sporgenti ad apertura angolare a $y=1,7$, Guscio centrale stratificato a 5 piani $z=0\dots4$, e Coda a $y=8$). Zero tile flottanti, 100% responsive su mobile.
- **Giocabilità Sbloccata**: la nuova silhouette offre molteplici rami e tessere aperte all'avvio su zampe, testa, coda e apice del carapace, eliminando gli stalli forzati del vecchio rettangolo compatto.

### v1.2.7 — Aggiornamento Playlist Classic & Ottimizzazione Switch Brani
- **Nuova Traccia Classic Dedicata**: collegato `Zen classic ( arcade main theme).mp3` in `assets/music/classic/` a `AUDIO_PLAYLIST_CLASSIC`, correggendo i riferimenti a vecchie tracce non presenti su disco.
- **Transizione Fluida Playlist**: `setMusicMode()` ora aggiorna la playlist solo quando c'è un reale cambio di modalità (Arcade ↔ Classic), evitando il riavvio della musica ad ogni livello consecutivo della stessa modalità.

### v1.2.6 — Fix Sincronizzazione DOM Shuffle & Rimescolamento Risolvibile
- **Fix Disallineamento Grafica SVG dopo Shuffle**: in `ui.js`, `updateStates()` ora aggiorna correttamente gli elementi `<img>` con `t.svg` e resetta le classi wildcard (`wildcard-flower`, `wildcard-season`). In precedenza, lo shuffle aggiornava i simboli in memoria ma non la grafica SVG a schermo, causando abbinamenti apparentemente errati (tessere visivamente diverse che si accoppiavano).
- **Playability Guard nello Shuffle**: in `input.js`, `shuffleBoard()` tenta fino a 50 permutazioni per garantire che dopo lo shuffle ci sia almeno una mossa valida disponibile (`hasAnyValidMove`).

### v1.2.5 — Ripristino CSS Splash Button & Autonomia Stili
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

### v1.2.1 — PointNetMusicPlayer Modulare & Seek Bar
- **Modulo Standalone `PointNetMusicPlayer` (`assets/js/pointnet-music-player.js` e `games/mahjong/player.js`)**: componente riutilizzabile in tutti i giochi per la gestione audio.

### v1.1.2 — Nuova Traccia Zen Remix Main Arcade Melody
- **Integrazione nuova traccia Arcade**: rinominata e normalizzata in formato web-safe `zen-remix-main-arcade-melody.mp3` e posizionata come brano di apertura nella playlist Arcade.
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
- **Menu Hamburger (☰)**: sostituito l'ingranaggio `⚙️` con l'icona menu standard a 3 linee `☰`.
- **Risolta sovrapposizione Fullscreen**: il tasto `✕` (`#fs-close`) è inserito ordinatamente in `.status-controls`.
- **Fix logica unmute**: sblocco immediato a `🔊` al toggle senza più loop forzato su disattivato.

### v1.0.3 — UI Header Integrata & Dual Audio Control
- **Icona audio sempre visibile**: controlli spostati dentro la barra di stato (`.status-bar` → `.status-controls`), senza più sovrapposizioni su mobile/iframe.
- **Doppio controllo audio**: toggle musica presente sia nell'header che dentro l'Action Drawer (⚙️).
- **Tracce normalizzate**: percorsi web-safe e ripresa playback istantanea.

### v1.0.2 — Tessere SVG Tradizionali per Fiori e Stagioni
- **Nuove 16 tessere SVG vettoriali** per i Fiori (梅, 蘭, 菊, 竹) e le Stagioni (春, 夏, 秋, 冬) in `assets/regular/` e `assets/black/`: rimpiazzano le vecchie emoji con grafica tradizionale autentica, badge numerici (1..4) e caratteri calligrafici in perfetta armonia con le altre 136 tessere Riichi.

### v1.0.1 — Fix robustezza Audio Player & Autoplay Policy
- Listener prima interazione per autoplay unlock, toggle migliorato e avvio sincrono preferenze.

### v1.0.0 — Modalità Classic + Staging Fisso Arcade + 330 Livelli

### v0.9.5 — Precompute solvability + staging ridotto + commenti in inglese
- **Precompute solvability (Piano A)**: `tools/build-solvable.js` genera offline `solvable-levels.js` → nessun DFS a runtime → livelli generati in ~25ms (prima 3-6s sui densi).
- **Metriche difficoltà** salvate per livello (sepoltura %, tile libere, maxZ).
- **Staging ridotto**: maxStaging 4→3→2 → **3→2→1**.
- **Commenti tradotti in inglese** in tutti i file del gioco.

### v0.9.4 — UI mobile compatta + action drawer
- **Header rimosso** (titolo già nella splash): più spazio verticale al board.
- **Action drawer**: Hint/Undo/Shuffle/New/Level spostati in un pannello apribile con ⚙️ (fixed bottom, slide-up) — il board occupa tutto lo spazio che prima era dell'action bar.
- **Staging box più leggibile**: slot ingranditi (44×52 desktop, 38×46 mobile) e `min-height` ridotto.
- **Status bar compatta**: gap e padding ridotti.
- Bump **0.9.4** (manifest, index.html, README, CHANGELOG).

### v0.9.3 — Blackout HALF esteso + copertura layout
- **Blackout anticipato da ~101 in poi** (alternato, prima solo 225+): 100 livelli oscurati su 300, distribuiti in tutta la seconda metà del gioco
- **Preferenza HALF nei blackout** (effetto "half sopra base oscurata"): metà dei blackout usa un layout HALF con base libera, l'altra metà un layout `freeBase` → ~50 blackout con HALF (prima 3) e ~82 livelli totali con HALF
- **Garanzia di copertura dei 38 layout** (es. `crown`, `star`, `harp` non vengono più esclusi dalla rotazione)
- `test-blackout.js` aggiornato (zona 101+, campioni nuovi)

### v0.9.2 — Rendering FULL-su-HALF + zero duplicati
- **Fix critico rendering stacking a offset** (`layoutPos` + geografia `rowOff`/`stackDepth`/`onHalf` in `buildBoard`, `engine.js`): le FULL che poggiano sull'incrocio di 4 HALF (temple_steps z2) venivano disegnate con l'offset 3D delle FULL dritte → in alto a destra, lontano dai supporti. Le HALF sotto *sembravano* libere ma erano correttamente bloccate ("libere ma non cliccabili", es. livello 175). Ora ogni tile della **scala a offset** è centrata sul proprio incrocio (z1 HALF → ½ riga, z2 FULL-su-HALF → 1 riga) e le FULL dritte **ereditano il rowOff del supporto** (stackDepth per l'effetto 3D): così anche l'apice z3 di `temple_steps/large` resta appena SOPRA la FULL che lo sostiene (8px) invece di "volare" in alto lasciandola apparentemente libera (es. livello 210).
- **Fix layout `lyre`** (layouts.js): i bracci partivano da y=0 e la traversa ripushava `(0,0)` e `(8,0)` → 2 tile nella stessa cella (parità rotta). Ora bracci da y=1: small 16 e medium 20 tile **uniche**.
- **Zero duplicati su tutti i builder**: audit `test-layouts.js` esteso con controllo coordinate ripetute → corretti con `dedupePts` anche `helix` (small/medium), `bridge/medium`, `spiral/medium`, `labyrinth/medium`, `mushroom/medium`, `windmill/medium`, `harp` (small/medium), `crane/medium`. Prima ogni duplicato creava 2 tile nella stessa cella (tile fantasma nel deck).
- **Progressione blackout sicura** (`buildProgression`): i livelli blackout (225+) scelgono solo layout con **almeno una tile z0 libera** all'avvio (nuovo helper `hasFreeBase`), altrimenti nessuna tile oscurata si auto-rivela e il livello parte bloccato (es. labyrinth/medium su L275).
- Nuovo test permanente `tests/test-temple-steps.js`: onHalf su FULL z2, centratura sull'incrocio in `layoutPos`, apice z3 come stacking dritto, conteggi %4.

### v0.9.1 — Fix off-by-one HALF + playability guard + temple_steps
- **Fix critico geometria HALF** (`hasHalfCoverAbove`, `isFreeForSolver`, `hasFullCoverAbove` in `engine.js`): la HALF coprente veniva cercata a `y+1` invece di `y-1` → la prima riga del piano base risultava iper-bloccata ("tile libere ma non risultano tali") e l'ultima ipo-bloccata ("tile bloccate ma cliccabili"). Colpiva i livelli con layout HALF (21, 28, 35, 42, 175, 182…)
- **`generateLevel` playability guard (nuovo)**: dopo `covered`, se tra le tile libere e scoperte non c'è quasi una coppia → lo shuffle viene rigirato. Risolve i livelli che partivano bloccati (es. 175) quando il `covered` casuale copriva tutte le coppie libere
- **`temple_steps` ridisegnato** (24/40/56 tile): geometria ziggurat con HALF che partono dalla fila 0 della base (tagliano a metà la prima fila, niente "fluttuazione"), piani centrati
- Nuovo test permanente `tests/test-free.js` (regressione: `halfcover/small` (0,0) libera, (0,4) bloccata)

### v0.9.0 — Blackout + stacking classico a offset
- **BLACKOUT (new mechanic)**: nei livelli 225–299 (alternati), tutto il piano base `z=0` parte OSCURATO (`obscured`) — le tile sono inerti (non cliccabili, non trascinabili) e si **auto-rivelano** da sole appena diventano LIBERE (`isFree`), grazie all'auto-reveal in `ui.js updateStates()`. Convive con la memoria `covered` (una tile z=0 può essere sia oscurata che a faccia in giù)
- **Stacking classico a offset**: nuova regola fisica in `engine.js` — una tile FULL può poggiare sull'incrocio di **4 HALF** (`validateSupport`, `isFree`, solver aggiornati). Abilita "half su half" nello stile classico del Mahjong solitaire: piano 1 griglia → piano 2 sfalsato → piano 3 sfalsato sul 2 → ecc.
- **Nuovo layout `temple_steps`** (38 totali): piramide a gradoni a offset puro, varianti 20/40/68 tile, multi-livello FULL→HALF→FULL→HALF. I 37 layout esistenti restano intatti (regressione verificata)
- **Fix commento `applyFaceDown`**: la selezione delle tile `covered` è CASUALE (possono coprire entrambe le copie di un simbolo) — il commento precedente diceva erroneamente "una tile per coppia"
- **Test permanenti**: nuovo `games/mahjong/tests/test-blackout.js` (zona 225+, alternanza, obscured solo su z=0, multipli di 4, auto-reveal giocabile) — `node games/mahjong/tests/test-*.js` lancia tutta la suite

### v0.8.2 — Progressione monotona + 9 nuove figure
- **Tile-count monotono**: la progressione (`buildProgression`) non fa MAI calare il numero di tile di più di 8 tra livelli adiacenti (prima c'erano salti tipo `124 → 56`); floor globale come quantile dei tile-count reali del pool (`tileLevels`) con curva `progress^2.2`; banda `[minTiles, minTiles+16]` con cap 108 → `spiral/medium` (124 tile) come **finale boss** negli ultimi 3 livelli
- **9 nuove figure**: `chalice, mushroom, ship, anchor, windmill, harp, lyre, skyscraper, crane` (totale 37 layout)
- **Script di test permanenti**: creati `games/mahjong/tests/test-layouts.js` e `test-progression.js` (non più in /tmp — si lanciano con `node games/mahjong/tests/test-*.js`)
- **CHANGELOG.md** introdotto: storico essenziale + convenzioni coordinate + come aggiungere figure e fare il version bump

### v0.8.1 — Fix half-tile offset
- Half-tile centrata tra due righe di supporto (spostata mezza riga in basso) — fix `engine.js` su `layoutPos.shiftY` e `boardSize`
- Verificato su 300 livelli: 0 violazioni top/bottom

### v0.8.0 — Modular split + cumulative score
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