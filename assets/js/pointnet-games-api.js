/**
 * PointNet Games — Client-side API bridge.
 *
 * This is the global API available to all games loaded by the plugin.
 * Games can use `pointnetGamesAPI` to submit scores, fetch leaderboards,
 * check login state, etc.
 *
 * Exposed global: window.pointnetGamesAPI
 */
(function (window) {
	'use strict';

	// Ensure config exists (localized from PHP).
	var config = window.POINTNET_GAMES_CONFIG || {
		rest_url: '/wp-json/pointnet-games/v1',
		nonce: '',
		is_logged_in: false,
		nickname: ''
	};

	// Simple localStorage key for saved anonymous nickname.
	var NICKNAME_KEY = 'pointnet_games_nickname';

	/**
	 * Perform a fetch request with JSON handling.
	 *
	 * @param {string} path   REST path (relative to namespace).
	 * @param {object} options Fetch options.
	 *
	 * @return {Promise}
	 */
	function request(path, options) {
		options = options || {};
		options.headers = options.headers || {};
		options.headers['X-WP-Nonce'] = config.nonce;
		options.headers['Content-Type'] = 'application/json';

		return fetch(config.rest_url + path, options).then(function (response) {
			if (!response.ok) {
				return response.json().then(function (err) {
					throw new Error((err && err.message) || 'Request failed');
				});
			}
			return response.json();
		});
	}

	/**
	 * The public API object.
	 */
	var api = {
		/**
		 * Get the current user's nickname.
		 *
		 * @return {string}
		 */
		getNickname: function () {
			if (config.is_logged_in) {
				return config.nickname;
			}

			var saved = localStorage.getItem(NICKNAME_KEY);
			return saved || '';
		},

		/**
		 * Save the nickname for an anonymous user.
		 *
		 * @param {string} nickname Nickname to store.
		 */
		setNickname: function (nickname) {
			nickname = String(nickname || '').trim().slice(0, 20);
			if (nickname) {
				localStorage.setItem(NICKNAME_KEY, nickname);
			}
		},

		/**
		 * Whether the current user is logged in.
		 *
		 * @return {boolean}
		 */
		isUserLoggedIn: function () {
			return !!config.is_logged_in;
		},

		/**
		 * Fetch the list of available games.
		 *
		 * @param {Function} callback (optional) Callback receiving games list.
		 *
		 * @return {Promise}
		 */
		getGames: function (callback) {
			return request('/games').then(function (data) {
				if (typeof callback === 'function') {
					callback(data.games);
				}
				return data.games;
			});
		},

		/**
		 * Fetch details for a single game.
		 *
		 * @param {number}   gameId   Game post ID.
		 * @param {Function} callback (optional) Callback receiving game object.
		 *
		 * @return {Promise}
		 */
		getGame: function (gameId, callback) {
			return request('/game/' + encodeURIComponent(gameId)).then(function (data) {
				if (typeof callback === 'function') {
					callback(data.game);
				}
				return data.game;
			});
		},

		/**
		 * Submit a score to the leaderboard.
		 *
		 * @param {number}   score    Score value.
		 * @param {object}   meta     Optional meta { level, time, difficulty, ... }.
		 * @param {Function} callback (optional) Callback receiving response { success, score_id, position }.
		 *
		 * @return {Promise}
		 */
		submitScore: function (score, meta, callback) {
			score = parseInt(score, 10) || 0;
			meta = meta || {};

			var payload = {
				score: score,
				meta: meta
			};

			// Anonymous user: include nickname.
			if (!config.is_logged_in) {
				payload.nickname = this.getNickname();
			}

			var currentGameId = this._currentGameId;

			return request('/game/' + encodeURIComponent(currentGameId) + '/score', {
				method: 'POST',
				body: JSON.stringify(payload)
			}).then(function (response) {
				if (typeof callback === 'function') {
					callback(response);
				}
				return response;
			});
		},

		/**
		 * Fetch the leaderboard for the current game.
		 *
		 * @param {number}   limit    Max entries (default 10).
		 * @param {Function} callback (optional) Callback receiving leaderboard entries.
		 *
		 * @return {Promise}
		 */
		getLeaderboard: function (limit, callback, difficulty) {
			// Allow calling with a callback only.
			if (typeof limit === 'function') {
				callback = limit;
				limit = 10;
			}

			limit = limit || 10;
			var currentGameId = this._currentGameId;

			var url = '/game/' + encodeURIComponent(currentGameId) + '/leaderboard?limit=' + encodeURIComponent(limit);
			if (difficulty) {
				url += '&difficulty=' + encodeURIComponent(difficulty);
			}

			return request(url)
				.then(function (data) {
					if (typeof callback === 'function') {
						callback(data.entries);
					}
					return data.entries;
				});
		},

		/**
		 * Fetch the global leaderboard across all games.
		 *
		 * @param {number}   limit    Max entries (default 20).
		 * @param {Function} callback (optional) Callback receiving entries.
		 *
		 * @return {Promise}
		 */
		getGlobalLeaderboard: function (limit, callback) {
			if (typeof limit === 'function') {
				callback = limit;
				limit = 20;
			}

			limit = limit || 20;

			return request('/leaderboard?limit=' + encodeURIComponent(limit))
				.then(function (data) {
					if (typeof callback === 'function') {
						callback(data.entries);
					}
					return data.entries;
				});
		},

		/**
		 * Create a game session token (anti-cheat).
		 *
		 * @return {Promise}
		 */
		startSession: function () {
			var currentGameId = this._currentGameId;

			return request('/game/' + encodeURIComponent(currentGameId) + '/session', {
				method: 'POST',
				body: JSON.stringify({})
			});
		},

		/**
		 * Fetch the saved progress for the current game (logged-in only).
		 *
		 * @return {Promise} Resolves to { level, best_score, updated }.
		 */
		getProgress: function () {
			var currentGameId = this._currentGameId;
			if (!currentGameId) {
				return Promise.resolve({ level: 0, best_score: 0, updated: 0 });
			}

			return request('/game/' + encodeURIComponent(currentGameId) + '/progress')
				.then(function (data) {
					return data.progress || { level: 0, best_score: 0, updated: 0 };
				})
				.catch(function () {
					return { level: 0, best_score: 0, updated: 0 };
				});
		},

		/**
		 * Save the progress for the current game (logged-in only).
		 *
		 * @param {number} level Reached level number (1-based).
		 * @param {number} score Best score so far (optional).
		 *
		 * @return {Promise}
		 */
		saveProgress: function (level, score) {
			var currentGameId = this._currentGameId;
			if (!currentGameId) {
				return Promise.resolve({ success: false });
			}

			return request('/game/' + encodeURIComponent(currentGameId) + '/progress', {
				method: 'POST',
				body: JSON.stringify({
					level: parseInt(level, 10) || 0,
					score: parseInt(score, 10) || 0
				})
			}).catch(function () {
				return { success: false };
			});
		},

		/**
		 * Internal: bind the API to a specific game element.
		 * Called by pointnet-games-embed.js automatically.
		 *
		 * @param {HTMLElement} element Embed container element.
		 */
		_bindToElement: function (element) {
			var gameId = parseInt(element.getAttribute('data-game-id'), 10) || 0;
			this._currentGameId = gameId;
		},

		/**
		 * Internal: set the game id programmatically (used for iframes).
		 *
		 * @param {number} gameId Game post ID.
		 */
		_setGameId: function (gameId) {
			this._currentGameId = parseInt(gameId, 10) || 0;
		}
	};

	// Expose the API on window.
	window.pointnetGamesAPI = api;
})(window);