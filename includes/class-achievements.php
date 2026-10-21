<?php
/**
 * Player Achievements & Badges Engine.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Achievements
 */
class PointNet_Games_Achievements {

	/**
	 * Meta key used to store unlocked achievements in wp_usermeta.
	 */
	const USER_META_KEY = '_pointnet_games_achievements';

	/**
	 * Get the list of all available achievements.
	 *
	 * @return array
	 */
	public static function get_definitions() {
		return array(
			'first_blood' => array(
				'id'          => 'first_blood',
				'title'       => __( 'First Blood', 'pointnet-games' ),
				'description' => __( 'Submit your first verified score in any arcade game.', 'pointnet-games' ),
				'icon'        => '🎯',
				'rarity'      => 'common',
			),
			'podium_finisher' => array(
				'id'          => 'podium_finisher',
				'title'       => __( 'Podium Finisher', 'pointnet-games' ),
				'description' => __( 'Reach the Top 3 on any game leaderboard.', 'pointnet-games' ),
				'icon'        => '🥉',
				'rarity'      => 'rare',
			),
			'arcade_champion' => array(
				'id'          => 'arcade_champion',
				'title'       => __( 'Arcade Champion', 'pointnet-games' ),
				'description' => __( 'Claim the #1 spot on any game leaderboard.', 'pointnet-games' ),
				'icon'        => '👑',
				'rarity'      => 'epic',
			),
			'arcade_explorer' => array(
				'id'          => 'arcade_explorer',
				'title'       => __( 'Arcade Explorer', 'pointnet-games' ),
				'description' => __( 'Play and record a score in at least 2 different arcade games.', 'pointnet-games' ),
				'icon'        => '🕹️',
				'rarity'      => 'uncommon',
			),
			'veteran_player' => array(
				'id'          => 'veteran_player',
				'title'       => __( 'Veteran Player', 'pointnet-games' ),
				'description' => __( 'Record 10 or more verified game scores.', 'pointnet-games' ),
				'icon'        => '⚡',
				'rarity'      => 'rare',
			),
			'high_roller' => array(
				'id'          => 'high_roller',
				'title'       => __( 'High Roller', 'pointnet-games' ),
				'description' => __( 'Score 10,000 points or more in a single game session.', 'pointnet-games' ),
				'icon'        => '💎',
				'rarity'      => 'epic',
			),
		);
	}

	/**
	 * Retrieve all unlocked achievements for a specific user.
	 *
	 * @param int $user_id User ID.
	 * @return array Array of unlocked achievement data keyed by achievement ID.
	 */
	public static function get_user_achievements( $user_id ) {
		$user_id = absint( $user_id );
		if ( ! $user_id ) {
			return array();
		}

		$raw = get_user_meta( $user_id, self::USER_META_KEY, true );
		if ( ! is_array( $raw ) ) {
			return array();
		}

		return $raw;
	}

	/**
	 * Check if a user has unlocked a specific achievement.
	 *
	 * @param int    $user_id        User ID.
	 * @param string $achievement_id Achievement identifier.
	 * @return bool
	 */
	public static function has_unlocked( $user_id, $achievement_id ) {
		$unlocked = self::get_user_achievements( $user_id );
		return isset( $unlocked[ $achievement_id ] );
	}

	/**
	 * Unlock an achievement for a user.
	 *
	 * @param int    $user_id        User ID.
	 * @param string $achievement_id Achievement identifier.
	 * @param array  $context        Optional context metadata (e.g. game_id, score).
	 * @return bool True if newly unlocked, false if already unlocked or invalid user.
	 */
	public static function unlock( $user_id, $achievement_id, $context = array() ) {
		$user_id = absint( $user_id );
		if ( ! $user_id ) {
			return false;
		}

		$definitions = self::get_definitions();
		if ( ! isset( $definitions[ $achievement_id ] ) ) {
			return false;
		}

		$unlocked = self::get_user_achievements( $user_id );
		if ( isset( $unlocked[ $achievement_id ] ) ) {
			return false; // Already unlocked.
		}

		$unlocked[ $achievement_id ] = array_merge(
			array(
				'unlocked_at' => current_time( 'mysql', 1 ), // UTC
			),
			$context
		);

		update_user_meta( $user_id, self::USER_META_KEY, $unlocked );

		do_action( 'pointnet_games_achievement_unlocked', $user_id, $achievement_id, $unlocked[ $achievement_id ] );

		return true;
	}

