<?php
/**
 * Frontend game loader and embed handling.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Game_Loader
 */
class PointNet_Games_Game_Loader {

	/**
	 * Track if author records were already output to prevent duplicates.
	 *
	 * @var bool
	 */
	private static $author_records_injected = false;

	/**
	 * Register hooks.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue_game_assets' ) );
		add_filter( 'the_content', array( $this, 'inject_game_before_content' ) );

		// Hooks for author archive page (universal theme support):
		// 1. GeneratePress: outside page-header, right before the loop
		add_action( 'generate_before_loop', array( $this, 'inject_user_records_on_author_page' ), 5 );
		// 2. Astra
		add_action( 'astra_archive_header_after', array( $this, 'inject_user_records_on_author_page' ), 5 );
		add_action( 'astra_entry_before', array( $this, 'inject_user_records_on_author_page' ), 5 );
		// 3. Kadence
		add_action( 'kadence_before_archive_content', array( $this, 'inject_user_records_on_author_page' ), 5 );
		// 4. OceanWP
		add_action( 'ocean_before_content_inner', array( $this, 'inject_user_records_on_author_page' ), 5 );
		// 5. Genesis
		add_action( 'genesis_before_loop', array( $this, 'inject_user_records_on_author_page' ), 5 );
		// 6. Universal WordPress fallback: fires when the posts loop starts
		add_action( 'loop_start', array( $this, 'inject_user_records_on_loop_start' ) );
	}

	/**
	 * Enqueue the game embed script only when a game shortcode, author page or singular game page is present.
	 */
	public function maybe_enqueue_game_assets() {
		global $post;

		$has_shortcode  = is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'pointnet_game' );
		$is_game_single = is_singular( PointNet_Games_Post_Types::GAME_CPT );
		$is_author_page = is_author();

		if ( $has_shortcode || $is_game_single || $is_author_page ) {
			wp_enqueue_style( 'pointnet-games-public' );
		}

