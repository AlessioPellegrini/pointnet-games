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
	 * Register hooks.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue_game_assets' ) );
		add_filter( 'the_content', array( $this, 'inject_game_before_content' ) );
	}

	/**
	 * Enqueue the game embed script only when a game shortcode or singular game page is present.
	 */
	public function maybe_enqueue_game_assets() {
		global $post;

		$has_shortcode = is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'pointnet_game' );
		$is_game_single = is_singular( PointNet_Games_Post_Types::GAME_CPT );

		if ( $has_shortcode || $is_game_single ) {
			wp_enqueue_style( 'pointnet-games-public' );
			wp_enqueue_script( 'pointnet-games-api' );
			wp_enqueue_script( 'pointnet-games-embed' );
		}
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

		$embed = $this->render_game_embed( $game_id, '100%', $embed_height );
		if ( $embed ) {
			$html .= '<div class="pointnet-games-single-game">' . $embed . '</div>';
		}

		// 2. Leaderboard.
		$html .= '<section class="pointnet-games-single-leaderboard">';
		$html .= '<h2>' . esc_html__( 'Classifica', 'pointnet-games' ) . '</h2>';

		// If the game declares difficulty levels in its manifest, show tabs.
		$difficulties = isset( $manifest['difficulties'] ) ? $manifest['difficulties'] : array();
		if ( ! empty( $difficulties ) ) {
			$html .= '<div class="pointnet-games-leaderboard-tabs" data-game-id="' . (int) $game_id . '">';
			$html .= '<button class="pointnet-games-leaderboard-tab pointnet-games-leaderboard-tab-active" data-difficulty="">' . esc_html__( 'Tutti', 'pointnet-games' ) . '</button>';
			foreach ( $difficulties as $diff_slug => $diff_label ) {
				$html .= '<button class="pointnet-games-leaderboard-tab" data-difficulty="' . esc_attr( $diff_slug ) . '">' . esc_html( $diff_label ) . '</button>';
			}
			$html .= '</div>';
		}

		// Leaderboard panels: one per difficulty (pre-rendered server-side).
		$html .= '<div class="pointnet-games-leaderboard-panel pointnet-games-leaderboard-panel-active" data-panel="">';
		$html .= do_shortcode( '[pointnet_game_leaderboard game_id="' . (int) $game_id . '" limit="10"]' );
		$html .= '</div>';

		if ( ! empty( $difficulties ) ) {
			foreach ( $difficulties as $diff_slug => $diff_label ) {
				$html .= '<div class="pointnet-games-leaderboard-panel" data-panel="' . esc_attr( $diff_slug ) . '">';
				$html .= do_shortcode(
					'[pointnet_game_leaderboard game_id="' . (int) $game_id . '" limit="10" difficulty="' . esc_attr( $diff_slug ) . '"]'
				);
				$html .= '</div>';
			}
		}
		$html .= '</section>';

		// 3. Instructions (original post content).
		$html .= '<section class="pointnet-games-single-instructions">';
		$html .= '<h2>' . esc_html__( 'Come si gioca', 'pointnet-games' ) . '</h2>';
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
	 *
	 * @return string Embed HTML.
	 */
	public function render_game_embed( $game_id, $width = '100%', $height = '600px' ) {
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
		$html = sprintf(
			'<div class="pointnet-games-embed" data-game-id="%d" data-game-slug="%s" data-game-type="%s" style="width:%s; height:%s;">',
			esc_attr( $game_id ),
			esc_attr( $game_slug ),
			esc_attr( $game_type ),
			esc_attr( $width ),
			esc_attr( $height )
		);

		if ( 'iframe' === $game_type ) {
			$html .= sprintf(
				'<iframe src="%s" width="%d" height="%d" frameborder="0" allowfullscreen loading="lazy" title="%s"></iframe>',
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
	 * Build the iframe URL for a game, handling rewrite fallback.
	 *
	 * @param int    $game_id  Game post ID.
	 * @param string $game_slug Game slug.
	 *
	 * @return string
	 */
	public static function get_game_iframe_url( $game_id, $game_slug ) {
		$version = '';

		// Prefer the registered relative dir from the registry.
		$registered_dir = get_post_meta( $game_id, '_pointnet_games_dir', true );
		if ( $registered_dir ) {
			$direct_file = POINTNET_GAMES_PLUGIN_DIR . $registered_dir . 'index.html';
			if ( file_exists( $direct_file ) ) {
				$version = (string) filemtime( $direct_file );
				return POINTNET_GAMES_PLUGIN_URL . $registered_dir . 'index.html?v=' . $version;
			}
		}

		// Try direct file first (games/{slug}/index.html).
		$direct_file = POINTNET_GAMES_PLUGIN_DIR . 'games/' . $game_slug . '/index.html';
		if ( file_exists( $direct_file ) ) {
			$version = (string) filemtime( $direct_file );
			return POINTNET_GAMES_PLUGIN_URL . 'games/' . $game_slug . '/index.html?v=' . $version;
		}

		// Fallback to REST endpoint that serves the game HTML.
		return rest_url( POINTNET_GAMES_REST_NAMESPACE . '/game-iframe/' . $game_id );
	}
}