=== PointNet Games ===
Contributors: pointnet
Donate link: https://www.paypal.com/donate/?hosted_button_id=V8836NLKVLP4J
Tags: games, arcade, leaderboard, highscore, puzzle
Requires at least: 6.2
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 1.6.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Arcade gaming engine for WordPress with highscores, leaderboards, standardized API and a 1-Click Game Catalog.

== Description ==

**PointNet Games** turns your WordPress site into a complete arcade game platform. It provides a lightweight gaming engine with highscores, leaderboards, user arcade records and a **1-Click Game Catalog** to install free games (such as Minesweeper and Mahjong Arcade) directly to your server.

Games run in HTML5, WebAssembly or Canvas inside an isolated sandbox iframe. Scores are safely saved to the leaderboard for registered users (using their WordPress username), while casual visitors can play freely.

= Key Features =

* ✅ **1-Click Game Catalog** — browse, install and update free arcade games with a single tap from the admin dashboard
* ✅ **Zero-Bloat Core** — ultra-lightweight plugin (<150 KB); install only the games your audience actually plays
* ✅ **Safe Uploads Storage** — installed games live safely in `wp-content/uploads/pointnet-games/` and are never wiped when WordPress updates the plugin
* ✅ **Score system** — highscores and progression saved for registered users
* ✅ **Leaderboards** — per-game, difficulty-specific and global multi-game rankings
* ✅ **User Profiles & Author Pages** — personal arcade records and KPI stats cards automatically embedded on author pages (/author/...) and via shortcode
* ✅ **REST API & JS API** — standardized `pointnetGamesAPI` bridge for HTML5, WebAssembly, Godot or Unity web exports
* ✅ **Shortcodes** — `[pointnet_game]`, `[pointnet_game_leaderboard]`, `[pointnet_games_leaderboard]`, `[pointnet_games_list]`, `[pointnet_user_records]`
* ✅ **Anti-cheat** — nonces, rate limiting, session tokens, score bounds validation, IP hashing
* ✅ **Security** — output escaping, input sanitization, capability checks, prepared SQL statements
* ✅ **Immersive fullscreen CSS & Mobile Touch** — responsive touch controls and auto-fullscreen

= Security =

PointNet Games strictly follows official WordPress security and plugin guidelines:

* **No server-executable code downloaded** — games are pure client-side HTML5/WASM/JS served in sandboxed iframes
* **Output escaping** — every output is sanitized with `esc_html()`, `esc_attr()`, `esc_url()`, `esc_attr_e()`
* **Input sanitization** — all inputs pass through `sanitize_*()`, `absint()`, `sanitize_text_field()`
* **Nonces** — every write action is protected by a WordPress nonce
* **Capability checks** — admin operations require `manage_options`
* **SQL injection** — all queries use `$wpdb->prepare()` with typed placeholders
* **CSRF** — full protection on admin forms and REST endpoints
* **Privacy** — IPs are stored as SHA-256 hashes, never in plain text

= Featured Free Games (Available via Catalog) =

* **Minesweeper** — Classic mode with 4 presets (Easy, Medium, Hard, Extreme) and progressive Scalata mode spanning 18 levels. Features hardware-accelerated Pan & Pinch-to-zoom engine, smart chording, organic tactile audio, and high-contrast OLED legibility.
* **Mahjong Arcade** — 330 progressive levels with dual Arcade & Classic Challenge modes, 144-tile deck with flower and season wildcards, dynamic Conveyor Ring stages, Shield Wards, standalone PointNetMusicPlayer Jukebox, and 100% guaranteed solvability.

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

= Do players need an account to save scores? =

Yes. Anyone can play in guest/casual mode, but players must be registered and logged in to record their scores and climb the global leaderboards.

= How are scores protected from cheating? =

The plugin uses WordPress nonces, IP rate limiting, IP hashing and optional manual validation.

= Can I develop my own game? =

Absolutely! Full developer documentation is in `docs/developer-guide.md`. Each game is a folder with `manifest.json` + `index.html` that uses the global `pointnetGamesAPI` object.

