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

		$user_id      = absint( $user_id );
		$game_id      = absint( $game_id );
		$score        = max( 0, absint( $score ) );
		$nickname     = self::sanitize_nickname( $nickname );
		$settings     = get_option( 'pointnet_games_settings', array() );
		$allow_anon   = (int) $settings['allow_anonymous'] ?? 1;

		// Anonymous users not allowed, or no nickname for anonymous.
		if ( ! $user_id ) {
			if ( ! $allow_anon ) {
				return false;
			}
			if ( empty( $nickname ) ) {
				$nickname = __( 'Anonimo', 'pointnet-games' );
			}
		} else {
			// Registered users: nickname is resolved dynamically at display time
			// using the unique user_login — no need to store it.
			$nickname = '';
		}

		// Game must exist and be published.
		$game = get_post( $game_id );
		if ( ! $game || 'publish' !== $game->post_status || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type ) {
			return false;
		}

		$require_validation = (int) $settings['require_validation'] ?? 0;

		$data = array(
			'game_id'     => $game_id,
			'user_id'     => $user_id ? $user_id : null,
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

		// Optional validation filter, defaults to validated scores only.
		$validated_sql = '';
		$settings      = get_option( 'pointnet_games_settings', array() );
		$require_validation = (int) $settings['require_validation'] ?? 0;
		if ( $require_validation ) {
			$validated_sql = " AND s1.validated = 1 AND s2.validated = 1";
		}

		// Optional difficulty filter (from JSON score_meta, e.g. {"difficulty": "easy"}).
		// The filter must apply to BOTH sides of the join so the "best score per
		// player" comparison happens within the same difficulty only.
		$difficulty_sql = '';
		$difficulty_join_sql = '';
		if ( ! empty( $filters['difficulty'] ) ) {
			$difficulty = sanitize_text_field( $filters['difficulty'] );
			$difficulty_sql = $wpdb->prepare(
				" AND JSON_UNQUOTE(JSON_EXTRACT(s1.score_meta, '$.difficulty')) = %s",
				$difficulty
			);
			$difficulty_join_sql = $wpdb->prepare(
				" AND JSON_UNQUOTE(JSON_EXTRACT(s2.score_meta, '$.difficulty')) = %s",
				$difficulty
			);
		}

		// Only the best score per player (registered user_id or anonymous ip_hash).
		$sql = $wpdb->prepare(
			"SELECT s1.id, s1.game_id, s1.user_id, s1.nickname, s1.score, s1.score_meta, s1.played_at
			 FROM {$table} s1
			 LEFT JOIN {$table} s2 ON s1.game_id = s2.game_id
			     AND s1.score < s2.score
			     {$difficulty_join_sql}
			     AND COALESCE(CONCAT('u', s1.user_id), CONCAT('ip_', s1.ip_hash)) = COALESCE(CONCAT('u', s2.user_id), CONCAT('ip_', s2.ip_hash))
			 WHERE s1.game_id = %d
			   AND s2.id IS NULL
			 {$difficulty_sql}
			 {$validated_sql}
			 ORDER BY s1.score DESC, s1.played_at ASC
			 LIMIT %d OFFSET %d",
			$game_id,
			$limit,
			$offset
		);

		$rows = $wpdb->get_results( $sql, ARRAY_A );

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

		$settings      = get_option( 'pointnet_games_settings', array() );
		$require_validation = (int) $settings['require_validation'] ?? 0;
		$validated_sql = $require_validation ? ' AND s1.validated = 1 AND s2.validated = 1' : '';

		// Only the best score per player across all games.
		$sql = $wpdb->prepare(
			"SELECT s1.id, s1.game_id, s1.user_id, s1.nickname, s1.score, s1.score_meta, s1.played_at,
			        p.post_title as game_title
			 FROM {$table} s1
			 LEFT JOIN {$table} s2 ON s1.score < s2.score
			     AND COALESCE(CONCAT('u', s1.user_id), CONCAT('ip_', s1.ip_hash)) = COALESCE(CONCAT('u', s2.user_id), CONCAT('ip_', s2.ip_hash))
			 LEFT JOIN {$wpdb->posts} p ON p.ID = s1.game_id
			 WHERE s2.id IS NULL
			 {$validated_sql}
			 ORDER BY s1.score DESC, s1.played_at ASC
			 LIMIT %d",
			$limit
		);

		$rows = $wpdb->get_results( $sql, ARRAY_A );

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
	 * @param int $game_id Game post ID.
	 * @param int $user_id WP user ID.
	 * @param string $nickname Anonymous nickname.
	 *
	 * @return int|null Position (1-based) or null if no score.
	 */
	public static function get_player_position( $game_id, $user_id = 0, $nickname = '' ) {
		global $wpdb;

		$table  = pointnet_games_scores_table();
		$game_id = absint( $game_id );

		$settings      = get_option( 'pointnet_games_settings', array() );
		$require_validation = (int) $settings['require_validation'] ?? 0;
		$validated_sql = $require_validation ? ' AND validated = 1' : '';

		// Build the player lookup clause.
		if ( $user_id ) {
			$where = $wpdb->prepare( "user_id = %d", $user_id );
		} else {
			$where = $wpdb->prepare( "nickname = %s", $nickname );
		}

		$best_score = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT MAX(score) FROM {$table} WHERE game_id = %d AND {$where} {$validated_sql}",
				$game_id
			)
		);

		if ( null === $best_score ) {
			return null;
		}

		$position = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) + 1 FROM {$table}
				 WHERE game_id = %d AND score > %d {$validated_sql}",
				$game_id,
				(int) $best_score
			)
		);

		return (int) $position;
	}

	/**
	 * Replace the stored nickname with the current WordPress user_login
	 * for registered users (guaranteed unique by WordPress).
	 * Anonymous entries keep their stored nickname ("Anonimo").
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
				"SELECT COUNT(*) FROM {$table}
				 WHERE game_id = %d AND ip_hash = %s AND played_at >= %s",
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
			$nickname = __( 'Anonimo', 'pointnet-games' );
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