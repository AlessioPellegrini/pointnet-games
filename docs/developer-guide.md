# 🎮 PointNet Games — Guida per Sviluppatori di Giochi

Questa guida spiega come creare un gioco compatibile con il plugin **PointNet Games**.

---

## 1. Struttura di un Gioco

Ogni gioco è una **cartella autonoma** dentro la directory `games/` del plugin:

```
games/
└── mio-gioco/
    ├── manifest.json       # ✅ OBBLIGATORIO — metadati del gioco
    ├── index.html          # ✅ OBBLIGATORIO — entry point
    ├── game.js             # Logica del gioco (puoi usare più file JS, es. engine.js, ui.js)
    ├── style.css           # Stili
    ├── audio/              # (opzionale) file audio
    └── assets/             # (opzionale) sprite, immagini
```

---

## 2. manifest.json

```json
{
  "name": "Nome Gioco",
  "slug": "mio-gioco",
  "version": "1.0.0",
  "author": "Il Tuo Nome",
  "description": "Breve descrizione del gioco.",
  "type": "iframe",
  "width": 800,
  "height": 600,
  "orientation": "landscape",
  "controls": ["mouse", "keyboard", "touch"],
  "categories": ["arcade", "puzzle"],
  "max_score": 999999,
  "license": "MIT",
  "instructions": "Spiegazione rapida delle meccaniche di gioco."
}
```

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `name` | string | Nome visualizzato del gioco |
| `slug` | string | Identificatore univoco (stesso nome cartella) |
| `version` | string | Versione semver |
| `author` | string | Nome dell'autore |
| `description` | string | Breve descrizione |
| `type` | string | `iframe` (consigliata) o `canvas` |
| `width` | number | Larghezza consigliata del gioco (px) |
| `height` | number | Altezza consigliata del gioco (px) — determina l'altezza dell'iframe embedded |
| `orientation` | string | `landscape`, `portrait` o `both` |
| `controls` | array | Controlli supportati |
| `categories` | array | Categorie (filtri) |
| `max_score` | number | Punteggio massimo raggiungibile |
| `license` | string | Licenza del tuo codice |
| `instructions` | string | Istruzioni per il giocatore |
| `difficulties` | object \| absent | Mappa `{ "easy": "🐣 Facile", ... }` — se presente, la pagina del gioco mostra i tab di filtro difficoltà nella classifica |

---

## 3. Integrazione con l'API JavaScript

Il plugin espone l'oggetto globale **`pointnetGamesAPI`** dentro l'iframe del gioco.

### 3.1 Verifica disponibilità

```javascript
if (typeof window.pointnetGamesAPI !== 'undefined') {
    console.log('API PointNet Games disponibile!');
}
```

### 3.2 Metodi disponibili

#### `getNickname()` → string
Restituisce il nickname dell'utente:
- **Utente registrato**: username WordPress (`user_login`) — univoco garantito
- **Anonimo**: stringa vuota (in classifica appare "Anonimo")

```javascript
var nickname = pointnetGamesAPI.getNickname();
```

#### `setNickname(nickname)`
Salva il nickname per utenti anonimi (ignorato per utenti registrati).

```javascript
pointnetGamesAPI.setNickname('PlayerOne');
```

#### `isUserLoggedIn()` → boolean
`true` se l'utente è loggato con un account WordPress.

```javascript
if (pointnetGamesAPI.isUserLoggedIn()) {
    // Personalizza l'esperienza per utenti registrati
}
```

#### `submitScore(score, meta, callback)` → Promise
Invia il punteggio alla classifica.

```javascript
pointnetGamesAPI.submitScore(
    1500,
    {
        level: 5,
        time_seconds: 120,
        difficulty: 'hard'
    },
    function (response) {
        console.log('Posizione in classifica:', response.position);
    }
);
```

⚠️ **Nota**: `meta` deve contenere solo valori semplici (numeri, stringhe) — verrà sanitizzato dal server.

🔥 **Importante** — mostra sempre il punteggio al giocatore **subito**,
prima di chiamare `submitScore`. L'invio alla classifica avviene in
background: usa la Promise/callback solo per aggiornare la **posizione**
in classifica. Non aspettare la risposta API per mostrare il risultato,
altrimenti in caso di errore di rete il giocatore non vede mai il suo
punteggio.

#### `getLeaderboard(limit, callback, difficulty)` → Promise
Recupera la classifica del tuo gioco. Il terzo parametro `difficulty`
è opzionale: se passato, la classifica mostra solo i punteggi di quella
difficoltà (utile per giochi con livelli come il Campo Minato).

