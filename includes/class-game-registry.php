<?php
/**
 * Auto-register games from the /games directory.
 *
 * Scans the plugin's games/ folder, reads each manifest.json and
 * creates or updates the corresponding pointnet_game custom post.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Game_Registry
 */
class PointNet_Games_Game_Registry {

	/**
	 * Scan the games directory and sync all found games as CPT posts.
	 *
	 * @return int Number of games processed.
	 */
	public static function sync_all_games() {
		// Guard: ensure the post type class is loaded.
		if ( ! class_exists( 'PointNet_Games_Post_Types' ) ) {
			return 0;
		}

		// Guard: only sync when the game folder manifest changed.
		$fingerprint = self::get_games_fingerprint();
		$last_sync   = get_option( 'pointnet_games_sync_fingerprint', '' );

		if ( $last_sync === $fingerprint ) {
			return 0;
		}

		self::ensure_post_type();

		$games_dir = POINTNET_GAMES_PLUGIN_DIR . 'games/*/manifest.json';
		$manifests = (array) glob( $games_dir );

		if ( empty( $manifests ) ) {
			// All games removed — clean up orphaned posts too.
			self::cleanup_removed_games();
			update_option( 'pointnet_games_sync_fingerprint', $fingerprint );
			return 0;
		}

		$processed = 0;

		$games_root = trailingslashit( POINTNET_GAMES_PLUGIN_DIR ) . 'games';

		foreach ( $manifests as $manifest_path ) {
			// Guard: ensure file is readable and inside the games directory.
			if ( ! is_file( $manifest_path ) || ! is_readable( $manifest_path ) ) {
				continue;
			}

			// Path traversal protection: the manifest must be inside games/.
			$real_path = realpath( $manifest_path );
			$real_root = realpath( $games_root );
			if ( false === $real_path || false === $real_root || strpos( $real_path, $real_root ) !== 0 ) {
				continue;
			}

			$raw = file_get_contents( $manifest_path );
			if ( false === $raw ) {
				continue;
			}

			$manifest = json_decode( $raw, true );

			if ( ! is_array( $manifest ) || empty( $manifest['slug'] ) || empty( $manifest['name'] ) ) {
				continue;
			}

			self::sync_game( $manifest, $manifest_path );
			$processed++;
		}

		// Remove any game posts whose games/ folder no longer exists
		// (e.g. a bundled game deleted from the plugin).
		self::cleanup_removed_games();

		// Remember that we synced — avoids running again until a manifest changes.
		update_option( 'pointnet_games_sync_fingerprint', $fingerprint );

		return $processed;
	}

	/**
	 * Delete game CPT posts whose games/{slug}/ directory is no longer present.
	 * Also removes their scores from the leaderboard table.
	 *
	 * @return int Number of posts removed.
	 */
	private static function cleanup_removed_games() {
		$posts = get_posts(
			array(
				'post_type'      => PointNet_Games_Post_Types::GAME_CPT,
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'numberposts'    => -1,
			)
		);

		if ( empty( $posts ) ) {
			return 0;
		}

		$removed    = 0;
		$games_root = trailingslashit( POINTNET_GAMES_PLUGIN_DIR ) . 'games';

		foreach ( $posts as $post ) {
			$relative_dir = get_post_meta( $post->ID, '_pointnet_games_dir', true );

			// Build the absolute path to the game directory.
			if ( ! empty( $relative_dir ) ) {
				$game_dir_abs = realpath( POINTNET_GAMES_PLUGIN_DIR . $relative_dir );
			} else {
				// Fallback: use the slug meta.
				$slug         = get_post_meta( $post->ID, '_pointnet_games_slug', true );
				$game_dir_abs = $slug ? realpath( $games_root . '/' . $slug ) : false;
			}

			// If the folder is missing, remove the post and its scores.
			if ( false === $game_dir_abs || ! is_dir( $game_dir_abs ) ) {
				global $wpdb;
				$wpdb->delete( pointnet_games_scores_table(), array( 'game_id' => $post->ID ), array( '%d' ) );
				wp_delete_post( $post->ID, true );
				$removed++;
			}
		}

		return $removed;
	}