= How does Minesweeper scoring work? =

Minesweeper features two distinct scoring mechanics:
1. **Classic Mode** (Speedrun): Players choose among Easy, Medium, Hard, and Extreme. Score = Base Points + Completion Speed Bonus. Faster clears earn higher scores.
2. **Scalata Mode** (18 Progressive Levels): Cumulative score across all 18 levels. Completing a level adds points and time bonus with progressive multipliers. Scores are submitted instantly to the leaderboard upon each completed level.

= How do personal arcade records work on author pages? =

The plugin automatically embeds a modern arcade statistics showcase (KPI pills, game cards, personal ranks, best scores, mode badges) directly on WordPress author pages (`/author/username`). It provides universal compatibility out-of-the-box with popular themes including GeneratePress, Astra, Kadence, OceanWP, Genesis and classic themes. You can easily toggle this feature in **PointNet Games → Impostazioni** or embed records on any post or page with the `[pointnet_user_records]` shortcode.

= Can player names in leaderboards link to user profile pages? =

Yes! By default, player nicknames are displayed as static plain text for privacy and GDPR safety. Administrators can optionally enable "Link Player Profiles" in **PointNet Games → Impostazioni**. When enabled, links to player author profiles (`/author/username`) are rendered exclusively for logged-in registered users, while anonymous visitors and search engines always see plain text.

= What shortcodes are available? =

* `[pointnet_game slug="game-slug"]` — Embeds the game with iframe, splash screen, and drawer.
* `[pointnet_game_leaderboard slug="game-slug" difficulty="easy" limit="10"]` — Leaderboard for a specific game or mode, with automatic tabbed navigation.
* `[pointnet_games_leaderboard limit="20"]` — Global multi-game leaderboard across all games.
* `[pointnet_games_list columns="3"]` — Responsive grid displaying all installed games.
* `[pointnet_user_records user_id="" columns="2"]` — Personal arcade records and statistics showcase.

== Roadmap ==

* 🎯 **Additional Arcade Games** — classic favorites (Snake Arcade, Block Puzzle, Solitaire Klondike).
* 🎯 **Player Achievements & Badges** — unlockable achievements ("Speedrunner", "Minesweeper Master", "Shield Breaker").
* 🎯 **Timeframe Leaderboard Filters** — All-Time, Monthly, and Weekly highscore views.
* 🎯 **Discord & Webhook Notifications** — optional automated notifications when highscores are beaten.

== Screenshots ==

1. PointNet Games dashboard with statistics and installed games
2. Minesweeper Arcade page with leaderboard
3. Author profile page with personal arcade records and KPI stats
4. Settings panel

== Changelog ==

= 1.6.3 =
* Feature & Settings: added "Player Login & Registration Redirect" setting in PointNet Games → Settings, allowing administrators to configure where players (subscribers) land after logging in or registering (defaults to website home page).
* Security: administrators retain default unrestricted access to /wp-admin/.

= 1.6.2 =
* UX & Registration: always render both "Log In" and "Register" action buttons for anonymous guests, with fallback to registration URL.

= 1.6.1 =
* UX & Registration: added dynamic "Register" action button alongside "Log In" in the guest/anonymous arcade records prompt (respecting WordPress `users_can_register` setting).
* Navigation: preserved redirect destination URL (`redirect_to`) upon login so users land right back on the game page.

= 1.6.0 =
* Major Milestone (Phase 1 Gamification): introduces Player Achievements & Badges system (`includes/class-achievements.php`) with 6 distinct milestone badges saved safely to `wp_usermeta`.
* Achievements Showcase: rendered directly on author profile pages and `[pointnet_user_records]` with golden status badges and unlocked timestamps.
* Periodic Leaderboards: added timeframe filters (`period="all"`, `period="month"`, `period="week"`) across REST API routes and `[pointnet_game_leaderboard]` shortcode.
* Real-Time Celebrations: added instant celebration banner toasts upon score submission when beating personal records, reaching Top 3 or unlocking new badges.

