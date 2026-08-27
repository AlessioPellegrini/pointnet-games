<?php
/**
 * Leaderboard & score storage logic.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Leaderboard
 */
class PointNet_Games_Leaderboard {

	/**
	 * Insert a new score into the database.
	 *
	 * @param int    $game_id      The game post ID.
	 * @param int    $score        Score value.
	 * @param string $nickname     Nickname for anonymous users.
	 * @param array  $meta         Optional score meta (level, time, difficulty...).
	 * @param int    $user_id      WP user ID (0 for anonymous).
	 *
	 * @return int|false Inserted row ID, or false on failure.
	 */
	public static function insert_score( $game_id, $score, $nickname = '', $meta = array(), $user_id = 0 ) {
		global $wpdb;

		$table = pointnet_games_scores_table();

		$user_id = absint( $user_id );
		$game_id = absint( $game_id );
		$score   = max( 0, absint( $score ) );

		// Only registered users are allowed to save scores to the leaderboard.
		if ( ! $user_id ) {
			return false;
		}

		$nickname = '';

		// Game must exist and be published.
		$game = get_post( $game_id );
		if ( ! $game || 'publish' !== $game->post_status || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type ) {
			return false;
		}

		$settings           = get_option( 'pointnet_games_settings', array() );
		$require_validation = (int) $settings['require_validation'] ?? 0;

		$data = array(
			'game_id'     => $game_id,
			'user_id'     => $user_id,
			'nickname'    => $nickname,
			'score'       => $score,
			'score_meta'  => wp_json_encode( $meta ),
			'played_at'   => current_time( 'mysql' ),
			'ip_hash'     => self::get_ip_hash(),
			'user_agent'  => self::get_user_agent(),
			'validated'   => $require_validation ? 0 : 1,
		);

		$result = $wpdb->insert( $table, $data );

		if ( false === $result ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Get the leaderboard for a specific game.
	 *
	 * @param int   $game_id Game post ID.
	 * @param int   $limit   Max results.
	 * @param int   $offset  Offset for pagination.
	 * @param array $filters Optional filters (difficulty, period...).
	 *
	 * @return array
	 */
	public static function get_leaderboard( $game_id, $limit = 10, $offset = 0, $filters = array() ) {
		global $wpdb;

		$table = pointnet_games_scores_table();
		$limit = min( max( 1, absint( $limit ) ), 100 );
		$offset = max( 0, absint( $offset ) );

		$settings           = get_option( 'pointnet_games_settings', array() );
		$require_validation = (int) $settings['require_validation'] ?? 0;

		// Difficulty filter value (empty string = filter disabled).
		$difficulty = ! empty( $filters['difficulty'] ) ? sanitize_text_field( $filters['difficulty'] ) : '';

		// Only the best score per registered user.
		// Optional filters use the ( %d = 0 OR ... ) / ( %s = '' OR ... ) pattern:
		// passing 0/'' disables the condition while keeping every placeholder
		// statically inside the SQL string passed to $wpdb->prepare().
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT s1.id, s1.game_id, s1.user_id, s1.nickname, s1.score, s1.score_meta, s1.played_at
				 FROM %i s1
				 LEFT JOIN %i s2 ON s1.game_id = s2.game_id
				     AND s1.score < s2.score
				     AND ( %d = 0 OR ( s1.validated = 1 AND s2.validated = 1 ) )
				     AND ( %s = '' OR JSON_UNQUOTE(JSON_EXTRACT(s2.score_meta, '$.difficulty')) = %s )
				     AND s1.user_id = s2.user_id
				 WHERE s1.game_id = %d
				   AND s1.user_id > 0
				   AND s2.id IS NULL
				   AND ( %s = '' OR JSON_UNQUOTE(JSON_EXTRACT(s1.score_meta, '$.difficulty')) = %s )
				 ORDER BY s1.score DESC, s1.played_at ASC
				 LIMIT %d OFFSET %d",
				$table,
				$table,
				$require_validation,
				$difficulty,
				$difficulty,
				$game_id,
				$difficulty,
				$difficulty,
				$limit,
				$offset
			),
			ARRAY_A
		);

		if ( empty( $rows ) ) {
			return array();
		}

		// Attach position.
		foreach ( $rows as $index => $row ) {
			$rows[ $index ]['position'] = $offset + $index + 1;
			$rows[ $index ]['meta']     = json_decode( $row['score_meta'], true ) ?: array();
			unset( $rows[ $index ]['score_meta'] );
		}

		// Resolve registered users' display names dynamically (single bulk query).
		$rows = self::resolve_registered_nicknames( $rows );

		return $rows;
	}

