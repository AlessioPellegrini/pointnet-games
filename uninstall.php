<?php
/**
 * Uninstall PointNet Games.
 *
 * Deletes tables, options, posts and game files created by the plugin.
 * Runs only when the plugin is deleted from WP Admin → Plugins.
 *
 * @package PointNet Games
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Perform all uninstall cleanup.
 */
function pointnet_games_uninstall() {
	global $wpdb;

	// 1. Drop the custom scores table.
	$table_name = $wpdb->prefix . 'pointnet_game_scores';
	$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table_name ) );

	// 2. Delete plugin options.
	delete_option( 'pointnet_games_settings' );
	delete_option( 'pointnet_games_sync_fingerprint' );

	// 3. Delete all game posts and their meta.
	$post_types = array( 'pointnet_game' );

	foreach ( $post_types as $post_type ) {
		$games = get_posts(
			array(
				'post_type'      => $post_type,
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'numberposts'    => -1,
				'fields'         => 'ids',
			)
		);

		if ( ! empty( $games ) ) {
			foreach ( $games as $game_id ) {
				wp_delete_post( $game_id, true );
			}
		}
	}

	// 4. Delete auto-generated game pages (marked with plugin meta).
	$game_page_meta_key = '_pointnet_games_game_id';

	$pages = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'numberposts'    => -1,
			'meta_query'     => array(
				array(
					'key'   => $game_page_meta_key,
					'value' => '',
					'compare' => '!=',
				),
			),
			'fields'         => 'ids',
		)
	);

	if ( ! empty( $pages ) ) {
		foreach ( $pages as $page_id ) {
			wp_delete_post( $page_id, true );
		}
	}

	// 5. Delete the physical games/ directory (all bundled games).
	$plugin_dir = WP_PLUGIN_DIR . '/pointnet-games';
	$games_root = trailingslashit( $plugin_dir ) . 'games';

	if ( is_dir( $games_root ) ) {
		// WP Filesystem is available during uninstall (WordPress admin context).
		require_once ABSPATH . 'wp-admin/includes/file.php';

		if ( function_exists( 'WP_Filesystem' ) ) {
			WP_Filesystem();
			global $wp_filesystem;

			if ( $wp_filesystem ) {
				$wp_filesystem->delete( $games_root, true, 'd' );
			}
		}
	}
}

pointnet_games_uninstall();