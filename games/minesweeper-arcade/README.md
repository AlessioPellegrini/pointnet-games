# 💣 Campo Minato Arcade

Variante arcade del classico campo minato con **livelli progressivi**: completa il campo e passa al livello successivo. Un errore e riparti dal Livello 1!

## 🎮 Come si gioca

- **Scopo**: rivelare tutte le celle sicure senza far esplodere le mine, livello dopo livello.
- **Click sinistro / tap**: rivela una cella.
- **Click destro / pressione lunga (mobile)**: piazza/rimuovi una bandierina.
- **Scorciatoie**: `R` = riavvia livello, `M` = attiva/disattiva audio.

## 🏆 Punteggio e progressione

```
Punteggio livello = max(10, (celle_sicure × 10 − tempo_secondi × 5) × (1 + livello × 0.2))
Punteggio totale = somma di tutti i livelli completati
```

| Livello | Griglia | Celle | Bombe | % |
|---------|---------|-------|-------|---|
| 1 | 7 × 7 | 49 | 5 | 10% |
| 2 | 7 × 7 | 49 | 6 | 12% |
| 3 | 7 × 7 | 49 | 7 | 14% |
| 4 | 8 × 7 | 56 | 9 | 16% |
| 5 | 8 × 7 | 56 | 11 | 20% |
| 6 | 9 × 8 | 72 | 13 | 18% |
| 7 | 9 × 8 | 72 | 15 | 21% |
| 8 | 10 × 9 | 90 | 17 | 19% |
| 9 | 10 × 9 | 90 | 20 | 22% |
| 10 | 11 × 10 | 110 | 23 | 21% |
| 11 | 11 × 10 | 110 | 26 | 24% |
| 12 | 12 × 12 | 144 | 30 | 21% |
| 13 | 12 × 12 | 144 | 35 | 24% |
| 14 | 14 × 14 | 196 | 42 | 21% |
| 15 | 14 × 14 | 196 | 50 | 26% |

- Se **esplodi**: il punteggio accumulato viene inviato alla classifica e si riparte dal Livello 1
- Completa tutti e 15 i livelli: punteggio finale inviato come "Livello Massimo"
- **Mobile friendly**: tutte le griglie hanno massimo 14 colonne — entrano in qualunque schermo
- **Progressione graduale**: incremento di 1-3% per livello, con griglie che crescono lentamente

## 📦 Integrazione PointNet Games

- `submitScore(score, meta)` — invia il punteggio totale con meta `{ difficulty: "arcade", label: "Arcade", level_reached, time_seconds }`
- Classifica filtrata per `difficulty="arcade"` (tab "🎮 Arcade" nella pagina del gioco)

## 📝 Changelog

### 1.0.0 (attuale)
- Rilascio iniziale con **15 livelli progressivi** e difficoltà graduale
- Griglie mobile friendly (max 14 colonne)
- Punteggio progressivo con moltiplicatore per livello
- Audio procedurale (Web Audio API)
- Splash screen + fullscreen immersivo
- Integrazione completa PointNet Games (classifica, difficoltà arcade, shim postMessage)

## 📄 Licenza

**GPL-2.0+** — licenza GNU General Public License v2 o successiva.