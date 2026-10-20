<?php
/**
 * Uninstall PointNet Games.
 *
 * Runs only when the plugin is deleted from WP Admin → Plugins.
 * Follows WordPress best practices: preserves scores, CPT data and uploaded games
 * unless explicitly configured in "PointNet Games → Settings → Disinstallazione & Pulizia Dati".
 *
 * @package PointNet Games
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Perform uninstall cleanup based on admin settings.
 */
function pointnet_games_uninstall() {
	global $wpdb;

	$settings      = get_option( 'pointnet_games_settings', array() );
	$delete_data   = ! empty( $settings['delete_data_on_uninstall'] );
	$delete_games  = ! empty( $settings['delete_games_on_uninstall'] );

	// 1. Delete custom scores table and game CPTs only if requested.
	if ( $delete_data ) {
		$table_name = $wpdb->prefix . 'pointnet_game_scores';
		$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table_name ) );

		// Delete all game posts and their meta.
		$games = get_posts(
			array(
				'post_type'      => 'pointnet_game',
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

		// Delete auto-generated legacy game pages.
		$pages = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'numberposts'    => -1,
				'meta_query'     => array(
					array(
						'key'     => '_pointnet_games_game_id',
						'value'   => '',
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
	}

	// 2. Delete plugin options.
	delete_option( 'pointnet_games_settings' );
	delete_option( 'pointnet_games_sync_fingerprint' );

	// 3. Delete uploaded games directory (wp-content/uploads/pointnet-games/) only if requested.
	require_once ABSPATH . 'wp-admin/includes/file.php';
	if ( function_exists( 'WP_Filesystem' ) ) {
		WP_Filesystem();
		global $wp_filesystem;

		if ( $wp_filesystem ) {
			// Legacy bundled games directory (inside plugin folder being deleted anyway).
			$plugin_dir = WP_PLUGIN_DIR . '/pointnet-games';
			$games_root = trailingslashit( $plugin_dir ) . 'games';
			if ( is_dir( $games_root ) ) {
				$wp_filesystem->delete( $games_root, true, 'd' );
			}

			// External uploads games directory.
			if ( $delete_games ) {
				$upload_dir    = wp_upload_dir();
				$uploads_games = trailingslashit( $upload_dir['basedir'] ) . 'pointnet-games';
				if ( is_dir( $uploads_games ) ) {
					$wp_filesystem->delete( $uploads_games, true, 'd' );
				}
			}
		}
	}
}

pointnet_games_uninstall();
