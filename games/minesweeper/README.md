# 💣 Campo Minato

Il classico campo minato con grafica moderna dark, effetti sonori procedurali e musica di sottofondo generata in tempo reale (Web Audio API — nessun file audio esterno).

## 🎮 Come si gioca

- **Scopo**: rivelare tutte le celle sicure senza far esplodere le mine.
- **Click sinistro / tap**: rivela una cella.
- **Click destro / pressione lunga (mobile)**: piazza/rimuovi una bandierina.
- **Scorciatoie**: `R` = nuova partita, `M` = attiva/disattiva audio.

## 🏆 Punteggio

```
Punteggio = max(1, base + (mine × 2) − (tempo_in_secondi × 8))
```

| Difficoltà | Base | Mine | Punteggio massimo | Punteggio minimo |
|-----------|------|------|-------------------|------------------|
| 🐣 Facile | 1000 | 10 | 1020 | 1 |
| ⚡ Medio | 2000 | 40 | 2080 | 1 |
| 💀 Difficile | 4000 | 99 | 4198 | 1 |

- La **stima del punteggio** è visibile in tempo reale nella barra di stato (🏆).
- Ogni secondo di ritardo fa perdere **8 punti**.

## 🛠️ Funzionalità

- ✅ Tre difficoltà (Facile, Medio, Difficile)
- ✅ Splash screen con pulsante GIOCA e fullscreen immersivo
- ✅ Punteggio live nella status bar
- ✅ Audio procedurale: effetti sonori + musica di sottofondo (Web Audio API)
- ✅ Supporto touch: tap = rivela, long-press = bandierina (con vibrazione)
- ✅ Supporto keyboard: R = riavvia, M = audio
- ✅ Classifica integrata con PointNet Games (`pointnetGamesAPI.submitScore`)
- ✅ Primo click sempre sicuro (nessuna mina nella prima cella e nei suoi vicini)
- ✅ Animazioni: reveal pop, esplosione, flag pop, particelle, coriandoli

## 📦 Integrazione PointNet Games

Il gioco usa l'API JavaScript globale `pointnetGamesAPI` fornita dal plugin:

- **`submitScore(score, meta)`** — invia il punteggio alla classifica (in background: l'overlay con il punteggio appare subito, la posizione si aggiorna quando arriva la risposta).
- **`getNickname()`** — nickname utente (`user_login` WordPress per registrati, stringa vuota per anonimi che appaiono come "Anonimo").

## 🧰 Sviluppo

- **Struttura**: unico file `index.html` statico (HTML + CSS + JS inline).
- **Audio**: nessun file audio, tutto generato proceduralmente con Web Audio API.
- **Test**: aprire `index.html` direttamente nel browser o tramite il plugin.

## 📝 Changelog

### 0.1.2 (attuale)
- Stima punteggio live nella status bar (🏆) — punteggio aggiornato ogni secondo
- Fix: punteggio finale visibile subito alla vittoria, anche in fullscreen/iframe (senza dover ricaricare la pagina)
- Fix: shim postMessage `pointnetGamesAPI` con vere Promise per `submitScore`/`getLeaderboard`
- Responsive mobile: layout compatto (margini/padding ridotti), celle dinamiche 24-32px, scroll orizzontale fluido su Difficile, `touch-action: manipulation`
- Classifica: solo miglior punteggio per giocatore (GROUP BY user_id/ip_hash); utenti registrati mostrano `user_login` univoco WordPress, anonimi "Anonimo"
- Classifica per difficoltà: tab nella pagina del gioco (Tutti/Facile/Medio/Difficile) che filtrano via `score_meta.difficulty`
- ROADMAP: valutare soluzione per non esporre `user_login` di admin/editor
- Licenza aggiornata a **GPL-2.0+**

### 0.1.1
- Splash screen con pulsante GIOCA
- Fullscreen CSS immersivo (funziona anche su iOS Safari)
- Supporto touch: long-press per bandierina con vibrazione
- Altezza iframe 850px per Medio/Difficile

### 0.1.0
- Rilascio iniziale con 3 difficoltà, audio procedurale e classifica PointNet Games

## 📄 Licenza

**GPL-2.0+** — licenza GNU General Public License v2 o successiva.