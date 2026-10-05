# 💣 Minesweeper

Ispirato al design e all'esperienza tattile di *Minesweeper: The Clean One*, con **doppia modalità di gioco**: la classica partita singola a selezione libera o l'emozionante modalità Scalata a 18 livelli progressivi fino al livello Estremo!

## 🎮 Modalità di Gioco

### 1. ⚡ Modalità Classica (*The Clean One*)
Partita singola con i 4 preset di riferimento, ideale per cimentarsi su tavole specifiche o per stabilire il record di velocità:
- **🟢 Facile**: 9 × 9 · 10 mine (~12.3% densità)
- **🟡 Medio**: 16 × 16 · 40 mine (~15.6% densità)
- **🔴 Difficile**: 30 × 16 · 99 mine (~20.6% densità)
- **💀 Estremo**: 32 × 18 · 150 mine (~26.0% densità)

### 2. 🏆 Modalità Scalata (18 Livelli a scalata progressiva)
Scalata a livelli continui a vite singola: ogni tavola completata fa guadagnare punti e sblocca il livello successivo. Un errore su una mina fa esplodere la serie e invia il punteggio accumulato alla classifica!

| Livello | Griglia | Celle | Mine | Densità | Benchmark |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 8 × 8 | 64 | 7 | 10.9% | Avvio rilassante |
| **2** | 8 × 8 | 64 | 9 | 14.1% | |
| **3** | 9 × 9 | 81 | 10 | 12.3% | Benchmark Facile |
| **4** | 10 × 9 | 90 | 12 | 13.3% | |
| **5** | 10 × 10 | 100 | 15 | 15.0% | |
| **6** | 12 × 10 | 120 | 18 | 15.0% | |
| **7** | 12 × 12 | 144 | 22 | 15.3% | |
| **8** | 14 × 12 | 168 | 26 | 15.5% | |
| **9** | 14 × 14 | 196 | 31 | 15.8% | |
| **10** | 16 × 14 | 224 | 36 | 16.1% | |
| **11** | 16 × 16 | 256 | 40 | 15.6% | Benchmark Medio |
| **12** | 18 × 16 | 288 | 47 | 16.3% | |
| **13** | 20 × 16 | 320 | 55 | 17.2% | |
| **14** | 22 × 16 | 352 | 64 | 18.2% | |
| **15** | 25 × 16 | 400 | 75 | 18.8% | |
| **16** | 28 × 16 | 448 | 88 | 19.6% | |
| **17** | 30 × 16 | 480 | 99 | 20.6% | Benchmark Difficile |
| **18** | 32 × 18 | 576 | 150 | 26.0% | Benchmark Estremo (Max Level) |

---

## 🔍 Controlli e Pan & Pinch-to-Zoom

- **Tocca / Clic sinistro**: scopri la casella.
- **Tocca numero rivelato (Chording)**: se le bandierine adiacenti corrispondono al numero, scopre all'istante tutte le caselle sicure limitrofe.
- **Selettore Pill `⛏️ Dig / 🚩 Flag`**: tocco rapido per passare istantaneamente dalla modalità scavo a quella bandierina.
- **Pressione prolungata / Clic destro**: posiziona o rimuove una bandierina (con micro-vibrazione aptica).
- **Pan (Scorrimento)**: trascina la tavola con un dito su mobile o trascina con il mouse su desktop.
- **Pinch-to-Zoom**: allarga o stringi 2 dita per zoomare su smartphone e tablet; usa la rotellina del mouse su desktop.
- **Pulsanti HUD dedicati**:
  - `⛶`: adatta automaticamente l'intera tavola allo schermo (*Fit to Screen*).
  - `＋` / `−`: zoom in e zoom out rapido.
  - `🔊`: attiva o silenzia gli effetti sonori tattili.
  - `🏠`: torna al menu principale per cambiare modalità.
- **Scorciatoie da tastiera**:
  - `F` = toggle scavo/bandierina
  - `M` = toggle audio
  - `+` / `-` = zoom in/out
  - `0` = adatta allo schermo
  - `Esc` = esci da fullscreen o apri menu

---

## 📦 Integrazione PointNet Games

- Punteggi e metadati trasmessi con precisione in base alla modalità attiva:
  - `arcade`: classifica della modalità **Scalata** (`label: "Scalata"`).
  - `easy`, `medium`, `hard`, `extreme`: classifiche separate per ciascun preset della **Modalità Classica**.
- La pagina del gioco su WordPress espone automaticamente i tab dedicati per ciascuna classifica grazie alla configurazione di `manifest.json`.

---

## 📝 Changelog

### 1.3.0 (current)
- **Doppia Modalità (Classica & Scalata)**: introdotta la modalità Classica con i 4 preset di *The Clean One* (Facile 9×9, Medio 16×16, Difficile 30×16, Estremo 32×18) affiancata alla modalità Scalata progressiva ampliata a 18 livelli fino all'Estremo 32×18 con 150 mine.
- **Pan & Pinch-to-Zoom fluido**: motore viewport a trasformazione hardware con supporto per drag a 1 dito, pinch-to-zoom a 2 dita, rotellina del mouse su desktop, zoom buttons (`⛶`, `＋`, `−`) e soppressione automatica dei clic accidentali durante lo scorrimento.
- **Rimozione denominazione "Arcade"**: rinominato il gioco in **Minesweeper** per rispecchiare la nuova natura a doppia modalità, preservando al contempo lo slug `minesweeper-arcade` per la piena compatibilità con database, post e URL WordPress esistenti.
- **Classifiche dedicate per difficoltà**: aggiornato il manifest con tab di classifica per `arcade`, `easy`, `medium`, `hard`, ed `extreme`.
- **Sound Design Organico**: campionatura acustica pura (goccia/legno, kalimba pentatonica per i numeri, snap per le bandierine, sub-bass thud) senza loop musicali continui.
- **Smart Chording & Pill Toggle**: svelamento istantaneo attorno ai numeri completati e pill selector per il cambio rapido di modalità tocco.

### 1.2.0
- Riprogettazione iniziale ispirata a *The Clean One*, HUD landscape docking, fix conflitti touch Android e resume AudioContext.

### 1.1.0
- Splash screen iniziale e supporto CSS fullscreen.
- Version badge (`v1.1.0` in superscript) added to the splash screen title
- High-DPI board rendering: the board rasterizes at the current viewport resolution whenever the iframe grows to fullscreen (two-phase transform re-application), keeping cells and text crisp on WordPress embeds
- Splash screen now shows the game version in superscript after the title, consistent with mahjong

### 1.0.0
- Initial release with **15 progressive levels** and gradual difficulty
- Mobile friendly grids (max 14 columns)
- Progressive scoring with per-level multiplier
- Procedural audio (Web Audio API)
- Splash screen + immersive fullscreen
- Full PointNet Games integration (leaderboard, arcade difficulty, postMessage shim)

## 📄 License

**GPL-2.0+** — GNU General Public License v2 or later.