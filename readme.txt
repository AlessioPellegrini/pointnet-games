=== PointNet Games ===
Contributors: pointnet
Tags: games, arcade, leaderboard, highscore, puzzle
Requires at least: 6.2
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.8
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.txt

Arcade game platform for WordPress with scores, leaderboards and a standardized API for game developers.

== Description ==

**PointNet Games** turns your WordPress site into an arcade game platform. Games run in HTML5, Canvas or iframe, and every score is saved to the leaderboard — for registered users (using their unique WordPress username) or anonymous players (with a quick nickname, no registration required).

= Key Features =

* ✅ **Score system** — scores for registered and anonymous players with nicknames
* ✅ **Leaderboards** — per-game and global rankings
* ✅ **REST API** — standardized endpoints for third-party developers
* ✅ **JavaScript API** — `pointnetGamesAPI` bridge to integrate games easily
* ✅ **Shortcodes** — `[pointnet_game]`, `[pointnet_game_leaderboard]`, `[pointnet_games_list]`
* ✅ **Auto-registration** — games in the `games/` folder are registered automatically
* ✅ **Anti-cheat** — nonces, rate limiting, optional validation, IP hashing
* ✅ **Security** — output escaping, input sanitization, capability checks, prepared SQL statements
* ✅ **Bundled game** — Minesweeper Arcade with 15 progressive levels
* ✅ **Splash screen** — intro screen with a PLAY button
* ✅ **Immersive fullscreen CSS** — the game expands to fullscreen when pressing PLAY
* ✅ **Mobile touch support** — tap to reveal, long-press to flag with vibration

= Security =

PointNet Games follows official WordPress security recommendations:

* **Output escaping** — every output is sanitized with `esc_html()`, `esc_attr()`, `esc_url()`, `esc_attr_e()`
* **Input sanitization** — all inputs pass through `sanitize_*()`, `absint()`, `sanitize_text_field()`
* **Nonces** — every write action is protected by a WordPress nonce
* **Capability checks** — admin operations require `manage_options`
* **SQL injection** — all queries use `$wpdb->prepare()` with typed placeholders
* **CSRF** — full protection on admin forms and REST endpoints
* **Rate limiting** — max N score submissions per minute per player/game
* **Privacy** — IPs are stored as SHA-256 hashes, never in plain text

= Included Games =

* **Minesweeper Arcade** — progressive levels: clear the field and advance to the next level. One mistake and you restart from Level 1. Mobile friendly.
* **Mahjong Arcade** — tile-matching with a 4-slot staging box, face-down memory tiles, drag-to-peek and guaranteed solvable boards via DFS solver. In development (v0.8.0).

== Installation ==

= Automatic Installation =

1. Go to **WP Admin → Plugins → Add New**
2. Search "PointNet Games" and install
3. Activate the plugin

= Manual Installation =

1. Download the plugin ZIP file
2. Extract it into the `wp-content/plugins/pointnet-games/` folder
3. Activate the plugin from **WP Admin → Plugins**

= After Activation =

1. Log into **WP Admin** — the plugin automatically registers games from the `games/` folder
2. Go to **PointNet Games** in the admin menu to see installed games
3. Use the auto-generated page (e.g. `/minesweeper-arcade/`) or create a page with the `[pointnet_games_list]` shortcode

== Frequently Asked Questions ==

= How do I add a new game? =

Copy the game folder (with `manifest.json` and `index.html`) into `wp-content/plugins/pointnet-games/games/my-game/` and reload WP Admin. The plugin registers everything automatically.

= How do I create a games page? =

Create a WordPress page and insert the `[pointnet_games_list]` shortcode to show the grid, or `[pointnet_game slug="minesweeper-arcade"]` to embed a single game.

= Can anonymous users submit scores? =

Yes, by default. You can disable it from **PointNet Games → Settings**.

= How are scores protected from cheating? =

The plugin uses WordPress nonces, IP rate limiting, IP hashing and optional manual validation.

= Can I develop my own game? =

Absolutely! Full developer documentation is in `docs/developer-guide.md`. Each game is a folder with `manifest.json` + `index.html` that uses the global `pointnetGamesAPI` object.

= How does Minesweeper Arcade scoring work? =

The score is based on the game level reached at the moment of clearing the field. Saved meta includes the level, time and field size.

== Screenshots ==

1. PointNet Games dashboard with statistics and installed games
2. Minesweeper Arcade page with leaderboard
3. Settings panel

== Changelog ==

= 0.1.8 =
* Mahjong Arcade updated to v0.8.0 — game.js split into 4 modules (app/ui/input/progress)
* Cumulative score: per-level best scores + leaderboard total, merged via WP user meta
* PointNet API: getProgress/saveProgress aligned to per-level scores map

= 0.1.7 =
* Mahjong Arcade updated to v0.4.0 — 15 classic/hybrid layouts, 25-step progressive difficulty curve, up to 130 tiles, 8 face-down pairs, reduced staging box on higher levels
* Mahjong Arcade difficulty rebalance — Level 100 is now substantially harder (wall XL layout, 2 staging slots, 8 covered pairs)
* Fixed Mahjong board vertical centering (board sits higher with TOP_PAD_EXTRA = 2)

