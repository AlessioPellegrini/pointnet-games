<?php
/**
 * Remote game catalog management, 1-click installer and GitHub Release auto-sync.
 *
 * Automatically inspects GitHub Releases and Tags (e.g. mahjong-v1.8.0, minesweeper-v1.3.5),
 * detects when new games or updates are published, and allows administrators to
 * install or update games with 1-click directly from GitHub assets.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Game_Catalog
 */
class PointNet_Games_Game_Catalog {

	/**
	 * Default GitHub repository for games catalog & releases.
	 */
	const GITHUB_REPO = 'AlessioPellegrini/pointnet-games';

	/**
	 * Transient key for caching the remote GitHub catalog.
	 */
	const TRANSIENT_KEY = 'pointnet_games_github_catalog';

	/**
	 * Cache TTL (1 hour).
	 */
	const CACHE_TTL = 3600;

	/**
	 * Register admin AJAX and action hooks.
	 */
	public function __construct() {
		add_action( 'wp_ajax_pointnet_games_install_game', array( $this, 'ajax_install_game' ) );
		add_action( 'wp_ajax_pointnet_games_uninstall_game', array( $this, 'ajax_uninstall_game' ) );
		add_action( 'wp_ajax_pointnet_games_refresh_catalog', array( $this, 'ajax_refresh_catalog' ) );
	}

	/**
	 * Get the GitHub repository slug (filterable).
	 *
	 * @return string
	 */
	public static function get_repo() {
		return apply_filters( 'pointnet_games_catalog_repo', self::GITHUB_REPO );
	}

	/**
	 * Fetch all available games by inspecting GitHub Releases and fallback manifest.
	 *
	 * Matches tags like:
	 *   - mahjong-v1.8.0 or mahjong-1.8.0
	 *   - minesweeper-arcade-v1.3.5
	 * Or releases containing asset zips like mahjong.zip or minesweeper-arcade.zip.
	 *
	 * @param bool $force_refresh Skip cache when true.
	 * @return array Array of game objects.
	 */
	public static function get_catalog( $force_refresh = false ) {
		if ( ! $force_refresh ) {
			$cached = get_transient( self::TRANSIENT_KEY );
			if ( false !== $cached && is_array( $cached ) ) {
				return $cached;
			}
		}

		$games = self::fetch_games_from_github();

		if ( empty( $games ) ) {
			$games = self::get_fallback_catalog();
		}

		set_transient( self::TRANSIENT_KEY, $games, self::CACHE_TTL );

		return $games;
	}

	/**
	 * Query GitHub Releases API to discover games and versions.
	 *
	 * @return array
	 */
	private static function fetch_games_from_github() {
		$repo       = self::get_repo();
		$api_url    = 'https://api.github.com/repos/' . $repo . '/releases';
		$user_agent = 'WordPress/' . get_bloginfo( 'version' ) . '; PointNetGames/' . POINTNET_GAMES_VERSION;

		$response = wp_remote_get(
			$api_url,
			array(
				'timeout'    => 12,
				'user-agent' => $user_agent,
				'headers'    => array( 'Accept' => 'application/vnd.github.v3+json' ),
			)
		);

		$games_by_slug = array();

		// Start with known starter definitions so descriptions and names are beautiful.
		$known = self::get_fallback_catalog();
		foreach ( $known as $k ) {
			$games_by_slug[ $k['slug'] ] = $k;
		}

		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$releases = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( is_array( $releases ) ) {
				foreach ( $releases as $rel ) {
					if ( ! empty( $rel['draft'] ) ) {
						continue;
					}

					$tag = $rel['tag_name'] ?? '';

					// Case 1: Tag formatted as {slug}-v{version} (e.g. mahjong-v1.8.0)
					if ( preg_match( '/^([a-z0-9\-_]+)-v?([0-9]+\.[0-9]+(?:\.[0-9]+)?.*)$/i', $tag, $m ) ) {
						$slug    = sanitize_title( $m[1] );
						$version = $m[2];

						// Find zip asset matching the slug.
						$download_url = '';
						if ( ! empty( $rel['assets'] ) && is_array( $rel['assets'] ) ) {
							foreach ( $rel['assets'] as $asset ) {
								if ( preg_match( '/' . preg_quote( $slug, '/' ) . '.*\.zip$/i', $asset['name'] ) ) {
									$download_url = $asset['browser_download_url'];
									break;
								}
							}
						}

						if ( empty( $download_url ) && ! empty( $rel['zipball_url'] ) ) {
							$download_url = $rel['zipball_url'];
						}

						if ( ! isset( $games_by_slug[ $slug ] ) ) {
							$games_by_slug[ $slug ] = array(
								'slug'         => $slug,
								'name'         => ucwords( str_replace( array( '-', '_' ), ' ', $slug ) ),
								'version'      => $version,
								'author'       => 'PointNet Games',
								'description'  => $rel['body'] ? wp_strip_all_tags( $rel['body'] ) : __( 'Arcade game available on GitHub.', 'pointnet-games' ),
								'download_url' => $download_url,
								'badge'        => 'Release',
							);
						} else {
							// Check if this release is newer.
							if ( version_compare( $version, $games_by_slug[ $slug ]['version'], '>' ) ) {
								$games_by_slug[ $slug ]['version'] = $version;
								if ( ! empty( $download_url ) ) {
									$games_by_slug[ $slug ]['download_url'] = $download_url;
								}
							}
						}
					}

					// Case 2: Release contains asset zips matching games (e.g. mahjong.zip or minesweeper-arcade.zip)
					if ( ! empty( $rel['assets'] ) && is_array( $rel['assets'] ) ) {
						foreach ( $rel['assets'] as $asset ) {
							$asset_name = $asset['name'];
							if ( preg_match( '/^([a-z0-9\-_]+)\.zip$/i', $asset_name, $am ) ) {
								$asset_slug = sanitize_title( $am[1] );
								if ( isset( $games_by_slug[ $asset_slug ] ) ) {
									$games_by_slug[ $asset_slug ]['download_url'] = $asset['browser_download_url'];
								}
							}
						}
					}
				}
			}
		}