	/**
	 * Evaluate potential achievements upon a newly submitted score.
	 *
	 * @param int $user_id  User ID.
	 * @param int $game_id  Game post ID.
	 * @param int $score    Score value.
	 * @param int $position Leaderboard position achieved (or null).
	 * @return array Newly unlocked achievement definitions.
	 */
	public static function evaluate_on_score( $user_id, $game_id, $score, $position = null ) {
		global $wpdb;

		$user_id = absint( $user_id );
		if ( ! $user_id ) {
			return array();
		}

		$definitions    = self::get_definitions();
		$unlocked       = self::get_user_achievements( $user_id );
		$newly_unlocked = array();

		// 1. First Blood: first verified score ever.
		if ( ! isset( $unlocked['first_blood'] ) ) {
			self::unlock( $user_id, 'first_blood', array( 'game_id' => $game_id ) );
			$newly_unlocked[] = $definitions['first_blood'];
		}

		// 2. High Roller: single score >= 10,000.
		if ( ! isset( $unlocked['high_roller'] ) && $score >= 10000 ) {
			self::unlock( $user_id, 'high_roller', array( 'game_id' => $game_id, 'score' => $score ) );
			$newly_unlocked[] = $definitions['high_roller'];
		}

		// 3. Podium Finisher: Top 3 position.
		if ( ! isset( $unlocked['podium_finisher'] ) && null !== $position && $position >= 1 && $position <= 3 ) {
			self::unlock( $user_id, 'podium_finisher', array( 'game_id' => $game_id, 'position' => $position ) );
			$newly_unlocked[] = $definitions['podium_finisher'];
		}

		// 4. Arcade Champion: #1 spot on any game leaderboard.
		if ( ! isset( $unlocked['arcade_champion'] ) && 1 === (int) $position ) {
			self::unlock( $user_id, 'arcade_champion', array( 'game_id' => $game_id ) );
			$newly_unlocked[] = $definitions['arcade_champion'];
		}

		// 5. Query user game statistics if multi-game or volume achievements are still locked.
		$needs_stats = ( ! isset( $unlocked['arcade_explorer'] ) || ! isset( $unlocked['veteran_player'] ) );
		if ( $needs_stats ) {
			$table = pointnet_games_scores_table();

			$stats = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT COUNT(id) as total_scores, COUNT(DISTINCT game_id) as distinct_games
					 FROM %i
					 WHERE user_id = %d AND validated = 1",
					$table,
					$user_id
				)
			);

			if ( $stats ) {
				$distinct_games = (int) $stats->distinct_games;
				$total_scores   = (int) $stats->total_scores;

				// Arcade Explorer: played at least 2 distinct games.
				if ( ! isset( $unlocked['arcade_explorer'] ) && $distinct_games >= 2 ) {
					self::unlock( $user_id, 'arcade_explorer', array( 'distinct_games' => $distinct_games ) );
					$newly_unlocked[] = $definitions['arcade_explorer'];
				}

				// Veteran Player: recorded 10 or more scores.
				if ( ! isset( $unlocked['veteran_player'] ) && $total_scores >= 10 ) {
					self::unlock( $user_id, 'veteran_player', array( 'total_scores' => $total_scores ) );
					$newly_unlocked[] = $definitions['veteran_player'];
				}
			}
		}

		return $newly_unlocked;
	}
}
