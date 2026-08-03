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

global $wpdb;

// 1. Drop the custom scores table.
$table_name = $wpdb->prefix . 'pointnet_game_scores';
// Also drop the legacy pointnet_game_scores table from previous versions.
$legacy_table = $wpdb->prefix . 'pointnet_game_scores';

$wpdb->query( "DROP TABLE IF EXISTS {$table_name}" );
$wpdb->query( "DROP TABLE IF EXISTS {$legacy_table}" );

// 2. Delete plugin options.
delete_option( 'pointnet_games_settings' );
delete_option( 'pointnet_games_sync_fingerprint' );
delete_option( 'pointnet_games_settings' );
delete_option( 'pointnet_games_sync_fingerprint' );

// 3. Delete all game posts and their meta (both legacy and new CPT slugs).
$post_types = array( 'pointnet_game', 'pointnet_game' );

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

// 4. Delete auto-generated game pages (marked with legacy or new meta).
$game_page_meta_keys = array( '_pointnet_games_game_id', '_pointnet_games_game_id' );

foreach ( $game_page_meta_keys as $meta_key ) {
	$pages = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'numberposts'    => -1,
			'meta_key'       => $meta_key,
			'fields'         => 'ids',
		)
	);

	if ( ! empty( $pages ) ) {
		foreach ( $pages as $page_id ) {
			wp_delete_post( $page_id, true );
		}
	}
}

// 5. Delete the physical games/ directories (all bundled games).
$plugin_dir = WP_PLUGIN_DIR . '/pointnet-games';
if ( ! is_dir( $plugin_dir ) ) {
	$plugin_dir = WP_PLUGIN_DIR . '/pointnet-games';
}

$games_root = trailingslashit( $plugin_dir ) . 'games';

if ( is_dir( $games_root ) ) {
	$iterator = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $games_root, FilesystemIterator::SKIP_DOTS ),
		RecursiveIteratorIterator::CHILD_FIRST
	);

	foreach ( $iterator as $fileinfo ) {
		if ( $fileinfo->isDir() ) {
			@rmdir( $fileinfo->getRealPath() );
		} else {
			@unlink( $fileinfo->getRealPath() );
		}
	}

	@rmdir( $games_root );
}