/**
 * PointNet Games — Embed loader.
 *
 * Handles initialization of game embeds, binds the pointnetGamesAPI to each
 * game container, and relays postMessage communication between the
 * plugin and games running inside iframes.
 */
(function (window) {
	'use strict';

	/**
	 * Initialize all game embeds in the document.
	 */
	function initEmbeds() {
		var embeds = document.querySelectorAll('.pointnet-games-embed');
		for (var i = 0; i < embeds.length; i++) {
			setupEmbed(embeds[i]);
		}
	}

	/**
	 * Set up a single embed container.
	 *
	 * @param {HTMLElement} element .pointnet-games-embed element
	 */
	function setupEmbed(element) {
		if (element.getAttribute('data-pointnet-games-init') === '1') {
			return;
		}
		element.setAttribute('data-pointnet-games-init', '1');

		// Bind the API to this game.
		window.pointnetGamesAPI._bindToElement(element);

		var iframe = element.querySelector('iframe');
		if (iframe) {
			setupIframeCommunication(element, iframe);
			setupFullscreenButton(element);
		}

		// Canvas/dom games.
		var canvasHost = element.querySelector('.pointnet-games-canvas-host');
		if (canvasHost) {
			setupCanvasHost(element, canvasHost);
		}
	}

	/**
	 * Add a "fullscreen" button to the embed container.
	 *
	 * @param {HTMLElement} element Parent embed container.
	 */
	function setupFullscreenButton(element) {
		var button = document.createElement('button');
		button.className = 'pointnet-games-fullscreen-btn';
		button.type = 'button';
		button.title = 'Schermo intero';
		button.innerHTML = '⛶';

		button.addEventListener('click', function () {
			if (element.classList.contains('pointnet-games-fullscreen-active')) {
				// Exit fullscreen via API if available, otherwise fallback class.
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
				element.classList.remove('pointnet-games-fullscreen-active');
				return;
			}

			if (element.requestFullscreen) {
				element.requestFullscreen().then(function () {
					element.classList.add('pointnet-games-fullscreen-active');
				}).catch(function () {});
			} else if (element.webkitRequestFullscreen) {
				element.webkitRequestFullscreen();
				element.classList.add('pointnet-games-fullscreen-active');
			} else {
				// Fallback: fill viewport with class.
				element.classList.add('pointnet-games-fullscreen-active');
			}
		});

		// Reset state when leaving fullscreen.
		document.addEventListener('fullscreenchange', function () {
			if (!document.fullscreenElement) {
				element.classList.remove('pointnet-games-fullscreen-active');
			}
		});

		element.appendChild(button);
	}

	/**
	 * Set up postMessage relaying between parent and game iframe.
	 *
	 * @param {HTMLElement} element Parent embed container.
	 * @param {HTMLIFrameElement} iframe The game iframe.
	 */
	function setupIframeCommunication(element, iframe) {
		var gameId = element.getAttribute('data-game-id');
		var gameSlug = element.getAttribute('data-game-slug');

		// Forward pointnetGamesAPI to the iframe by appending query params.
		var src = iframe.getAttribute('src');
		var sep = src.indexOf('?') === -1 ? '?' : '&';
		iframe.setAttribute('src', src + sep + 'pointnet_game_id=' + encodeURIComponent(gameId) + '&pointnet_games_nonce=' + encodeURIComponent(window.POINTNET_GAMES_CONFIG.nonce));

		// Relay messages from iframe to the API.
		window.addEventListener('message', function (event) {
			// Only accept messages from our game iframes.
			if (event.source !== iframe.contentWindow) {
				return;
			}

			var message = event.data;
			if (!message || typeof message !== 'object' || !message.type) {
				return;
			}

			if (message.type === 'pointnet-games:submit-score') {
				window.pointnetGamesAPI.submitScore(
					message.data && message.data.score,
					message.data && message.data.meta
				).then(function (response) {
					iframe.contentWindow.postMessage({
						type: 'pointnet-games:score-submitted',
						data: response
					}, '*');
				}).catch(function (error) {
					iframe.contentWindow.postMessage({
						type: 'pointnet-games:score-error',
						data: { message: error.message }
					}, '*');
				});
			}

			if (message.type === 'pointnet-games:get-leaderboard') {
				window.pointnetGamesAPI.getLeaderboard(message.data && message.data.limit || 10)
					.then(function (entries) {
						iframe.contentWindow.postMessage({
							type: 'pointnet-games:leaderboard',
							data: entries
						}, '*');
					});
			}

			if (message.type === 'pointnet-games:get-nickname') {
				iframe.contentWindow.postMessage({
					type: 'pointnet-games:nickname',
					data: {
						nickname: window.pointnetGamesAPI.getNickname(),
						loggedIn: window.pointnetGamesAPI.isUserLoggedIn()
					}
				}, '*');
			}

			if (message.type === 'pointnet-games:set-nickname') {
				window.pointnetGamesAPI.setNickname(message.data && message.data.nickname);
			}

			if (message.type === 'pointnet-games:fullscreen-request') {
				// Expand the embed container to cover the viewport.
				element.classList.add('pointnet-games-fullscreen-active');
			}

			if (message.type === 'pointnet-games:fullscreen-exit') {
				element.classList.remove('pointnet-games-fullscreen-active');
			}

			if (message.type === 'pointnet-games:init') {
				// Game ready — push config.
				iframe.contentWindow.postMessage({
					type: 'pointnet-games:init-confirm',
					data: {
						gameId: parseInt(gameId, 10) || 0,
						gameSlug: gameSlug,
						nickname: window.pointnetGamesAPI.getNickname(),
						loggedIn: window.pointnetGamesAPI.isUserLoggedIn()
					}
				}, '*');
			}

		});
	}

	/**
	 * Set up a canvas/dom game host. For now this just provides the URL
	 * to the loader script; the game itself is expected to be initialized
	 * by the embed script or configured via manifest.
	 *
	 * @param {HTMLElement} element Parent embed container.
	 * @param {HTMLElement} canvasHost The canvas host div.
	 */
	function setupCanvasHost(element, canvasHost) {
		var src = canvasHost.getAttribute('data-src');

		// Load the game's HTML into the host via iframe (simplest robust approach).
		if (src) {
			var iframe = document.createElement('iframe');
			iframe.src = src;
			iframe.setAttribute('frameborder', '0');
			iframe.setAttribute('allowfullscreen', 'true');
			iframe.style.width = '100%';
			iframe.style.height = '100%';
			canvasHost.appendChild(iframe);

			// Reuse iframe communication.
			setupIframeCommunication(element, iframe);
		}
	}

	// Initialize on DOM ready.
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initEmbeds);
	} else {
		initEmbeds();
	}

	// Also watch for dynamically added embeds (e.g. via AJAX).
	var observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];
				if (node.nodeType === 1 && node.classList && node.classList.contains('pointnet-games-embed')) {
					setupEmbed(node);
				}
			}
		});
	});

	if (window.MutationObserver && document.body) {
		observer.observe(document.body, { childList: true, subtree: true });
	}

	/**
	 * Wire the mobile "GIOCA" button.
	 *
	 * The button is rendered above the iframe on small screens
	 * (visible only <=600px via CSS). Clicking it:
	 *   1. scrolls the embed into view
	 *   2. enters fullscreen on the embed (when possible)
	 *   3. sends a "start" message to the game iframe so it skips its splash
	 */
	function setupMobilePlayButtons() {
		var buttons = document.querySelectorAll('.pointnet-games-mobile-play');
		for (var i = 0; i < buttons.length; i++) {
			var button = buttons[i];
			if (button.getAttribute('data-pointnet-games-play-init') === '1') {
				continue;
			}
			button.setAttribute('data-pointnet-games-play-init', '1');

			button.addEventListener('click', function () {
				var targetSelector = this.getAttribute('data-target');
				if (!targetSelector) {
					return;
				}

				var embedEl = document.querySelector(targetSelector);
				if (!embedEl) {
					return;
				}

				// 1. Scroll the embed into view.
				embedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

				// 2. Enter fullscreen on the embed container (when supported).
				if (embedEl.requestFullscreen && !document.fullscreenElement) {
					embedEl.requestFullscreen().then(function () {
						embedEl.classList.add('pointnet-games-fullscreen-active');
					}).catch(function () {});
				} else if (!document.fullscreenElement) {
					embedEl.classList.add('pointnet-games-fullscreen-active');
				}

				// 3. Tell the game to skip its splash and start playing.
				var iframe = embedEl.querySelector('iframe');
				if (iframe && iframe.contentWindow) {
					iframe.contentWindow.postMessage({ type: 'pointnet-games:start' }, '*');
				}
			});
		}
	}

	// Init on DOM ready and also after AJAX additions.
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setupMobilePlayButtons);
	} else {
		setupMobilePlayButtons();
	}

	if (window.MutationObserver && document.body) {
		var mobilePlayObserver = new MutationObserver(function () {
			setupMobilePlayButtons();
		});
		mobilePlayObserver.observe(document.body, { childList: true, subtree: true });
	}

	/**
	 * Wire leaderboard difficulty tabs.
	 *
	 * Each tab has data-difficulty (e.g. "easy"), each panel has
	 * data-panel (e.g. "easy"). Toggling a tab shows the matching panel.
	 */
	function setupLeaderboardTabs() {
		var tabGroups = document.querySelectorAll('.pointnet-games-leaderboard-tabs');
		tabGroups.forEach(function (tabsEl) {
			var tabs = tabsEl.querySelectorAll('.pointnet-games-leaderboard-tab');

			tabs.forEach(function (tab) {
				tab.addEventListener('click', function () {
					var difficulty = this.dataset.difficulty || '';

					// Toggle active state on tabs.
					tabs.forEach(function (t) {
						t.classList.toggle('pointnet-games-leaderboard-tab-active', t === tab);
					});

					// Show the matching leaderboard panel (scoped to this game's section).
					var section = tabsEl.closest('.pointnet-games-single-leaderboard');
					if (section) {
						var panels = section.querySelectorAll('.pointnet-games-leaderboard-panel');
						panels.forEach(function (panel) {
							panel.classList.toggle('pointnet-games-leaderboard-panel-active', (panel.dataset.panel || '') === difficulty);
						});
					}
				});
			});
		});
	}

	// Initialize on DOM ready and for dynamically added content.
	function initLeaderboardTabs() {
		setupLeaderboardTabs();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initLeaderboardTabs);
	} else {
		initLeaderboardTabs();
	}

	// Also re-wire tabs when new nodes are added.
	if (window.MutationObserver && document.body) {
		var tabObserver = new MutationObserver(function () {
			setupLeaderboardTabs();
		});
		tabObserver.observe(document.body, { childList: true, subtree: true });
	}
})(window);
