/* ============================================================
   MAHJONG ARCADE - progress.js
   Star rating, arcade persistence, cumulative scores, WP bridge
   and boot sequence. Loaded LAST.
   ============================================================ */
'use strict';

	/* ============================================================
	   STAR RATING (v0.7.0): 1★ any clear, 2★ faster than par,
	   3★ no undo used. Par = 2s per remaining pair at start.
	   ============================================================ */
	function computeStars() {
		var pairs = pairsLeftAtStart || 1;
		var parTime = pairs * 2;
		var s = 1;
		if (app.elapsed <= Math.max(10, parTime)) s++;
		if (app.undoUsed === 0) s++;
		return s;
	}

	function levelComplete() {
		stopTimer();
		if (typeof playSfx === 'function') playSfx('victory');
		if (typeof spawnVictoryConfetti === 'function') spawnVictoryConfetti();
		app.stars = computeStars();
		var levelNum = app.levelIndex + 1;
		saveStars(levelNum, app.stars);
		app.levelIndex = Math.min(levelNum, 329);
		saveGame();
		/* PHASE 4: persist progress + submit the score to the leaderboard. */
		if (!bestScores[levelNum] || app.score > bestScores[levelNum]) {
			bestScores[levelNum] = app.score;
		}
		saveScores();
		saveProgressToWP(levelNum, bestScores);
		submitScoreToWP(computeCumulative(), levelNum, app.elapsed);
		modalTitle.textContent = '🏆 Level ' + levelNum + ' Cleared!';
		/* Restore the "Next level" label (a previous loss had changed
		   it to "Retry"). */
		if (btnPlayAgain) btnPlayAgain.textContent = '▶ Next level';
		var btnModalShuffle = document.getElementById('btn-modal-shuffle');
		if (btnModalShuffle) btnModalShuffle.style.display = 'none';
		if (modalStars) {
			var starStr = '';
			for (var si = 0; si < 3; si++) starStr += (si < app.stars) ? '⭐' : '☆';
			modalStars.textContent = starStr;
		}
		modalStats.textContent = 'Time: ' + app.elapsed + 's   ·   Score: ' + app.score +
			'   ·   Best: ' + (bestStars[levelNum] || 0) + '⭐' +
			'   ·   Next: Level ' + Math.min(levelNum + 1, 330);
		overlayEl.classList.add('show');
	}

	/* ============================================================
	   ARCADE PERSISTENCE — level reached + debug URL ?level=N.
	   ============================================================ */
	function readUrlParams() {
		try {
			var qs = new URLSearchParams(window.location.search);
			var lvl = parseInt(qs.get('level'), 10);
			if (!isNaN(lvl) && lvl >= 1) app.levelIndex = Math.min(lvl - 1, 329);
		} catch (e) {}
	}

	function saveGame() {
		try {
			localStorage.setItem('wp_mahjong_arcade_level', String(app.levelIndex));
		} catch (e) {}
	}

	function loadGame() {
		try {
			var raw = localStorage.getItem('wp_mahjong_arcade_level');
			if (raw !== null) {
				var n = parseInt(raw, 10);
				if (!isNaN(n) && n >= 0) app.levelIndex = Math.min(n, 329);
			}
		} catch (e) {}
	}

	/* ============================================================
	   STAR RATING PERSISTENCE (v0.7.0) — best stars per level.
	   ============================================================ */
	var bestStars = {};
