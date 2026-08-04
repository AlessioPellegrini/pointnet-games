<?php
/**
 * Custom post types for games.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Post_Types
 */
class PointNet_Games_Post_Types {

	/**
	 * Post type slug.
	 */
	const GAME_CPT = 'pointnet_game';

	/**
	 * Register hooks.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_game_cpt' ) );
		add_action( 'init', array( $this, 'register_game_category_taxonomy' ) );
	}

	/**
	 * Register the pointnet_game custom post type.
	 */
	public function register_game_cpt() {
		$labels = array(
			'name'               => __( 'Games', 'pointnet-games' ),
			'singular_name'      => __( 'Game', 'pointnet-games' ),
			'menu_name'          => __( 'Games', 'pointnet-games' ),
			'add_new'            => __( 'Add Game', 'pointnet-games' ),
			'add_new_item'       => __( 'Add New Game', 'pointnet-games' ),
			'edit_item'          => __( 'Edit Game', 'pointnet-games' ),
			'new_item'           => __( 'New Game', 'pointnet-games' ),
			'view_item'          => __( 'View Game', 'pointnet-games' ),
			'search_items'       => __( 'Search Games', 'pointnet-games' ),
			'not_found'          => __( 'No games found', 'pointnet-games' ),
			'not_found_in_trash' => __( 'No games found in trash', 'pointnet-games' ),
			'all_items'          => __( 'All Games', 'pointnet-games' ),
		);

		$args = array(
			'labels'       => $labels,
			'public'       => true,
			'show_in_rest' => true,
			'menu_icon'    => 'dashicons-games',
			'menu_position' => 25,
			'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
			'has_archive'  => true,
			'rewrite'      => array( 'slug' => 'games' ),
			'taxonomies'   => array( 'pointnet_game_category' ),
		);

		register_post_type( self::GAME_CPT, $args );
	}

	/**
	 * Register taxonomy for game categories.
	 */
	public function register_game_category_taxonomy() {
		$labels = array(
			'name'              => __( 'Game Categories', 'pointnet-games' ),
			'singular_name'     => __( 'Game Category', 'pointnet-games' ),
			'search_items'      => __( 'Search Categories', 'pointnet-games' ),
			'all_items'         => __( 'All Categories', 'pointnet-games' ),
			'parent_item'       => __( 'Parent Category', 'pointnet-games' ),
			'parent_item_colon' => __( 'Parent Category:', 'pointnet-games' ),
			'edit_item'         => __( 'Edit Category', 'pointnet-games' ),
			'update_item'       => __( 'Update Category', 'pointnet-games' ),
			'add_new_item'      => __( 'Add New Category', 'pointnet-games' ),
			'new_item_name'     => __( 'New Category Name', 'pointnet-games' ),
			'menu_name'         => __( 'Categories', 'pointnet-games' ),
		);

		$args = array(
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'game-category' ),
		);

		register_taxonomy( 'pointnet_game_category', self::GAME_CPT, $args );
	}
}