	/**
	 * Get the global leaderboard across all games.
	 *
	 * @param int $limit Max results.
	 *
	 * @return array
	 */
	public static function get_global_leaderboard( $limit = 20 ) {
		global $wpdb;

		$table = pointnet_games_scores_table();
		$limit = min( max( 1, absint( $limit ) ), 100 );

		$settings           = get_option( 'pointnet_games_settings', array() );
		$require_validation = (int) $settings['require_validation'] ?? 0;

		// Only the best score per registered user across all games.
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT s1.id, s1.game_id, s1.user_id, s1.nickname, s1.score, s1.score_meta, s1.played_at,
				        p.post_title as game_title
				 FROM %i s1
				 LEFT JOIN %i s2 ON s1.score < s2.score
				     AND ( %d = 0 OR ( s1.validated = 1 AND s2.validated = 1 ) )
				     AND s1.user_id = s2.user_id
				 LEFT JOIN %i p ON p.ID = s1.game_id
				 WHERE s1.user_id > 0
				   AND s2.id IS NULL
				 ORDER BY s1.score DESC, s1.played_at ASC
				 LIMIT %d",
				$table,
				$table,
				$require_validation,
				$wpdb->posts,
				$limit
			),
			ARRAY_A
		);

		foreach ( $rows as $index => $row ) {
			$rows[ $index ]['position'] = $index + 1;
			$rows[ $index ]['meta']     = json_decode( $row['score_meta'], true ) ?: array();
			unset( $rows[ $index ]['score_meta'] );
		}

		// Resolve registered users' display names dynamically (single bulk query).
		$rows = self::resolve_registered_nicknames( $rows );

		return $rows;
	}

	/**
	 * Get a player's best position for a given game.
	 *
	 * @param int    $game_id  Game post ID.
	 * @param int    $user_id  WP user ID.
	 * @param string $nickname Optional nickname (unused, kept for compatibility).
	 *
	 * @return int|null Position (1-based) or null if no score.
	 */
	public static function get_player_position( $game_id, $user_id = 0, $nickname = '' ) {
		global $wpdb;

		$table   = pointnet_games_scores_table();
		$game_id = absint( $game_id );
		$user_id = absint( $user_id );

		if ( ! $user_id ) {
			return null;
		}

		$settings           = get_option( 'pointnet_games_settings', array() );
		$require_validation = (int) $settings['require_validation'] ?? 0;

		$best_score = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT MAX(score) FROM %i WHERE ( %d = 0 OR validated = 1 ) AND user_id = %d AND game_id = %d',
				$table,
				$require_validation,
				$user_id,
				$game_id
			)
		);

		if ( null === $best_score ) {
			return null;
		}

		$position = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT COUNT(*) + 1 FROM %i WHERE ( %d = 0 OR validated = 1 ) AND user_id > 0 AND game_id = %d AND score > %d',
				$table,
				$require_validation,
				$game_id,
				(int) $best_score
			)
		);

		return (int) $position;
	}

	/**
	 * Replace the stored nickname with the current WordPress user_login
	 * for registered users (guaranteed unique by WordPress).
	 * Anonymous entries keep their stored nickname ("Anonymous").
	 *
	 * @param array $rows Leaderboard rows (ARRAY_A).
	 *
	 * @return array Rows with updated nicknames.
	 */
	private static function resolve_registered_nicknames( $rows ) {
		$user_ids = array();
		foreach ( $rows as $row ) {
			if ( ! empty( $row['user_id'] ) ) {
				$user_ids[] = (int) $row['user_id'];
			}
		}

		if ( empty( $user_ids ) ) {
			return $rows;
		}

		$user_ids = array_values( array_unique( $user_ids ) );

		$users = get_users(
			array(
				'include' => $user_ids,
				'fields'  => array( 'ID', 'user_login' ),
			)
		);

		$user_logins = array();
		foreach ( $users as $user ) {
			$user_logins[ (int) $user->ID ] = $user->user_login;
		}

		foreach ( $rows as $index => $row ) {
			$uid = (int) ( $row['user_id'] ?? 0 );
			if ( $uid && isset( $user_logins[ $uid ] ) ) {
				$rows[ $index ]['nickname'] = $user_logins[ $uid ];
			}
		}

		return $rows;
	}

	/**
	 * Check rate limiting for a given IP.
	 *
	 * @param int $game_id Game post ID.
	 *
	 * @return bool True if allowed, false if rate limited.
	 */
	public static function check_rate_limit( $game_id ) {
		global $wpdb;

		$settings = get_option( 'pointnet_games_settings', array() );
		$rate_limit = (int) $settings['rate_limit'] ?? 5;

		if ( $rate_limit <= 0 ) {
			return true;
		}

		$table   = pointnet_games_scores_table();
		$ip_hash = self::get_ip_hash();
		$time    = gmdate( 'Y-m-d H:i:s', strtotime( '-1 minute' ) );

		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM %i
				 WHERE game_id = %d AND ip_hash = %s AND played_at >= %s",
				$table,
				$game_id,
				$ip_hash,
				$time
			)
		);

		return $count < $rate_limit;
	}

	/**
	 * Sanitize a nickname.
	 *
	 * @param string $nickname Raw nickname.
	 *
	 * @return string
	 */
	public static function sanitize_nickname( $nickname ) {
		$settings = get_option( 'pointnet_games_settings', array() );
		$min      = (int) $settings['nickname_min_length'] ?? 3;
		$max      = (int) $settings['nickname_max_length'] ?? 20;

		$nickname = sanitize_text_field( $nickname );
		$nickname = preg_replace( '/[^A-Za-z0-9_\-\x{00C0}-\x{017F} ]/u', '', $nickname );
		$nickname = trim( $nickname );

		// Apply length limits (with fallback if mbstring is not installed).
		$len = function_exists( 'mb_strlen' ) ? mb_strlen( $nickname ) : strlen( $nickname );
		if ( $len < $min ) {
			$nickname = __( 'Anonymous', 'pointnet-games' );
		} elseif ( $len > $max ) {
			$nickname = function_exists( 'mb_substr' ) ? mb_substr( $nickname, 0, $max ) : substr( $nickname, 0, $max );
		}

		return $nickname;
	}

	/**
	 * Generate a SHA256 hash of the visitor IP.
	 *
	 * @return string
	 */
	private static function get_ip_hash() {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';

		return hash( 'sha256', $ip . wp_salt( 'auth' ) );
	}

	/**
	 * Get sanitized user agent string.
	 *
	 * @return string
	 */
	private static function get_user_agent() {
		$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';

		return function_exists( 'mb_substr' ) ? mb_substr( $ua, 0, 255 ) : substr( $ua, 0, 255 );
	}
}