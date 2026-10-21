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
		add_action( 'admin_init', array( $this, 'redirect_manual_game_creation' ) );
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
			__( 'Game Catalog', 'pointnet-games' ),
			__( 'Game Catalog', 'pointnet-games' ),
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
			__( 'Shortcodes', 'pointnet-games' ),
			__( 'Shortcodes', 'pointnet-games' ),
			'manage_options',
			'pointnet-games-shortcodes',
			array( $this, 'render_shortcodes_page' )
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
	 * Official PayPal donation URL for PointNet Games.
	 */
	const DONATE_URL = 'https://www.paypal.com/donate/?hosted_button_id=V8836NLKVLP4J';

	/**
	 * Output donation supporter banner.
	 */
	public static function render_donation_box() {
		?>
		<div class="pointnet-games-donation-box">
			<div class="pointnet-games-donation-content">
				<h3>💖 <?php esc_html_e( 'Do you enjoy PointNet Games? Support the project!', 'pointnet-games' ); ?></h3>
				<p><?php esc_html_e( 'All games are open-source and free. Support development to fund new levels and games!', 'pointnet-games' ); ?></p>
			</div>
			<a href="<?php echo esc_url( self::DONATE_URL ); ?>" target="_blank" rel="noopener noreferrer" class="pointnet-games-btn-donate">
				💙 <?php esc_html_e( 'Donate with PayPal', 'pointnet-games' ); ?>
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
					<h2>🎮 <?php esc_html_e( 'Your Arcade Platform is ready!', 'pointnet-games' ); ?></h2>
					<p><?php esc_html_e( 'You do not have any games installed yet. You can install Minesweeper with 1 click or browse the catalog to add games to your site.', 'pointnet-games' ); ?></p>
					<div class="pointnet-games-onboarding-actions">
						<button type="button" class="button button-primary button-hero pointnet-game-install-btn" data-slug="minesweeper-arcade">
							💣 <?php esc_html_e( 'Install Minesweeper (Recommended)', 'pointnet-games' ); ?>
						</button>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=pointnet-games-catalog' ) ); ?>" class="button button-secondary button-hero">
							📦 <?php esc_html_e( 'Browse Game Catalog', 'pointnet-games' ); ?>
						</a>
					</div>
				</div>
			<?php endif; ?>

			<div class="pointnet-games-stats-grid">
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $published_games ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Published Games', 'pointnet-games' ); ?></span>
				</div>
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $total_scores ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Total Scores', 'pointnet-games' ); ?></span>
				</div>
				<div class="pointnet-games-stat-card">
					<span class="pointnet-games-stat-value"><?php echo esc_html( number_format_i18n( $total_players ) ); ?></span>
					<span class="pointnet-games-stat-label"><?php esc_html_e( 'Unique Players', 'pointnet-games' ); ?></span>
				</div>
			</div>

			<h2><?php esc_html_e( 'Installed Games', 'pointnet-games' ); ?></h2>
			<table class="widefat striped pointnet-games-installed-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'ID', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Game', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Slug', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Version', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Shortcode', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Game Page', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Actions', 'pointnet-games' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php $this->render_installed_games(); ?>
				</tbody>
			</table>

			<h2><?php esc_html_e( 'Available Shortcodes', 'pointnet-games' ); ?></h2>
			<table class="widefat striped pointnet-games-shortcodes-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Shortcode', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Description', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Attributes', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Example', 'pointnet-games' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php $this->render_shortcodes_list(); ?>
				</tbody>
			</table>

			<h2><?php esc_html_e( 'Top Games Leaderboard', 'pointnet-games' ); ?></h2>
			<table class="widefat striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Game', 'pointnet-games' ); ?></th>
						<th><?php esc_html_e( 'Games Played', 'pointnet-games' ); ?></th>
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
		$force_refresh = ! empty( $_GET['refresh'] );
		$catalog       = PointNet_Games_Game_Catalog::get_catalog( $force_refresh );
		$installed     = PointNet_Games_Game_Catalog::get_installed_games_map();

		?>
		<div class="wrap">
			<div class="pointnet-games-catalog-header">
				<h1>🎮 <?php esc_html_e( 'Arcade Games Catalog', 'pointnet-games' ); ?></h1>
				<button type="button" class="button button-secondary" id="pointnet-refresh-catalog-btn">
					🔄 <?php esc_html_e( 'Check Updates', 'pointnet-games' ); ?>
				</button>
			</div>

			<p><?php esc_html_e( 'Browse free arcade games for PointNet Games. Each game is installed directly on your server with 1-click in a secure, protected directory.', 'pointnet-games' ); ?></p>

			<?php self::render_donation_box(); ?>

			<?php if ( empty( $catalog ) ) : ?>
				<div class="notice notice-info" style="margin-top:20px; padding:15px;">
					<p style="font-size:14px; margin:0;">
						<?php esc_html_e( 'No game releases found on GitHub. Publish a release in the catalog repository to have it appear here automatically.', 'pointnet-games' ); ?>
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
									<span class="pointnet-game-badge update"><?php esc_html_e( 'Update', 'pointnet-games' ); ?></span>
								<?php elseif ( $is_installed ) : ?>
									<span class="pointnet-game-badge installed"><?php esc_html_e( 'Installed', 'pointnet-games' ); ?></span>
								<?php elseif ( ! empty( $badge_label ) ) : ?>
									<span class="pointnet-game-badge popular"><?php echo esc_html( $badge_label ); ?></span>
								<?php endif; ?>
							</div>
							<div class="pointnet-game-card-body">
								<p class="pointnet-game-card-desc"><?php echo esc_html( $game['description'] ); ?></p>
								<div class="pointnet-game-meta-row">
									<span><strong><?php esc_html_e( 'Version:', 'pointnet-games' ); ?></strong> v<?php echo esc_html( $game['version'] ); ?></span>
									<?php if ( $is_installed ) : ?>
										<span><strong><?php esc_html_e( 'Current:', 'pointnet-games' ); ?></strong> v<?php echo esc_html( $local_version ); ?></span>
									<?php endif; ?>
								</div>
							</div>
							<div class="pointnet-game-card-footer">
								<span style="font-size:12px; color:#646970;"><code><?php echo esc_html( $slug ); ?></code></span>
								<div class="actions">
									<?php if ( $has_update ) : ?>
										<button type="button" class="button button-primary pointnet-game-update-btn" data-slug="<?php echo esc_attr( $slug ); ?>">
											🔄 <?php esc_html_e( 'Update', 'pointnet-games' ); ?>
										</button>
									<?php elseif ( $is_installed ) : ?>
										<button type="button" class="button button-secondary pointnet-game-uninstall-btn" data-slug="<?php echo esc_attr( $slug ); ?>">
											🗑️ <?php esc_html_e( 'Uninstall', 'pointnet-games' ); ?>
										</button>
									<?php else : ?>
										<button type="button" class="button button-primary pointnet-game-install-btn" data-slug="<?php echo esc_attr( $slug ); ?>">
											⬇️ <?php esc_html_e( 'Install (1-Click)', 'pointnet-games' ); ?>
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
							<label for="pointnet_games_rate_limit"><?php esc_html_e( 'Rate Limit (requests/min)', 'pointnet-games' ); ?></label>
						</th>
						<td>
							<input type="number" id="pointnet_games_rate_limit" name="pointnet_games_settings[rate_limit]" value="<?php echo esc_attr( isset( $settings['rate_limit'] ) ? $settings['rate_limit'] : 5 ); ?>" min="1" max="60" class="small-text">
							<p class="description">
								<?php esc_html_e( 'Maximum number of scores that can be submitted per minute by a single player.', 'pointnet-games' ); ?>
							</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Score Validation', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[require_validation]" value="1" <?php checked( ! empty( $settings['require_validation'] ) ); ?>>
								<?php esc_html_e( 'Require manual approval before showing scores on leaderboards', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Arcade Records on Author Profiles', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[show_author_records]" value="1" <?php checked( ! isset( $settings['show_author_records'] ) || (int) $settings['show_author_records'] === 1 ); ?>>
								<?php esc_html_e( 'Automatically display the arcade statistics card on author pages (/author/...)', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Link Author Profiles on Leaderboards', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[link_author_profiles]" value="1" <?php checked( ! empty( $settings['link_author_profiles'] ) ); ?>>
								<?php esc_html_e( 'Make registered player names clickable on leaderboards with links to their author profile', 'pointnet-games' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Player Login Redirect', 'pointnet-games' ); ?></th>
						<td>
							<label style="display: block; margin-bottom: 8px;">
								<input type="checkbox" name="pointnet_games_settings[enable_login_redirect]" value="1" <?php checked( ! empty( $settings['enable_login_redirect'] ) ); ?>>
								<strong><?php esc_html_e( 'Enable custom redirect after login for players (subscribers)', 'pointnet-games' ); ?></strong>
							</label>
							<div style="margin-left: 24px;">
								<p style="margin: 6px 0 2px;">
									<label for="pointnet_login_redirect_url"><strong><?php esc_html_e( 'Standard Login Redirect URL:', 'pointnet-games' ); ?></strong></label>
								</p>
								<input type="text" id="pointnet_login_redirect_url" name="pointnet_games_settings[login_redirect_url]" value="<?php echo esc_attr( $settings['login_redirect_url'] ?? '' ); ?>" class="regular-text" placeholder="<?php echo esc_attr( home_url( '/' ) ); ?>" />
								<p class="description">
									<?php esc_html_e( 'Destination for returning players after logging in. Leave empty to redirect to the website home page.', 'pointnet-games' ); ?>
								</p>

								<p style="margin: 14px 0 2px;">
									<label for="pointnet_first_login_redirect_url"><strong><?php esc_html_e( 'First Login Redirect URL (Optional):', 'pointnet-games' ); ?></strong></label>
								</p>
								<input type="text" id="pointnet_first_login_redirect_url" name="pointnet_games_settings[first_login_redirect_url]" value="<?php echo esc_attr( $settings['first_login_redirect_url'] ?? '' ); ?>" class="regular-text" placeholder="<?php echo esc_attr( home_url( '/welcome/' ) ); ?>" />
								<p class="description">
									<?php esc_html_e( 'Special destination used only the very first time a newly registered player logs in (e.g. welcome guide, rules, or profile setup). Leave empty to use the standard redirect.', 'pointnet-games' ); ?>
								</p>
							</div>
						</td>
					</tr>
				</table>

				<h2><?php esc_html_e( 'Uninstall & Data Cleanup', 'pointnet-games' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Define plugin behavior when deleted via "Plugins → Installed Plugins". By default, your data and games are preserved in case of accidental deactivation or reinstallation.', 'pointnet-games' ); ?>
				</p>
				<table class="form-table">
					<tr>
						<th scope="row"><?php esc_html_e( 'Delete Scores & Leaderboards', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[delete_data_on_uninstall]" value="1" <?php checked( ! empty( $settings['delete_data_on_uninstall'] ) ); ?>>
								<span style="color:#d63638;"><?php esc_html_e( 'Permanently delete all score and leaderboard database tables when uninstalling the plugin', 'pointnet-games' ); ?></span>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Delete Downloaded Games', 'pointnet-games' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="pointnet_games_settings[delete_games_on_uninstall]" value="1" <?php checked( ! empty( $settings['delete_games_on_uninstall'] ) ); ?>>
								<span style="color:#d63638;"><?php esc_html_e( 'Delete the uploads/pointnet-games/ directory containing all downloaded catalog games', 'pointnet-games' ); ?></span>
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
	 * Render the Shortcodes directory & interactive builder page.
	 */
	public function render_shortcodes_page() {
		$games = get_posts(
			array(
				'post_type'      => PointNet_Games_Post_Types::GAME_CPT,
				'post_status'    => 'publish',
				'posts_per_page' => 100,
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);
		?>
		<div class="wrap pointnet-games-shortcodes-wrap">
			<h1><?php esc_html_e( 'PointNet Games — Shortcodes Reference', 'pointnet-games' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Use these shortcodes to embed playable games, interactive leaderboards, catalogs, and personal player records anywhere in your pages, posts, or page builders (Gutenberg, Elementor, Divi).', 'pointnet-games' ); ?>
			</p>

			<?php if ( ! empty( $games ) ) : ?>
				<div class="pointnet-shortcode-quickref-card" style="background: #fff; border: 1px solid #ccd0d4; border-radius: 8px; padding: 16px 20px; margin: 20px 0 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
					<h3 style="margin-top: 0; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
						<span class="dashicons dashicons-games"></span>
						<?php esc_html_e( 'Installed Games Quick Reference (ID & Slug)', 'pointnet-games' ); ?>
					</h3>
					<p style="margin-top: 0; color: #646970; font-size: 13px;">
						<?php esc_html_e( 'You can target games in shortcodes using either id="123" or slug="game-slug". Here are all your currently installed games:', 'pointnet-games' ); ?>
					</p>
					<table class="widefat striped" style="border: 1px solid #e2e4e7; border-radius: 4px; overflow: hidden;">
						<thead>
							<tr>
								<th style="width: 80px;"><strong><?php esc_html_e( 'Game ID', 'pointnet-games' ); ?></strong></th>
								<th><strong><?php esc_html_e( 'Game Title', 'pointnet-games' ); ?></strong></th>
								<th><strong><?php esc_html_e( 'Slug', 'pointnet-games' ); ?></strong></th>
								<th><strong><?php esc_html_e( 'Game Embed Shortcode', 'pointnet-games' ); ?></strong></th>
								<th><strong><?php esc_html_e( 'Leaderboard Shortcode', 'pointnet-games' ); ?></strong></th>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $games as $game_item ) : ?>
								<tr>
									<td><code><?php echo (int) $game_item->ID; ?></code></td>
									<td><strong><?php echo esc_html( $game_item->post_title ); ?></strong></td>
									<td><code><?php echo esc_html( $game_item->post_name ); ?></code></td>
									<td>
										<div class="pointnet-code-copy-box" style="margin: 0; padding: 4px 8px;">
											<code id="code-quick-game-<?php echo (int) $game_item->ID; ?>">[pointnet_game id="<?php echo (int) $game_item->ID; ?>"]</code>
											<button type="button" class="button button-small pointnet-btn-copy" data-target="code-quick-game-<?php echo (int) $game_item->ID; ?>"><?php esc_html_e( 'Copy', 'pointnet-games' ); ?></button>
										</div>
									</td>
									<td>
										<div class="pointnet-code-copy-box" style="margin: 0; padding: 4px 8px;">
											<code id="code-quick-lb-<?php echo (int) $game_item->ID; ?>">[pointnet_game_leaderboard id="<?php echo (int) $game_item->ID; ?>"]</code>
											<button type="button" class="button button-small pointnet-btn-copy" data-target="code-quick-lb-<?php echo (int) $game_item->ID; ?>"><?php esc_html_e( 'Copy', 'pointnet-games' ); ?></button>
										</div>
									</td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				</div>
			<?php endif; ?>

			<div class="pointnet-shortcode-cards-grid">

				<!-- 1. Playable Game Embed -->
				<div class="pointnet-shortcode-card">
					<div class="pointnet-shortcode-card-header">
						<span class="pointnet-shortcode-badge">🎮 <?php esc_html_e( 'Core', 'pointnet-games' ); ?></span>
						<h3><code>[pointnet_game]</code></h3>
						<p><?php esc_html_e( 'Embeds the playable arcade game inside an isolated, secure canvas/iframe sandbox with fullscreen toggle.', 'pointnet-games' ); ?></p>
					</div>
					<div class="pointnet-shortcode-card-body">
						<h4><?php esc_html_e( 'Supported Attributes:', 'pointnet-games' ); ?></h4>
						<table class="widefat striped">
							<thead><tr><th><?php esc_html_e( 'Attribute', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Default', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Description', 'pointnet-games' ); ?></th></tr></thead>
							<tbody>
								<tr><td><code>id</code></td><td><em><?php esc_html_e( 'Optional*', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'WordPress Post ID of the game (e.g. 123). Can be used instead of slug.', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>slug</code></td><td><em><?php esc_html_e( 'Optional*', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'Slug of the game (e.g. minesweeper-arcade). *Either id or slug is required.', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>width</code></td><td><code>100%</code></td><td><?php esc_html_e( 'CSS width (e.g. 100%, 800px)', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>height</code></td><td><em><?php esc_html_e( 'From manifest', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'Custom container height (e.g. 750px)', 'pointnet-games' ); ?></td></tr>
							</tbody>
						</table>
					</div>
					<div class="pointnet-shortcode-card-footer">
						<div class="pointnet-code-copy-box">
							<code id="code-game">[pointnet_game slug="minesweeper-arcade"]</code>
							<button type="button" class="button pointnet-btn-copy" data-target="code-game"><?php esc_html_e( 'Copy', 'pointnet-games' ); ?></button>
						</div>
					</div>
				</div>

				<!-- 2. Single Game Leaderboard -->
				<div class="pointnet-shortcode-card">
					<div class="pointnet-shortcode-card-header">
						<span class="pointnet-shortcode-badge">🏆 <?php esc_html_e( 'Rankings', 'pointnet-games' ); ?></span>
						<h3><code>[pointnet_game_leaderboard]</code></h3>
						<p><?php esc_html_e( 'Displays the highscore table for a single game with automatic difficulty tabs and periodic timeframe filtering.', 'pointnet-games' ); ?></p>
					</div>
					<div class="pointnet-shortcode-card-body">
						<h4><?php esc_html_e( 'Supported Attributes:', 'pointnet-games' ); ?></h4>
						<table class="widefat striped">
							<thead><tr><th><?php esc_html_e( 'Attribute', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Default', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Description', 'pointnet-games' ); ?></th></tr></thead>
							<tbody>
								<tr><td><code>id</code></td><td><em><?php esc_html_e( 'Optional*', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'WordPress Post ID of the game (or game_id="123"). Can be used instead of slug.', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>slug</code></td><td><em><?php esc_html_e( 'Optional*', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'Slug of the game. *Either id or slug is required.', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>limit</code></td><td><code>10</code></td><td><?php esc_html_e( 'Maximum number of positions shown (1 - 100)', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>period</code></td><td><code>all</code></td><td><?php esc_html_e( 'Timeframe filter: all, month, or week', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>difficulty</code></td><td><em><?php esc_html_e( 'All', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'Specific difficulty preset (e.g. easy, medium, hard, arcade)', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>tabs</code></td><td><code>auto</code></td><td><?php esc_html_e( 'Render clickable difficulty tabs when multiple modes exist (auto or 0 to disable)', 'pointnet-games' ); ?></td></tr>
							</tbody>
						</table>
					</div>
					<div class="pointnet-shortcode-card-footer">
						<div class="pointnet-code-copy-box">
							<code id="code-leaderboard">[pointnet_game_leaderboard slug="minesweeper-arcade" period="week" limit="10"]</code>
							<button type="button" class="button pointnet-btn-copy" data-target="code-leaderboard"><?php esc_html_e( 'Copy', 'pointnet-games' ); ?></button>
						</div>
					</div>
				</div>

				<!-- 3. Global Multi-Game Leaderboard -->
				<div class="pointnet-shortcode-card">
					<div class="pointnet-shortcode-card-header">
						<span class="pointnet-shortcode-badge">🌍 <?php esc_html_e( 'Hall of Fame', 'pointnet-games' ); ?></span>
						<h3><code>[pointnet_games_leaderboard]</code></h3>
						<p><?php esc_html_e( 'Displays the global arcade ranking across all installed games, isolating each player\'s personal best.', 'pointnet-games' ); ?></p>
					</div>
					<div class="pointnet-shortcode-card-body">
						<h4><?php esc_html_e( 'Supported Attributes:', 'pointnet-games' ); ?></h4>
						<table class="widefat striped">
							<thead><tr><th><?php esc_html_e( 'Attribute', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Default', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Description', 'pointnet-games' ); ?></th></tr></thead>
							<tbody>
								<tr><td><code>limit</code></td><td><code>20</code></td><td><?php esc_html_e( 'Number of global ranking entries (1 - 100)', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>period</code></td><td><code>all</code></td><td><?php esc_html_e( 'Timeframe filter: all, month, or week', 'pointnet-games' ); ?></td></tr>
							</tbody>
						</table>
					</div>
					<div class="pointnet-shortcode-card-footer">
						<div class="pointnet-code-copy-box">
							<code id="code-global">[pointnet_games_leaderboard limit="20" period="month"]</code>
							<button type="button" class="button pointnet-btn-copy" data-target="code-global"><?php esc_html_e( 'Copy', 'pointnet-games' ); ?></button>
						</div>
					</div>
				</div>

				<!-- 4. User Arcade Records & Badges -->
				<div class="pointnet-shortcode-card">
					<div class="pointnet-shortcode-card-header">
						<span class="pointnet-shortcode-badge">🎖️ <?php esc_html_e( 'Profile & Badges', 'pointnet-games' ); ?></span>
						<h3><code>[pointnet_user_records]</code></h3>
						<p><?php esc_html_e( 'Renders a player\'s personal arcade records showcase, stat KPI pills, game cards, and unlocked achievements tray.', 'pointnet-games' ); ?></p>
					</div>
					<div class="pointnet-shortcode-card-body">
						<h4><?php esc_html_e( 'Supported Attributes:', 'pointnet-games' ); ?></h4>
						<table class="widefat striped">
							<thead><tr><th><?php esc_html_e( 'Attribute', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Default', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Description', 'pointnet-games' ); ?></th></tr></thead>
							<tbody>
								<tr><td><code>user_id</code></td><td><em><?php esc_html_e( 'Current User', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'Specific WordPress user ID (optional; auto-detects author page)', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>username</code></td><td><em><?php esc_html_e( 'Current User', 'pointnet-games' ); ?></em></td><td><?php esc_html_e( 'Username or slug of the player', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>show_stats</code></td><td><code>1</code></td><td><?php esc_html_e( 'Show/hide top summary stat pills (1 or 0)', 'pointnet-games' ); ?></td></tr>
								<tr><td><code>show_play_btn</code></td><td><code>1</code></td><td><?php esc_html_e( 'Show/hide "Improve / Challenge" full-width footer buttons (1 or 0)', 'pointnet-games' ); ?></td></tr>
							</tbody>
						</table>
					</div>
					<div class="pointnet-shortcode-card-footer">
						<div class="pointnet-code-copy-box">
							<code id="code-user">[pointnet_user_records show_stats="1" show_play_btn="1"]</code>
							<button type="button" class="button pointnet-btn-copy" data-target="code-user"><?php esc_html_e( 'Copy', 'pointnet-games' ); ?></button>
						</div>
					</div>
				</div>

				<!-- 5. Games Catalog Grid -->
				<div class="pointnet-shortcode-card">
					<div class="pointnet-shortcode-card-header">
						<span class="pointnet-shortcode-badge">🕹️ <?php esc_html_e( 'Catalog Grid', 'pointnet-games' ); ?></span>
						<h3><code>[pointnet_games_list]</code></h3>
						<p><?php esc_html_e( 'Displays a responsive grid showcasing all installed arcade games with titles, thumbnails, tags, and PLAY buttons.', 'pointnet-games' ); ?></p>
					</div>
					<div class="pointnet-shortcode-card-body">
						<h4><?php esc_html_e( 'Supported Attributes:', 'pointnet-games' ); ?></h4>
						<table class="widefat striped">
							<thead><tr><th><?php esc_html_e( 'Attribute', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Default', 'pointnet-games' ); ?></th><th><?php esc_html_e( 'Description', 'pointnet-games' ); ?></th></tr></thead>
							<tbody>
								<tr><td><code>columns</code></td><td><code>3</code></td><td><?php esc_html_e( 'Number of columns in responsive grid (2, 3, 4, or 5)', 'pointnet-games' ); ?></td></tr>
							</tbody>
						</table>
					</div>
					<div class="pointnet-shortcode-card-footer">
						<div class="pointnet-code-copy-box">
							<code id="code-list">[pointnet_games_list columns="3"]</code>
							<button type="button" class="button pointnet-btn-copy" data-target="code-list"><?php esc_html_e( 'Copy', 'pointnet-games' ); ?></button>
						</div>
					</div>
				</div>

			</div>
		</div>

		<script>
		document.addEventListener('DOMContentLoaded', function() {
			document.querySelectorAll('.pointnet-btn-copy').forEach(function(btn) {
				btn.addEventListener('click', function() {
					var targetId = this.getAttribute('data-target');
					var codeEl = document.getElementById(targetId);
					if (!codeEl) return;
					var text = codeEl.textContent;
					navigator.clipboard.writeText(text).then(function() {
						var oldText = btn.textContent;
						btn.textContent = '✓ ' + <?php echo wp_json_encode( __( 'Copied!', 'pointnet-games' ) ); ?>;
						btn.classList.add('button-primary');
						setTimeout(function() {
							btn.textContent = oldText;
							btn.classList.remove('button-primary');
						}, 2000);
					});
				});
			});
		});
		</script>
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
			'enable_login_redirect'      => 0,
			'login_redirect_url'         => '',
			'first_login_redirect_url'   => '',
			'delete_data_on_uninstall'   => 0,
			'delete_games_on_uninstall'  => 0,
		);

		$clean = wp_parse_args( $input, $defaults );

		$clean['require_validation']         = isset( $input['require_validation'] ) ? 1 : 0;
		$clean['show_author_records']        = isset( $input['show_author_records'] ) ? 1 : 0;
		$clean['link_author_profiles']       = isset( $input['link_author_profiles'] ) ? 1 : 0;
		$clean['enable_login_redirect']      = isset( $input['enable_login_redirect'] ) ? 1 : 0;
		$clean['login_redirect_url']         = ! empty( $input['login_redirect_url'] ) ? esc_url_raw( trim( $input['login_redirect_url'] ) ) : '';
		$clean['first_login_redirect_url']   = ! empty( $input['first_login_redirect_url'] ) ? esc_url_raw( trim( $input['first_login_redirect_url'] ) ) : '';
		$clean['delete_data_on_uninstall']   = isset( $input['delete_data_on_uninstall'] ) ? 1 : 0;
		$clean['delete_games_on_uninstall']  = isset( $input['delete_games_on_uninstall'] ) ? 1 : 0;
		$clean['rate_limit']                 = (int) $input['rate_limit'];

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
				esc_html__( 'No games installed yet. Visit the %s to install one with 1-click.', 'pointnet-games' ),
				'<a href="' . esc_url( admin_url( 'admin.php?page=pointnet-games-catalog' ) ) . '">' . esc_html__( 'Game Catalog', 'pointnet-games' ) . '</a>'
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
			echo '<td><a href="' . esc_url( $game_url ) . '" target="_blank">' . esc_html__( 'Open game', 'pointnet-games' ) . '</a></td>';

			echo '<td>';
			$edit_url    = get_edit_post_link( $game->ID );
			$score_count = $this->count_game_scores( $game->ID );
			$confirm_text = sprintf(
				/* translators: 1: game title, 2: game slug */
				__( 'Uninstall game "%1$s"? Files in uploads/pointnet-games/%2$s/ will be removed.', 'pointnet-games' ),
				$game->post_title,
				$slug
			);

			if ( $edit_url ) {
				echo '<a href="' . esc_url( $edit_url ) . '" class="button button-small" style="margin-bottom:6px; display:inline-block;">✏️ ' . esc_html__( 'Edit', 'pointnet-games' ) . '</a><br>';
			}

			echo '<form method="post" onsubmit="return confirm(\'' . esc_js( $confirm_text ) . '\');">';
			wp_nonce_field( 'pointnet_games_uninstall_game' );
			echo '<input type="hidden" name="pointnet_games_uninstall_game" value="' . esc_attr( $game->ID ) . '">';
			echo '<label style="display:block;margin-bottom:6px;font-weight:400;cursor:pointer;">';
			echo '<input type="checkbox" name="pointnet_games_delete_scores" value="1" checked> ';
			if ( $score_count > 0 ) {
				printf(
					/* translators: %d: number of scores for this game */
					esc_html__( 'Also delete %d scores', 'pointnet-games' ),
					absint( $score_count )
				);
			} else {
				esc_html_e( 'Delete scores', 'pointnet-games' );
			}
			echo '</label>';
			echo '<button type="submit" class="button button-link-delete">' . esc_html__( 'Uninstall', 'pointnet-games' ) . '</button>';
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
				'description' => __( 'Embed a specific game via slug or ID.', 'pointnet-games' ),
				'attributes'  => '<code>slug</code>, <code>id</code>, <code>width</code>, <code>height</code>',
				'example'     => '<code>[pointnet_game slug="minesweeper-arcade"]</code>',
			),
			array(
				'code'        => '[pointnet_game_leaderboard]',
				'description' => __( 'Display the leaderboard with filters and tabs for a game.', 'pointnet-games' ),
				'attributes'  => '<code>game_id</code>, <code>difficulty</code>, <code>period</code>, <code>limit</code>',
				'example'     => '<code>[pointnet_game_leaderboard game_id="12" limit="10"]</code>',
			),
			array(
				'code'        => '[pointnet_games_list]',
				'description' => __( 'Display a grid with all available games.', 'pointnet-games' ),
				'attributes'  => '<code>columns</code>, <code>category</code>, <code>limit</code>',
				'example'     => '<code>[pointnet_games_list columns="3"]</code>',
			),
			array(
				'code'        => '[pointnet_user_records]',
				'description' => __( 'KPI card with player\'s personal records and statistics.', 'pointnet-games' ),
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
			echo '<tr><td colspan="2">' . esc_html__( 'No games played yet.', 'pointnet-games' ) . '</td></tr>';
			return;
		}

		foreach ( $results as $row ) {
			$game = get_post( $row->game_id );
			$title = $game ? $game->post_title : __( 'Unknown Game', 'pointnet-games' );
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
			wp_die( esc_html__( 'Security check failed.', 'pointnet-games' ) );
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Permission denied.', 'pointnet-games' ) );
		}

		$game_id       = absint( $_POST['pointnet_games_uninstall_game'] );
		$delete_scores = isset( $_POST['pointnet_games_delete_scores'] ) ? 1 : 0;
		$game          = get_post( $game_id );

		if ( ! $game || PointNet_Games_Post_Types::GAME_CPT !== $game->post_type ) {
			wp_die( esc_html__( 'Game not found.', 'pointnet-games' ) );
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

	/**
	 * Prevent manual post creation via post-new.php?post_type=pointnet_game and redirect to catalog.
	 */
	public function redirect_manual_game_creation() {
		global $pagenow;
		if ( 'post-new.php' === $pagenow && isset( $_GET['post_type'] ) && PointNet_Games_Post_Types::GAME_CPT === $_GET['post_type'] ) {
			wp_safe_redirect( admin_url( 'admin.php?page=pointnet-games-catalog' ) );
			exit;
		}
	}

}
