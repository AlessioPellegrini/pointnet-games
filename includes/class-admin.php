<?php
/**
 * Admin interface: menu, settings, score management.
 *
 * @package PointNet Games
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PointNet_Games_Admin
 */
class PointNet_Games_Admin {

	/**
	 * Register hooks.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_init', array( $this, 'handle_uninstall_game' ) );
	}

	/**
	 * Register the admin menu pages.
	 */
	public function register_admin_menu() {
		add_menu_page(
			__( 'PointNet Games', 'pointnet-games' ),
			__( 'PointNet Games', 'pointnet-games' ),
			'manage_options',
			'pointnet-games',
			array( $this, 'render_dashboard_page' ),
			'dashicons-games',
			26
		);

		add_submenu_page(
			'pointnet-games',
			__( 'Punteggi', 'pointnet-games' ),
			__( 'Punteggi', 'pointnet-games' ),
			'manage_options',
			'pointnet-games-scores',
			array( $this, 'render_scores_page' )
		);

		add_submenu_page(
			'pointnet-games',
			__( 'Impostazioni', 'pointnet-games' ),
			__( 'Impostazioni', 'pointnet-games' ),
			'manage_options',
			'pointnet-games-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Register plugin settings.
	 */
	public function register_settings() {
		register_setting(
			'pointnet_games_settings_group',
			'pointnet_games_settings',
			array(
				'type'              => 'array',
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
			)
		);
	}

	/**
	 * Render the dashboard page.
	 */
	public function render_dashboard_page() {
		$total_scores    = $this->count_scores();
		$games_count     = wp_count_posts( PointNet_Games_Post_Types::GAME_CPT );
		$published_games = isset( $games_count->publish ) ? $games_count->publish : 0;
		$total_players   = $this->count_unique_nicknames();

		if ( isset( $_GET['pointnet_games_uninstalled'] ) ) {
			$uninstall_ok   = '1' === $_GET['pointnet_games_uninstalled'];
			$scores_deleted = isset( $_GET['pointnet_games_scores'] ) && '1' === $_GET['pointnet_games_scores'];

			$game_message = $uninstall_ok
				? __( 'Gioco disinstallato con successo.', 'pointnet-games' )
				: __( 'Gioco rimosso dal database, ma la cartella dei file non è stata trovata o non è rimovibile. Controlla games/ manualmente.', 'pointnet-games' );

			$scores_message = $scores_deleted
				? __( ' Punteggi eliminati.', 'pointnet-games' )
				: __( ' Punteggi conservati nel database.', 'pointnet-games' );

			echo '<div class="notice notice-' . ( $uninstall_ok ? 'success' : 'warning' ) . ' is-dismissible"><p>' . esc_html( $game_message . $scores_message ) . '</p></div>';
		}

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'PointNet Games Dashboard', 'pointnet-games' ); ?> <sup style="color:#9f9f9f;">V<?php echo esc_html( POINTNET_GAMES_VERSION ); ?></sup></h1>

			<div class="pointnet-games-stats-grid">
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $published_games ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Giochi pubblicati', 'pointnet-games' ); ?></span>
				</div>
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $total_scores ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Punteggi totali', 'pointnet-games' ); ?></span>
				</div>
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $total_players ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Giocatori unici', 'pointnet-games' ); ?></span>
				</div>
			</div>

			<h2><?php esc_html_e( 'Giochi installati', 'pointnet-games' ); ?></h2>
			<table class="widefat striped pointnet-games-installed-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'ID', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Gioco', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Slug', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Shortcode', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Pagina del gioco', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Azioni', 'pointnet-games' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php $this->render_installed_games(); ?>
				</tbody>
			</table>

			<h2><?php esc_html_e( 'Shortcode disponibili', 'pointnet-games' ); ?></h2>
			<table class="widefat striped pointnet-games-shortcodes-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Shortcode', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Descrizione', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Attributi', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Esempio', 'pointnet-games' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php $this->render_shortcodes_list(); ?>
				</tbody>
			</table>

			<h2><?php esc_html_e( 'Giochi più giocati', 'pointnet-games' ); ?></h2>
			<table class="widefat striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Gioco', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Punteggi', 'pointnet-games' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php $this->render_top_games(); ?>
				</tbody>
			</table>
		</div>
		<?php
	}

	/**
	 * Render the scores management page.
	 */
	public function render_scores_page() {
		// Capability check.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Non hai i permessi per accedere a questa pagina.', 'pointnet-games' ) );
		}

		if ( isset( $_POST['pointnet_games_delete_score'] ) && check_admin_referer( 'pointnet_games_delete_score' ) ) {
			$score_id = absint( $_POST['pointnet_games_delete_score'] );
			$this->delete_score( $score_id );
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Punteggio eliminato.', 'pointnet-games' ) . '</p></div>';
		}

		$limit  = isset( $_GET['pointnet_games_limit'] ) ? absint( $_GET['pointnet_games_limit'] ) : 50;
		$scores = $this->get_recent_scores( $limit );

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Punteggi', 'pointnet-games' ); ?></h1>
			<table class="widefat striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'ID', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Gioco', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Nickname', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Utente', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Punteggio', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Data', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Valido', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Azioni', 'pointnet-games' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $scores as $score ) : ?>
						<tr>
							<td><?php echo esc_html( $score->id ); ?></td>
							<td>
								<?php
								$game = get_post( $score->game_id );
								echo $game ? esc_html( $game->post_title ) : esc_html__( 'N/A', 'pointnet-games' );
								?>
							</td>
							<td><?php echo esc_html( $score->nickname ); ?></td>
							<td><?php echo $score->user_id ? esc_html__( 'Registrato', 'pointnet-games' ) : esc_html__( 'Anonimo', 'pointnet-games' ); ?></td>
							<td><?php echo esc_html( number_format_i18n( $score->score ) ); ?></td>
							<td><?php echo esc_html( $score->played_at ); ?></td>
							<td><?php echo $score->validated ? esc_html__( 'Sì', 'pointnet-games' ) : esc_html__( 'No', 'pointnet-games' ); ?></td>
							<td>
								<form method="post" style="display:inline" onsubmit="return confirm('<?php esc_attr_e( 'Eliminare questo punteggio?', 'pointnet-games' ); ?>')">
									<?php wp_nonce_field( 'pointnet_games_delete_score' ); ?>
									<input type="hidden" name="pointnet_games_delete_score" value="<?php echo esc_attr( $score->id ); ?>">
									<button type="submit" class="button button-link-delete"><?php esc_html_e( 'Elimina', 'pointnet-games' ); ?></button>
								</form>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
		<?php
	}