		if ( $has_shortcode || $is_game_single ) {
			wp_enqueue_script( 'pointnet-games-api' );
			wp_enqueue_script( 'pointnet-games-embed' );
		}
	}

	/**
	 * Core method to output author arcade records once per request.
	 */
	public static function output_author_records(): void {
		if ( self::$author_records_injected ) {
			return;
		}

		if ( ! is_author() ) {
			return;
		}

		$settings = get_option( 'pointnet_games_settings', array() );
		$enabled  = ! isset( $settings['show_author_records'] ) || (int) $settings['show_author_records'] === 1;
		if ( ! $enabled ) {
			return;
		}

		$author_id = (int) get_queried_object_id();
		if ( ! $author_id ) {
			return;
		}

		// Mark injected immediately to prevent any concurrent or secondary hook from firing.
		self::$author_records_injected = true;

		echo PointNet_Games_Shortcodes::render_user_records_html( $author_id, array( 'is_auto_injected' => true ) );
	}

	/**
	 * Inject user arcade records on author archive page via theme-specific action hook.
	 */
	public function inject_user_records_on_author_page(): void {
		self::output_author_records();
	}

	/**
	 * Fallback injection for standard WordPress themes where theme-specific hooks do not exist.
	 *
	 * @param WP_Query $query The query instance.
	 */
	public function inject_user_records_on_loop_start( $query ): void {
		if ( ! is_a( $query, 'WP_Query' ) || ! $query->is_main_query() ) {
			return;
		}

		self::output_author_records();
	}

	/**
	 * On single game pages, inject the full game layout before the content:
	 * game embed, leaderboard, then the instructions (post content).
	 *
	 * @param string $content The post content.
	 *
	 * @return string
	 */
	public function inject_game_before_content( $content ) {
		if ( ! is_singular( PointNet_Games_Post_Types::GAME_CPT ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}

		$game_id = get_the_ID();

		$html  = '<div class="pointnet-games-single-content">';
		$html .= '<h2 class="pointnet-games-visually-hidden pointnet-games-single-title">' . esc_html( get_the_title() ) . '</h2>';

		// 1. Game embed — use the manifest height so the iframe has room
		// for all difficulty levels.
		$manifest     = get_post_meta( $game_id, '_pointnet_games_manifest', true );
		$manifest     = is_array( $manifest ) ? $manifest : array();
		$embed_height = isset( $manifest['height'] ) ? (int) $manifest['height'] . 'px' : '600px';
		$embed_id     = 'pointnet-games-embed-' . $game_id;

		// Mobile "Play" button: on small screens this appears above the
		// iframe so users can start the game with a single tap without
		// scrolling through the page layout.
		$html .= '<button type="button" class="pointnet-games-mobile-play" data-target="#' . esc_attr( $embed_id ) . '">🎮 ' . esc_html__( 'PLAY', 'pointnet-games' ) . '</button>';

		$embed = $this->render_game_embed( $game_id, '100%', $embed_height, $embed_id );
		if ( $embed ) {
			$html .= '<div class="pointnet-games-single-game">' . $embed . '</div>';
		}

		// 2. Leaderboard.
		$html .= '<section class="pointnet-games-single-leaderboard">';
		$html .= '<h2>' . esc_html__( 'Leaderboard', 'pointnet-games' ) . '</h2>';
		$html .= do_shortcode( '[pointnet_game_leaderboard game_id="' . (int) $game_id . '" limit="10" show_meta="1" tabs="auto"]' );
		$html .= '</section>';

		// 3. Instructions (original post content).
		$html .= '<section class="pointnet-games-single-instructions">';
		$html .= '<h2>' . esc_html__( 'How to play', 'pointnet-games' ) . '</h2>';
		$html .= '<div class="pointnet-games-single-content-text">' . wp_kses_post( wpautop( $content ) ) . '</div>';
		$html .= '</section>';

		$html .= '</div>';

		return $html;
	}

	/**
	 * Render the embed HTML for a game.
	 *
	 * @param int    $game_id Game post ID.
	 * @param string $width   CSS width for the embed container.
	 * @param string $height  CSS height for the embed container.
	 * @param string $embed_id Optional HTML id attribute for the embed container.
	 *
	 * @return string Embed HTML.
	 */
	public function render_game_embed( $game_id, $width = '100%', $height = '600px', $embed_id = '' ) {
		$game = get_post( $game_id );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type || 'publish' !== $game->post_status ) {
			return '';
		}

		$manifest = get_post_meta( $game_id, '_pointnet_games_manifest', true );
		$manifest = is_array( $manifest ) ? $manifest : array();

		$game_slug    = get_post_meta( $game_id, '_pointnet_games_slug', true );
		$game_slug    = $game_slug ? $game_slug : $game->post_name;
		$game_type    = isset( $manifest['type'] ) ? $manifest['type'] : 'iframe';
		$game_width   = isset( $manifest['width'] ) ? (int) $manifest['width'] : 800;
		$game_height  = isset( $manifest['height'] ) ? (int) $manifest['height'] : 600;

		$iframe_url = PointNet_Games_Game_Loader::get_game_iframe_url( $game_id, $game_slug );

		// Build game wrapper.
		$id_attr = $embed_id ? ' id="' . esc_attr( $embed_id ) . '"' : '';
		$html = sprintf(
			'<div class="pointnet-games-embed"%s data-game-id="%d" data-game-slug="%s" data-game-type="%s" style="width:%s; height:%s;">',
			$id_attr,
			esc_attr( $game_id ),
			esc_attr( $game_slug ),
			esc_attr( $game_type ),
			esc_attr( $width ),
			esc_attr( $height )
		);

		if ( 'iframe' === $game_type ) {
			$html .= sprintf(
				'<iframe src="%s" width="%d" height="%d" frameborder="0" allowfullscreen loading="lazy" title="%s" sandbox="allow-scripts allow-same-origin" referrerpolicy="strict-origin-when-cross-origin"></iframe>',
				esc_url( $iframe_url ),
				esc_attr( $game_width ),
				esc_attr( $game_height ),
				esc_attr( $game->post_title )
			);
		} else {
			// For canvas/dom games, expose game URL via data attribute.
			$html .= sprintf(
				'<div class="pointnet-games-canvas-host" data-src="%s"></div>',
				esc_url( $iframe_url )
			);
		}

		$html .= '</div>';

		return $html;
	}

	/**
	 * Get the newest modification time of any file inside a game folder.
	 * This ensures cache busting also works for games with separate
	 * CSS, JS or asset files, not just index.html.
	 *
	 * @param string $dir_abs Absolute path to the game directory.
	 *
	 * @return int Latest filemtime, or 0 when the directory is missing/empty.
	 */
	private static function get_game_dir_mtime( $dir_abs ) {
		if ( ! is_dir( $dir_abs ) ) {
			return 0;
		}

		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir_abs, FilesystemIterator::SKIP_DOTS )
		);

		$latest = 0;
		foreach ( $iterator as $file ) {
			if ( $file->isFile() ) {
				$mtime = (int) $file->getMTime();
				if ( $mtime > $latest ) {
					$latest = $mtime;
				}
			}
		}

		return $latest;
	}

	/**
	 * Build the iframe URL for a game, handling rewrite fallback.
	 *
	 * @param int    $game_id  Game post ID.
	 * @param string $game_slug Game slug.
	 *
	 * @return string
	 */
	public static function get_game_iframe_url( $game_id, $game_slug ) {
		// Prefer the registered relative dir from the registry.
		$registered_dir = get_post_meta( $game_id, '_pointnet_games_dir', true );
		if ( $registered_dir ) {
			$direct_file = POINTNET_GAMES_PLUGIN_DIR . $registered_dir . 'index.html';
			if ( file_exists( $direct_file ) ) {
				$version = self::get_game_dir_mtime( POINTNET_GAMES_PLUGIN_DIR . $registered_dir );
				return POINTNET_GAMES_PLUGIN_URL . $registered_dir . 'index.html?v=' . $version;
			}
		}

		// Try direct file first (games/{slug}/index.html).
		$direct_file = POINTNET_GAMES_PLUGIN_DIR . 'games/' . $game_slug . '/index.html';
		if ( file_exists( $direct_file ) ) {
			$version = self::get_game_dir_mtime( POINTNET_GAMES_PLUGIN_DIR . 'games/' . $game_slug );
			return POINTNET_GAMES_PLUGIN_URL . 'games/' . $game_slug . '/index.html?v=' . $version;
		}

		// Fallback to REST endpoint that serves the game HTML.
		return rest_url( POINTNET_GAMES_REST_NAMESPACE . '/game-iframe/' . $game_id );
	}
}