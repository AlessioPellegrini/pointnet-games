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
			'name'               => __( 'Giochi', 'pointnet-games' ),
			'singular_name'      => __( 'Gioco', 'pointnet-games' ),
			'menu_name'          => __( 'Giochi', 'pointnet-games' ),
			'add_new'            => __( 'Aggiungi gioco', 'pointnet-games' ),
			'add_new_item'       => __( 'Aggiungi nuovo gioco', 'pointnet-games' ),
			'edit_item'          => __( 'Modifica gioco', 'pointnet-games' ),
			'new_item'           => __( 'Nuovo gioco', 'pointnet-games' ),
			'view_item'          => __( 'Vedi gioco', 'pointnet-games' ),
			'search_items'       => __( 'Cerca giochi', 'pointnet-games' ),
			'not_found'          => __( 'Nessun gioco trovato', 'pointnet-games' ),
			'not_found_in_trash' => __( 'Nessun gioco nel cestino', 'pointnet-games' ),
			'all_items'          => __( 'Tutti i giochi', 'pointnet-games' ),
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
			'name'              => __( 'Categorie Giochi', 'pointnet-games' ),
			'singular_name'     => __( 'Categoria Gioco', 'pointnet-games' ),
			'search_items'      => __( 'Cerca categorie', 'pointnet-games' ),
			'all_items'         => __( 'Tutte le categorie', 'pointnet-games' ),
			'parent_item'       => __( 'Categoria padre', 'pointnet-games' ),
			'parent_item_colon' => __( 'Categoria padre:', 'pointnet-games' ),
			'edit_item'         => __( 'Modifica categoria', 'pointnet-games' ),
			'update_item'       => __( 'Aggiorna categoria', 'pointnet-games' ),
			'add_new_item'      => __( 'Aggiungi nuova categoria', 'pointnet-games' ),
			'new_item_name'     => __( 'Nuovo nome categoria', 'pointnet-games' ),
			'menu_name'         => __( 'Categorie', 'pointnet-games' ),
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