= 1.5.1 =
* Documentation & Architecture: stabilized developer guidelines, updated roadmap, added reference architecture for Player Achievements and Periodic Leaderboards (Phase 1).
* Maintenance: tagged clean baseline release prior to Phase 1 gamification engine implementation.

= 1.5.0 =
* UI & Layout: repositioned the "Improve / Challenge" button to the bottom footer of game cards with a 100% full-width block layout (`.pointnet-games-btn-play-full`).
* Visual Hierarchy: polished record list elements and game card footer styling across all screen sizes.

= 1.4.9 =
* UI & Metadata: eliminated redundant duplicate meta items (`Level/Livello`, `Time/Tempo`) across leaderboards and profile cards.
* Clean Output: suppressed redundant outcome text on progressive games (`Level: 5 / 18` instead of duplicating `Outcome: Livello 5`).
* Responsive Layout: fixed horizontal container overflow on narrow sidebar layouts via dynamic minmax clamping (`minmax(min(100%, 320px), 1fr)`).

= 1.4.8 =
* Catalog Engine: added manual force-refresh support (`&refresh=1`) and restored the "Check Updates" button on the Game Catalog screen to clear GitHub release caches immediately.

= 1.4.7 =
* Catalog Automation: automated game catalog synchronization on admin page load with a 10-minute rate-limited transient cache.

= 1.4.6 =
* Code Standards: replaced PHP native `unlink()` and `rmdir()` with `wp_delete_file()` and WordPress VIP / WPCS compliant `WP_Filesystem` methods in catalog installation and uninstallation flows.

= 1.4.5 =
* Admin Experience: consolidated installed games under the unified "PointNet Games" admin menu.
* Workflow: redirected manual empty game post creation (`Add New Game`) to the 1-Click Game Catalog.
* Management: added a 1-click ✏️ "Edit" button on installed games table for metadata and SEO customization.

= 1.4.4 =
* Internationalization (i18n): standardized 100% of codebase strings in standard American English with proper gettext domain `pointnet-games`.
* Localization: loaded textdomain via `load_plugin_textdomain` and updated full Italian (`it_IT`) PO and MO translations.

= 1.4.3 =
* Leaderboard Shortcode: added `slug` attribute support to `[pointnet_game_leaderboard slug="..."]` for friendly game resolution.
* Leaderboard Details: formatted levels (e.g. `Livello: 5 / 18`) and times (`mm:ss`) cleanly in table metadata.
* Catalog Security Scoping: scoped executable security scans strictly to the extracted game directory, preventing false positives from repository root development scripts.
* API Metadata Whitelist: expanded allowed game metadata to accept `livello`, `level`, `tempo`, `time`, and `esito`.

= 1.4.2 =
* Catalog Engine: enhanced GitHub Release synchronization and game extraction handling for external catalog repositories.
* Maintenance: documentation updates and catalog compatibility verification.

= 1.4.1 =
* Release-Only Discovery: catalog now filters games strictly by published official GitHub Releases (drafts and untagged commits are safely ignored).
* Zero Manual Zip: games are downloaded and extracted automatically on the fly from official GitHub tag archives.
* Modular Architecture: catalog repository decoupled to dedicated `pointnet-games-catalog` with subfolder game extraction.
* Data Protection Options: added granular controls in admin settings to choose whether to purge scores or uploaded games on uninstall.

= 1.4.0 =
* 1-Click Game Catalog: added built-in Game Store in admin to browse, install and update free arcade games directly from GitHub releases.
* Zero-Bloat Core: removed bundled games from plugin folder, reducing plugin size to under 150 KB for instant WordPress.org review and fast downloads.
* Safe Uploads Storage: games installed from the catalog are stored in `wp-content/uploads/pointnet-games/` and are never wiped when WordPress updates the plugin.
* GitHub Release Auto-Sync: automatically detects newly published game releases and tags on GitHub (e.g. `minesweeper-arcade-v1.3.5`) and notifies administrators with 1-click update buttons.
* First-Time Onboarding: friendly welcome banner on dashboard when no games are installed with 1-click installation for Minesweeper.
* Data Protection Best Practices: added configurable "Disinstallazione & Pulizia Dati" settings to protect highscores and downloaded games during accidental plugin uninstalls.
* Community Support: integrated Ko-fi supporter box and official `Donate link` header.