	/**
	 * Render the settings page.
	 */
	public function render_settings_page() {
		// Capability check.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Non hai i permessi per accedere a questa pagina.', 'pointnet-games' ) );
		}

		$settings = get_option( 'pointnet_games_settings', array() );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Impostazioni PointNet Games', 'pointnet-games' ); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields( 'pointnet_games_settings_group' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">
							<label for="pointnet_games_allow_anonymous"><?php esc_html_e( 'Consenti punteggi anonimi', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[allow_anonymous]" id="pointnet_games_allow_anonymous" value="1" <?php checked( (int) $settings['allow_anonymous'] ?? 1, 1 ); ?>>
								<?php esc_html_e( 'Gli utenti non registrati possono inviare punteggi con nickname.', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="pointnet_games_rate_limit"><?php esc_html_e( 'Rate limit per minuto', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<input type="number" name="pointnet_games_settings[rate_limit]" id="pointnet_games_rate_limit" value="<?php echo esc_attr( (int) $settings['rate_limit'] ?? 5 ); ?>" min="1" max="60">
							<p class="description"><?php esc_html_e( 'Numero massimo di invii punteggio consentiti per giocatore al minuto.', 'pointnet-games' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="pointnet_games_require_validation"><?php esc_html_e( 'Richiedi validazione manuale', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[require_validation]" id="pointnet_games_require_validation" value="1" <?php checked( (int) $settings['require_validation'] ?? 0, 1 ); ?>>
								<?php esc_html_e( 'I punteggi compaiono in classifica solo dopo approvazione admin.', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="pointnet_games_nickname_min"><?php esc_html_e( 'Lunghezza minima nickname', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<input type="number" name="pointnet_games_settings[nickname_min_length]" id="pointnet_games_nickname_min" value="<?php echo esc_attr( (int) $settings['nickname_min_length'] ?? 3 ); ?>" min="1" max="20">
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="pointnet_games_nickname_max"><?php esc_html_e( 'Lunghezza massima nickname', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<input type="number" name="pointnet_games_settings[nickname_max_length]" id="pointnet_games_nickname_max" value="<?php echo esc_attr( (int) $settings['nickname_max_length'] ?? 20 ); ?>" min="1" max="50">
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Sanitize settings.
	 *
	 * @param array $input Raw settings.
	 *
	 * @return array
	 */
	public function sanitize_settings( $input ) {
		$defaults = array(
			'allow_anonymous'     => 1,
			'rate_limit'          => 5,
			'require_validation'  => 0,
			'nickname_min_length' => 3,
			'nickname_max_length' => 20,
		);

		$clean = wp_parse_args( $input, $defaults );

		$clean['allow_anonymous']     = isset( $input['allow_anonymous'] ) ? 1 : 0;
		$clean['require_validation']  = isset( $input['require_validation'] ) ? 1 : 0;
		$clean['rate_limit']          = (int) $input['rate_limit'];
		$clean['nickname_min_length'] = max( 1, min( 20, (int) $input['nickname_min_length'] ) );
		$clean['nickname_max_length'] = max( 1, min( 50, (int) $input['nickname_max_length'] ) );

		return $clean;
	}

	/**
	 * Count total scores.
	 *
	 * @return int
	 */
	private function count_scores() {
		global $wpdb;

		$table = pointnet_games_scores_table();

		return (int) $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(*) FROM {$table}" )
		);
	}

	/**
	 * Count unique nicknames.
	 *
	 * @return int
	 */
	private function count_unique_nicknames() {
		global $wpdb;

		$table = pointnet_games_scores_table();

		return (int) $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(DISTINCT nickname) FROM {$table}" )
		);
	}

	/**
	 * Render the list of installed games with their shortcodes.
	 */
	private function render_installed_games() {
		$games = get_posts(
			array(
				'post_type'      => PointNet_Games_Post_Types::GAME_CPT,
				'post_status'    => 'any',
				'posts_per_page' => 100,
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);

		if ( empty( $games ) ) {
			echo '<tr><td colspan="6">' . esc_html__( 'Nessun gioco installato. Aggiungi una cartella con manifest.json in games/.', 'pointnet-games' ) . '</td></tr>';
			return;
		}

		foreach ( $games as $game ) {
			$slug = get_post_meta( $game->ID, '_pointnet_games_slug', true );
			$slug = $slug ? $slug : $game->post_name;

			// Canonical URL: the CPT permalink (e.g. /games/minesweeper/).
			$game_url = get_permalink( $game->ID );

			echo '<tr>';
			echo '<td><code>' . esc_html( $game->ID ) . '</code></td>';
			echo '<td><strong>' . esc_html( $game->post_title ) . '</strong>';
			if ( 'publish' !== $game->post_status ) {
				echo ' <em>(' . esc_html( $game->post_status ) . ')</em>';
			}
			echo '</td>';
			echo '<td><code>' . esc_html( $slug ) . '</code></td>';
			echo '<td><code>[pointnet_game slug="' . esc_html( $slug ) . '"]</code></td>';
			echo '<td><a href="' . esc_url( $game_url ) . '" target="_blank">' . esc_html__( 'Apri il gioco', 'pointnet-games' ) . '</a></td>';

			// Uninstall action column.
			echo '<td>';

			$score_count = $this->count_game_scores( $game->ID );

			$confirm_text = sprintf(
				/* translators: 1: game title, 2: game slug */
				__( 'Disinstallare il gioco "%1$s"? I file di games/%2$s/ verranno rimossi. Procedere?', 'pointnet-games' ),
				$game->post_title,
				$slug
			);

			echo '<form method="post" onsubmit="return confirm(\'' . esc_js( $confirm_text ) . '\');">';
			wp_nonce_field( 'pointnet_games_uninstall_game' );
			echo '<input type="hidden" name="pointnet_games_uninstall_game" value="' . esc_attr( $game->ID ) . '">';
			echo '<label style="display:block;margin-bottom:6px;font-weight:400;cursor:pointer;">';
			echo '<input type="checkbox" name="pointnet_games_delete_scores" value="1" checked> ';
			if ( $score_count > 0 ) {
				/* translators: %d: number of scores for this game */
				printf( esc_html__( 'Elimina anche i %d punteggi', 'pointnet-games' ), esc_html( $score_count ) );
			} else {
				esc_html_e( 'Elimina punteggi (nessuno presente)', 'pointnet-games' );
			}
			echo '</label>';
			echo '<button type="submit" class="button button-link-delete">' . esc_html__( 'Disinstalla', 'pointnet-games' ) . '</button>';
			echo '</form>';

			echo '</td>';
			echo '</tr>';
		}
	}

	/**
	 * Render the list of available shortcodes with descriptions and examples.
	 */
	private function render_shortcodes_list() {
		$shortcodes = array(
			array(
				'shortcode'    => '[pointnet_game id="123" slug="minesweeper" width="800px" height="600px"]',
				'description'  => __( 'Incorpora un singolo gioco nella pagina.', 'pointnet-games' ),
				'attrs'        => __( 'id (int), slug (string), width (string, default 100%), height (string, default 600px)', 'pointnet-games' ),
				'example'      => '[pointnet_game slug="minesweeper"]',
			),
			array(
				'shortcode'    => '[pointnet_game_leaderboard game_id="123" limit="10" global="0" show_meta="0"]',
				'description'  => __( 'Mostra la classifica dei punteggi per un gioco o globale.', 'pointnet-games' ),
				'attrs'        => __( 'game_id (int), limit (int 1-100, default 10), global (0|1), show_meta (0|1)', 'pointnet-games' ),
				'example'      => '[pointnet_game_leaderboard game_id="123" limit="10"]' . "\n" . '[pointnet_game_leaderboard global="1" limit="25"]',
			),
			array(
				'shortcode'    => '[pointnet_games_list limit="12" category="puzzle" columns="3"]',
				'description'  => __( 'Mostra una griglia dei giochi disponibili.', 'pointnet-games' ),
				'attrs'        => __( 'limit (int 1-60, default 12), category (slug), columns (int 1-5, default 3)', 'pointnet-games' ),
				'example'      => '[pointnet_games_list limit="8" category="puzzle" columns="4"]',
			),
		);

		foreach ( $shortcodes as $shortcode ) {
			echo '<tr>';
			echo '<td><code>' . esc_html( $shortcode['shortcode'] ) . '</code></td>';
			echo '<td>' . esc_html( $shortcode['description'] ) . '</td>';
			echo '<td>' . esc_html( $shortcode['attrs'] ) . '</td>';
			echo '<td><code>' . nl2br( esc_html( $shortcode['example'] ) ) . '</code></td>';
			echo '</tr>';
		}
	}

	/**
	 * Get scores grouped by game for dashboard.
	 */
	private function render_top_games() {
		global $wpdb;

		$table = pointnet_games_scores_table();
		$rows  = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT game_id, COUNT(*) as total
				 FROM {$table}
				 GROUP BY game_id
				 ORDER BY total DESC
				 LIMIT %d",
				10
			)
		);

		if ( empty( $rows ) ) {
			echo '<tr><td colspan="2">' . esc_html__( 'Nessun dato disponibile.', 'pointnet-games' ) . '</td></tr>';
			return;
		}

		foreach ( $rows as $row ) {
			$game = get_post( $row->game_id );
			echo '<tr>';
			echo '<td>' . ( $game ? esc_html( $game->post_title ) : esc_html__( 'Gioco eliminato', 'pointnet-games' ) ) . '</td>';
			echo '<td>' . esc_html( number_format_i18n( (int) $row->total ) ) . '</td>';
			echo '</tr>';
		}
	}

	/**
	 * Get recent scores for the scores admin page.
	 *
	 * @param int $limit Max rows.
	 *
	 * @return array
	 */
	private function get_recent_scores( $limit ) {
		global $wpdb;

		$table = pointnet_games_scores_table();
		$limit = min( max( 1, $limit ), 200 );

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$table} ORDER BY played_at DESC LIMIT %d",
				$limit
			)
		);
	}

	/**
	 * Delete a score.
	 *
	 * @param int $score_id Score row ID.
	 */
	private function delete_score( $score_id ) {
		// Capability check for defense in depth.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		global $wpdb;
		$wpdb->delete( pointnet_games_scores_table(), array( 'id' => absint( $score_id ) ), array( '%d' ) );
	}

	/**
	 * Handle the game uninstallation POST request.
	 *
	 * Removes the game CPT, the games/{slug}/ directory and,
	 * optionally, all scores belonging to that game.
	 */
	public function handle_uninstall_game() {
		if ( ! isset( $_POST['pointnet_games_uninstall_game'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Non hai i permessi per effettuare questa operazione.', 'pointnet-games' ) );
		}

		check_admin_referer( 'pointnet_games_uninstall_game' );

		$game_id       = absint( $_POST['pointnet_games_uninstall_game'] );
		$delete_scores = isset( $_POST['pointnet_games_delete_scores'] ) ? 1 : 0;

		$game = get_post( $game_id );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type ) {
			wp_die( esc_html__( 'Gioco non trovato.', 'pointnet-games' ) );
		}

		$slug = get_post_meta( $game_id, '_pointnet_games_slug', true );
		if ( empty( $slug ) ) {
			$slug = $game->post_name;
		}

		// Remove scores belonging to this game only (never touches other games).
		if ( $delete_scores ) {
			global $wpdb;
			$wpdb->delete( pointnet_games_scores_table(), array( 'game_id' => $game_id ), array( '%d' ) );
		}

		// Remove the game files (games/{slug}/).
		$dir_deleted = $this->delete_game_directory( $slug );

		// Remove the game CPT post.
		wp_delete_post( $game_id, true );

		// Force the registry to re-scan on next request.
		delete_option( 'pointnet_games_sync_fingerprint' );

		// Redirect to avoid form re-submission on refresh.
		wp_safe_redirect(
			add_query_arg(
				array(
					'pointnet_games_uninstalled' => $dir_deleted ? '1' : '2',
					'pointnet_games_scores'      => $delete_scores ? '1' : '0',
				),
				admin_url( 'admin.php?page=pointnet-games' )
			)
		);
		exit;
	}

	/**
	 * Count scores for a specific game.
	 *
	 * @param int $game_id Game CPT post ID.
	 *
	 * @return int
	 */
	private function count_game_scores( $game_id ) {
		global $wpdb;

		$table = pointnet_games_scores_table();

		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} WHERE game_id = %d",
				$game_id
			)
		);
	}

