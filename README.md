# PointNet Games

Arcade games platform for WordPress with scores for registered users, global leaderboards, personal author profile records, and a standardized API for game developers.

**Contributors:** pointnet  
**Tags:** games, arcade, leaderboard, highscore, puzzle, minesweeper, mahjong  
**Requires at least:** WordPress 7.0  
**Tested up to:** 7.1  
**Stable tag:** 1.3.9  
**Requires PHP:** 8.0+  
**License:** GPL-2.0-or-later — see [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html)  

---

## 🎮 Overview

**PointNet Games** turns any WordPress installation into a modern arcade gaming platform. Games run inside responsive, isolated HTML5/Canvas/iframe environments. Registered users can compete for highscores, track level progression, and showcase their personal gaming records directly on their WordPress profile/author pages (`/author/username`).

Anonymous visitors can freely enjoy casual/practice mode, while authenticated users record verified highscores with built-in anti-cheat protections.

Developed by [PointNet](https://www.pointnet.it/).

---

## 🕹️ Included Games

### 1. 💣 Minesweeper (v1.3.5)
Inspired by the minimalist aesthetics and tactile responsiveness of *Minesweeper: The Clean One*, featuring **Dual Game Modes**:
- **⚡ Classic Mode (Speedrun & Time-Attack)**: Free-selection single game with the 4 standard presets:
  - 🟢 **Easy**: $9 \times 9$, 10 mines (~12.3% density)
  - 🟡 **Medium**: $16 \times 16$, 40 mines (~15.6% density)
  - 🔴 **Hard**: $30 \times 16$, 99 mines (~20.6% density)
  - 💀 **Extreme**: $32 \times 18$, 150 mines (~26.0% density)
- **🏆 Scalata Mode (18 Progressive Levels)**: Continuous 1-life climbing progression advancing from a relaxing $8 \times 8$ board up to the Extreme $32 \times 18$ board with 150 mines. Scores are submitted progressively upon clearing each level.
- **🔍 Viewport Engine**: Hardware-accelerated Pan & Pinch-to-zoom (1-finger pan, 2-finger pinch, desktop mouse wheel, fit-to-screen button, accidental-tap suppression).
- **🎶 Organic Sound Design**: Acoustic drop/wood clicks, pentatonic kalimba chords for numbers, snap for flags, and sub-bass boom thuds.
- **☀️ High-Contrast OLED Outdoors**: 1px perimetral edge definition with double inset highlight for flawless sunlight legibility.

### 2. 🀄 Mahjong Arcade (v1.7.0)
Classic Mahjong Solitaire tile-matching with an arcade twist, dual modes, and 100% mathematically guaranteed solvability:
- **330 Progressive Levels**: Curated progression spanning 46 unique layout figures (dragon, turtle, pagoda, butterfly, temple, etc.).
- **Dual Gameplay Modes**:
  - **Arcade Mode**: 4-slot staging box, face-down memory tiles, drag-to-peek, and blackout challenge levels.
  - **Classic Mode (Boss Challenges every 10 levels)**: Traditional pair-matching with 144 Riichi SVG tiles and flower/season wildcards.
- **🛡️ Shield Wards Mechanic (Levels ending in 7)**: Mystic central energy barrier defended by perimeter Guardian 🛡️ tiles. Deflection SFX, visual alerts, and shattering animations with bonus points.
- **🔄 Conveyor Ring Stages (Levels ending in 5)**: Rotating conveyor ribbon boards advancing clockwise with every match.
- **🎵 PointNetMusicPlayer Jukebox**: Standalone audio player with interactive scrubber seek bar, time indicators, volume card, and dual Zen/Arcade playlists.

---

## ✨ Key Features

- **🏆 Leaderboards & Score Tracking**:
  - Global multi-game leaderboard isolating each player's personal best per game.
  - Game-specific leaderboards with dynamic tabbed navigation across declared difficulty modes.
  - Registered user validation with privacy-safe display names (`display_name`) and sequential duplicate resolution (`#2`, `#3`), never exposing login credentials or database user IDs.
- **👤 Personal Records on Author Pages**:
  - Automatic injection of arcade records between profile header and post loops on `/author/username`.
  - Modern KPI stats pills (Total Score, Games Played, Personal Bests, Podiums).
  - Game cards with rank medals (🥇, 🥈, 🥉), mode badges, and speedrun/arcade detail formatting.
  - Universal theme compatibility (GeneratePress, Astra, Kadence, OceanWP, Genesis and standard themes).
- **🔒 Security & Anti-Cheat**:
  - Nonce validation, server-side parameter sanitization, and output escaping.
  - One-time anti-cheat session tokens, manifest `max_score` boundaries, and minimum duration plausibility checks.
  - Strict capability verification (`manage_options`) on administrative actions.
  - IP rate limiting and privacy-first SHA-256 IP hashing (no plain IPs stored).
- **🚀 1-Click Native GitHub Auto-Updater**:
  - Native background updater querying official GitHub releases and tags.
  - Uses official `Update URI` header and queries GitHub releases/tags with full pagination (`?per_page=100`).
  - Seamless 1-click updates directly inside WordPress admin with safe folder renaming.

---

## 📋 Shortcodes Reference

| Shortcode | Attributes | Description |
|---|---|---|
| `[pointnet_game]` | `slug="minesweeper-arcade"`<br>`width="600"`<br>`height="850"` | Embeds the playable game with splash screen, fullscreen support, and leaderboard drawer. |
| `[pointnet_game_leaderboard]` | `slug="minesweeper-arcade"`<br>`difficulty="easy"`<br>`limit="10"`<br>`show_meta="1"` | Displays highscores for a specific game and mode, with automatic tabs if multiple difficulties exist. |
| `[pointnet_games_leaderboard]` | `limit="20"` | Displays the multi-game global ranking across all installed games (plural alias with `global="1"`). |
| `[pointnet_games_list]` | `columns="3"` | Displays a responsive visual grid of all installed games with metadata, tags, and PLAY buttons. |
| `[pointnet_user_records]` | `user_id=""`<br>`columns="2"`<br>`show_stats="1"`<br>`show_cards="1"` | Displays a player's personal arcade records showcase anywhere. Defaults to current author or logged-in user. |

---

## 🌐 REST API Endpoints

All endpoints are registered under the `/wp-json/pointnet-games/v1` namespace:

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/games` | Public | List all installed and active games |
| `GET` | `/games/(?P<slug>[\w-]+)` | Public | Get metadata and manifest for a single game |
| `GET` | `/leaderboard/(?P<slug>[\w-]+)` | Public | Get leaderboard entries for a game (`limit`, `difficulty`) |
| `GET` | `/leaderboard` | Public | Get global multi-game leaderboard |
| `POST` | `/session` | Logged In | Generate a one-time anti-cheat game session token |
| `POST` | `/score` | Logged In | Submit a verified score (`game_slug`, `score`, `meta`, `session_token`) |
| `GET` | `/user/(?P<id>\d+)/records` | Public | Get all arcade records and statistics for a specific user ID |

---

## 🛠️ JavaScript API (`pointnetGamesAPI`)

Inside the game iframe, the plugin provides the global `window.pointnetGamesAPI` object with Promise support:

```javascript
// Check user authentication
if (pointnetGamesAPI.isUserLoggedIn()) {
    console.log('Player:', pointnetGamesAPI.getNickname());
}

// Start an anti-cheat game session
pointnetGamesAPI.startSession().then(function (session) {
    var sessionToken = session.token;
});

// Submit score upon game over
pointnetGamesAPI.submitScore(25000, {
    difficulty: 'hard',
    time_seconds: 48,
    outcome: 'victory'
}).then(function (response) {
    if (response.success) {
        console.log('Rank position:', response.position);
    }
});

// Request fullscreen
pointnetGamesAPI.requestFullscreen();
```

---

## 📁 Repository Structure

```
pointnet-games/
├── assets/                  # Public and admin styles, scripts, controller icons
├── docs/
│   └── developer-guide.md   # Comprehensive game developer and API guide
├── games/
│   ├── minesweeper-arcade/  # Minesweeper (The Clean One aesthetics, Dual Modes)
│   └── mahjong/             # Mahjong Arcade (330 levels, Shield Wards, Conveyor)
├── includes/
│   ├── class-api.php        # REST API controllers and rate limiting
│   ├── class-game-loader.php# Shortcode rendering and author page hooks
│   ├── class-game-registry.php # Automatic game scanner and CPT sync
│   ├── class-install.php    # DB migration and custom score tables
│   ├── class-leaderboard.php# Leaderboard queries and deduplication
│   ├── class-post-types.php # CPT definition and admin columns
│   ├── class-shortcodes.php # Shortcode handlers and user records HTML
│   └── class-updater.php    # Native GitHub auto-updater module
├── languages/               # Internationalization (.pot, .po, .mo)
├── pointnet-games.php       # Main plugin bootstrap and headers
└── readme.txt               # WordPress standard readme
```

---

## 🗺️ Roadmap

- [x] **v1.3.0**: Dual-mode Minesweeper, Pan & Pinch-to-zoom, native GitHub updater.
- [x] **v1.3.5**: Personal arcade records on author profiles and `[pointnet_user_records]`.
- [x] **v1.3.7**: Universal theme compatibility for author pages (GeneratePress, Astra, etc.).
- [x] **v1.3.8**: Standard `Update URI`, tag pagination, and core recheck force-refresh.
- [x] **v1.3.9**: Privacy-safe display names, duplicate resolution (`#2`, `#3`), optional profile linking for logged-in users, and cached profile hooks.
- [ ] **v1.4.0**: Additional arcade titles (Snake Arcade, Block Puzzle).
- [ ] **v1.5.0**: Player achievements & unlockable profile badges system.
- [ ] **v1.6.0**: Timeframe leaderboard filters (All-Time, Monthly, Weekly).

---

## 📄 License & Credits

Developed by **PointNet** ([https://www.pointnet.it/](https://www.pointnet.it/)).  
Released under the terms of the **GNU General Public License v2 or later (GPL-2.0+)**.
