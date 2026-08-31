/* ============================================================
   MAHJONG ARCADE - progress.js
   Star rating, arcade persistence, cumulative scores, WP bridge
   and boot sequence. Loaded LAST.
   ============================================================ */
'use strict';

	/* ============================================================
	   STAR RATING (v1.3.4): 1★ any clear, 2★ faster than strategic par,
	   3★ no undo used. Par is fair and generous on large 3D tables.
	   ============================================================ */
	function computeStars() {
		var pairs = pairsLeftAtStart || 1;
		var isClassic = (app.multiplier && app.multiplier > 1.0);
		var secondsPerPair = isClassic ? 4.0 : 3.0;
		var parTime = Math.round(pairs * secondsPerPair);
		var s = 1;
		if (app.elapsed <= Math.max(12, parTime)) s++;
		if (app.undoUsed === 0) s++;
		return s;
	}

	function levelComplete() {
		stopTimer();
		if (typeof playSfx === 'function') playSfx('victory');
		if (typeof spawnVictoryConfetti === 'function') spawnVictoryConfetti();

		/* STRATEGIC COMPLETION BONUSES (v1.3.4):
		   Reward players for smart resource preservation and clean play. */
		var noShuffleBonus = (app.shufflesLeft === 3) ? 1500 : (app.shufflesLeft === 2 ? 500 : 0);
		var noUndoBonus = (app.undoUsed === 0) ? 1000 : 0;
		var strategicBonus = noShuffleBonus + noUndoBonus;
		app.score += strategicBonus;

		app.stars = computeStars();
		var levelNum = app.levelIndex + 1;
		saveStars(levelNum, app.stars);
		if (!bestScores[levelNum] || app.score > bestScores[levelNum]) {
			bestScores[levelNum] = app.score;
		}
		saveScores();
		var nextLevelNum = Math.min(levelNum + 1, 330);
		app.levelIndex = nextLevelNum - 1;
		saveGame();
		saveProgressToWP(nextLevelNum, bestScores);
		submitScoreToWP(computeCumulative(), levelNum, app.elapsed);

		if (levelNum === 330) {
			/* GRAND FINALE CELEBRATION (v1.3.4) */
			modalTitle.textContent = '👑 CAMPIONE SUPREMO! 👑';
			var totalStars = 0;
			for (var l in bestStars) {
				if (Object.prototype.hasOwnProperty.call(bestStars, l)) totalStars += bestStars[l];
			}
			modalStats.innerHTML = '🎉 <b>CONGRATULAZIONI!</b> Hai conquistato tutti i Livelli di Mahjong Arcade!<br><br>' +
				'⭐ Stelle Totali: <b>' + totalStars + '</b><br>' +
				'🏆 Punteggio Record Cumulativo: <b>' + computeCumulative().toLocaleString() + ' pt</b><br>' +
				'⏱️ Tempo Ultimo Livello: ' + app.elapsed + 's' +
				(strategicBonus > 0 ? (' (inclusi +' + strategicBonus + ' bonus strategici!)') : '');
			if (btnPlayAgain) btnPlayAgain.textContent = '🔄 Rigioca Livelli';
		} else {
			modalTitle.textContent = (app.mode === 'classic') ? '🏛️ Sfida Classica Completata!' : '🏆 Livello Superato!';
			modalStars.textContent = '⭐'.repeat(app.stars) + '☆'.repeat(3 - app.stars);
			var ptsText = (app.score > 0) ? ('🎯 Punteggio: <b>' + app.score + ' pt</b>' + (strategicBonus > 0 ? (' (+' + strategicBonus + ' bonus)') : '') + '<br>') : '';
			modalStats.innerHTML = ptsText + '⏱️ Tempo: ' + app.elapsed + 's · ⭐ Stelle: ' + app.stars + '/3';
			if (btnPlayAgain) btnPlayAgain.textContent = '▶ Livello ' + (levelNum + 1);
		}

		var btnModalShuffle = document.getElementById('btn-modal-shuffle');
		if (btnModalShuffle) btnModalShuffle.style.display = 'none';
		if (modalStars) {
			var starStr = '';
			for (var si = 0; si < 3; si++) starStr += (si < app.stars) ? '⭐' : '☆';
			modalStars.textContent = starStr;
		}
		var modalLoginHint = document.getElementById('modal-login-hint');
		if (modalLoginHint) {
			var isLoggedIn = (typeof window.pointnetGamesAPI !== 'undefined' && typeof window.pointnetGamesAPI.isUserLoggedIn === 'function')
				? window.pointnetGamesAPI.isUserLoggedIn()
				: !!(window.__wpGamesState && window.__wpGamesState.loggedIn);
			modalLoginHint.style.display = isLoggedIn ? 'none' : 'block';
		}
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

			/* v1.3.4: leaderboard response from parent WordPress plugin */
			if (msg.type === 'pointnet-games:leaderboard') {
				var entries = Array.isArray(msg.data) ? msg.data : (msg.data && msg.data.entries ? msg.data.entries : []);
				renderDrawerLeaderboard(entries);
			}
		});
	}

	/* ============================================================
	   DRAWER LEADERBOARD RENDERING (v1.3.4)
	   Displays Top 10 absolute players with medals and live formatting.
	   ============================================================ */
	function renderDrawerLeaderboard(entries) {
		var listEl = document.getElementById('drawer-lb-list');
		if (!listEl) return;
		if (!entries || !entries.length) {
			listEl.innerHTML = '<div class="drawer-lb-empty">Nessun punteggio ancora registrato. Sii il primo!</div>';
			return;
		}
		var html = '';
		for (var i = 0; i < Math.min(10, entries.length); i++) {
			var e = entries[i];
			var rank = i + 1;
			var rankClass = (rank === 1) ? 'gold' : (rank === 2 ? 'silver' : (rank === 3 ? 'bronze' : ''));
			var rankBadge = (rank === 1) ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : (rank + '°')));
			var name = e.nickname || e.player_name || e.user_login || 'Giocatore';
			var scoreFormatted = Number(e.score || 0).toLocaleString();
			html += '<div class="drawer-lb-row">' +
				'<span class="drawer-lb-rank ' + rankClass + '">' + rankBadge + '</span>' +
				'<span class="drawer-lb-name" title="' + name + '">' + name + '</span>' +
				'<span class="drawer-lb-score">' + scoreFormatted + ' pt</span>' +
			'</div>';
		}
		listEl.innerHTML = html;
	}
	window.renderDrawerLeaderboard = renderDrawerLeaderboard;

	function fetchDrawerLeaderboard() {
		var listEl = document.getElementById('drawer-lb-list');
		if (!listEl) return;
		listEl.innerHTML = '<div class="drawer-lb-loading">⏳ Caricamento classifica...</div>';
		if (typeof window.pointnetGamesAPI !== 'undefined' && typeof window.pointnetGamesAPI.getLeaderboard === 'function') {
			window.pointnetGamesAPI.getLeaderboard(10, function (entries) {
				renderDrawerLeaderboard(entries);
			});
		} else if (window.parent !== window) {
			window.parent.postMessage({ type: 'pointnet-games:get-leaderboard', data: { limit: 10 } }, '*');
		} else {
			renderDrawerLeaderboard([]);
		}
	}
	window.fetchDrawerLeaderboard = fetchDrawerLeaderboard;

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
	window.saveProgressToWP = saveProgressToWP;
	window.saveGame = saveGame;

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