	/**
	 * Recursively delete the games/{slug}/ directory using PHP only.
	 *
	 * @param string $slug Game slug (folder name).
	 *
	 * @return bool True when the directory was removed, false otherwise.
	 */
	private function delete_game_directory( $slug ) {
		$games_root = realpath( POINTNET_GAMES_PLUGIN_DIR . 'games' );
		$target     = realpath( POINTNET_GAMES_PLUGIN_DIR . 'games' . DIRECTORY_SEPARATOR . $slug );

		if ( false === $games_root || false === $target ) {
			return false;
		}

		// Path traversal protection: the target must be inside games/.
		if ( strpos( $target, $games_root . DIRECTORY_SEPARATOR ) !== 0 ) {
			return false;
		}

		if ( ! is_dir( $target ) ) {
			return false;
		}

		$deleted = $this->filesystem_delete( $target );

		return $deleted;
	}

	/**
	 * Recursively delete a directory using the WordPress Filesystem API
	 * when available, with a PHP fallback for compatibility.
	 *
	 * @param string $target Absolute path to the directory to delete.
	 *
	 * @return bool True on success, false otherwise.
	 */
	private function filesystem_delete( $target ) {
		// Try WP_Filesystem first (recommended by WordPress.org Plugin Check).
		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( function_exists( 'WP_Filesystem' ) ) {
			WP_Filesystem();
			global $wp_filesystem;

			if ( $wp_filesystem && $wp_filesystem->delete( $target, true, 'd' ) ) {
				return true;
			}
		}

		// Fallback: PHP recursive deletion.
		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $target, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ( $iterator as $fileinfo ) {
			if ( $fileinfo->isDir() ) {
				@rmdir( $fileinfo->getRealPath() );
			} else {
				@unlink( $fileinfo->getRealPath() );
			}
		}

		return @rmdir( $target );
	}
}