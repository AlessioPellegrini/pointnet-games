/**
 * PointNet Games Admin Catalog 1-Click Installer
 */
jQuery(document).ready(function($) {
	$('.pointnet-game-install-btn, .pointnet-game-update-btn').on('click', function(e) {
		e.preventDefault();
		var $btn = $(this);
		var slug = $btn.data('slug');
		var isUpdate = $btn.hasClass('pointnet-game-update-btn');
		var origText = $btn.text();

		if ($btn.hasClass('updating-message')) {
			return;
		}

		$btn.addClass('updating-message').prop('disabled', true).text(isUpdate ? 'Aggiornamento...' : 'Installazione...');

		$.post(pointnetGamesCatalog.ajax_url, {
			action: 'pointnet_games_install_game',
			nonce: pointnetGamesCatalog.nonce,
			slug: slug
		}).done(function(response) {
			if (response.success) {
				$btn.removeClass('updating-message button-primary').addClass('button-secondary').text('Installato ✓');
				setTimeout(function() {
					location.reload();
				}, 1000);
			} else {
				alert(response.data.message || 'Errore durante l\'installazione.');
				$btn.removeClass('updating-message').prop('disabled', false).text(origText);
			}
		}).fail(function() {
			alert('Errore di connessione al server.');
			$btn.removeClass('updating-message').prop('disabled', false).text(origText);
		});
	});

	$('.pointnet-game-uninstall-btn').on('click', function(e) {
		e.preventDefault();
		var $btn = $(this);
		var slug = $btn.data('slug');

		if (!confirm('Sei sicuro di voler disinstallare questo gioco?')) {
			return;
		}

		$btn.addClass('updating-message').prop('disabled', true).text('Rimozione...');

		$.post(pointnetGamesCatalog.ajax_url, {
			action: 'pointnet_games_uninstall_game',
			nonce: pointnetGamesCatalog.nonce,
			slug: slug
		}).done(function(response) {
			if (response.success) {
				location.reload();
			} else {
				alert(response.data.message || 'Errore durante la disinstallazione.');
				$btn.removeClass('updating-message').prop('disabled', false).text('Disinstalla');
			}
		}).fail(function() {
			alert('Errore di connessione.');
			$btn.removeClass('updating-message').prop('disabled', false).text('Disinstalla');
		});
	});

	$('#pointnet-refresh-catalog-btn').on('click', function(e) {
		e.preventDefault();
		var $btn = $(this);
		$btn.addClass('updating-message').prop('disabled', true);

		$.post(pointnetGamesCatalog.ajax_url, {
			action: 'pointnet_games_refresh_catalog',
			nonce: pointnetGamesCatalog.nonce
		}).done(function() {
			location.reload();
		}).always(function() {
			$btn.removeClass('updating-message').prop('disabled', false);
		});
	});
});