= 0.1.6 =
* New bundled game: Mahjong Arcade (v0.3.0) — tile-matching with a 4-slot staging box, face-down memory tiles, drag-to-peek, half-cover tiles and DFS solver guaranteeing solvability
* Minesweeper Arcade remains available alongside Mahjong Arcade; both games are auto-registered from the games/ folder

= 0.1.5 =
* Removed the classic Minesweeper game — only Minesweeper Arcade is bundled now
* Orphaned game cleanup: when a game folder is removed from `games/`, its CPT post and leaderboard scores are automatically deleted during the registry sync
* Admin dashboard: detailed shortcode documentation with per-attribute explanations and multiple examples
* Minesweeper Arcade mobile optimization: responsive board that fills the screen, compact portrait and landscape layouts, dynamic cell sizing
* Cache busting now covers the whole game folder: if any file (CSS, JS, assets) is modified, the iframe cache refreshes

= 0.1.4 =
* Plugin Check compliance: interpolated table names in SQL replaced with `%i` identifiers (requires WordPress 6.2+)
* Uninstall script rewritten as a function wrapper (no more prefixed-global warnings)
* PHPCS ignore annotations for legacy `rmdir()`/`unlink()` fallback — WP_Filesystem remains the primary path
* Removed duplicate legacy cleanup entries left over from the plugin rename
* Requires at least bumped to 6.2 for `$wpdb->prepare( '%i', ... )`

= 0.1.3 =
* Game uninstallation from the dashboard: "Actions" column with an "Uninstall" button for each game
* Option to delete a single game's scores during uninstallation (dedicated checkbox, only affects that game)
* Plugin renamed to PointNet Games (new slug pointnet-games, new CPT, REST namespace, shortcodes, JS API)
* Uninstall now removes everything: scores table, options, game posts, game pages and the games/ folder (legacy + new names)
* Plugin metadata updated: author PointNet (https://www.pointnet.it/) and plugin site https://wpgames.pointnet.it/
* ROADMAP: ZIP upload to install new games from the admin panel
* ROADMAP: Mahjong Solitaire with progressive levels
* Developer guide updated

= 0.1.2 =
* Fix Minesweeper: score appears immediately on win (no need to exit fullscreen or reload)
* Fix postMessage bridge: `submitScore`/`getLeaderboard` shims now return real Promises
* Fix `submitScore` robustness: safe handling of missing API, errors and non-Promise responses
* Leaderboard: best score per player only (GROUP BY user_id/ip_hash)
* Leaderboard: registered users show their unique WordPress username (`user_login`) — anonymous remain "Anonymous"
* Removed display-name deduplication (no longer needed with unique user_login)
* Difficulty-based leaderboards: new `difficulty` attribute in `[pointnet_game_leaderboard]` shortcode and `getLeaderboard()` REST API parameter
* Difficulty filter tabs on the game page (declared in the `difficulties` field of manifest.json)
* ROADMAP: evaluate a solution to avoid exposing `user_login` of admins/editors on leaderboards
* Cache busting: iframe game URLs with `?v=filemtime` to avoid stale cached versions
* New game: Minesweeper Arcade with 15 progressive levels and mobile-friendly grids (max 14 columns)
* ROADMAP: Mahjong Solitaire with progressive levels
* Developer guide updated: fixed `endGame()` example, automatic shim note, "show score immediately" warning

= 0.1.1 =
* New splash screen with PLAY button in Minesweeper
* Immersive CSS fullscreen: the game expands to fullscreen on PLAY click (works on iOS Safari too)
* Removed fragile iframe auto-resize — height read from manifest.json
* Fixed vertical cut on Medium/Hard (850px iframe)
* Touch support: long-press cell to flag (with vibration)
* Game page: full layout (game + leaderboard + instructions) via content filter
* Cleaned duplicate /slug/ pages created by betas (canonical URL /games/slug/)
* "Settings" link in the plugins list
* Single-game template removed (replaced by robust content filter)
* Versioned sync fingerprint v3 (automatic re-sync after upgrade)

= 0.1.0 =
* Initial release
* Score system for registered and anonymous users
* Per-game and global leaderboards
* Admin dashboard with installed games and shortcodes
* Auto-registration of games from the games/ folder
* Auto-generated pages for each game
* Complete REST API
* pointnetGamesAPI JavaScript bridge
* Bundled Minesweeper game with procedural audio
* Anti-cheat: nonce, rate limit, IP hash, optional validation

== Upgrade Notice ==

= 0.1.4 =
Now requires WordPress 6.2 or newer because SQL table identifiers are quoted with `$wpdb->prepare( '%i' )`.

= 0.1.3 =
The plugin has been renamed to PointNet Games with a new slug: deactivate and delete the old "WP Games" plugin, then install the new "pointnet-games" folder. The uninstall script removes all data and files (old and new names).

= 0.1.2 =
Fixes a Minesweeper bug: the final score now appears immediately on win, even in fullscreen/iframe mode. Recommended update.

= 0.1.1 =
Recommended update: adds splash screen, CSS fullscreen, touch support and fixes vertical cutting on Medium/Hard.

= 0.1.0 =
First release.