		return array_values( $games_by_slug );
	}

	/**
	 * Fallback starter catalog when GitHub API is unreachable or rate-limited.
	 *
	 * @return array
	 */
	private static function get_fallback_catalog() {
		return array(
			array(
				'slug'         => 'minesweeper-arcade',
				'name'         => 'Minesweeper',
				'version'      => '1.3.5',
				'author'       => 'PointNet Games',
				'description'  => 'Minesweeper with dual modes: Classic (Easy, Medium, Hard, Extreme) and progressive Scalata reaching Extreme 32x18. Minimalist Clean One aesthetics, smart chording, pan & pinch-to-zoom, and organic tactile sound.',
				'categories'   => array( 'puzzle', 'classic', 'logic', 'arcade' ),
				'download_url' => 'https://github.com/' . self::get_repo() . '/releases/download/minesweeper-arcade-v1.3.5/minesweeper-arcade.zip',
				'badge'        => 'Popular',
			),
		);
	}

	/**
	 * Get all currently installed games indexed by slug.
	 *
	 * @return array Array with slug => details.
	 */
	public static function get_installed_games_map() {
		$installed  = array();
		$scan_roots = PointNet_Games_Game_Registry::get_scan_roots();

		foreach ( $scan_roots as $source_key => $root_dir ) {
			if ( ! is_dir( $root_dir ) ) {
				continue;
			}
			$manifests = (array) glob( trailingslashit( $root_dir ) . '*/manifest.json' );
			foreach ( $manifests as $manifest_path ) {
				$raw = file_get_contents( $manifest_path );
				if ( ! $raw ) {
					continue;
				}
				$manifest = json_decode( $raw, true );
				if ( is_array( $manifest ) && ! empty( $manifest['slug'] ) ) {
					$slug = sanitize_title( $manifest['slug'] );
					$installed[ $slug ] = array(
						'slug'          => $slug,
						'name'          => isset( $manifest['name'] ) ? $manifest['name'] : $slug,
						'version'       => isset( $manifest['version'] ) ? $manifest['version'] : '1.0.0',
						'path'          => dirname( $manifest_path ),
						'source'        => $source_key,
						'manifest_path' => $manifest_path,
					);
				}
			}
		}

		return $installed;
	}

	/**
	 * AJAX Handler to install or update a game from catalog.
	 */
	public function ajax_install_game() {
		check_ajax_referer( 'pointnet_games_catalog_action', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'pointnet-games' ) ) );
		}

		$slug = isset( $_POST['slug'] ) ? sanitize_title( wp_unslash( $_POST['slug'] ) ) : '';
		if ( empty( $slug ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid game slug.', 'pointnet-games' ) ) );
		}

		$catalog = self::get_catalog();
		$target  = null;

		foreach ( $catalog as $item ) {
			if ( isset( $item['slug'] ) && $item['slug'] === $slug ) {
				$target = $item;
				break;
			}
		}

		if ( ! $target || empty( $target['download_url'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Game not found in catalog or download URL missing.', 'pointnet-games' ) ) );
		}

		$result = self::install_from_zip_url( $target['download_url'], $slug );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		// Force registry sync.
		PointNet_Games_Game_Registry::sync_all_games( true );

		wp_send_json_success(
			array(
				'message' => sprintf(
					/* translators: %s: Game name */
					__( '"%s" installed successfully!', 'pointnet-games' ),
					esc_html( $target['name'] )
				),
				'slug'    => $slug,
				'version' => isset( $target['version'] ) ? $target['version'] : '',
			)
		);
	}

	/**
	 * AJAX Handler to uninstall a game.
	 */
	public function ajax_uninstall_game() {
		check_ajax_referer( 'pointnet_games_catalog_action', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'pointnet-games' ) ) );
		}

		$slug = isset( $_POST['slug'] ) ? sanitize_title( wp_unslash( $_POST['slug'] ) ) : '';
		if ( empty( $slug ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid game slug.', 'pointnet-games' ) ) );
		}

		$target_dir = trailingslashit( PointNet_Games_Game_Registry::get_installed_games_dir() ) . $slug;

		if ( ! is_dir( $target_dir ) ) {
			wp_send_json_error( array( 'message' => __( 'Game directory does not exist or is not in uploads.', 'pointnet-games' ) ) );
		}

		global $wp_filesystem;
		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		WP_Filesystem();

		$deleted = $wp_filesystem->delete( $target_dir, true );

		if ( ! $deleted ) {
			wp_send_json_error( array( 'message' => __( 'Could not delete game files.', 'pointnet-games' ) ) );
		}

		PointNet_Games_Game_Registry::sync_all_games( true );

		wp_send_json_success(
			array(
				'message' => __( 'Game uninstalled successfully.', 'pointnet-games' ),
				'slug'    => $slug,
			)
		);
	}

	/**
	 * AJAX Handler to refresh catalog cache.
	 */
	public function ajax_refresh_catalog() {
		check_ajax_referer( 'pointnet_games_catalog_action', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'pointnet-games' ) ) );
		}

		delete_transient( self::TRANSIENT_KEY );
		$catalog = self::get_catalog( true );

		wp_send_json_success(
			array(
				'message' => __( 'Catalog refreshed from GitHub successfully.', 'pointnet-games' ),
				'count'   => count( $catalog ),
			)
		);
	}

	/**
	 * Download, validate and extract a game zip package.
	 *
	 * Security validations:
	 * - Zip must contain manifest.json and index.html.
	 * - Zip must NOT contain any executable PHP/Phar/Shell scripts.
	 *
	 * @param string $zip_url URL to the zip archive.
	 * @param string $slug    Target game slug.
	 * @return true|WP_Error
	 */
	public static function install_from_zip_url( $zip_url, $slug ) {
		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$temp_file = download_url( $zip_url, 60 );

		if ( is_wp_error( $temp_file ) ) {
			return $temp_file;
		}

		// Inspect zip contents with ZipArchive before extracting.
		if ( class_exists( 'ZipArchive' ) ) {
			$zip = new ZipArchive();
			if ( true === $zip->open( $temp_file ) ) {
				$has_manifest = false;
				$has_index    = false;

				for ( $i = 0; $i < $zip->numFiles; $i++ ) {
					$filename = $zip->getNameIndex( $i );
					$ext      = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );

					// Security check: reject any server-executable code.
					if ( in_array( $ext, array( 'php', 'phtml', 'phar', 'sh', 'py', 'pl', 'cgi', 'exe' ), true ) ) {
						$zip->close();
						@unlink( $temp_file );
						return new WP_Error(
							'unsafe_file_detected',
							__( 'Security violation: The package contains server-executable scripts and was rejected.', 'pointnet-games' )
						);
					}

					if ( basename( $filename ) === 'manifest.json' ) {
						$has_manifest = true;
					}
					if ( basename( $filename ) === 'index.html' ) {
						$has_index = true;
					}
				}
				$zip->close();

				if ( ! $has_manifest || ! $has_index ) {
					@unlink( $temp_file );
					return new WP_Error(
						'invalid_game_structure',
						__( 'Invalid package: The game must contain manifest.json and index.html.', 'pointnet-games' )
					);
				}
			}
		}

		// Destination path: wp-content/uploads/pointnet-games/{slug}/
		$target_dir = trailingslashit( PointNet_Games_Game_Registry::get_installed_games_dir() ) . $slug;

		if ( ! file_exists( $target_dir ) ) {
			wp_mkdir_p( $target_dir );
		}

		$unzip_result = unzip_file( $temp_file, $target_dir );
		@unlink( $temp_file );

		if ( is_wp_error( $unzip_result ) ) {
			return $unzip_result;
		}

		return true;
	}

}