```javascript
// Tutti i punteggi
pointnetGamesAPI.getLeaderboard(10, function (entries) {
    entries.forEach(function (entry, i) {
        console.log((i + 1) + '. ' + entry.nickname + ' — ' + entry.score);
    });
});

// Solo difficoltà "easy"
pointnetGamesAPI.getLeaderboard(10, function (entries) {
    // entries filtrate per difficoltà
}, 'easy');
```

#### `getGlobalLeaderboard(limit, callback)` → Promise
Recupera la classifica globale di tutti i giochi.

```javascript
pointnetGamesAPI.getGlobalLeaderboard(20, function (entries) {
    // entries[0] è il campione assoluto
});
```

#### `startSession()` → Promise
Crea un token di sessione (anti-cheat consigliato per giochi con punteggio alto).

```javascript
pointnetGamesAPI.startSession().then(function (session) {
    console.log('Sessione creata, token:', session.token);
});
```

---

## 4. Modalità iframe con postMessage

Se per qualche motivo `pointnetGamesAPI` non è disponibile direttamente nell'iframe, il plugin supporta la comunicazione via **`window.postMessage`**.

> 💡 **Nota**: il plugin crea automaticamente uno **shim postMessage** —
> l'oggetto `pointnetGamesAPI` è sempre disponibile dentro l'iframe (sia via API
> diretta sia via bridge postMessage), e tutti i metodi ritornano una vera
> **`Promise`**. Non devi implementare tu un bridge postMessage: usa
> sempre `pointnetGamesAPI.submitScore(...).then(...)`. La sezione seguente
> documenta i messaggi interni per chi volesse integrarsi a livello più basso.

### Messaggi dal gioco → plugin

```javascript
// Inviare un punteggio
window.parent.postMessage({
    type: 'pointnet-games:submit-score',
    data: { score: 1500, meta: { level: 5 } }
}, '*');

// Richiedere classifica
window.parent.postMessage({
    type: 'pointnet-games:get-leaderboard',
    data: { limit: 10 }
}, '*');

// Richiedere fullscreen (overlay CSS)
window.parent.postMessage({ type: 'pointnet-games:fullscreen-request' }, '*');

// Uscire dal fullscreen
window.parent.postMessage({ type: 'pointnet-games:fullscreen-exit' }, '*');
```

### Messaggi dal plugin → gioco

```javascript
window.addEventListener('message', function (event) {
    var msg = event.data;
    if (msg.type === 'pointnet-games:score-submitted') {
        // msg.data = { success: true, score_id: 123, position: 4 }
    }
    if (msg.type === 'pointnet-games:leaderboard') {
        // msg.data = [ { nickname, score, position }, ... ]
    }
});
```

#### 🎬 `pointnet-games:start` — avvio immediato del gioco

Quando il gioco è embeddato in una pagina WordPress, il plugin può
inviare all'iframe il messaggio **`pointnet-games:start`** (ad esempio
dal pulsante mobile "GIOCA" che appare sopra l'iframe su schermi piccoli).

Il gioco **dovrebbe** gestirlo così:

```javascript
window.addEventListener('message', function (event) {
    var msg = event.data;
    if (msg && msg.type === 'pointnet-games:start') {
        // 1. Nascondi la splash screen (se presente)
        // 2. Avvia una nuova partita
        // 3. Richiedi il fullscreen
    }
});
```