	/**
	 * Build a fingerprint of all manifests to detect changes.
	 *
	 * @return string
	 */
	private static function get_games_fingerprint() {
		$games_dir = POINTNET_GAMES_PLUGIN_DIR . 'games/*/manifest.json';
		$manifests = (array) glob( $games_dir );

		if ( empty( $manifests ) ) {
			return 'none';
		}

		$hash_parts = array();

		foreach ( $manifests as $manifest_path ) {
			$hash_parts[] = basename( dirname( $manifest_path ) ) . ':' . ( is_file( $manifest_path ) ? (string) @filemtime( $manifest_path ) : '' );
		}

		sort( $hash_parts );

		// Include a sync version so that code changes (new features)
		// trigger a re-sync even when manifests are unchanged.
		return md5( 'v3:' . implode( '|', $hash_parts ) );
	}

	/**
	 * Make sure the post type exists before inserting posts.
	 */
	private static function ensure_post_type() {
		if ( ! post_type_exists( PointNet_Games_Post_Types::GAME_CPT ) ) {
			$post_types = new PointNet_Games_Post_Types();
			$post_types->register_game_cpt();
		}
	}

	/**
	 * Create or update a single game post from its manifest.
	 *
	 * @param array  $manifest      Manifest data.
	 * @param string $manifest_path Absolute path to the manifest file.
	 */
	private static function sync_game( $manifest, $manifest_path ) {
		$slug = sanitize_title( $manifest['slug'] );

		// Slug must be a valid game folder name.
		if ( empty( $slug ) || preg_match( '/[^a-z0-9\-_]/', $slug ) ) {
			return;
		}

		// Look up existing game by our custom slug meta (reliable).
		$existing = get_posts(
			array(
				'post_type'      => PointNet_Games_Post_Types::GAME_CPT,
				'post_status'    => 'any',
				'posts_per_page' => 1,
				'meta_key'       => '_pointnet_games_slug',
				'meta_value'     => $slug,
			)
		);

		$post_id = $existing ? $existing[0]->ID : 0;

		$description = isset( $manifest['description'] ) ? $manifest['description'] : '';
		$instructions = isset( $manifest['instructions'] ) ? $manifest['instructions'] : '';
		$version     = isset( $manifest['version'] ) ? $manifest['version'] : '1.0.0';

		$postarr = array(
			'post_type'    => PointNet_Games_Post_Types::GAME_CPT,
			'post_status'  => 'publish',
			'post_title'   => $manifest['name'],
			'post_name'    => $slug,
			'post_excerpt' => $description,
			'post_content' => $instructions,
		);

		if ( $post_id ) {
			$postarr['ID'] = $post_id;
		}

		$new_id = wp_insert_post( $postarr, true );

		if ( is_wp_error( $new_id ) ) {
			return;
		}

		// Store the relative games/ subfolder, safe for URL building.
		$game_dir     = dirname( $manifest_path );
		$relative_dir = str_replace(
			trailingslashit( POINTNET_GAMES_PLUGIN_DIR ),
			'',
			trailingslashit( $game_dir )
		);

		update_post_meta( $new_id, '_pointnet_games_slug', $slug );
		update_post_meta( $new_id, '_pointnet_games_dir', $relative_dir );
		update_post_meta( $new_id, '_pointnet_games_version', $version );
		update_post_meta( $new_id, '_pointnet_games_manifest', $manifest );

		// Clean up any auto-generated pages from older plugin versions.
		// The canonical URL for a game is now the CPT permalink only.
		self::cleanup_legacy_pages( $new_id );
	}

	/**
	 * Delete any legacy auto-generated "page" posts that were created by
	 * PointNet Games v0.1.0-beta (ensure_game_page). These pages were the source
	 * of duplicate URLs like /minesweeper-arcade/ vs /games/minesweeper-arcade/.
	 *
	 * @param int $game_id The pointnet_game post ID.
	 */
	private static function cleanup_legacy_pages( $game_id ) {
		$pages = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'numberposts'    => -1,
				'meta_key'       => '_pointnet_games_game_id',
				'meta_value'     => $game_id,
			)
		);

		if ( empty( $pages ) ) {
			return;
		}

		foreach ( $pages as $page ) {
			wp_delete_post( $page->ID, true );
		}
	}

}
