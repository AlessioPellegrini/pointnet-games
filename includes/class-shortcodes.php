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
		add_shortcode( 'pointnet_games_leaderboard', array( $this, 'shortcode_leaderboard' ) );
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
	 * [pointnet_game_leaderboard game_id="123" limit="10" global="0" tabs="auto" show_meta="1"]
	 *
	 * @param array       $atts    Shortcode attributes.
	 * @param string|null $content Enclosed content (unused).
	 * @param string      $tag     Shortcode tag.
	 *
	 * @return string
	 */
	public function shortcode_leaderboard( $atts, $content = null, $tag = '' ) {
		wp_enqueue_style( 'pointnet-games-public' );
		wp_enqueue_script( 'pointnet-games-embed' );

		$default_global = ( 'pointnet_games_leaderboard' === $tag ) ? 1 : 0;
		$atts           = shortcode_atts(
			array(
				'game_id'    => 0,
				'limit'      => 10,
				'global'     => $default_global,
				'show_meta'  => 1,
				'difficulty' => '',
				'tabs'       => 'auto',
			),
			$atts,
			'pointnet_game_leaderboard'
		);

		$limit      = min( max( 1, absint( $atts['limit'] ) ), 100 );
		$is_global  = (bool) $atts['global'];
		$difficulty = sanitize_text_field( $atts['difficulty'] );
		$show_meta  = (bool) $atts['show_meta'];

		if ( $is_global ) {
			return $this->render_leaderboard_table( 0, $limit, '', $show_meta, array(), true );
		}

		$game_id = absint( $atts['game_id'] );
		if ( ! $game_id ) {
			return '<p class="pointnet-games-error">' . esc_html__( 'Specify a game_id for the leaderboard.', 'pointnet-games' ) . '</p>';
		}

		// Retrieve game manifest to inspect available difficulties.
		$manifest     = get_post_meta( $game_id, '_pointnet_games_manifest', true );
		$manifest     = is_array( $manifest ) ? $manifest : array();
		$difficulties = isset( $manifest['difficulties'] ) && is_array( $manifest['difficulties'] ) ? $manifest['difficulties'] : array();

		// Check if tabs should be displayed.
		$tabs_enabled   = ( '0' !== (string) $atts['tabs'] && 'false' !== (string) $atts['tabs'] );
		$has_multi_diff = count( $difficulties ) >= 2;

		if ( $tabs_enabled && $has_multi_diff && '' === $difficulty ) {
			$html  = '<div class="pointnet-games-leaderboard-container" data-game-id="' . (int) $game_id . '">';
			$html .= '<div class="pointnet-games-leaderboard-tabs" data-game-id="' . (int) $game_id . '">';
			$html .= '<button type="button" class="pointnet-games-leaderboard-tab pointnet-games-leaderboard-tab-active" data-difficulty="">' . esc_html__( 'All', 'pointnet-games' ) . '</button>';
			foreach ( $difficulties as $diff_slug => $diff_label ) {
				$html .= '<button type="button" class="pointnet-games-leaderboard-tab" data-difficulty="' . esc_attr( $diff_slug ) . '">' . esc_html( $diff_label ) . '</button>';
			}
			$html .= '</div>';

			// Panel for "All":
			$html .= '<div class="pointnet-games-leaderboard-panel pointnet-games-leaderboard-panel-active" data-panel="">';
			$html .= $this->render_leaderboard_table( $game_id, $limit, '', $show_meta, $difficulties, false );
			$html .= '</div>';

			// Panels for each difficulty:
			foreach ( $difficulties as $diff_slug => $diff_label ) {
				$html .= '<div class="pointnet-games-leaderboard-panel" data-panel="' . esc_attr( $diff_slug ) . '">';
				$html .= $this->render_leaderboard_table( $game_id, $limit, $diff_slug, $show_meta, $difficulties, false );
				$html .= '</div>';
			}

			$html .= '</div>';
			return $html;
		}

		// Single mode or explicitly requested difficulty.
		return $this->render_leaderboard_table( $game_id, $limit, $difficulty, $show_meta, $difficulties, false );
	}

	/**
	 * Render a single leaderboard HTML table.
	 *
	 * @param int    $game_id      Game post ID (0 for global).
	 * @param int    $limit        Max results.
	 * @param string $difficulty   Difficulty filter.
	 * @param bool   $show_meta    Whether to show metadata details.
	 * @param array  $difficulties Map of difficulties for the game.
	 * @param bool   $is_global    Whether this is the global leaderboard.
	 *
	 * @return string Table HTML.
	 */
	public function render_leaderboard_table( $game_id, $limit, $difficulty = '', $show_meta = true, $difficulties = array(), $is_global = false ) {
		if ( $is_global ) {
			$entries = PointNet_Games_Leaderboard::get_global_leaderboard( $limit );
		} else {
			$filters = array();
			if ( '' !== $difficulty ) {
				$filters['difficulty'] = $difficulty;
			}
			$entries = PointNet_Games_Leaderboard::get_leaderboard( $game_id, $limit, 0, $filters );
		}

		if ( empty( $entries ) ) {
			return '<p class="pointnet-games-empty">' . esc_html__( 'No scores yet.', 'pointnet-games' ) . '</p>';
		}

		// Show mode column when viewing "All" in a multi-difficulty game.
		$show_mode_column = ( ! $is_global && '' === $difficulty && count( $difficulties ) >= 2 );

		$html  = '<div class="pointnet-games-leaderboard">';
		$html .= '<table class="pointnet-games-leaderboard-table">';
		$html .= '<thead><tr>';
		$html .= '<th>' . esc_html__( 'Pos.', 'pointnet-games' ) . '</th>';
		$html .= '<th>' . esc_html__( 'Player', 'pointnet-games' ) . '</th>';

		if ( $is_global ) {
			$html .= '<th>' . esc_html__( 'Game', 'pointnet-games' ) . '</th>';
		} elseif ( $show_mode_column ) {
			$html .= '<th>' . esc_html__( 'Mode', 'pointnet-games' ) . '</th>';
		}

		if ( $show_meta ) {
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
				$mode_key   = $entry['meta']['difficulty'] ?? '';
				$mode_label = '';
				if ( ! empty( $mode_key ) ) {
					$mode_label = ucfirst( str_replace( array( '_', '-' ), ' ', (string) $mode_key ) );
				}
				$game_col = esc_html( $entry['game_title'] );
				if ( $mode_label ) {
					$game_col .= ' <span class="pointnet-games-mode-badge">' . esc_html( $mode_label ) . '</span>';
				}
				$html .= '<td>' . $game_col . '</td>';
			} elseif ( $show_mode_column ) {
				$diff_key   = $entry['meta']['difficulty'] ?? '';
				$diff_label = '';
				if ( isset( $difficulties[ $diff_key ] ) ) {
					$diff_label = $difficulties[ $diff_key ];
				} elseif ( ! empty( $diff_key ) ) {
					$diff_label = ucfirst( str_replace( array( '_', '-' ), ' ', (string) $diff_key ) );
				} else {
					$diff_label = '—';
				}
				$html .= '<td><span class="pointnet-games-mode-badge pointnet-games-mode-' . esc_attr( sanitize_html_class( (string) $diff_key ) ) . '">' . esc_html( $diff_label ) . '</span></td>';
			}

			if ( $show_meta ) {
				$meta_cell = '';
				if ( ! empty( $entry['meta'] ) && is_array( $entry['meta'] ) ) {
					$meta_parts    = array();
					$excluded_keys = array( 'difficulty', 'label', 'session_token', 'time_seconds', 'level_time_seconds', 'level_reached', 'won' );

					foreach ( $entry['meta'] as $meta_key => $meta_value ) {
						if ( in_array( strtolower( (string) $meta_key ), $excluded_keys, true ) ) {
							continue;
						}
						if ( is_scalar( $meta_value ) ) {
							$label        = ucfirst( str_replace( '_', ' ', (string) $meta_key ) );
							$meta_parts[] = '<span class="png-meta-item"><strong>' . esc_html( $label ) . ':</strong> ' . esc_html( (string) $meta_value ) . '</span>';
						}
					}

					if ( empty( $meta_parts ) ) {
						foreach ( $entry['meta'] as $meta_key => $meta_value ) {
							if ( is_scalar( $meta_value ) && ! in_array( strtolower( (string) $meta_key ), array( 'session_token' ), true ) ) {
								$meta_parts[] = '<span class="png-meta-item">' . esc_html( (string) $meta_key ) . ': ' . esc_html( (string) $meta_value ) . '</span>';
							}
						}
					}

					if ( ! empty( $meta_parts ) ) {
						$meta_cell = implode( ' <span class="png-meta-sep">&bull;</span> ', $meta_parts );
					}
				}
				$html .= '<td class="pointnet-games-meta-cell">' . ( $meta_cell ? $meta_cell : '—' ) . '</td>';
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