= 1.3.12 =
* Compatibility: aligned "Tested up to" to 7.1 to strictly follow WordPress.org major.minor validation standards (resolving invalid_tested_upto_minor).
* Auto-Updater: integrated native automatic changelog extraction and HTML formatting directly from readme.txt for update details modals.

= 1.3.11 =
* Compatibility: dynamically match active WordPress version in the auto-updater payload and set "Tested up to" to 7.1 to follow WordPress.org major.minor standard.
* Requirements: set "Requires at least" to WordPress 6.2+.

= 1.3.10 =
* Security & Output Escaping: enforced `wp_kses_post` on automatic author records injection in Game Loader, satisfying Plugin Check security rules.
* Client-Side Hardening: replaced DOM `innerHTML` with `textContent` for the fullscreen toggle button icon, eliminating DOM XSS vectors.
* i18n & Translators Comments: placed translator placeholder notes immediately adjacent to translation functions in admin tables.
* Input Sanitization: strictly sanitized core update recheck query parameters in GitHub updater with `sanitize_key(wp_unslash())`.
* Code Quality: removed error-suppression operator `@` across filesystem timestamp scans in favor of explicit `file_exists` validations.
* Codebase Standards: cleared arbitrary phpcs annotation suppressions for full auditability.

= 1.3.9 =
* Privacy & Security: leaderboards and user cards now use WordPress `display_name` instead of revealing private `user_login` credentials.
* Player Disambiguation: automatic sequential duplicate numbering (`#2`, `#3`...) for players sharing the exact same display name, safely detached from database user IDs.
* Event-Driven Performance: player arcade names are pre-calculated and cached on `user_register` and `profile_update` hooks, ensuring zero database load on leaderboard pageviews.
* Settings: added optional "Link Player Profiles" admin setting in PointNet Games → Impostazioni (disabled by default for privacy; active only for authenticated users).
* Admin Security: added warning notice in settings panel explaining WordPress username disclosure and brute-force mitigation best practices.
* Code Quality: added translator comments for i18n placeholders and switched updater assets to local relative icons.

= 1.3.8 =
* Auto-Updater: added official Update URI plugin header.
* Auto-Updater: enhanced GitHub API tags pagination (?per_page=100) to ensure newly pushed tags are never truncated.
* Auto-Updater: hooked pre_set_site_transient_update_plugins with automatic force-refresh during WordPress update checks.
* Author Page & User Profiles: universal theme compatibility (GeneratePress, Astra, Kadence, OceanWP, Genesis and standard WordPress themes) preserving avatar, username and bio.
* Author Page: injected records span 100% full width of the main content column cleanly outside theme page-header.

= 1.3.7 =
* Author Page & User Profiles: universal theme compatibility (GeneratePress, Astra, Kadence, OceanWP, Genesis and standard WordPress themes).
* Author Page: preserved theme author header (avatar, username and bio remain untouched at the top of the page).
* Author Page: injected records now span 100% full width of the main content column, completely outside the theme page-header.
* Author Page: enhanced layout with responsive grid, pill white-space protection and strict single-render static guard.

= 1.3.6 =
* Auto-Updater: immediate cache invalidation on "Controlla di nuovo" in WordPress admin (detects `do-core-recheck` and deletes stale transient).
* Auto-Updater: hooked `site_transient_update_plugins` filter so update notices and badges appear dynamically across WordPress admin.
* Auto-Updater: reduced GitHub API cache TTL to 2 hours for faster detection of newly published tags and releases.

= 1.3.5 =
* Author Page & User Profiles: added personal arcade records and statistics cards for registered users. Automatically injected between the author header and post loop on author pages (/author/...), with full GeneratePress support and universal theme fallback.
* Shortcode: added [pointnet_user_records] to display personal gaming records anywhere with modern KPI stat pills, game cards, mode badges, ranks, and speedrun/arcade details.
* Settings: added toggle in PointNet Games Settings to easily enable/disable author page arcade records injection.

