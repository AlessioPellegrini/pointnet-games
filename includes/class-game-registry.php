<?php
/**
 * Auto-register games from the uploads and plugin directories.
 *
 * Scans registered games folders (primary: wp-content/uploads/pointnet-games/),
 * reads each manifest.json and creates or updates the corresponding pointnet_game custom post.
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
	 * Get the primary directory path where installed games reside.
	 *
	 * @return string Absolute path with trailing slash.
	 */
	public static function get_installed_games_dir() {
		$upload_dir = wp_upload_dir();
		$games_dir  = trailingslashit( $upload_dir['basedir'] ) . 'pointnet-games/';

		if ( ! file_exists( $games_dir ) ) {
			wp_mkdir_p( $games_dir );
			// Add an empty index.php to prevent directory listing.
			$index_file = $games_dir . 'index.php';
			if ( ! file_exists( $index_file ) ) {
				file_put_contents( $index_file, '<?php // Silence is golden.' );
			}
		}

		return $games_dir;
	}

	/**
	 * Get all directories to scan for games.
	 *
	 * Allows custom add-on folders or developer directories via filter.
	 *
	 * @return array List of directory paths with trailing slashes.
	 */
	public static function get_scan_roots() {
		$roots = array(
			'uploads' => self::get_installed_games_dir(),
		);

		// Also check bundled games/ folder if it exists in plugin (backward compat).
		$plugin_games = trailingslashit( POINTNET_GAMES_PLUGIN_DIR ) . 'games/';
		if ( is_dir( $plugin_games ) ) {
			$roots['bundled'] = $plugin_games;
		}

		/**
		 * Filter the root directories to scan for games.
		 *
		 * @param array $roots Associative array of root directories.
		 */
		return apply_filters( 'pointnet_games_scan_roots', $roots );
	}

	/**
	 * Scan the games directories and sync all found games as CPT posts.
	 *
	 * @param bool $force_sync When true, bypasses the fingerprint check.
	 * @return int Number of games processed.
	 */
	public static function sync_all_games( $force_sync = false ) {
		// Guard: ensure the post type class is loaded.
		if ( ! class_exists( 'PointNet_Games_Post_Types' ) ) {
			return 0;
		}

		// Guard: only sync when game manifests changed unless forced.
		$fingerprint = self::get_games_fingerprint();
		$last_sync   = get_option( 'pointnet_games_sync_fingerprint', '' );

		if ( ! $force_sync && $last_sync === $fingerprint ) {
			return 0;
		}

		self::ensure_post_type();

		$scan_roots = self::get_scan_roots();
		$manifests  = array();

		foreach ( $scan_roots as $source_key => $root_dir ) {
			if ( ! is_dir( $root_dir ) ) {
				continue;
			}
			$found = glob( trailingslashit( $root_dir ) . '*/manifest.json' );
			if ( ! empty( $found ) ) {
				foreach ( $found as $path ) {
					$manifests[ $path ] = $source_key;
				}
			}
		}

		if ( empty( $manifests ) ) {
			// All games removed — clean up orphaned posts too.
			self::cleanup_removed_games();
			update_option( 'pointnet_games_sync_fingerprint', $fingerprint );
			return 0;
		}

		$processed = 0;

		foreach ( $manifests as $manifest_path => $source_key ) {
			if ( ! is_file( $manifest_path ) || ! is_readable( $manifest_path ) ) {
				continue;
			}

			// Validate path containment inside its registered root.
			$real_path = realpath( $manifest_path );
			$root_dir  = $scan_roots[ $source_key ];
			$real_root = realpath( $root_dir );

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

			self::sync_game( $manifest, $manifest_path, $source_key );
			$processed++;
		}

		// Remove any game posts whose game folders no longer exist in any scanned root.
		self::cleanup_removed_games();

		// Remember that we synced.
		update_option( 'pointnet_games_sync_fingerprint', $fingerprint );

		return $processed;
	}

	/**
	 * Delete game CPT posts whose directory is no longer present.
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
		$scan_roots = self::get_scan_roots();

		foreach ( $posts as $post ) {
			$game_path_abs = get_post_meta( $post->ID, '_pointnet_games_abs_path', true );
			$exists        = false;

			if ( ! empty( $game_path_abs ) && is_dir( $game_path_abs ) && file_exists( trailingslashit( $game_path_abs ) . 'manifest.json' ) ) {
				$exists = true;
			} else {
				// Fallback verification across all scan roots using slug.
				$slug = get_post_meta( $post->ID, '_pointnet_games_slug', true );
				if ( ! empty( $slug ) ) {
					foreach ( $scan_roots as $root ) {
						$check_dir = trailingslashit( $root ) . $slug;
						if ( is_dir( $check_dir ) && file_exists( $check_dir . '/manifest.json' ) ) {
							$exists = true;
							// Update stored absolute path.
							update_post_meta( $post->ID, '_pointnet_games_abs_path', $check_dir );
							break;
						}
					}
				}
			}

			// If the folder is missing from all roots, remove the post and its scores.
			if ( ! $exists ) {
				global $wpdb;
				$wpdb->delete( pointnet_games_scores_table(), array( 'game_id' => $post->ID ), array( '%d' ) );
				wp_delete_post( $post->ID, true );
				$removed++;
			}
		}

		return $removed;
	}

	/**
	 * Build a fingerprint of all manifests across scan roots to detect changes.
	 *
	 * @return string
	 */
	private static function get_games_fingerprint() {
		$scan_roots = self::get_scan_roots();
		$hash_parts = array();

		foreach ( $scan_roots as $source_key => $root ) {
			if ( ! is_dir( $root ) ) {
				continue;
			}
			$manifests = (array) glob( trailingslashit( $root ) . '*/manifest.json' );
			foreach ( $manifests as $manifest_path ) {
				$mtime        = ( is_file( $manifest_path ) && file_exists( $manifest_path ) ) ? (string) filemtime( $manifest_path ) : '';
				$hash_parts[] = $source_key . ':' . basename( dirname( $manifest_path ) ) . ':' . $mtime;
			}
		}

		if ( empty( $hash_parts ) ) {
			return 'none';
		}

		sort( $hash_parts );

		return md5( 'v4-modular:' . implode( '|', $hash_parts ) );
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
	 * @param string $source_key    Source root key ('uploads' or 'bundled').
	 */
	private static function sync_game( $manifest, $manifest_path, $source_key ) {
		$slug = sanitize_title( $manifest['slug'] );

		// Slug must be a valid folder name.
		if ( empty( $slug ) || preg_match( '/[^a-z0-9\-_]/', $slug ) ) {
			return;
		}

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

		$description  = isset( $manifest['description'] ) ? $manifest['description'] : '';
		$instructions = isset( $manifest['instructions'] ) ? $manifest['instructions'] : '';
		$version      = isset( $manifest['version'] ) ? $manifest['version'] : '1.0.0';

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

		$game_dir_abs = trailingslashit( dirname( $manifest_path ) );

		update_post_meta( $new_id, '_pointnet_games_slug', $slug );
		update_post_meta( $new_id, '_pointnet_games_version', $version );
		update_post_meta( $new_id, '_pointnet_games_manifest', $manifest );
		update_post_meta( $new_id, '_pointnet_games_abs_path', $game_dir_abs );
		update_post_meta( $new_id, '_pointnet_games_source', $source_key );

		// Legacy cleanup.
		self::cleanup_legacy_pages( $new_id );
	}

	/**
	 * Delete any legacy auto-generated "page" posts.
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