> 💡 **Nota**: se il tuo gioco ha una splash screen con pulsante 🎮 GIOCA,
> aggiungi SEMPRE questo listener. In questo modo il pulsante "GIOCA" del
> plugin (sopra l'iframe su mobile) e il pulsante PLAY della splash
> fanno la stessa cosa: nascondono la splash, avviano la partita e
> richiedono il fullscreen.

---

## 5. Buone Pratiche

### 🎬 Splash screen + fullscreen (raccomandato)

Per un'esperienza arcade moderna, **raccomandiamo** di aggiungere al tuo gioco
una **schermata iniziale (splash)** separata dal gameplay:

```
┌──────────────────────────────────────┐
│   🎮 NOME GIOCO                      │
│   "Breve descrizione / tagline"      │
│   Informazioni sui controlli         │
│      [ 🎮 GIOCA ]                    │
└──────────────────────────────────────┘
              │ click su GIOCA
              ▼
   richiedi il fullscreen + avvia partita
```

1. **All'avvio**: mostra la splash con titolo, descrizione, controlli e un
   pulsante **🎮 GIOCA**
2. **Al click su GIOCA**:
   - Nascondi la splash
   - Chiama `pointnetGamesAPI.requestFullscreen()` (o invia
     `pointnet-games:fullscreen-request` via postMessage)
   - Avvia una nuova partita
3. **Per uscire**: aggiungi un pulsante ✕ (o un tasto ESC) che chiama
   `pointnetGamesAPI.exitFullscreen()`

**Vantaggi**:
- L'utente entra nel gioco "pulito" a schermo pieno, senza distrazioni
- Il problema delle dimensioni (taglio verticale su schermi piccoli)
  **sparisce del tutto** perché il gioco usa l'intero viewport
- La pagina WordPress sottostante (classifica + istruzioni) resta visibile
  una volta usciti dal fullscreen

#### 🏷️ Mostra la versione nella splash

Consigliato: aggiungi un **badge versione in apice** dopo il titolo della
splash, allineato a `manifest.json` → `version`:

```html
<h1 class="splash-title">Mio Gioco<sup class="splash-version">v1.0.0</sup></h1>
```

```css
.splash-version {
	font-size: 0.45em;
	font-weight: 700;
	vertical-align: super;
	margin-left: 4px;
	opacity: 0.7;
	letter-spacing: 0.3px;
}
```

#### 🔍 Rendering nitido dentro l'iframe (raccomandazioni testate)

L'iframe parte alla dimensione `manifest.json` (piccola) e cresce a
fullscreen dopo il round-trip `fullscreen-request` → **async**. Se il board
viene scalato con `transform: scale()`, il browser può riusare la texture
rasterizzata alla dimensione piccola e upscalarla → **tiles/blur low-res**.

Raccomandazioni testate sui giochi Mahjong e Minesweeper:

1. **Evita `zoom` CSS per il fit**: forza un full layout recalc a ogni
   cambiamento (lento) e rompe il centraggio (`offsetWidth` inaffidabile).
   Usa `transform: scale()`.
2. **`transform-origin: top left`** sul contenitore scalato — altrimenti lo
   scale parte dal centro e la board appare spostata/tagliata.
3. **Evita `translate3d()`/`perspective()` per-tile**: promuove ogni tile a
   layer GPU separato rasterizzato alla dimensione nativa (blur all'hover).
   Usa transform 2D (`translate()`) e `z-index` per lo stacking.
4. **Rasterizzazione in due fasi**: per invalidare la texture GPU al resize
   (rimuovi il transform → paint → ri-applica il nuovo scale):
   ```javascript
   el.style.transform = 'none';
   requestAnimationFrame(function () {
       el.style.transform = 'scale(' + s + ')';
   });
   ```
5. **Re-fit fino a stabilizzazione**: dopo l'avvio, per ~600ms controlla a
   ogni frame reale del wrapper e ri-applica il fit appena l'iframe cresce.
6. **Non renderizzare il board all'init** dietro la splash: renderizzalo
   solo al click GIOCA, quando il viewport ha le dimensioni finali.

Se il tuo gioco non supporta il fullscreen, assicurati che il contenuto
si adatti all'altezza indicata in `manifest.json` (`height`).

### ✅ Fai
- Invia il punteggio **una sola volta per partita** (usa un flag)
- Includi sempre `meta` con informazioni utili al confronto
- Gestisci il caso di API assente (gioco aperto fuori dal plugin)
- Testa il gioco sia dentro sia fuori dall'iframe
- Usa licenze aperte (MIT, GPL) per il tuo codice

### ❌ Evita
- Inviare punteggi negativi o non numerici
- Invii multipli nello stesso minuto → *rate limit* (default 5/minuto)
- Punteggi falsi → il plugin valida con nonce, rate limit e IP hash
- Nomi offensivi → il plugin filtra i nickname al server

---

## 6. Installazione di un Nuovo Gioco

**Il plugin registra automaticamente i giochi dalla cartella `games/`.**

1. Metti la cartella del gioco in `pointnet-games/games/mio-gioco/`
2. Assicurati che `manifest.json` sia presente e valido
3. Entra in **WP Admin** (anche solo una pagina qualsiasi dell'area
   amministrativa) — la sync avviene automaticamente lì

Il plugin scansiona `games/*/manifest.json` nelle pagine admin e automaticamente:

- ✅ Crea/aggiorna il post `pointnet_game` corrispondente
- ✅ L'URL canonico del gioco è il permalink del CPT `/games/mio-gioco/`
  (la pagina singola mostra gioco + classifica + istruzioni via content filter)
- ✅ La dashboard **PointNet Games** mostra la tabella "Giochi installati"
  con shortcode pronti da copiare e link alla pagina del gioco

La sync gira **solo in admin** per non pesare sul traffico frontend.
Non serve creare post o pagine a mano.

### Sync manuale (opzionale)

Puoi forzare la risincronizzazione da wp-cli o cron:

```php
PointNet_Games_Game_Registry::sync_all_games();
```

---

## 6.1 Disinstallazione di un Gioco

Dalla versione **0.1.3** puoi disinstallare un gioco direttamente dalla
dashboard **PointNet Games → Giochi installati**:

1. Individua il gioco nella tabella
2. Nella colonna **Azioni** clicca **Disinstalla**
3. Conferma la scelta nel dialog JavaScript

Durante la disinstallazione il plugin:

- ✅ Rimuove solo la cartella di **quel gioco** (`games/slug/`)
- ✅ Elimina il post `pointnet_game` corrispondente dal database
- ☑️ Elimina i **punteggi di quel singolo gioco** — solo se la checkbox
  "Elimina anche i N punteggi" è selezionata (default: selezionata)
- ❌ Non tocca gli altri giochi, le loro cartelle o i loro punteggi
- ❌ Non tocca le impostazioni del plugin né le altre tabelle WordPress

> 💡 Se deselezioni la checkbox, i punteggi restano nel database ma
> nella pagina **Punteggi** il gioco appare come "N/A" (gioco eliminato).

---

## 7. Esempio Completo

Ecco il flusso tipico di un gioco compatibile:

```javascript
// Configurazione iniziale
var score = 0;
var scoreSubmitted = false;
var isLoggedIn = pointnetGamesAPI.isUserLoggedIn();

// ... logica del gioco ...

// Alla fine della partita:
function endGame() {
    if (scoreSubmitted) return;
    scoreSubmitted = true;

    // ✅ CORRETTO: mostra il punteggio SUBITO,
    // poi aggiorna la posizione in classifica quando arriva la risposta.
    showScoreScreen(score);

    pointnetGamesAPI.submitScore(score, {
        level: currentLevel,
        time_seconds: Math.round(elapsed)
    }, function (response) {
        if (response && response.position) {
            updatePosition(response.position);
        }
    });
}

// ❌ SBAGLIATO: se l'API è lenta o fallisce,
// il giocatore non vede mai il suo punteggio.
// pointnetGamesAPI.submitScore(...).then(function (response) {
//     showScoreScreen(response.position);
// });
```

---

## 8. Domande Frequenti

### Il gioco può usare framework (React, Phaser, ecc.)?
Sì, ma il output deve essere un singolo `index.html` statico che funziona senza build server.

### Come gestisco il nickname anonimo?
Usa `pointnetGamesAPI.getNickname()` per leggere e `pointnetGamesAPI.setNickname()` per salvare quando l'utente lo inserisce. Il plugin lo persiste in localStorage.

### Come funziona l'anti-cheat?
Il plugin usa:
1. **Nonce WordPress** — ogni richiesta deve essere autenticata
2. **Rate limiting** — max 5 punteggi/minuto per giocatore/gioco
3. **IP hashing** — rileva abusi senza tracciare l'utente
4. **Validazione** — opzionale: i punteggi richiedono approvazione admin

### Posso aggiungere audio?
Assolutamente sì! Usa `games/mio-gioco/audio/` e fai riferimento ai file relativi. **Attenzione ai copyright**: usa solo audio che hai diritto di distribuire.

---

## 📝 Changelog Guida

- **v0.1.4** — Sezione 5 "Buone Pratiche" ampliata: badge versione nella splash, raccomandazioni testate per rendering nitido nell'iframe (evitare `zoom` CSS, `transform-origin: top left`, transform 2D per-tile, rasterizzazione in due fasi, re-fit finché stabile, niente board all'init)
- **v0.1.3** — Sezione 6.1 "Disinstallazione di un Gioco" (dalla dashboard PointNet Games, con opzione di eliminare i punteggi del singolo gioco)
- **v0.1.2** — Aggiornato esempio `endGame()` (mostra il punteggio subito, posizione in background); nota su shim postMessage automatico con Promise garantite; avviso "mostra punteggio subito" nella sezione `submitScore`; classifica con solo miglior punteggio per giocatore; utenti registrati mostrano `user_login` univoco (anonimi = "Anonimo"); nuovo attributo `difficulty` per shortcode `[pointnet_game_leaderboard]` e `getLeaderboard()`
- **v0.1.0** — Prima versione della guida API