var bestScores = {};

	function loadStars() {
		try {
			var raw = localStorage.getItem('wp_mahjong_arcade_stars');
			if (raw) bestStars = JSON.parse(raw) || {};
		} catch (e) { bestStars = {}; }
	}

	function saveStars(levelNum, stars) {
		if (!bestStars[levelNum] || stars > bestStars[levelNum]) {
			bestStars[levelNum] = stars;
		}
		try {
			localStorage.setItem('wp_mahjong_arcade_stars', JSON.stringify(bestStars));
		} catch (e) {}
	}

	/* CUMULATIVE SCORE (v0.8.0) — best score per level + running total. */
	function loadScores() {
		try {
			var raw = localStorage.getItem('wp_mahjong_arcade_scores');
			if (raw) bestScores = JSON.parse(raw) || {};
		} catch (e) { bestScores = {}; }
	}

	function saveScores() {
		try {
			localStorage.setItem('wp_mahjong_arcade_scores', JSON.stringify(bestScores));
		} catch (e) {}
	}

	function computeCumulative() {
		var total = 0;
		for (var lvl in bestScores) {
			if (Object.prototype.hasOwnProperty.call(bestScores, lvl)) {
				total += parseInt(bestScores[lvl], 10) || 0;
			}
		}
		return total;
	}

	/* ============================================================
	   WP GAMES INTEGRATION
	   ============================================================ */
	function initWPGamesBridge() {
		var params = new URLSearchParams(window.location.search);

		if (params.get('pointnet_game_id')) {
			var gameId = params.get('pointnet_game_id');

			if (typeof window.pointnetGamesAPI !== 'undefined') {
				window.pointnetGamesAPI._setGameId(parseInt(gameId, 10) || 0);
			} else {
				window.parent.postMessage({ type: 'pointnet-games:init' }, '*');
			}
		}

		window.addEventListener('message', function (event) {
			var msg = event.data;
			if (!msg || typeof msg !== 'object' || !msg.type) return;

			if (msg.type === 'pointnet-games:init-confirm') {
				window.__wpGamesState = window.__wpGamesState || {};
				window.__wpGamesState.gameId = msg.data.gameId;
				window.__wpGamesState.nickname = msg.data.nickname;
				window.__wpGamesState.loggedIn = msg.data.loggedIn;
			}

			/* PHASE 4: saved WP progress (only before the game starts) */
			if (msg.type === 'pointnet-games:progress' && msg.data) {
				var savedLevel = parseInt(msg.data.level, 10) || 0;
				/* Only apply if the user hasn't started playing yet and
				   no explicit ?level= override is present. */
				if (app.tiles.length === 0 &&
				    !new URLSearchParams(window.location.search).get('level') &&
				    savedLevel > 0) {
					app.levelIndex = Math.min(savedLevel - 1, 329);
					window.__wpLoadedLevel = savedLevel;
				}
			}
		});
	}

	/* PHASE 4: ask the plugin for the user's saved level (logged-in). */
	function loadProgressFromWP() {
		var inIframe = window.parent !== window;
		if (typeof window.pointnetGamesAPI !== 'undefined' &&
		    typeof window.pointnetGamesAPI.getProgress === 'function') {
			window.pointnetGamesAPI.getProgress().then(function (progress) {
				var savedLevel = parseInt(progress.level, 10) || 0;
				if (app.tiles.length === 0 &&
				    !new URLSearchParams(window.location.search).get('level') &&
				    savedLevel > 0) {
					app.levelIndex = Math.min(savedLevel - 1, 329);
					window.__wpLoadedLevel = savedLevel;
				}
				/* Merge server-side best scores so the cumulative total
				   stays coherent across devices. */
				if (progress.scores && typeof progress.scores === 'object') {
					for (var lvl in progress.scores) {
						var val = parseInt(progress.scores[lvl], 10) || 0;
						if (val > (bestScores[lvl] || 0)) bestScores[lvl] = val;
					}
					saveScores();
				}
			});
		} else if (inIframe) {
			window.parent.postMessage({ type: 'pointnet-games:get-progress' }, '*');
		}
	}

	/* PHASE 4: persist reached level + best score to the plugin. */
	function saveProgressToWP(reachedLevel, scores) {
		try {
			if (typeof window.pointnetGamesAPI !== 'undefined' &&
			    typeof window.pointnetGamesAPI.saveProgress === 'function') {
				window.pointnetGamesAPI.saveProgress(reachedLevel, scores);
			} else if (window.parent !== window) {
				window.parent.postMessage({
					type: 'pointnet-games:save-progress',
					data: { level: reachedLevel, scores: scores }
				}, '*');
			}
		} catch (e) {}
	}

	/* PHASE 4: submit the completed level score to the leaderboard. */
	function submitScoreToWP(score, level, elapsed) {
		try {
			var payload = {
				score: parseInt(score, 10) || 0,
				meta: {
					level: level,
					time: elapsed
				}
			};
			if (typeof window.pointnetGamesAPI !== 'undefined' &&
			    typeof window.pointnetGamesAPI.submitScore === 'function') {
				window.pointnetGamesAPI.submitScore(payload.score, payload.meta);
			} else if (window.parent !== window) {
				window.parent.postMessage({
					type: 'pointnet-games:submit-score',
					data: payload
				}, '*');
			}
		} catch (e) {}
	}

	function wirePostMessageAPI() {
		if (typeof window.pointnetGamesAPI !== 'undefined') return;

		window.pointnetGamesAPI = {
			_currentGameId: parseInt(new URLSearchParams(window.location.search).get('pointnet_game_id'), 10) || 0,

			_setGameId: function (id) {
				this._currentGameId = id || 0;
			},

			getNickname: function () {
				return window.__wpGamesState ? window.__wpGamesState.nickname || '' : '';
			},

			isUserLoggedIn: function () {
				return !!(window.__wpGamesState && window.__wpGamesState.loggedIn);
			}
		};
	}

		readUrlParams();
	if (!new URLSearchParams(window.location.search).get('level')) loadGame();
	loadStars();
	loadScores();
	window.addEventListener('beforeunload', saveGame);

	/* PHASE 4: logged-in users resume from their saved WP level.
	   The board isn't rendered until PLAY, so this races cleanly with
	   the rest of the boot and only applies when no ?level= override. */
	loadProgressFromWP();

	initWPGamesBridge();
	wirePostMessageAPI();
