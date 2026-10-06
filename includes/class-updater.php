<?php
/**
 * PointNet_Games_Updater
 *
 * Lightweight native GitHub Release updater for PointNet Games.
 * Queries GitHub repository releases and git tags, informs WordPress of available updates,
 * and ensures safe installation with correct folder naming.
 *
 * @package PointNet_Games
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PointNet_Games_Updater {

	private const GITHUB_REPO   = 'AlessioPellegrini/pointnet-games';
	private const TRANSIENT_KEY = 'pointnet_games_github_release';
	private const CACHE_TTL     = 3600; // 1 hour (auto-refreshed in background)

	/**
	 * Hook updater into WordPress lifecycle.
	 */
	public static function init(): void {
		add_filter( 'pre_set_site_transient_update_plugins', array( __CLASS__, 'check_update' ) );
		add_filter( 'site_transient_update_plugins',         array( __CLASS__, 'check_update' ) );
		add_filter( 'plugins_api',                            array( __CLASS__, 'plugin_info' ), 20, 3 );
		add_filter( 'upgrader_source_selection',             array( __CLASS__, 'fix_folder_name' ), 10, 4 );
		add_action( 'upgrader_process_complete',             array( __CLASS__, 'clear_cache' ), 10, 2 );
		add_action( 'admin_init',                            array( __CLASS__, 'handle_admin_recheck' ) );
	}

	/**
	 * Invalidate GitHub cache when admin triggers a manual update recheck.
	 */
	public static function handle_admin_recheck(): void {
		if ( ! empty( $_GET['force-check'] ) || ( isset( $_GET['action'] ) && 'do-core-recheck' === $_GET['action'] ) ) {
			delete_site_transient( self::TRANSIENT_KEY );
		}
	}

	/**
	 * Retrieve the latest release or git tag from GitHub API with transient caching.
	 *
	 * @param bool $force_refresh Whether to bypass cache.
	 * @return array|null
	 */
	public static function get_latest_release( bool $force_refresh = false ): ?array {
		if ( ! $force_refresh ) {
			$is_recheck = ! empty( $_GET['force-check'] )
				|| ( isset( $_GET['action'] ) && 'do-core-recheck' === $_GET['action'] )
				|| ( isset( $_POST['action'] ) && 'do-core-recheck' === $_POST['action'] );
			if ( $is_recheck ) {
				$force_refresh = true;
			}
		}

		if ( ! $force_refresh ) {
			$cached = get_site_transient( self::TRANSIENT_KEY );
			if ( false !== $cached && is_array( $cached ) ) {
				return $cached;
			}
		}

		$user_agent = 'WordPress/' . get_bloginfo( 'version' ) . '; PointNetGames/' . POINTNET_GAMES_VERSION . '; ' . home_url();

		// 1. Check formal GitHub Releases
		$rel_url = 'https://api.github.com/repos/' . self::GITHUB_REPO . '/releases';
		$rel_res = wp_remote_get(
			$rel_url,
			array(
				'timeout'    => 10,
				'user-agent' => $user_agent,
				'headers'    => array( 'Accept' => 'application/vnd.github.v3+json' ),
			)
		);

		$best_release = null;
		if ( ! is_wp_error( $rel_res ) && 200 === wp_remote_retrieve_response_code( $rel_res ) ) {
			$releases = json_decode( wp_remote_retrieve_body( $rel_res ), true );
			if ( is_array( $releases ) && ! empty( $releases ) ) {
				foreach ( $releases as $rel ) {
					if ( ! empty( $rel['draft'] ) ) {
						continue;
					}
					$tag = $rel['tag_name'] ?? '';
					// Only accept plugin versions, ignoring game-specific tags (e.g. mahjong-v1.7.0, minesweeper-v1.3.0)
					if ( ! preg_match( '/^v?([0-9]+\.[0-9]+(?:\.[0-9]+)?.*)$/i', $tag, $matches ) ) {
						continue;
					}
					$v = $matches[1];
					if ( ! $best_release || version_compare( $v, ltrim( $best_release['tag_name'], 'vV ' ), '>' ) ) {
						$best_release = $rel;
					}
				}
			}
		}

		// 2. Also check Git Tags in case tags were pushed without creating a formal GitHub release
		$tags_url = 'https://api.github.com/repos/' . self::GITHUB_REPO . '/tags';
		$tags_res = wp_remote_get(
			$tags_url,
			array(
				'timeout'    => 10,
				'user-agent' => $user_agent,
				'headers'    => array( 'Accept' => 'application/vnd.github.v3+json' ),
			)
		);

		if ( ! is_wp_error( $tags_res ) && 200 === wp_remote_retrieve_response_code( $tags_res ) ) {
			$tags = json_decode( wp_remote_retrieve_body( $tags_res ), true );
			if ( is_array( $tags ) && ! empty( $tags ) ) {
				foreach ( $tags as $tag_item ) {
					$tag_name = $tag_item['name'] ?? '';
					// Only accept plugin versions, ignoring game-specific tags
					if ( ! preg_match( '/^v?([0-9]+\.[0-9]+(?:\.[0-9]+)?.*)$/i', $tag_name, $matches ) ) {
						continue;
					}
					$tv = $matches[1];
					$current_best_v = $best_release ? ltrim( $best_release['tag_name'], 'vV ' ) : '0.0.0';
					if ( version_compare( $tv, $current_best_v, '>' ) ) {
						$best_release = array(
							'tag_name'    => $tag_name,
							'zipball_url' => $tag_item['zipball_url'] ?? ( 'https://api.github.com/repos/' . self::GITHUB_REPO . '/zipball/refs/tags/' . $tag_name ),
							'html_url'    => 'https://github.com/' . self::GITHUB_REPO . '/releases/tag/' . $tag_name,
							'body'        => '',
							'assets'      => array(),
						);
					}
				}
			}
		}

		if ( ! $best_release || empty( $best_release['tag_name'] ) ) {
			return null;
		}

		set_site_transient( self::TRANSIENT_KEY, $best_release, self::CACHE_TTL );
		return $best_release;
	}

	/**
	 * Check if a newer release is available and inject it into WordPress update transient.
	 *
	 * @param object|null $transient WordPress update plugins transient.
	 * @return object|null
	 */
	public static function check_update( $transient ) {
		if ( ! is_object( $transient ) ) {
			return $transient;
		}

		$release = self::get_latest_release();
		if ( ! $release ) {
			return $transient;
		}

		$plugin_file = plugin_basename( POINTNET_GAMES_PLUGIN_FILE );
		$latest_ver  = ltrim( $release['tag_name'], 'vV ' );

		// Prefer attached zip asset if published, fallback to GitHub zipball
		$package = $release['zipball_url'] ?? '';
		if ( ! empty( $release['assets'] ) && is_array( $release['assets'] ) ) {
			foreach ( $release['assets'] as $asset ) {
				if ( isset( $asset['name'] ) && 'pointnet-games.zip' === $asset['name'] && ! empty( $asset['browser_download_url'] ) ) {
					$package = $asset['browser_download_url'];
					break;
				}
			}
		}

		$item = (object) array(
			'slug'         => 'pointnet-games',
			'plugin'       => $plugin_file,
			'new_version'  => $latest_ver,
			'url'          => $release['html_url'] ?? ( 'https://github.com/' . self::GITHUB_REPO ),
			'package'      => $package,
			'tested'       => '7.1',
			'requires_php' => '8.0',
			'icons'        => self::get_plugin_icons(),
			'banners'      => array(),
		);

		if ( version_compare( $latest_ver, POINTNET_GAMES_VERSION, '>' ) ) {
			if ( ! isset( $transient->response ) || ! is_array( $transient->response ) ) {
				$transient->response = array();
			}
			$transient->response[ $plugin_file ] = $item;
			if ( isset( $transient->no_update[ $plugin_file ] ) ) {
				unset( $transient->no_update[ $plugin_file ] );
			}
		} else {
			if ( ! isset( $transient->no_update ) || ! is_array( $transient->no_update ) ) {
				$transient->no_update = array();
			}
			$transient->no_update[ $plugin_file ] = $item;
			if ( isset( $transient->response[ $plugin_file ] ) ) {
				unset( $transient->response[ $plugin_file ] );
			}
		}

		return $transient;
	}

	/**
	 * Provide plugin information for the WordPress "View version details" modal.
	 *
	 * @param false|object $res    The result object.
	 * @param string       $action The type of information requested.
	 * @param object       $args   Plugin API arguments.
	 * @return false|object
	 */
	public static function plugin_info( $res, string $action, $args ) {
		if ( 'plugin_information' !== $action ) {
			return $res;
		}

		if ( empty( $args->slug ) || 'pointnet-games' !== $args->slug ) {
			return $res;
		}

		$release = self::get_latest_release();
		if ( ! $release ) {
			return $res;
		}

		$latest_ver = ltrim( $release['tag_name'], 'vV ' );
		$changelog  = ! empty( $release['body'] )
			? nl2br( esc_html( $release['body'] ) )
			: esc_html__( 'Consult GitHub releases for full changelog.', 'pointnet-games' );

		// Package URL
		$package = $release['zipball_url'] ?? '';
		if ( ! empty( $release['assets'] ) && is_array( $release['assets'] ) ) {
			foreach ( $release['assets'] as $asset ) {
				if ( isset( $asset['name'] ) && 'pointnet-games.zip' === $asset['name'] && ! empty( $asset['browser_download_url'] ) ) {
					$package = $asset['browser_download_url'];
					break;
				}
			}
		}

		return (object) array(
			'name'          => 'PointNet Games',
			'slug'          => 'pointnet-games',
			'version'       => $latest_ver,
			'author'        => '<a href="https://www.pointnet.it/">PointNet</a>',
			'homepage'      => 'https://wpgames.pointnet.it/',
			'requires'      => '7.0',
			'tested'        => '7.1',
			'requires_php'  => '8.0',
			'download_link' => $package,
			'icons'         => self::get_plugin_icons(),
			'sections'      => array(
				'description' => esc_html__( 'Arcade games platform for WordPress with scores for registered users, global leaderboards and a standardized API for game developers.', 'pointnet-games' ),
				'changelog'   => $changelog,
			),
		);
	}

	/**
	 * Get plugin icon URLs for WordPress update screens and plugin information modal.
	 *
	 * @return array
	 */
	public static function get_plugin_icons() {
		$local_128 = POINTNET_GAMES_PLUGIN_DIR . 'assets/icon-128x128.png';
		$local_256 = POINTNET_GAMES_PLUGIN_DIR . 'assets/icon-256x256.png';
		$local_svg = POINTNET_GAMES_PLUGIN_DIR . 'assets/icon.svg';

		$url_128 = file_exists( $local_128 )
			? POINTNET_GAMES_PLUGIN_URL . 'assets/icon-128x128.png'
			: 'https://raw.githubusercontent.com/' . self::GITHUB_REPO . '/main/assets/icon-128x128.png';

		$url_256 = file_exists( $local_256 )
			? POINTNET_GAMES_PLUGIN_URL . 'assets/icon-256x256.png'
			: 'https://raw.githubusercontent.com/' . self::GITHUB_REPO . '/main/assets/icon-256x256.png';

		$url_svg = file_exists( $local_svg )
			? POINTNET_GAMES_PLUGIN_URL . 'assets/icon.svg'
			: 'https://raw.githubusercontent.com/' . self::GITHUB_REPO . '/main/assets/icon.svg';

		return array(
			'1x'      => $url_128,
			'2x'      => $url_256,
			'default' => $url_256,
			'svg'     => $url_svg,
		);
	}

	/**
	 * Ensure the extracted directory is named 'pointnet-games' so WordPress updates it in place.
	 *
	 * @param string      $source        Path on local filesystem for extracted archive.
	 * @param string      $remote_source Remote source path.
	 * @param WP_Upgrader $upgrader      WP_Upgrader instance.
	 * @param array       $hook_extra    Extra hook data.
	 * @return string|WP_Error
	 */
	public static function fix_folder_name( $source, string $remote_source, $upgrader, array $hook_extra = array() ) {
		global $wp_filesystem;

		$plugin_file = plugin_basename( POINTNET_GAMES_PLUGIN_FILE );
		if ( empty( $hook_extra['plugin'] ) || $hook_extra['plugin'] !== $plugin_file ) {
			return $source;
		}

		$correct_dir_name = dirname( $plugin_file );
		$target           = trailingslashit( $remote_source ) . $correct_dir_name;

		if ( untrailingslashit( $source ) === untrailingslashit( $target ) ) {
			return $source;
		}

		if ( ! $wp_filesystem ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
		}

		if ( $wp_filesystem && $wp_filesystem->move( $source, $target ) ) {
			return trailingslashit( $target );
		}

		return new WP_Error(
			'pointnet_games_rename_failed',
			esc_html__( 'Failed to rename plugin update folder to pointnet-games.', 'pointnet-games' )
		);
	}

	/**
	 * Clear release transient cache when upgrade process finishes.
	 *
	 * @param WP_Upgrader $upgrader   WP_Upgrader instance.
	 * @param array       $hook_extra Hook extra data.
	 */
	public static function clear_cache( $upgrader, array $hook_extra = array() ): void {
		delete_site_transient( self::TRANSIENT_KEY );
	}
}
