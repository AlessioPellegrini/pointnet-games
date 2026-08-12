<?php
/**
 * REST API endpoints.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_API
 */
class PointNet_Games_API {

	/**
	 * Register REST routes.
	 */
	public function register_routes() {
		$namespace = POINTNET_GAMES_REST_NAMESPACE;

		register_rest_route(
			$namespace,
			'/games',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_games' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_game' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)/score',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'submit_score' ),
				'permission_callback' => array( $this, 'verify_rest_auth' ),
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)/session',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'create_session' ),
				'permission_callback' => array( $this, 'verify_rest_auth' ),
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)/leaderboard',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_game_leaderboard' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'limit'      => array(
						'sanitize_callback' => 'absint',
					),
					'offset'     => array(
						'sanitize_callback' => 'absint',
					),
					'difficulty' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			$namespace,
			'/leaderboard',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_global_leaderboard' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)/progress',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_progress' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)/progress',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_progress' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
	}

	/**
	 * GET /games — list all published games.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_games( $request ) {
		$games = get_posts(
			array(
				'post_type'      => PointNet_Games_Post_Types::GAME_CPT,
				'post_status'    => 'publish',
				'posts_per_page' => 100,
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);

		$result = array();
		foreach ( $games as $game ) {
			$result[] = $this->format_game( $game );
		}

		return rest_ensure_response( array( 'games' => $result ) );
	}

	/**
	 * GET /game/{id} — single game detail.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_game( $request ) {
		$game = get_post( (int) $request['id'] );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type || 'publish' !== $game->post_status ) {
			return new WP_Error(
				'pointnet_games_game_not_found',
				__( 'Game not found.', 'pointnet-games' ),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response( array( 'game' => $this->format_game( $game ) ) );
	}

	/**
	 * POST /game/{id}/score — submit a score.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function submit_score( $request ) {
		$game_id = (int) $request['id'];
		$params  = $request->get_json_params();

		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		$score = isset( $params['score'] ) ? absint( $params['score'] ) : 0;
		if ( $score <= 0 ) {
			return new WP_Error(
				'pointnet_games_invalid_score',
				__( 'Invalid score.', 'pointnet-games' ),
				array( 'status' => 400 )
			);
		}

		// Rate limiting check.
		if ( ! PointNet_Games_Leaderboard::check_rate_limit( $game_id ) ) {
			return new WP_Error(
				'pointnet_games_rate_limited',
				__( 'Too many submissions, try again in a minute.', 'pointnet-games' ),
				array( 'status' => 429 )
			);
		}

		$nickname = isset( $params['nickname'] ) ? sanitize_text_field( $params['nickname'] ) : '';
		$meta     = isset( $params['meta'] ) && is_array( $params['meta'] ) ? $params['meta'] : array();

		$user_id = 0;
		if ( is_user_logged_in() ) {
			$user_id  = get_current_user_id();
			$nickname = pointnet_games_current_nickname();
		}

		// Sanitize meta recursively.
		$meta = $this->sanitize_meta( $meta );

		$result = PointNet_Games_Leaderboard::insert_score( $game_id, $score, $nickname, $meta, $user_id );

		if ( false === $result ) {
			return new WP_Error(
				'pointnet_games_insert_failed',
				__( 'Unable to save the score.', 'pointnet-games' ),
				array( 'status' => 500 )
			);
		}

		$position = PointNet_Games_Leaderboard::get_player_position( $game_id, $user_id, $nickname );

		return rest_ensure_response(
			array(
				'success'  => true,
				'score_id' => $result,
				'position' => $position,
			)
		);
	}

	/**
	 * POST /game/{id}/session — create a game session token (anti-cheat).
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function create_session( $request ) {
		$game_id  = (int) $request['id'];
		$token    = wp_generate_password( 32, false );
		$expires  = time() + HOUR_IN_SECONDS;

		$session = array(
			'token'   => $token,
			'expires' => $expires,
			'game_id' => $game_id,
		);

		set_transient( 'pointnet_games_session_' . $token, $session, HOUR_IN_SECONDS );

		return rest_ensure_response( $session );
	}

	/**
	 * GET /game/{id}/leaderboard — leaderboard for one game.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_game_leaderboard( $request ) {
		$game_id = (int) $request['id'];
		$limit   = isset( $request['limit'] ) ? (int) $request['limit'] : 10;
		$offset  = isset( $request['offset'] ) ? (int) $request['offset'] : 0;

		$filters = array();
		$difficulty = isset( $request['difficulty'] ) ? sanitize_text_field( $request['difficulty'] ) : '';
		if ( $difficulty ) {
			$filters['difficulty'] = $difficulty;
		}

		$entries = PointNet_Games_Leaderboard::get_leaderboard( $game_id, $limit, $offset, $filters );

		return rest_ensure_response(
			array(
				'game_id'    => $game_id,
				'entries'    => $entries,
				'count'      => count( $entries ),
				'pagination' => array(
					'limit'  => $limit,
					'offset' => $offset,
					'has_more' => count( $entries ) === $limit,
				),
			)
		);
	}

	/**
	 * GET /leaderboard — global leaderboard.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_global_leaderboard( $request ) {
		$limit = isset( $request['limit'] ) ? (int) $request['limit'] : 20;

		$entries = PointNet_Games_Leaderboard::get_global_leaderboard( $limit );

		return rest_ensure_response(
			array(
				'entries' => $entries,
				'count'   => count( $entries ),
			)
		);
	}

	/**
	 * GET /game/{id}/progress — user's saved progress for a game.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_progress( $request ) {
		$game_id = (int) $request['id'];
		$user_id = get_current_user_id();

		if ( ! $user_id ) {
			return new WP_Error(
				'pointnet_games_not_logged_in',
				__( 'You must be logged in.', 'pointnet-games' ),
				array( 'status' => 401 )
			);
		}

		$progress  = get_user_meta( $user_id, '_pointnet_games_progress', true );
		$progress  = is_array( $progress ) ? $progress : array();
		$game_data = isset( $progress[ $game_id ] ) ? $progress[ $game_id ] : array();

		return rest_ensure_response(
			array(
				'game_id'  => $game_id,
				'progress' => array(
					'level'      => isset( $game_data['level'] ) ? (int) $game_data['level'] : 0,
					'best_score' => isset( $game_data['best_score'] ) ? (int) $game_data['best_score'] : 0,
					'updated'    => isset( $game_data['updated'] ) ? (int) $game_data['updated'] : 0,
				),
			)
		);
	}

	/**
	 * POST /game/{id}/progress — save the user's progress for a game.
	 *
	 * Body: { level: int, score: int }
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_progress( $request ) {
		$game_id = (int) $request['id'];
		$user_id = get_current_user_id();

		if ( ! $user_id ) {
			return new WP_Error(
				'pointnet_games_not_logged_in',
				__( 'You must be logged in.', 'pointnet-games' ),
				array( 'status' => 401 )
			);
		}

		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		$level = isset( $params['level'] ) ? absint( $params['level'] ) : 0;
		$score = isset( $params['score'] ) ? absint( $params['score'] ) : 0;

		/* Clamp level: a game can register up to 300 levels (Mahjong).
		   Use a safe generic cap to avoid storing absurd values. */
		$level = min( 300, max( 1, $level ) );

		$progress = get_user_meta( $user_id, '_pointnet_games_progress', true );
		$progress = is_array( $progress ) ? $progress : array();
		$current  = isset( $progress[ $game_id ] ) ? $progress[ $game_id ] : array();

		/* Only move forward: the saved level never goes backwards. */
		$current['level'] = max( isset( $current['level'] ) ? (int) $current['level'] : 0, $level );
		$current['best_score'] = max( isset( $current['best_score'] ) ? (int) $current['best_score'] : 0, $score );
		$current['updated']    = time();

		$progress[ $game_id ] = $current;
		update_user_meta( $user_id, '_pointnet_games_progress', $progress );

		return rest_ensure_response(
			array(
				'success' => true,
				'game_id' => $game_id,
				'level'   => $current['level'],
				'score'   => $current['best_score'],
				'updated' => $current['updated'],
			)
		);
	}

	/**
	 * Verify nonce for REST requests.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function verify_rest_auth( $request ) {
		$nonce = $request->get_header( 'X-WP-Nonce' );
		if ( ! $nonce ) {
			return false;
		}

		$nonce = sanitize_text_field( $nonce );

		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Format a game post into API-friendly structure.
	 *
	 * @param WP_Post $game Game post object.
	 *
	 * @return array
	 */
	private function format_game( $game ) {
		$manifest = get_post_meta( $game->ID, '_pointnet_games_manifest', true );
		$manifest = is_array( $manifest ) ? $manifest : array();

		return array(
			'id'           => $game->ID,
			'slug'         => sanitize_title( $game->post_name ),
			'title'        => sanitize_text_field( $game->post_title ),
			'excerpt'      => sanitize_text_field( wp_strip_all_tags( $game->post_excerpt ) ),
			'thumbnail'    => esc_url_raw( (string) get_the_post_thumbnail_url( $game->ID, 'large' ) ),
			'permalink'    => esc_url_raw( (string) get_permalink( $game->ID ) ),
			'manifest'     => $manifest,
		);
	}

	/**
	 * Sanitize nested meta arrays.
	 *
	 * @param array $meta Meta array to sanitize.
	 *
	 * @return array
	 */
	private function sanitize_meta( $meta ) {
		$clean = array();
		foreach ( $meta as $key => $value ) {
			$key = sanitize_key( $key );
			if ( is_array( $value ) ) {
				$clean[ $key ] = $this->sanitize_meta( $value );
			} elseif ( is_numeric( $value ) ) {
				$clean[ $key ] = (float) $value;
			} else {
				$clean[ $key ] = sanitize_text_field( $value );
			}
		}

		return $clean;
	}
}