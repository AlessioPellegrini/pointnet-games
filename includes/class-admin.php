<?php
/**
 * Admin interface: menu, settings, game catalog and score management.
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
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
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
			__( 'Catalogo Giochi', 'pointnet-games' ),
			__( 'Catalogo Giochi', 'pointnet-games' ),
			'manage_options',
			'pointnet-games-catalog',
			array( $this, 'render_catalog_page' )
		);

		add_submenu_page(
			'pointnet-games',
			__( 'Scores', 'pointnet-games' ),
			__( 'Scores', 'pointnet-games' ),
			'manage_options',
			'pointnet-games-scores',
			array( $this, 'render_scores_page' )
		);

		add_submenu_page(
			'pointnet-games',
			__( 'Settings', 'pointnet-games' ),
			__( 'Settings', 'pointnet-games' ),
			'manage_options',
			'pointnet-games-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Enqueue admin scripts & styles on PointNet Games admin pages.
	 *
	 * @param string $hook_suffix The current admin screen.
	 */
	public function enqueue_admin_assets( $hook_suffix ) {
		if ( strpos( $hook_suffix, 'pointnet-games' ) === false ) {
			return;
		}

		wp_enqueue_style(
			'pointnet-games-admin-css',
			POINTNET_GAMES_PLUGIN_URL . 'admin/css/pointnet-games-admin.css',
			array(),
			POINTNET_GAMES_VERSION
		);

		if ( strpos( $hook_suffix, 'pointnet-games-catalog' ) !== false || strpos( $hook_suffix, 'pointnet-games' ) !== false ) {
			wp_enqueue_script(
				'pointnet-games-catalog-js',
				POINTNET_GAMES_PLUGIN_URL . 'admin/js/pointnet-games-catalog.js',
				array( 'jquery' ),
				POINTNET_GAMES_VERSION,
				true
			);

			wp_localize_script(
				'pointnet-games-catalog-js',
				'pointnetGamesCatalog',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'pointnet_games_catalog_action' ),
				)
			);
		}
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
	 * Output donation supporter banner.
	 */
	public static function render_donation_box() {
		$settings = get_option( 'pointnet_games_settings', array() );
		$kofi_url = ! empty( $settings['kofi_url'] ) ? esc_url( $settings['kofi_url'] ) : 'https://ko-fi.com/pointnet';
		?>
		<div class="pointnet-games-donation-box">
			<div class="pointnet-games-donation-content">
				<h3>☕ <?php esc_html_e( 'Ti piace PointNet Games? Sostieni il progetto!', 'pointnet-games' ); ?></h3>
				<p><?php esc_html_e( 'Tutti i giochi sono open-source e gratuiti. Offri un caffè allo sviluppatore per finanziare nuovi livelli e nuovi giochi!', 'pointnet-games' ); ?></p>
			</div>
			<a href="<?php echo esc_url( $kofi_url ); ?>" target="_blank" rel="noopener noreferrer" class="pointnet-games-btn-kofi">
				☕ <?php esc_html_e( 'Offri un caffè su Ko-fi', 'pointnet-games' ); ?>
			</a>
		</div>
		<?php
	}

	/**
	 * Render the dashboard page.
	 */
	public function render_dashboard_page() {
		$total_scores    = $this->count_scores();
		$games_count     = wp_count_posts( PointNet_Games_Post_Types::GAME_CPT );
		$published_games = isset( $games_count->publish ) ? $games_count->publish : 0;
		$total_players   = $this->count_unique_nicknames();

		$uninstall_notice = get_transient( 'pointnet_games_uninstall_notice' );

		if ( is_array( $uninstall_notice ) ) {
			$uninstall_ok   = ! empty( $uninstall_notice['ok'] );
			$scores_deleted = ! empty( $uninstall_notice['scores'] );

			delete_transient( 'pointnet_games_uninstall_notice' );

			$game_message = $uninstall_ok
				? __( 'Game successfully uninstalled.', 'pointnet-games' )
				: __( 'Game removed from database.', 'pointnet-games' );

			$scores_message = $scores_deleted
				? __( ' Scores deleted.', 'pointnet-games' )
				: __( ' Scores kept in database.', 'pointnet-games' );

			echo '<div class="notice notice-' . ( $uninstall_ok ? 'success' : 'warning' ) . ' is-dismissible"><p>' . esc_html( $game_message . $scores_message ) . '</p></div>';
		}

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'PointNet Games Dashboard', 'pointnet-games' ); ?> <sup style="color:#9f9f9f;">V<?php echo esc_html( POINTNET_GAMES_VERSION ); ?></sup></h1>

			<?php self::render_donation_box(); ?>

			<?php if ( 0 === (int) $published_games ) : ?>
				<div class="pointnet-games-onboarding-hero">
					<h2>🎮 <?php esc_html_e( 'La tua Arcade Platform è pronta!', 'pointnet-games' ); ?></h2>
					<p><?php esc_html_e( 'Non hai ancora nessun gioco installato. Puoi installare Minesweeper con 1 click o esplorare il catalogo completo per aggiungere i giochi desiderati sul tuo sito.', 'pointnet-games' ); ?></p>
					<div class="pointnet-games-onboarding-actions">
						<button type="button" class="button button-primary button-hero pointnet-game-install-btn" data-slug="minesweeper-arcade">
							💣 <?php esc_html_e( 'Installa Minesweeper (Consigliato)', 'pointnet-games' ); ?>
						</button>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=pointnet-games-catalog' ) ); ?>" class="button button-secondary button-hero">
							📦 <?php esc_html_e( 'Sfoglia Catalogo Giochi', 'pointnet-games' ); ?>
						</a>
					</div>
				</div>
			<?php endif; ?>

			<div class="pointnet-games-stats-grid">
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $published_games ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Giochi Pubblicati', 'pointnet-games' ); ?></span>
				</div>
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $total_scores ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Punteggi Totali', 'pointnet-games' ); ?></span>
				</div>
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $total_players ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Giocatori Unici', 'pointnet-games' ); ?></span>
				</div>
			</div>

			<h2><?php esc_html_e( 'Giochi Installati', 'pointnet-games' ); ?></h2>
			<table class="widefat striped pointnet-games-installed-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'ID', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Gioco', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Slug', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Versione', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Shortcode', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Pagina Gioco', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Azioni', 'pointnet-games' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php $this->render_installed_games(); ?>
				</tbody>
			</table>

			<h2><?php esc_html_e( 'Shortcode Disponibili', 'pointnet-games' ); ?></h2>
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

			<h2><?php esc_html_e( 'Classifica Top Giochi', 'pointnet-games' ); ?></h2>
			<table class="widefat striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Gioco', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Partite Giocate', 'pointnet-games' ); ?></th>
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
	 * Render the Game Catalog page.
	 */
	public function render_catalog_page() {
		$catalog   = PointNet_Games_Game_Catalog::get_catalog();
		$installed = PointNet_Games_Game_Catalog::get_installed_games_map();

		?>
		<div class="wrap">
			<div class="pointnet-games-catalog-header">
				<h1>🎮 <?php esc_html_e( 'Catalogo Giochi Arcade', 'pointnet-games' ); ?></h1>
				<button type="button" class="button button-secondary" id="pointnet-refresh-catalog-btn">
					🔄 <?php esc_html_e( 'Controlla Aggiornamenti Catalogo', 'pointnet-games' ); ?>
				</button>
			</div>

			<p><?php esc_html_e( 'Sfoglia la libreria di giochi arcade gratuiti per PointNet Games. Ogni gioco viene installato direttamente sul tuo server con 1-click in una cartella sicura e protetta.', 'pointnet-games' ); ?></p>

			<?php self::render_donation_box(); ?>

			<?php if ( empty( $catalog ) ) : ?>
				<div class="notice notice-info" style="margin-top:20px; padding:15px;">
					<p style="font-size:14px; margin:0;">
						<?php esc_html_e( 'Nessuna release di giochi trovata su GitHub. Pubblica una release nel repository del catalogo per farla comparire qui automaticamente.', 'pointnet-games' ); ?>
					</p>
				</div>
			<?php else : ?>
				<div class="pointnet-games-catalog-grid">
					<?php foreach ( $catalog as $game ) :
						$slug          = sanitize_title( $game['slug'] );
						$is_installed  = isset( $installed[ $slug ] );
						$local_version = $is_installed ? $installed[ $slug ]['version'] : '';
						$has_update    = $is_installed && version_compare( $game['version'], $local_version, '>' );
						$badge_label   = isset( $game['badge'] ) ? $game['badge'] : '';
					?>
						<div class="pointnet-game-card">
							<div class="pointnet-game-card-header">
								<div>
									<h3 class="pointnet-game-card-title"><?php echo esc_html( $game['name'] ); ?></h3>
									<span style="font-size:12px; color:#646970;"><?php echo esc_html( $game['author'] ); ?></span>
								</div>
								<?php if ( $has_update ) : ?>
									<span class="pointnet-game-badge update"><?php esc_html_e( 'Aggiornamento', 'pointnet-games' ); ?></span>
								<?php elseif ( $is_installed ) : ?>
									<span class="pointnet-game-badge installed"><?php esc_html_e( 'Installato', 'pointnet-games' ); ?></span>
								<?php elseif ( ! empty( $badge_label ) ) : ?>
									<span class="pointnet-game-badge popular"><?php echo esc_html( $badge_label ); ?></span>
								<?php endif; ?>
							</div>
							<div class="pointnet-game-card-body">
								<p class="pointnet-game-card-desc"><?php echo esc_html( $game['description'] ); ?></p>
								<div class="pointnet-game-meta-row">
									<span><strong><?php esc_html_e( 'Versione:', 'pointnet-games' ); ?></strong> v<?php echo esc_html( $game['version'] ); ?></span>
									<?php if ( $is_installed ) : ?>
										<span><strong><?php esc_html_e( 'Attuale:', 'pointnet-games' ); ?></strong> v<?php echo esc_html( $local_version ); ?></span>
									<?php endif; ?>
								</div>
							</div>
							<div class="pointnet-game-card-footer">
								<span style="font-size:12px; color:#646970;"><code><?php echo esc_html( $slug ); ?></code></span>
								<div class="actions">
									<?php if ( $has_update ) : ?>
										<button type="button" class="button button-primary pointnet-game-update-btn" data-slug="<?php echo esc_attr( $slug ); ?>">
											🔄 <?php esc_html_e( 'Aggiorna', 'pointnet-games' ); ?>
										</button>
									<?php elseif ( $is_installed ) : ?>
										<button type="button" class="button button-secondary pointnet-game-uninstall-btn" data-slug="<?php echo esc_attr( $slug ); ?>">
											🗑️ <?php esc_html_e( 'Disinstalla', 'pointnet-games' ); ?>
										</button>
									<?php else : ?>
										<button type="button" class="button button-primary pointnet-game-install-btn" data-slug="<?php echo esc_attr( $slug ); ?>">
											⬇️ <?php esc_html_e( 'Installa (1-Click)', 'pointnet-games' ); ?>
										</button>
									<?php endif; ?>
								</div>
							</div>
						</div>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Render the scores management page.
	 */
	public function render_scores_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'pointnet-games' ) );
		}

		if ( isset( $_POST['pointnet_games_delete_score'] ) && check_admin_referer( 'pointnet_games_delete_score' ) ) {
			$score_id = absint( $_POST['pointnet_games_delete_score'] );
			$this->delete_score( $score_id );
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Score deleted.', 'pointnet-games' ) . '</p></div>';
		}

		$limit  = isset( $_GET['pointnet_games_limit'] ) ? absint( $_GET['pointnet_games_limit'] ) : 50;
		$scores = $this->get_recent_scores( $limit );

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Scores', 'pointnet-games' ); ?></h1>
			<table class="widefat striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'ID', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Game', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Nickname', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'User', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Score', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Date', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Valid', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Actions', 'pointnet-games' ); ?></th>
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
							<td>
								<?php
								$user = $score->user_id ? get_userdata( $score->user_id ) : null;
								echo $user ? esc_html( $user->user_login ) : esc_html( $score->nickname ?: '—' );
								?>
							</td>
							<td><?php echo $score->user_id ? esc_html__( 'Registered', 'pointnet-games' ) : esc_html__( 'Guest', 'pointnet-games' ); ?></td>
							<td><?php echo esc_html( number_format_i18n( $score->score ) ); ?></td>
							<td><?php echo esc_html( $score->played_at ); ?></td>
							<td><?php echo $score->validated ? esc_html__( 'Yes', 'pointnet-games' ) : esc_html__( 'No', 'pointnet-games' ); ?></td>
							<td>
								<form method="post" style="display:inline" onsubmit="return confirm('<?php esc_attr_e( 'Delete this score?', 'pointnet-games' ); ?>')">
									<?php wp_nonce_field( 'pointnet_games_delete_score' ); ?>
									<input type="hidden" name="pointnet_games_delete_score" value="<?php echo esc_attr( $score->id ); ?>">
									<button type="submit" class="button button-link-delete"><?php esc_html_e( 'Delete', 'pointnet-games' ); ?></button>
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
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'pointnet-games' ) );
		}

		$settings = get_option( 'pointnet_games_settings', array() );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'PointNet Games Settings', 'pointnet-games' ); ?></h1>

			<?php self::render_donation_box(); ?>

			<form method="post" action="options.php">
				<?php
				settings_fields( 'pointnet_games_settings_group' );
				do_settings_sections( 'pointnet_games_settings_group' );
				?>
				<table class="form-table">
					<tr>
						<th scope="row">
							<label for="pointnet_games_kofi_url"><?php esc_html_e( 'Link Donazioni (Ko-fi / Sostenitori)', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<input type="url" id="pointnet_games_kofi_url" name="pointnet_games_settings[kofi_url]" value="<?php echo esc_attr( isset( $settings['kofi_url'] ) ? $settings['kofi_url'] : 'https://ko-fi.com/pointnet' ); ?>" class="regular-text">
							<p class="description">
								<?php esc_html_e( 'Inserisci il link alla tua pagina Ko-fi o Buy Me a Coffee visualizzato nei box di supporto.', 'pointnet-games' ); ?>
							</p>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="pointnet_games_rate_limit"><?php esc_html_e( 'Rate Limit (richieste/min)', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<input type="number" id="pointnet_games_rate_limit" name="pointnet_games_settings[rate_limit]" value="<?php echo esc_attr( isset( $settings['rate_limit'] ) ? $settings['rate_limit'] : 5 ); ?>" min="1" max="60" class="small-text">
							<p class="description">
								<?php esc_html_e( 'Numero massimo di punteggi inviabili al minuto per singolo giocatore.', 'pointnet-games' ); ?>
							</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Validazione Punteggi', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[require_validation]" value="1" <?php checked( ! empty( $settings['require_validation'] ) ); ?>>
								<?php esc_html_e( 'Richiedi approvazione manuale prima di mostrare i punteggi in classifica', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Record Arcade nei Profili Autore', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[show_author_records]" value="1" <?php checked( ! isset( $settings['show_author_records'] ) || (int) $settings['show_author_records'] === 1 ); ?>>
								<?php esc_html_e( 'Mostra automaticamente la card arcade con statistiche personali nelle pagine autore (/author/...)', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Link ai Profili Autore nelle Classifiche', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[link_author_profiles]" value="1" <?php checked( ! empty( $settings['link_author_profiles'] ) ); ?>>
								<?php esc_html_e( 'Rendi cliccabili i nomi degli utenti registrati nelle classifiche con link al profilo autore', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
				</table>

				<h2><?php esc_html_e( 'Disinstallazione & Pulizia Dati', 'pointnet-games' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Definisci il comportamento del plugin quando viene eliminato da "Plugin → Plugin installati". Di default i tuoi dati e i giochi vengono protetti in caso di reinstallazione o disattivazione accidentale.', 'pointnet-games' ); ?>
				</p>
				<table class="form-table">
					<tr>
						<th scope="row"><?php esc_html_e( 'Elimina Punteggi e Classifiche', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[delete_data_on_uninstall]" value="1" <?php checked( ! empty( $settings['delete_data_on_uninstall'] ) ); ?>>
								<span style="color:#d63638;"><?php esc_html_e( 'Cancella permanentemente tutte le tabelle dei punteggi e delle classifiche all\'eliminazione del plugin', 'pointnet-games' ); ?></span>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Elimina Giochi Scaricati', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[delete_games_on_uninstall]" value="1" <?php checked( ! empty( $settings['delete_games_on_uninstall'] ) ); ?>>
								<span style="color:#d63638;"><?php esc_html_e( 'Cancella la cartella uploads/pointnet-games/ contenente tutti i giochi scaricati dal catalogo', 'pointnet-games' ); ?></span>
							</label>
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
	 * @return array
	 */
	public function sanitize_settings( $input ) {
		$defaults = array(
			'rate_limit'                 => 5,
			'require_validation'         => 0,
			'show_author_records'        => 1,
			'link_author_profiles'       => 0,
			'delete_data_on_uninstall'   => 0,
			'delete_games_on_uninstall'  => 0,
			'kofi_url'                   => 'https://ko-fi.com/pointnet',
		);

		$clean = wp_parse_args( $input, $defaults );

		$clean['require_validation']         = isset( $input['require_validation'] ) ? 1 : 0;
		$clean['show_author_records']        = isset( $input['show_author_records'] ) ? 1 : 0;
		$clean['link_author_profiles']       = isset( $input['link_author_profiles'] ) ? 1 : 0;
		$clean['delete_data_on_uninstall']   = isset( $input['delete_data_on_uninstall'] ) ? 1 : 0;
		$clean['delete_games_on_uninstall']  = isset( $input['delete_games_on_uninstall'] ) ? 1 : 0;
		$clean['rate_limit']                 = (int) $input['rate_limit'];
		$clean['kofi_url']                   = esc_url_raw( $input['kofi_url'] );

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
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i", $table ) );
	}

	/**
	 * Count unique nicknames.
	 *
	 * @return int
	 */
	private function count_unique_nicknames() {
		global $wpdb;
		$table = pointnet_games_scores_table();
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(DISTINCT nickname) FROM %i", $table ) );
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
			echo '<tr><td colspan="7">' . sprintf(
				/* translators: %s: Catalog URL */
				esc_html__( 'Nessun gioco installato. Vai al %s per installarne uno con 1-click.', 'pointnet-games' ),
				'<a href="' . esc_url( admin_url( 'admin.php?page=pointnet-games-catalog' ) ) . '">' . esc_html__( 'Catalogo Giochi', 'pointnet-games' ) . '</a>'
			) . '</td></tr>';
			return;
		}

		foreach ( $games as $game ) {
			$slug = get_post_meta( $game->ID, '_pointnet_games_slug', true );
			$slug = $slug ? $slug : $game->post_name;

			$version = get_post_meta( $game->ID, '_pointnet_games_version', true );
			$version = $version ? $version : '—';

			$game_url = get_permalink( $game->ID );

			echo '<tr>';
			echo '<td><code>' . esc_html( $game->ID ) . '</code></td>';
			echo '<td><strong>' . esc_html( $game->post_title ) . '</strong>';
			if ( 'publish' !== $game->post_status ) {
				echo ' <em>(' . esc_html( $game->post_status ) . ')</em>';
			}
			echo '</td>';
			echo '<td><code>' . esc_html( $slug ) . '</code></td>';
			echo '<td><code>' . esc_html( $version ) . '</code></td>';
			echo '<td><code>[pointnet_game slug="' . esc_html( $slug ) . '"]</code></td>';
			echo '<td><a href="' . esc_url( $game_url ) . '" target="_blank">' . esc_html__( 'Apri gioco', 'pointnet-games' ) . '</a></td>';

			echo '<td>';
			$score_count = $this->count_game_scores( $game->ID );
			$confirm_text = sprintf(
				/* translators: 1: game title, 2: game slug */
				__( 'Disinstallare il gioco "%1$s"? I file in uploads/pointnet-games/%2$s/ verranno rimossi.', 'pointnet-games' ),
				$game->post_title,
				$slug
			);

			echo '<form method="post" onsubmit="return confirm(\'' . esc_js( $confirm_text ) . '\');">';
			wp_nonce_field( 'pointnet_games_uninstall_game' );
			echo '<input type="hidden" name="pointnet_games_uninstall_game" value="' . esc_attr( $game->ID ) . '">';
			echo '<label style="display:block;margin-bottom:6px;font-weight:400;cursor:pointer;">';
			echo '<input type="checkbox" name="pointnet_games_delete_scores" value="1" checked> ';
			if ( $score_count > 0 ) {
				printf(
					/* translators: %d: number of scores for this game */
					esc_html__( 'Cancella anche i %d punteggi', 'pointnet-games' ),
					absint( $score_count )
				);
			} else {
				esc_html_e( 'Cancella punteggi', 'pointnet-games' );
			}
			echo '</label>';
			echo '<button type="submit" class="button button-link-delete">' . esc_html__( 'Disinstalla', 'pointnet-games' ) . '</button>';
			echo '</form>';
			echo '</td>';
			echo '</tr>';
		}
	}

	/**
	 * Render available shortcodes table.
	 */
	private function render_shortcodes_list() {
		$shortcodes = array(
			array(
				'code'        => '[pointnet_game]',
				'description' => __( 'Incorpora un gioco specifico tramite slug o ID.', 'pointnet-games' ),
				'attributes'  => '<code>slug</code>, <code>id</code>, <code>width</code>, <code>height</code>',
				'example'     => '<code>[pointnet_game slug="minesweeper-arcade"]</code>',
			),
			array(
				'code'        => '[pointnet_game_leaderboard]',
				'description' => __( 'Mostra la classifica con filtri e tab per un gioco.', 'pointnet-games' ),
				'attributes'  => '<code>game_id</code>, <code>difficulty</code>, <code>period</code>, <code>limit</code>',
				'example'     => '<code>[pointnet_game_leaderboard game_id="12" limit="10"]</code>',
			),
			array(
				'code'        => '[pointnet_games_list]',
				'description' => __( 'Visualizza la griglia con tutti i giochi disponibili.', 'pointnet-games' ),
				'attributes'  => '<code>columns</code>, <code>category</code>, <code>limit</code>',
				'example'     => '<code>[pointnet_games_list columns="3"]</code>',
			),
			array(
				'code'        => '[pointnet_user_records]',
				'description' => __( 'Card KPI con statistiche personali e record del giocatore.', 'pointnet-games' ),
				'attributes'  => '<code>user_id</code>',
				'example'     => '<code>[pointnet_user_records]</code>',
			),
		);

		foreach ( $shortcodes as $item ) {
			echo '<tr>';
			echo '<td><strong><code>' . esc_html( $item['code'] ) . '</code></strong></td>';
			echo '<td>' . esc_html( $item['description'] ) . '</td>';
			echo '<td>' . wp_kses_post( $item['attributes'] ) . '</td>';
			echo '<td>' . wp_kses_post( $item['example'] ) . '</td>';
			echo '</tr>';
		}
	}

	/**
	 * Render top games table.
	 */
	private function render_top_games() {
		global $wpdb;
		$table = pointnet_games_scores_table();

		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT game_id, COUNT(*) as score_count FROM %i GROUP BY game_id ORDER BY score_count DESC LIMIT 5",
				$table
			)
		);

		if ( empty( $results ) ) {
			echo '<tr><td colspan="2">' . esc_html__( 'Nessuna partita registrata.', 'pointnet-games' ) . '</td></tr>';
			return;
		}

		foreach ( $results as $row ) {
			$game = get_post( $row->game_id );
			$title = $game ? $game->post_title : __( 'Gioco Sconosciuto', 'pointnet-games' );
			echo '<tr>';
			echo '<td>' . esc_html( $title ) . '</td>';
			echo '<td>' . esc_html( number_format_i18n( $row->score_count ) ) . '</td>';
			echo '</tr>';
		}
	}

	/**
	 * Get recent scores.
	 *
	 * @param int $limit Score limit.
	 * @return array
	 */
	private function get_recent_scores( $limit = 50 ) {
		global $wpdb;
		$table = pointnet_games_scores_table();
		return (array) $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM %i ORDER BY played_at DESC LIMIT %d",
				$table,
				$limit
			)
		);
	}

	/**
	 * Delete single score.
	 *
	 * @param int $score_id Score ID.
	 */
	private function delete_score( $score_id ) {
		global $wpdb;
		$table = pointnet_games_scores_table();
		$wpdb->delete( $table, array( 'id' => $score_id ), array( '%d' ) );
	}

	/**
	 * Handle uninstalling game action from dashboard.
	 */
	public function handle_uninstall_game() {
		if ( ! isset( $_POST['pointnet_games_uninstall_game'] ) ) {
			return;
		}

		if ( ! check_admin_referer( 'pointnet_games_uninstall_game' ) ) {
			wp_die( esc_html__( 'Verifica di sicurezza non superata.', 'pointnet-games' ) );
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Permesso negato.', 'pointnet-games' ) );
		}

		$game_id       = absint( $_POST['pointnet_games_uninstall_game'] );
		$delete_scores = isset( $_POST['pointnet_games_delete_scores'] ) ? 1 : 0;
		$game          = get_post( $game_id );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type ) {
			wp_die( esc_html__( 'Gioco non trovato.', 'pointnet-games' ) );
		}

		$slug = get_post_meta( $game_id, '_pointnet_games_slug', true );
		if ( empty( $slug ) ) {
			$slug = $game->post_name;
		}

		if ( $delete_scores ) {
			global $wpdb;
			$wpdb->delete( pointnet_games_scores_table(), array( 'game_id' => $game_id ), array( '%d' ) );
		}

		$dir_deleted = $this->delete_game_directory( $slug );
		wp_delete_post( $game_id, true );
		delete_option( 'pointnet_games_sync_fingerprint' );

		set_transient(
			'pointnet_games_uninstall_notice',
			array(
				'ok'     => (bool) $dir_deleted,
				'scores' => (bool) $delete_scores,
			),
			60
		);

		wp_safe_redirect( admin_url( 'admin.php?page=pointnet-games' ) );
		exit;
	}

	/**
	 * Delete game directory across scan roots.
	 *
	 * @param string $slug Game slug.
	 * @return bool
	 */
	private function delete_game_directory( $slug ) {
		$target = trailingslashit( PointNet_Games_Game_Registry::get_installed_games_dir() ) . $slug;

		if ( ! is_dir( $target ) ) {
			// Check bundled folder fallback.
			$bundled = trailingslashit( POINTNET_GAMES_PLUGIN_DIR ) . 'games/' . $slug;
			if ( is_dir( $bundled ) ) {
				$target = $bundled;
			} else {
				return false;
			}
		}

		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		WP_Filesystem();
		global $wp_filesystem;

		if ( ! $wp_filesystem ) {
			return false;
		}

		return (bool) $wp_filesystem->delete( $target, true, 'd' );
	}

	/**
	 * Count scores for a specific game.
	 *
	 * @param int $game_id Game ID.
	 * @return int
	 */
	private function count_game_scores( $game_id ) {
		global $wpdb;
		$table = pointnet_games_scores_table();
		return (int) $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE game_id = %d", $table, $game_id )
		);
	}

}