= 1.3.4 =
* Branding & Admin: added custom arcade controller icon (SVG, 256x256 and 128x128 PNG) for WordPress updates and plugin information screens, eliminating the default plug placeholder icon.

= 1.3.3 =
* Leaderboard: comprehensive "All" overview displaying a player's best score across every played mode/difficulty without Scalata eclipsing Classic mode scores.
* Leaderboard: dedicated "Mode" column and styling badge in multi-difficulty views and global rankings.
* Leaderboard: dynamic tabs support in [pointnet_game_leaderboard] — automatically generates tabbed navigation when a game defines 2 or more difficulties in manifest.json, avoiding redundant tabs for single-mode games.
* Leaderboard: default show_meta enabled out-of-the-box to display score details (time, level, outcome) seamlessly.
* Responsive: horizontal scrolling support on mobile devices for multi-column leaderboards.

= 1.3.2 =
* Minesweeper: enhanced tile micro-contrast and edge definition for high-ambient OLED smartphone outdoor legibility without compromising dark theme aesthetics.

= 1.3.1 =
* Leaderboard: fixed global multi-game leaderboard query to isolate best score per game per player so all installed games appear simultaneously.
* Minesweeper: instant leaderboard submission on every completed level in Scalata mode (starting from Level 1).
* Anti-cheat: tuned minimum plausibility duration to prevent rejecting rapid mobile taps on small boards.
* Shortcode: added [pointnet_games_leaderboard] plural alias with automatic global=1 default.

= 1.3.0 =
* GitHub Release Auto-Updater: integrated native GitHub releases updater for direct 1-click plugin updates and dashboard notifications within WordPress admin.
* Minesweeper v1.3.0: Dual modes (Classic mode with Easy, Medium, Hard, and Extreme 32x18 presets from The Clean One, and 18-level progressive Scalata mode), dedicated per-difficulty scoring & speedrun time-attack conversion, hardware-accelerated Pan & Pinch-to-zoom engine for mobile and desktop, multi-difficulty leaderboards (arcade, easy, medium, hard, extreme) with formatted metadata (time, level, outcome) and difficulty-aware player rank feedback, organic acoustic sound design, smart chording, and dual-mode pill toggle.
* Mahjong Arcade v1.7.0: Shield Wards mechanic on levels ending in 7, scalable conveyor variants, and Synco Mashup audio track.
* Security & Reliability: throttled session generation, post existence guards on REST routes, GMT/UTC timestamp standardization, and score boundary limits.

= 1.2.6 =
* Security hardening: strict unified `permission_callback` verifying authentication and REST nonce on all protected endpoints.
* Anti-cheat enforcement: server-side validation against `max_score` declared in manifest, one-time anti-cheat game session tokens, and minimum game duration plausibility check.
* Iframe isolation & postMessage security: added `sandbox="allow-scripts allow-same-origin"` to game iframe, strict origin verification (`event.origin === window.location.origin`), and replaced wildcard targetOrigin `'*'` with explicit origin.
* Robust data sanitization: strictly scalar metadata sanitization avoiding PHP 8 TypeError DoS, DOM XSS prevention in leaderboard drawer, and hybrid user-ID/IP rate limiting.
* Privacy: eliminated nonce leakage from iframe query string parameters.

= 1.2.5 =
* Enforce registered and logged-in users only for leaderboard highscores and progress persistence
* Updated WordPress minimum requirements: Requires at least 7.0, Tested up to 7.1, Requires PHP 8.0+
* Mahjong Arcade updated to v1.2.5: dual Arcade & Classic modes, 330 progressive levels, 144-tile deck with Flower/Season wildcards, PointNetMusicPlayer standalone Jukebox, Web Audio organic Zen SFX
* PointNetMusicPlayer reusable standalone audio component for background music and playlists

= 0.1.9 =
* Mahjong Arcade updated to v0.9.5 - precomputed solvability (no runtime DFS), reduced staging box (3->2->1) for more strategy, compact mobile UI (action drawer, bigger staging slots)
* Mahjong Arcade engine refinements: offset-stack rendering fixes, zero duplicate tile coordinates, HALF-heavy blackout levels from level 101
* Mahjong Arcade comments translated to English for consistency

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

