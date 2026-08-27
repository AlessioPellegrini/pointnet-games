<?php
/**
 * Activation / deactivation hooks, DB table creation.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Install
 */
class PointNet_Games_Install {

	/**
	 * Run on plugin activation.
	 */
	public static function activate() {
		self::create_tables();
		self::seed_default_settings();

		// Register bundled games as CPT posts.
		if ( class_exists( 'PointNet_Games_Game_Registry' ) ) {
			PointNet_Games_Game_Registry::sync_all_games();
		}

		flush_rewrite_rules();
	}

	/**
	 * Run on plugin deactivation.
	 */
	public static function deactivate() {
		flush_rewrite_rules();
	}

	/**
	 * Create the custom scores table.
	 */
	public static function create_tables() {
		global $wpdb;

		$table_name      = pointnet_games_scores_table();
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			game_id BIGINT(20) UNSIGNED NOT NULL,
			user_id BIGINT(20) UNSIGNED NULL DEFAULT NULL,
			nickname VARCHAR(50) NOT NULL,
			score BIGINT(20) NOT NULL DEFAULT 0,
			score_meta TEXT NULL,
			played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			ip_hash VARCHAR(64) NULL,
			user_agent VARCHAR(255) NULL,
			validated TINYINT(1) NOT NULL DEFAULT 0,
			PRIMARY KEY  (id),
			KEY game_id (game_id),
			KEY score (score),
			KEY nickname (nickname)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Set default plugin settings on first activation.
	 */
	public static function seed_default_settings() {
		$defaults = array(
			'rate_limit'         => 5,
			'require_validation' => 0,
		);

		if ( false === get_option( 'pointnet_games_settings' ) ) {
			add_option( 'pointnet_games_settings', $defaults );
		}
	}
}