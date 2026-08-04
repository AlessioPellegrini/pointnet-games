<?php
/**
 * Shortcodes for embedding games and leaderboards.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Shortcodes
 */
class PointNet_Games_Shortcodes {

	/**
	 * Register hooks.
	 */
	public function __construct() {
		add_shortcode( 'pointnet_game', array( $this, 'shortcode_game' ) );
		add_shortcode( 'pointnet_game_leaderboard', array( $this, 'shortcode_leaderboard' ) );
		add_shortcode( 'pointnet_games_list', array( $this, 'shortcode_games_list' ) );
	}

	/**
	 * [pointnet_game id="123" width="800px" height="600px"]
	 *
	 * @param array $atts Shortcode attributes.
	 *
	 * @return string
	 */
	public function shortcode_game( $atts ) {
		$atts = shortcode_atts(
			array(
				'id'     => 0,
				'slug'   => '',
				'width'  => '100%',
				'height' => '600px',
			),
			$atts,
			'pointnet_game'
		);

		$game_id = absint( $atts['id'] );

		// Resolve by slug if no ID given.
		if ( ! $game_id && ! empty( $atts['slug'] ) ) {
			$game = get_page_by_path( $atts['slug'], OBJECT, PointNet_Games_Post_Types::GAME_CPT );
			if ( $game ) {
				$game_id = $game->ID;
			}
		}

		if ( ! $game_id ) {
			return '<p class="pointnet-games-error">' . esc_html__( 'Game not specified.', 'pointnet-games' ) . '</p>';
		}

		$loader = new PointNet_Games_Game_Loader();

		return $loader->render_game_embed( $game_id, $atts['width'], $atts['height'] );
	}

	/**
	 * [pointnet_game_leaderboard game_id="123" limit="10" global="0"]
	 *
	 * @param array $atts Shortcode attributes.
	 *
	 * @return string
	 */
	public function shortcode_leaderboard( $atts ) {
		$atts = shortcode_atts(
			array(
				'game_id'    => 0,
				'limit'      => 10,
				'global'     => 0,
				'show_meta'  => 0,
				'difficulty' => '',
			),
			$atts,
			'pointnet_game_leaderboard'
		);

		$limit      = min( max( 1, absint( $atts['limit'] ) ), 100 );
		$is_global  = (bool) $atts['global'];
		$difficulty = sanitize_text_field( $atts['difficulty'] );

		if ( $is_global ) {
			$entries = PointNet_Games_Leaderboard::get_global_leaderboard( $limit );
		} else {
			$game_id = absint( $atts['game_id'] );
			if ( ! $game_id ) {
				return '<p class="pointnet-games-error">' . esc_html__( 'Specify a game_id for the leaderboard.', 'pointnet-games' ) . '</p>';
			}
			$filters = array();
			if ( $difficulty ) {
				$filters['difficulty'] = $difficulty;
			}
			$entries = PointNet_Games_Leaderboard::get_leaderboard( $game_id, $limit, 0, $filters );
		}

		if ( empty( $entries ) ) {
			return '<p class="pointnet-games-empty">' . esc_html__( 'No scores yet.', 'pointnet-games' ) . '</p>';
		}

		$html  = '<div class="pointnet-games-leaderboard">';
		$html .= '<table class="pointnet-games-leaderboard-table">';
		$html .= '<thead><tr><th>' . esc_html__( 'Pos.', 'pointnet-games' ) . '</th><th>' . esc_html__( 'Player', 'pointnet-games' ) . '</th>';

		if ( $is_global ) {
			$html .= '<th>' . esc_html__( 'Game', 'pointnet-games' ) . '</th>';
		}

		if ( $atts['show_meta'] ) {
			$html .= '<th>' . esc_html__( 'Details', 'pointnet-games' ) . '</th>';
		}

		$html .= '<th>' . esc_html__( 'Score', 'pointnet-games' ) . '</th>';
		$html .= '</tr></thead><tbody>';

		foreach ( $entries as $entry ) {
			$row_class = 1 === (int) $entry['position'] ? ' class="pointnet-games-first"' : '';
			$html     .= '<tr' . $row_class . '>';
			$html     .= '<td>' . esc_html( $entry['position'] ) . '</td>';
			$html     .= '<td>' . esc_html( $entry['nickname'] ) . '</td>';

			if ( $is_global ) {
				$html .= '<td>' . esc_html( $entry['game_title'] ) . '</td>';
			}

			if ( $atts['show_meta'] ) {
				$meta_parts = array();
				foreach ( $entry['meta'] as $meta_key => $meta_value ) {
					$meta_parts[] = esc_html( $meta_key ) . ': ' . esc_html( $meta_value );
				}
				$html .= '<td>' . implode( ', ', $meta_parts ) . '</td>';
			}

			$html .= '<td>' . esc_html( number_format_i18n( $entry['score'] ) ) . '</td>';
			$html .= '</tr>';
		}

		$html .= '</tbody></table>';
		$html .= '</div>';

		return $html;
	}

	/**
	 * [pointnet_games_list limit="12"]
	 *
	 * @param array $atts Shortcode attributes.
	 *
	 * @return string
	 */
	public function shortcode_games_list( $atts ) {
		$atts = shortcode_atts(
			array(
				'limit'     => 12,
				'category'  => '',
				'columns'   => 3,
			),
			$atts,
			'pointnet_games_list'
		);

		$query_args = array(
			'post_type'      => PointNet_Games_Post_Types::GAME_CPT,
			'post_status'    => 'publish',
			'posts_per_page' => min( max( 1, absint( $atts['limit'] ) ), 60 ),
		);

		if ( ! empty( $atts['category'] ) ) {
			$query_args['tax_query'] = array(
				array(
					'taxonomy' => 'pointnet_game_category',
					'field'    => 'slug',
					'terms'    => sanitize_title( $atts['category'] ),
				),
			);
		}

		$games = get_posts( $query_args );

		if ( empty( $games ) ) {
			return '<p class="pointnet-games-empty">' . esc_html__( 'No games available.', 'pointnet-games' ) . '</p>';
		}

		$columns = min( max( 1, absint( $atts['columns'] ) ), 5 );

		$html  = '<div class="pointnet-games-grid pointnet-games-grid-' . $columns . '">';
		foreach ( $games as $game ) {
			$thumb  = get_the_post_thumbnail_url( $game->ID, 'medium' );
			$url    = get_permalink( $game->ID );
			$html  .= '<div class="pointnet-games-card">';
			$html  .= '<a href="' . esc_url( $url ) . '">';
			if ( $thumb ) {
				$html .= '<img class="pointnet-games-card-thumb" src="' . esc_url( $thumb ) . '" alt="' . esc_attr( $game->post_title ) . '" loading="lazy">';
			}
			$html .= '<div class="pointnet-games-card-body">';
			$html .= '<h3 class="pointnet-games-card-title">' . esc_html( $game->post_title ) . '</h3>';
			if ( $game->post_excerpt ) {
				$html .= '<p class="pointnet-games-card-excerpt">' . esc_html( wp_trim_words( $game->post_excerpt, 20 ) ) . '</p>';
			}
			$html .= '</div></a></div>';
		}
		$html .= '</div>';

		return $html;
	}
}