= 1.6.1 =
Recommended update: adds "Register" action button alongside "Log In" for anonymous visitors and preserves return URL on login.

= 1.6.0 =
Major Phase 1 release: introduces Player Achievements & Badges, Periodic Leaderboard filters (week/month/all-time) and real-time Personal Best celebrations.

= 1.5.1 =
Recommended baseline update: updates developer guides, architecture specifications and documentation prior to Phase 1 gamification release.

= 1.5.0 =
Recommended update: repositions the Improve / Challenge button to the bottom footer of game cards with a full-width block layout, and polishes record list hierarchy.

= 1.4.9 =
Recommended update: cleans metadata deduplication across leaderboards and profile cards, removes redundant outcome repetition on levels, and optimizes responsive layout to prevent horizontal overflow in narrow sidebars.

= 1.4.8 =
Recommended update: supports force-refresh parameter (&refresh=1) and adds dedicated Check Updates action to instantly clear GitHub catalog cache when new game releases are published.

= 1.4.7 =
Recommended update: automates Game Catalog synchronization on page load with an intelligent 10-minute rate-limited transient cache, removing the need for manual check buttons.

= 1.4.6 =
Recommended update: complies with WordPress VIP / WPCS standards by replacing direct unlink() and rmdir() PHP calls with wp_delete_file() and WP_Filesystem methods in the Game Catalog installer.

= 1.4.5 =
Recommended update: streamlines admin UX by nesting installed games under the PointNet Games menu, disallows manual empty post creation via Add New (redirects to Catalog), and adds a 1-click Edit button on installed games for SEO and media customization.

= 1.4.4 =
Recommended update: complete internationalization (i18n) standardization with English source strings, loads textdomain for custom translations, and includes 100% updated Italian (it_IT) translations.

= 1.4.3 =
Recommended update: fixes catalog security scoping for game zip archives, formats level/time details in leaderboards, and supports the slug attribute in leaderboard shortcodes.

= 1.4.2 =
Recommended update: incorporates enhanced GitHub Release synchronization and game extraction handling for the external catalog.

= 1.4.1 =
Recommended update: connects to official GitHub Releases for games catalog, introduces zero-manual-zip extraction and provides granular uninstall data protection options.

= 1.4.0 =
Major Architecture Update: introduces the 1-Click Game Catalog, zero-bloat lightweight core (<150 KB), safe uploads storage and configurable data protection.

= 1.3.11 =
Recommended update: eliminates the false-positive "This plugin has not been tested with your current version of WordPress" warning.

= 1.3.10 =
Recommended security & quality update: enforces output escaping on user records, hardens client-side DOM manipulation, cleans filesystem scanning operators, and aligns translation placeholder notes.

= 1.3.9 =
Recommended update: enhances player privacy by adopting WordPress display names with sequential duplicate resolution, adds optional author profile linking for logged-in users, and introduces performance caching on profile hooks.

= 1.3.8 =
Recommended update: adds standard Update URI header, tag pagination (up to 100 tags) and automatic force-refresh during WordPress update checks for seamless 1-click updates.

= 1.3.7 =
Recommended update: adds universal theme compatibility for personal arcade records on user profile pages (/author/...), preserving theme header and layout.

= 1.3.6 =
Enhances auto-updater with instant cache invalidation on core recheck and dynamic badge updates.

= 1.3.5 =
Adds personal arcade records cards and statistics pills to author profile pages and introduces the [pointnet_user_records] shortcode.

= 1.3.0 =
Major update: adds dual-mode Minesweeper (The Clean One Classic presets + 18-level Scalata with Pan & Zoom), Mahjong Conveyor stages, multi-difficulty leaderboards, and native GitHub auto-updater.

= 1.2.5 =
Requires WordPress 7.0+ and PHP 8.0+. Enforces registered users for score saving and leaderboards to eliminate anonymous clutter.

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