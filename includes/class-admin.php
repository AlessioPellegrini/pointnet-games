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
		add_action( 'show_user_profile', array( $this, 'render_user_profile_arcade_section' ) );
		add_action( 'edit_user_profile', array( $this, 'render_user_profile_arcade_section' ) );
		add_action( 'personal_options_update', array( $this, 'save_user_profile_arcade_preferences' ) );
		add_action( 'edit_user_profile_update', array( $this, 'save_user_profile_arcade_preferences' ) );
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
		$is_pointnet_page = ( strpos( $hook_suffix, 'pointnet-games' ) !== false );
		$is_profile_page  = in_array( $hook_suffix, array( 'profile.php', 'user-edit.php' ), true );

		if ( ! $is_pointnet_page && ! $is_profile_page ) {
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
						<th scope="row"><?php esc_html_e( 'User Arcade Profiles & Career', 'pointnet-games' ); ?></th>
						<td>
							<label style="display: block; margin-bottom: 12px;">
								<input type="checkbox" name="pointnet_games_settings[enable_user_profile_career]" value="1" <?php checked( ! empty( $settings['enable_user_profile_career'] ) ); ?>>
								<strong><?php esc_html_e( 'Enable arcade statistics, personal records, and achievements showcase for users', 'pointnet-games' ); ?></strong>
							</label>

							<div style="margin-left: 24px;">
								<p style="margin: 0 0 6px;"><strong><?php esc_html_e( 'Display locations:', 'pointnet-games' ); ?></strong></p>
								<div style="margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px;">
									<label>
										<input type="checkbox" name="pointnet_games_settings[show_backend_profile]" value="1" <?php checked( ! isset( $settings['show_backend_profile'] ) || ! empty( $settings['show_backend_profile'] ) ); ?>>
										<?php esc_html_e( 'In WordPress user profile dashboard (/wp-admin/profile.php)', 'pointnet-games' ); ?>
									</label>
									<label>
										<input type="checkbox" name="pointnet_games_settings[show_author_records]" value="1" <?php checked( ! isset( $settings['show_author_records'] ) || ! empty( $settings['show_author_records'] ) ); ?>>
										<?php esc_html_e( 'On public website author archive pages (/author/...)', 'pointnet-games' ); ?>
									</label>
								</div>

								<p style="margin: 0 0 6px;"><strong><?php esc_html_e( 'Enabled user roles:', 'pointnet-games' ); ?></strong></p>
								<p class="description" style="margin-top: 0; margin-bottom: 8px;">
									<?php esc_html_e( 'Choose which user roles have their arcade career active. Unchecked roles retain standard default WordPress profile.', 'pointnet-games' ); ?>
								</p>
								<fieldset style="display: flex; flex-wrap: wrap; gap: 16px;">
									<?php
									$all_roles       = function_exists( 'wp_roles' ) ? wp_roles()->get_names() : array();
									$is_all_roles    = ! empty( $settings['profile_career_all_roles'] );
									$enabled_roles   = isset( $settings['profile_career_roles'] ) && is_array( $settings['profile_career_roles'] ) ? $settings['profile_career_roles'] : array( 'subscriber' );
									?>
									<label style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; width: 100%; margin-bottom: 4px;">
										<input type="checkbox" id="pointnet_all_roles_toggle" name="pointnet_games_settings[profile_career_all_roles]" value="1" <?php checked( $is_all_roles ); ?> onclick="document.querySelectorAll('.pointnet-role-checkbox').forEach(cb => cb.disabled = this.checked);">
										<span>⚡ <?php esc_html_e( 'All roles (apply to every registered user)', 'pointnet-games' ); ?></span>
									</label>
									<?php foreach ( $all_roles as $role_key => $role_name ) :
										$is_role_checked = $is_all_roles || in_array( $role_key, $enabled_roles, true );
										?>
										<label style="display: inline-flex; align-items: center; gap: 4px;">
											<input type="checkbox" class="pointnet-role-checkbox" name="pointnet_games_settings[profile_career_roles][]" value="<?php echo esc_attr( $role_key ); ?>" <?php checked( $is_role_checked ); ?> <?php disabled( $is_all_roles ); ?>>
											<span><?php echo esc_html( translate_user_role( $role_name ) ); ?> (<code><?php echo esc_html( $role_key ); ?></code>)</span>
										</label>
									<?php endforeach; ?>
								</fieldset>
							</div>
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
			'show_backend_profile'       => 1,
			'link_author_profiles'       => 0,
			'enable_user_profile_career' => 0,
			'profile_career_all_roles'   => 0,
			'profile_career_roles'       => array( 'subscriber' ),
			'enable_login_redirect'      => 0,
			'login_redirect_url'         => '',
			'first_login_redirect_url'   => '',
			'delete_data_on_uninstall'   => 0,
			'delete_games_on_uninstall'  => 0,
		);

		$clean = wp_parse_args( $input, $defaults );

		$clean['require_validation']         = isset( $input['require_validation'] ) ? 1 : 0;
		$clean['show_author_records']        = isset( $input['show_author_records'] ) ? 1 : 0;
		$clean['show_backend_profile']       = isset( $input['show_backend_profile'] ) ? 1 : 0;
		$clean['link_author_profiles']       = isset( $input['link_author_profiles'] ) ? 1 : 0;
		$clean['enable_user_profile_career'] = isset( $input['enable_user_profile_career'] ) ? 1 : 0;
		$clean['profile_career_all_roles']   = isset( $input['profile_career_all_roles'] ) ? 1 : 0;
		$clean['profile_career_roles']       = isset( $input['profile_career_roles'] ) && is_array( $input['profile_career_roles'] ) ? array_map( 'sanitize_key', $input['profile_career_roles'] ) : array();
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

	/**
	 * Render Arcade Career, Top Games, and Badges in the WordPress User Profile.
	 *
	 * @param WP_User $user The WordPress user object.
	 */
	public function render_user_profile_arcade_section( $user ) {
		if ( ! is_a( $user, 'WP_User' ) ) {
			return;
		}

		$settings = get_option( 'pointnet_games_settings', array() );

		// Check if feature is globally enabled and backend location is active.
		if ( empty( $settings['enable_user_profile_career'] ) ) {
			return;
		}

		if ( isset( $settings['show_backend_profile'] ) && empty( $settings['show_backend_profile'] ) ) {
			return;
		}

		// Check role permission (admins always have permission to view on user-edit).
		$all_roles_enabled = ! empty( $settings['profile_career_all_roles'] );
		$enabled_roles     = isset( $settings['profile_career_roles'] ) && is_array( $settings['profile_career_roles'] ) ? $settings['profile_career_roles'] : array();
		$user_roles        = (array) $user->roles;
		$has_role          = $all_roles_enabled || (bool) array_intersect( $user_roles, $enabled_roles );
		$is_admin          = current_user_can( 'manage_options' );

		if ( ! $has_role && ! $is_admin ) {
			return;
		}

		$records_data = PointNet_Games_Leaderboard::get_user_records( $user->ID );
		$stats        = $records_data['stats'];
		$games        = $records_data['games'];

		$hide_public  = (bool) get_user_meta( $user->ID, '_pointnet_games_hide_records', true );

		// Enqueue public styling for badges and cards.
		wp_enqueue_style( 'pointnet-games-public', POINTNET_GAMES_PLUGIN_URL . 'assets/css/pointnet-games-public.css', array(), POINTNET_GAMES_VERSION );

		?>
		<h2>🎮 <?php esc_html_e( 'PointNet Games — Arcade Career & Records', 'pointnet-games' ); ?></h2>
		<table class="form-table pointnet-profile-arcade-table">
			<tr>
				<th scope="row"><?php esc_html_e( 'Public Profile Privacy', 'pointnet-games' ); ?></th>
				<td>
					<label>
						<input type="checkbox" name="pointnet_games_hide_records" value="1" <?php checked( $hide_public ); ?> />
						<?php esc_html_e( 'Hide my arcade statistics and records from my public author/profile page', 'pointnet-games' ); ?>
					</label>
					<p class="description">
						<?php esc_html_e( 'When checked, your arcade scores and badges will remain visible only to you and administrators.', 'pointnet-games' ); ?>
					</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><?php esc_html_e( 'Career Overview', 'pointnet-games' ); ?></th>
				<td>
					<div class="pointnet-games-stats-bar" style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
						<div class="pointnet-games-stat-pill">
							<span class="png-pill-icon">🏆</span>
							<span class="png-pill-label"><?php esc_html_e( 'Total Score:', 'pointnet-games' ); ?></span>
							<strong><?php echo esc_html( number_format_i18n( $stats['total_score'] ) ); ?> pt</strong>
						</div>
						<div class="pointnet-games-stat-pill">
							<span class="png-pill-icon">🕹️</span>
							<span class="png-pill-label"><?php esc_html_e( 'Games Played:', 'pointnet-games' ); ?></span>
							<strong><?php echo esc_html( (string) $stats['games_played'] ); ?></strong>
						</div>
						<div class="pointnet-games-stat-pill">
							<span class="png-pill-icon">🎯</span>
							<span class="png-pill-label"><?php esc_html_e( 'Best Rank:', 'pointnet-games' ); ?></span>
							<strong><?php echo null !== $stats['best_position'] ? '#' . esc_html( (string) $stats['best_position'] ) : '—'; ?></strong>
						</div>
						<div class="pointnet-games-stat-pill">
							<span class="png-pill-icon">🎖️</span>
							<span class="png-pill-label"><?php esc_html_e( 'Badges:', 'pointnet-games' ); ?></span>
							<strong><?php echo esc_html( (string) count( PointNet_Games_Achievements::get_user_achievements( $user->ID ) ) ); ?> / <?php echo esc_html( (string) count( PointNet_Games_Achievements::get_all() ) ); ?></strong>
						</div>
					</div>
				</td>
			</tr>

			<?php
			$all_definitions = PointNet_Games_Achievements::get_all();
			$user_badges     = PointNet_Games_Achievements::get_user_achievements( $user->ID );
			$unlocked_map    = array();
			foreach ( $user_badges as $ub ) {
				$unlocked_map[ $ub['achievement_id'] ] = $ub;
			}
			?>
			<tr>
				<th scope="row"><?php esc_html_e( 'Achievements & Badges', 'pointnet-games' ); ?></th>
				<td>
					<div class="pointnet-games-achievements-tray" style="margin-top: 0; background: #fff;">
						<div class="pointnet-games-achievements-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
							<?php foreach ( $all_definitions as $badge_id => $badge ) :
								$is_unlocked   = isset( $unlocked_map[ $badge_id ] );
								$badge_class   = $is_unlocked ? 'png-badge-unlocked png-badge-' . esc_attr( $badge['rarity'] ) : 'png-badge-locked';
								$unlocked_meta = $is_unlocked ? $unlocked_map[ $badge_id ] : null;
								if ( $is_unlocked ) {
									$formatted_date = date_i18n( get_option( 'date_format' ), strtotime( $unlocked_meta['unlocked_at'] ?? 'now' ) );
									/* translators: %s: formatted unlock date */
									$unlocked_tip = sprintf( esc_html__( 'Unlocked on %s', 'pointnet-games' ), esc_html( $formatted_date ) );
								} else {
									$unlocked_tip = esc_html__( 'Locked', 'pointnet-games' );
								}
								?>
								<div class="pointnet-games-badge-card <?php echo esc_attr( $badge_class ); ?>" title="<?php echo esc_attr( $badge['title'] . ' — ' . $badge['description'] . ' (' . $unlocked_tip . ')' ); ?>">
									<div class="pointnet-games-badge-icon"><?php echo $is_unlocked ? esc_html( $badge['icon'] ) : '🔒'; ?></div>
									<div class="pointnet-games-badge-body">
										<div class="pointnet-games-badge-name"><?php echo esc_html( $badge['title'] ); ?></div>
										<div class="pointnet-games-badge-desc"><?php echo esc_html( $badge['description'] ); ?></div>
									</div>
								</div>
							<?php endforeach; ?>
						</div>
					</div>
				</td>
			</tr>

			<?php if ( ! empty( $games ) ) : ?>
				<tr>
					<th scope="row"><?php esc_html_e( 'Personal Best by Game', 'pointnet-games' ); ?></th>
					<td>
						<div class="pointnet-games-user-cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
							<?php foreach ( $games as $game ) : ?>
								<div class="pointnet-games-user-card" style="margin: 0;">
									<div class="pointnet-games-user-card-head">
										<div class="pointnet-games-user-card-game">
											<?php if ( ! empty( $game['thumbnail'] ) ) : ?>
												<img src="<?php echo esc_url( $game['thumbnail'] ); ?>" alt="<?php echo esc_attr( $game['title'] ); ?>" class="pointnet-games-user-card-thumb" />
											<?php else : ?>
												<div class="pointnet-games-user-card-icon">🎮</div>
											<?php endif; ?>
											<div class="pointnet-games-user-card-titles">
												<h4 class="pointnet-games-user-card-title"><a href="<?php echo esc_url( $game['permalink'] ); ?>" target="_blank"><?php echo esc_html( $game['title'] ); ?></a></h4>
												<span class="pointnet-games-user-card-subtitle">
													<?php
													/* translators: %d: number of records */
													printf( esc_html__( '%d records registered', 'pointnet-games' ), count( $game['records'] ) );
													?>
												</span>
											</div>
										</div>
									</div>
									<div class="pointnet-games-user-card-records">
										<?php foreach ( $game['records'] as $rec ) : ?>
											<div class="pointnet-games-record-row">
												<div class="pointnet-games-record-mode">
													<span class="pointnet-games-diff-badge"><?php echo esc_html( $rec['diff_label'] ); ?></span>
													<?php if ( ! empty( $rec['played_at'] ) ) : ?>
														<span class="pointnet-games-record-date"><?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $rec['played_at'] ) ) ); ?></span>
													<?php endif; ?>
												</div>
												<div class="pointnet-games-record-score">
													<span class="pointnet-games-score-num"><?php echo esc_html( number_format_i18n( $rec['score'] ) ); ?></span>
													<span class="pointnet-games-score-pts">pt</span>
												</div>
											</div>
										<?php endforeach; ?>
									</div>
								</div>
							<?php endforeach; ?>
						</div>
					</td>
				</tr>
			<?php endif; ?>
		</table>
		<?php
	}

	/**
	 * Save arcade user preferences from the profile screen.
	 *
	 * @param int $user_id The user ID.
	 */
	public function save_user_profile_arcade_preferences( $user_id ) {
		if ( ! current_user_can( 'edit_user', $user_id ) ) {
			return;
		}

		if ( isset( $_POST['pointnet_games_hide_records'] ) ) {
			update_user_meta( $user_id, '_pointnet_games_hide_records', 1 );
		} else {
			delete_user_meta( $user_id, '_pointnet_games_hide_records' );
		}
	}

}
