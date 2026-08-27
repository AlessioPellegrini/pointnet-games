<?php
/**
 * Plugin Name:       PointNet Games
 * Plugin URI:        https://wpgames.pointnet.it/
 * Description:       Arcade games platform for WordPress with scores for registered and anonymous users, leaderboards and a standardized API for game developers.
 * Version:           1.2.5
 * Author:            PointNet
 * Author URI:        https://www.pointnet.it/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       pointnet-games
 * Domain Path:       /languages
 * Requires at least: 7.0
 * Tested up to:      7.1
 * Requires PHP:      7.4
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin version.
define( 'POINTNET_GAMES_VERSION', '1.2.5' );

// Plugin paths.
define( 'POINTNET_GAMES_PLUGIN_FILE', __FILE__ );
define( 'POINTNET_GAMES_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'POINTNET_GAMES_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'POINTNET_GAMES_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Rest API namespace.
define( 'POINTNET_GAMES_REST_NAMESPACE', 'pointnet-games/v1' );

// Include required classes.
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-install.php';
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-post-types.php';
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-game-registry.php';
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-leaderboard.php';
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-api.php';
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-game-loader.php';
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-shortcodes.php';
require_once POINTNET_GAMES_PLUGIN_DIR . 'includes/class-admin.php';

// Register activation / deactivation hooks.
register_activation_hook( __FILE__, array( 'PointNet_Games_Install', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'PointNet_Games_Install', 'deactivate' ) );

/**
 * Initialize the plugin components.
 */
function pointnet_games_init() {
	// Post types and taxonomies.
	new PointNet_Games_Post_Types();

	// Register REST API routes.
	add_action( 'rest_api_init', array( new PointNet_Games_API(), 'register_routes' ) );

	// Shortcodes.
	new PointNet_Games_Shortcodes();

	// Frontend loader.
	new PointNet_Games_Game_Loader();

	// Admin UI (only in admin context).
	if ( is_admin() ) {
		new PointNet_Games_Admin();
	}
}
add_action( 'plugins_loaded', 'pointnet_games_init' );

/**
 * Scan the games/ directory and sync new/updated games into the database.
 *
 * Runs automatically on plugin load so newly added games appear as posts.
 * The registry uses a manifest fingerprint so this is cheap when
 * nothing changed. When new games are found, rewrite rules are
 * flushed so their permalinks resolve.
 */
function pointnet_games_sync_bundled_games() {
	// WP CLI / cron manual sync.
	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		$processed = PointNet_Games_Game_Registry::sync_all_games();
		if ( $processed > 0 ) {
			flush_rewrite_rules();
		}
		return;
	}

	if ( ! class_exists( 'PointNet_Games_Game_Registry' ) ) {
		return;
	}

	// Only run once per request.
	if ( defined( 'POINTNET_GAMES_SYNC_DONE' ) ) {
		return;
	}
	define( 'POINTNET_GAMES_SYNC_DONE', true );

	$processed = PointNet_Games_Game_Registry::sync_all_games();

	// If new games were registered, regenerate rewrite rules so
	// their permalinks actually resolve.
	if ( $processed > 0 ) {
		flush_rewrite_rules();
	}
}
add_action( 'init', 'pointnet_games_sync_bundled_games', 90 );
add_action( 'admin_init', 'pointnet_games_sync_bundled_games', 90 );

/**
 * Enqueue frontend assets.
 */
function pointnet_games_enqueue_public_assets() {
	$css_file = POINTNET_GAMES_PLUGIN_DIR . 'assets/css/pointnet-games-public.css';
	$css_ver  = file_exists( $css_file ) ? (string) filemtime( $css_file ) : POINTNET_GAMES_VERSION;

	$js_file  = POINTNET_GAMES_PLUGIN_DIR . 'assets/js/pointnet-games-embed.js';
	$js_ver   = file_exists( $js_file ) ? (string) filemtime( $js_file ) : POINTNET_GAMES_VERSION;

	$api_file = POINTNET_GAMES_PLUGIN_DIR . 'assets/js/pointnet-games-api.js';
	$api_ver  = file_exists( $api_file ) ? (string) filemtime( $api_file ) : POINTNET_GAMES_VERSION;

	wp_register_style(
		'pointnet-games-public',
		POINTNET_GAMES_PLUGIN_URL . 'assets/css/pointnet-games-public.css',
		array(),
		$css_ver
	);

	wp_register_script(
		'pointnet-games-api',
		POINTNET_GAMES_PLUGIN_URL . 'assets/js/pointnet-games-api.js',
		array(),
		$api_ver,
		true
	);

	wp_register_script(
		'pointnet-games-embed',
		POINTNET_GAMES_PLUGIN_URL . 'assets/js/pointnet-games-embed.js',
		array( 'pointnet-games-api' ),
		$js_ver,
		true
	);

	// Localize API config for the frontend bridge.
	wp_localize_script(
		'pointnet-games-api',
		'POINTNET_GAMES_CONFIG',
		array(
			'rest_url'     => esc_url_raw( rest_url( POINTNET_GAMES_REST_NAMESPACE ) ),
			'nonce'        => wp_create_nonce( 'wp_rest' ),
			'is_logged_in' => is_user_logged_in(),
			'nickname'     => pointnet_games_current_nickname(),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'pointnet_games_enqueue_public_assets' );

/**
 * Get the display nickname for the current visitor.
 *
 * @return string
 */
function pointnet_games_current_nickname() {
	if ( is_user_logged_in() ) {
		$user = wp_get_current_user();
		return $user->user_login;
	}

	return '';
}

/**
 * Helper to get full custom table name.
 *
 * @return string
 */
function pointnet_games_scores_table() {
	global $wpdb;
	return $wpdb->prefix . 'pointnet_game_scores';
}

/**
 * Add a "Settings" link to the plugin's row on the Plugins admin page.
 *
 * @param array $links Existing action links.
 *
 * @return array
 */
function pointnet_games_plugin_action_links( $links ) {
	$settings_link = sprintf(
		'<a href="%s">%s</a>',
		esc_url( admin_url( 'admin.php?page=pointnet-games-settings' ) ),
		esc_html__( 'Settings', 'pointnet-games' )
	);

	array_unshift( $links, $settings_link );

	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'pointnet_games_plugin_action_links' );
