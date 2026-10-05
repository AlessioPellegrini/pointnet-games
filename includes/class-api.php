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
				'permission_callback' => array( $this, 'verify_authenticated_user' ),
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)/session',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'create_session' ),
				'permission_callback' => array( $this, 'verify_authenticated_user' ),
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
				'permission_callback' => array( $this, 'verify_authenticated_user' ),
			)
		);

		register_rest_route(
			$namespace,
			'/game/(?P<id>\d+)/progress',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_progress' ),
				'permission_callback' => array( $this, 'verify_authenticated_user' ),
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

		$game = get_post( $game_id );
		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type || 'publish' !== $game->post_status ) {
			return new WP_Error(
				'pointnet_games_game_not_found',
				__( 'Game not found.', 'pointnet-games' ),
				array( 'status' => 404 )
			);
		}

		$user_id = get_current_user_id();

		// Check against max_score from manifest (safe fallback if manifest missing or max_score = 0).
		$manifest  = get_post_meta( $game_id, '_pointnet_games_manifest', true );
		$max_score = ( is_array( $manifest ) && ! empty( $manifest['max_score'] ) ) ? absint( $manifest['max_score'] ) : 1000000;
		if ( $max_score > 0 && $score > $max_score ) {
			return new WP_Error(
				'pointnet_games_score_exceeds_limit',
				__( 'Score exceeds the maximum permitted for this game.', 'pointnet-games' ),
				array( 'status' => 400 )
			);
		}

		// Anti-cheat: Validate game session token and minimum duration.
		$session_token = isset( $params['session_token'] ) ? sanitize_text_field( $params['session_token'] ) : '';
		if ( empty( $session_token ) ) {
			return new WP_Error(
				'pointnet_games_missing_session',
				__( 'A valid game session token is required to submit scores.', 'pointnet-games' ),
				array( 'status' => 403 )
			);
		}

		$session_key = 'pointnet_games_session_' . $session_token;
		$session     = get_transient( $session_key );
		delete_transient( $session_key ); // One-time token consumption prevents replay attacks.

		if ( ! is_array( $session ) || (int) ( $session['game_id'] ?? 0 ) !== $game_id || (int) ( $session['user_id'] ?? 0 ) !== $user_id ) {
			return new WP_Error(
				'pointnet_games_invalid_session',
				__( 'Invalid or expired game session.', 'pointnet-games' ),
				array( 'status' => 403 )
			);
		}

		// Plausibility check: games cannot be completed in less than 5 seconds.
		$elapsed = time() - (int) ( $session['started_at'] ?? 0 );
		if ( $elapsed < 5 ) {
			return new WP_Error(
				'pointnet_games_impossible_time',
				__( 'Game duration is incoherently short.', 'pointnet-games' ),
				array( 'status' => 400 )
			);
		}

		// Rate limiting check (user ID + IP).
		if ( ! PointNet_Games_Leaderboard::check_rate_limit( $game_id, $user_id ) ) {
			return new WP_Error(
				'pointnet_games_rate_limited',
				__( 'Too many submissions, try again in a minute.', 'pointnet-games' ),
				array( 'status' => 429 )
			);
		}

		$nickname = pointnet_games_current_nickname();
		$raw_meta = isset( $params['meta'] ) && is_array( $params['meta'] ) ? $params['meta'] : array();

		// Sanitize meta safely without nesting.
		$meta = $this->sanitize_meta( $raw_meta );

		$result = PointNet_Games_Leaderboard::insert_score( $game_id, $score, $nickname, $meta, $user_id );

		if ( false === $result ) {
			return new WP_Error(
				'pointnet_games_insert_failed',
				__( 'Unable to save the score.', 'pointnet-games' ),
				array( 'status' => 500 )
			);
		}

		$difficulty = '';
		if ( ! empty( $params['meta']['difficulty'] ) && is_string( $params['meta']['difficulty'] ) ) {
			$difficulty = sanitize_text_field( $params['meta']['difficulty'] );
		}

		$position = PointNet_Games_Leaderboard::get_player_position( $game_id, $user_id, $nickname, $difficulty );

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
		$game_id = (int) $request['id'];
		$game    = get_post( $game_id );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type || 'publish' !== $game->post_status ) {
			return new WP_Error(
				'pointnet_games_game_not_found',
				__( 'Game not found.', 'pointnet-games' ),
				array( 'status' => 404 )
			);
		}

		$user_id = get_current_user_id();

		// Throttle session creation: max 10 sessions per 5 minutes per user to prevent transient bloat.
		$session_limit_key = 'png_s_rl_' . $user_id . '_' . $game_id;
		$session_count     = (int) get_transient( $session_limit_key );
		if ( $session_count >= 10 ) {
			return new WP_Error(
				'pointnet_games_session_rate_limited',
				__( 'Too many active sessions generated. Please wait a few minutes.', 'pointnet-games' ),
				array( 'status' => 429 )
			);
		}
		set_transient( $session_limit_key, $session_count + 1, 5 * MINUTE_IN_SECONDS );

		$token   = wp_generate_password( 32, false );
		$expires = time() + HOUR_IN_SECONDS;

		$session = array(
			'token'      => $token,
			'user_id'    => $user_id,
			'started_at' => time(),
			'expires'    => $expires,
			'game_id'    => $game_id,
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
		$game    = get_post( $game_id );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type || 'publish' !== $game->post_status ) {
			return new WP_Error(
				'pointnet_games_game_not_found',
				__( 'Game not found.', 'pointnet-games' ),
				array( 'status' => 404 )
			);
		}

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
					'level'             => isset( $game_data['level'] ) ? (int) $game_data['level'] : 0,
					'scores'            => isset( $game_data['scores'] ) && is_array( $game_data['scores'] ) ? $game_data['scores'] : array(),
					'cumulative_score'  => isset( $game_data['cumulative_score'] ) ? (int) $game_data['cumulative_score'] : 0,
					'updated'           => isset( $game_data['updated'] ) ? (int) $game_data['updated'] : 0,
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
		$game    = get_post( $game_id );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type || 'publish' !== $game->post_status ) {
			return new WP_Error(
				'pointnet_games_game_not_found',
				__( 'Game not found.', 'pointnet-games' ),
				array( 'status' => 404 )
			);
		}

		$user_id = get_current_user_id();

		if ( ! $user_id ) {
			return new WP_Error(
				'pointnet_games_not_logged_in',
				__( 'You must be logged in.', 'pointnet-games' ),
				array( 'status' => 401 )
			);
		}

		// Rate limiting: throttle progress saves to prevent DB spam (max 1 save per 3s).
		$progress_limit_key = 'png_prog_limit_' . $user_id . '_' . $game_id;
		if ( get_transient( $progress_limit_key ) ) {
			return new WP_Error(
				'pointnet_games_rate_limited',
				__( 'Too many progress saves. Please wait a moment.', 'pointnet-games' ),
				array( 'status' => 429 )
			);
		}
		set_transient( $progress_limit_key, 1, 3 );

		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		$level    = isset( $params['level'] ) ? absint( $params['level'] ) : 0;
		$scores   = isset( $params['scores'] ) && is_array( $params['scores'] ) ? $params['scores'] : array();
		$is_reset = ! empty( $params['reset'] ) || ( 1 === $level && empty( $scores ) );

		/* Clamp level: support up to 500 levels. */
		$level = min( 500, max( 1, $level ) );

		$manifest  = get_post_meta( $game_id, '_pointnet_games_manifest', true );
		$max_score = ( is_array( $manifest ) && ! empty( $manifest['max_score'] ) ) ? absint( $manifest['max_score'] ) : 1000000;

		$progress = get_user_meta( $user_id, '_pointnet_games_progress', true );
		$progress = is_array( $progress ) ? $progress : array();
		$current  = isset( $progress[ $game_id ] ) ? $progress[ $game_id ] : array();

		$cumulative = 0;
		if ( $is_reset ) {
			$current['level']            = $level;
			$current['scores']           = array();
			$current['cumulative_score'] = 0;
			$current['updated']          = time();
			PointNet_Games_Leaderboard::reset_user_scores( $game_id, $user_id );
		} else {
			/* Save level directly (supports both forward progress and dev level jumps) */
			$current['level'] = $level;
			/* Merge per-level best scores, keeping the highest. */
			$existing = isset( $current['scores'] ) && is_array( $current['scores'] ) ? $current['scores'] : array();
			foreach ( $scores as $lvl => $val ) {
				$lvl = absint( $lvl );
				$val = absint( $val );
				if ( $lvl >= 1 && $lvl <= 500 && $val > 0 && $val <= $max_score ) {
					$existing[ $lvl ] = max( isset( $existing[ $lvl ] ) ? (int) $existing[ $lvl ] : 0, $val );
				}
			}
			foreach ( $existing as $val ) {
				$cumulative += absint( $val );
			}
			$current['scores']           = $existing;
			$current['cumulative_score'] = $cumulative;
			$current['updated']          = time();
		}

		$progress[ $game_id ] = $current;
		update_user_meta( $user_id, '_pointnet_games_progress', $progress );

		return rest_ensure_response(
			array(
				'success'          => true,
				'game_id'          => $game_id,
				'level'            => $current['level'],
				'cumulative_score' => $cumulative,
				'updated'          => $current['updated'],
			)
		);
	}

	/**
	 * Verify authentication and nonce for sensitive REST requests.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return true|WP_Error
	 */
	public function verify_authenticated_user( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_not_logged_in',
				__( 'Authentication required.', 'pointnet-games' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$nonce = $request->get_header( 'X-WP-Nonce' );
		if ( ! $nonce ) {
			return new WP_Error(
				'rest_missing_nonce',
				__( 'Missing X-WP-Nonce header.', 'pointnet-games' ),
				array( 'status' => 403 )
			);
		}

		$nonce = sanitize_text_field( $nonce );

		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new WP_Error(
				'rest_invalid_nonce',
				__( 'Invalid or expired nonce.', 'pointnet-games' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Backwards-compatibility wrapper for REST auth.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function verify_rest_auth( $request ) {
		$check = $this->verify_authenticated_user( $request );
		return true === $check;
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
	 * Sanitize meta attributes strictly. Rejects nested arrays to prevent DoS.
	 * Whitelists common gameplay meta keys and ensures scalar values.
	 *
	 * @param array $meta Meta array to sanitize.
	 *
	 * @return array
	 */
	private function sanitize_meta( $meta ) {
		$allowed_keys = array( 'difficulty', 'level', 'time_seconds', 'time', 'moves', 'combo', 'hints', 'shuffle' );
		$clean        = array();

		foreach ( $meta as $key => $value ) {
			$key = sanitize_key( $key );
			if ( ! in_array( $key, $allowed_keys, true ) ) {
				continue;
			}
			// Only scalar values allowed - strictly reject nested arrays/objects.
			if ( is_array( $value ) || is_object( $value ) ) {
				continue;
			}
			if ( is_numeric( $value ) ) {
				$clean[ $key ] = (float) $value;
			} else {
				$clean[ $key ] = sanitize_text_field( (string) $value );
			}
		}

		return $clean;
	}
}