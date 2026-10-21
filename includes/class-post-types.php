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
		add_filter( 'manage_pointnet_game_posts_columns', array( $this, 'set_custom_columns' ) );
		add_action( 'manage_pointnet_game_posts_custom_column', array( $this, 'render_custom_column' ), 10, 2 );
	}

	/**
	 * Register the pointnet_game custom post type.
	 */
	public function register_game_cpt() {
		$labels = array(
			'name'               => __( 'Games', 'pointnet-games' ),
			'singular_name'      => __( 'Game', 'pointnet-games' ),
			'menu_name'          => __( 'Installed Games', 'pointnet-games' ),
			'all_items'          => __( 'Installed Games', 'pointnet-games' ),
			'edit_item'          => __( 'Edit Game', 'pointnet-games' ),
			'view_item'          => __( 'View Game', 'pointnet-games' ),
			'search_items'       => __( 'Search Games', 'pointnet-games' ),
			'not_found'          => __( 'No games found', 'pointnet-games' ),
			'not_found_in_trash' => __( 'No games found in trash', 'pointnet-games' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => true,
			'show_in_rest'        => true,
			'show_in_menu'        => 'pointnet-games',
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
			'has_archive'         => true,
			'rewrite'             => array( 'slug' => 'games' ),
			'taxonomies'          => array( 'pointnet_game_category' ),
			'capability_type'     => 'post',
			'map_meta_cap'        => true,
			'capabilities'        => array(
				'create_posts' => 'do_not_allow',
			),
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

	/**
	 * Define custom admin columns for the Installed Games list table.
	 *
	 * @param array $columns Existing columns.
	 * @return array
	 */
	public function set_custom_columns( $columns ) {
		$new_columns = array();

		foreach ( $columns as $key => $title ) {
			$new_columns[ $key ] = $title;
			if ( 'title' === $key ) {
				$new_columns['game_id']   = __( 'Game ID', 'pointnet-games' );
				$new_columns['game_slug'] = __( 'Slug', 'pointnet-games' );
				$new_columns['shortcode'] = __( 'Shortcode', 'pointnet-games' );
			}
		}

		return $new_columns;
	}

	/**
	 * Render custom column contents for games.
	 *
	 * @param string $column  Column name.
	 * @param int    $post_id Post ID.
	 */
	public function render_custom_column( $column, $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}

		switch ( $column ) {
			case 'game_id':
				echo '<code>' . (int) $post_id . '</code>';
				break;

			case 'game_slug':
				echo '<code>' . esc_html( $post->post_name ) . '</code>';
				break;

			case 'shortcode':
				$code = '[pointnet_game id="' . (int) $post_id . '"]';
				echo '<input type="text" readonly value="' . esc_attr( $code ) . '" class="code" style="width: 220px; font-size: 12px; background: #f6f7f7; cursor: pointer;" onclick="this.select(); navigator.clipboard.writeText(this.value);" title="' . esc_attr__( 'Click to copy', 'pointnet-games' ) . '" />';
				break;
		}
	}
}