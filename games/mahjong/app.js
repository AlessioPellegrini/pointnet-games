/* ============================================================
   MAHJONG ARCADE - app.js
   Shared state, constants, DOM refs, game flow (startGame),
   fullscreen/splash. Loaded BEFORE ui.js/input.js/progress.js.
   ============================================================ */
'use strict';

	/* ============================================================
	   CONSTANTS
	   ============================================================ */
	var FACE_DOWN_PAIRS = 1;       // how many pairs start covered (memory)
	/* Staging box capacity is per-level (see LAST_LEVEL_DEF.maxStaging
	   set by generateLevel in data.js). Default 4 for safety. */
	var MAX_STAGING = 4;

	/* ============================================================
	   DOM REFERENCES
	   ============================================================ */
	var wrap = document.getElementById('board-wrap');
	var boardEl = document.getElementById('board');
	var levelLabelEl = document.getElementById('level-label');
	var timerEl = document.getElementById('timer');
	var pairsLeftEl = document.getElementById('pairs-left');
	var scoreEl = document.getElementById('score');
	var comboEl = document.getElementById('combo');
	var shuffleBtn = document.getElementById('btn-shuffle');
	var shuffleCountEl = document.getElementById('shuffle-count');
	var overlayEl = document.getElementById('overlay');
	var modalTitle = document.getElementById('modal-title');
	var modalStats = document.getElementById('modal-stats');
	var modalStars = document.getElementById('modal-stars');
	var stagingBoxEl = document.getElementById('staging-box');
	var splashEl = document.getElementById('splash');
	var splashPlayBtn = document.getElementById('splash-play');
	var fsCloseBtn = document.getElementById('fs-close');
	var btnPlayAgain = document.getElementById('btn-play-again');
	var pairsLeftAtStart = 1;

	/* ============================================================
	   APP STATE + GAME FLOW
	   ============================================================ */
	var app = {
		tiles: [],
		board: null,
		staging: [],          // tiles in the staging box (max 4)
		peeking: null,        // face-down tile currently revealed
		selectedTile: null,   // first tile clicked in classic mode
		mode: 'arcade',       // 'arcade' | 'classic'
		multiplier: 1.0,      // scoring multiplier (1.5x for classic)
		tileEls: [],
		score: 0,
		elapsed: 0,
		timerInterval: null,
		timerStarted: false,
		history: [],
		combo: 0,             // consecutive fast matches multiplier
		lastMatchTime: 0,
		shufflesLeft: 3,      // shuffle power-up uses per level
		stars: 0,             // star rating earned on this level
		undoUsed: 0,
		levelIndex: 0,
		_metrics: null,
		_boardSize: null,
		_scale: 1,
		_tilt: 8,
		autoMatching: false,
		devMode: false
	};

	/* ============================================================
	   DEV MODE (v1.3.5)
	   ============================================================ */
	function checkDevMode() {
		try {
			var qs = new URLSearchParams(window.location.search);
			var urlDev = qs.get('dev') === '1' || qs.get('debug') === '1';
			var localDev = localStorage.getItem('wp_mahjong_dev_mode') === '1';
			app.devMode = urlDev || localDev;
			if (app.devMode) document.body.classList.add('dev-mode-active');
			else document.body.classList.remove('dev-mode-active');
		} catch (e) {}
	}
	checkDevMode();

	function showToast(msg) {
		var toast = document.getElementById('toast-notify');
		if (!toast) return;
		toast.textContent = msg;
		toast.classList.add('show');
		clearTimeout(toast._tid);
		toast._tid = setTimeout(function () {
			toast.classList.remove('show');
		}, 2400);
	}
	window.showToast = showToast;

	function toggleDevMode(forced) {
		app.devMode = (typeof forced === 'boolean') ? forced : !app.devMode;
		try {
			localStorage.setItem('wp_mahjong_dev_mode', app.devMode ? '1' : '0');
		} catch (e) {}
		if (app.devMode) {
			document.body.classList.add('dev-mode-active');
			showToast('🛠️ Modalità Sviluppatore ATTIVATA');
		} else {
			document.body.classList.remove('dev-mode-active');
			showToast('🔒 Modalità Sviluppatore DISATTIVATA');
		}
		updateDevLayoutInfo();
	}
	window.toggleDevMode = toggleDevMode;

	function updateDevLayoutInfo() {
		var devInfoEl = document.getElementById('dev-layout-info');
		if (devInfoEl && typeof LAST_LEVEL_DEF !== 'undefined' && LAST_LEVEL_DEF) {
			var maxZ = 0;
			for (var z = 0; z < app.tiles.length; z++) {
				if (app.tiles[z].z > maxZ) maxZ = app.tiles[z].z;
			}
			devInfoEl.textContent = 'Layout: ' + LAST_LEVEL_DEF.layout + '/' + LAST_LEVEL_DEF.variant +
				' (' + app.tiles.length + ' tessere) · Strati: ' + (maxZ + 1) +
				' · Blackout: ' + (LAST_LEVEL_DEF.blackout ? 'ON' : 'OFF');
		}
	}
	window.updateDevLayoutInfo = updateDevLayoutInfo;

	function pairsLeft() {
		var count = 0;
		app.tiles.forEach(function (t) { if (!t.removed) count++; });
		return count / 2;
	}

	function startTimer() {
		if (app.timerInterval) return;
		app.timerStarted = true;
		app.timerInterval = setInterval(function () {
			app.elapsed++;
			timerEl.textContent = app.elapsed;
		}, 1000);
	}

	function stopTimer() {
		if (app.timerInterval) { clearInterval(app.timerInterval); app.timerInterval = null; }
	}

	function startGame() {
		stopTimer();
		app.timerStarted = false;
		app.elapsed = 0;
		app.staging = [];
		app.peeking = null;
		app.selectedTile = null;
		app.score = 0;
		app.combo = 0;
		app.lastMatchTime = 0;
		app.shufflesLeft = 3;
		app.undoUsed = 0;
		app.history = [];
		app.tiles = generateLevel(app.levelIndex);
		app.board = buildBoard(app.tiles);
		pairsLeftAtStart = pairsLeft();
		app.mode = (LAST_LEVEL_DEF && LAST_LEVEL_DEF.mode) ? LAST_LEVEL_DEF.mode : 'arcade';
		app.multiplier = (LAST_LEVEL_DEF && LAST_LEVEL_DEF.multiplier) ? LAST_LEVEL_DEF.multiplier : 1.0;

		/* Per-level staging capacity comes from the generated level. */
		MAX_STAGING = (typeof LAST_LEVEL_DEF !== 'undefined' && LAST_LEVEL_DEF && LAST_LEVEL_DEF.maxStaging) || 4;

		if (app.mode === 'classic') {
			document.body.classList.add('mode-classic');
			levelLabelEl.innerHTML = (app.levelIndex + 1) + ' <span class="badge-classic">CLASSIC</span>';
		} else {
			document.body.classList.remove('mode-classic');
			levelLabelEl.textContent = app.levelIndex + 1;
		}
		if (typeof setMusicMode === 'function') setMusicMode(app.mode);
		var levelInputEl = document.getElementById('level-input');
		if (levelInputEl) levelInputEl.value = app.levelIndex + 1;
		if (typeof updateDrawerScoreComparison === 'function') updateDrawerScoreComparison();
		updateDevLayoutInfo();

		timerEl.textContent = '0';
		scoreEl.textContent = '0';
		pairsLeftEl.textContent = pairsLeft();
		if (comboEl) comboEl.classList.remove('show');
		if (shuffleCountEl) shuffleCountEl.textContent = 'x' + app.shufflesLeft;
		if (shuffleBtn) shuffleBtn.disabled = false;
		overlayEl.classList.remove('show');
		renderStaging();
		rebuildBoard();
		/* Watch for the async iframe resize (WordPress fullscreen): if the
		   board was rasterized at the small embed size, refitUntilStable()
		   detects the real (larger) board-wrap size and re-rasterizes the
		   board at the new resolution before the user perceives blur. */
		refitUntilStable();
	}

	/* ============================================================
	   FULLSCREEN / SPLASH
	   ============================================================ */
	function requestGameFullscreen() {
		var inIframe = window.parent !== window;
		if (inIframe) {
			window.parent.postMessage({ type: 'pointnet-games:fullscreen-request' }, '*');
		} else {
			document.body.classList.add('pointnet-games-fs');
			if (fsCloseBtn) fsCloseBtn.style.display = 'inline-flex';
		}
	}

	function exitGameFullscreen() {
		var inIframe = window.parent !== window;
		if (inIframe) {
			window.parent.postMessage({ type: 'pointnet-games:fullscreen-exit' }, '*');
		} else {
			document.body.classList.remove('pointnet-games-fs');
			if (fsCloseBtn) fsCloseBtn.style.display = 'none';
		}
	}

	/* Defer startGame() to the next animation frame so the splash fade
	   is applied before the board renders. The WordPress async iframe
	   resize is handled by refitUntilStable() inside startGame(), so a
	   single rAF is enough — double rAF only delayed the board. */
	function startAfterSplash() {
		/* Start the background music: here we have a real user gesture
		   (PLAY / plugin "GIOCA" click) so the autoplay policy is ok. */
		if (typeof playMusic === 'function') playMusic();
		requestAnimationFrame(startGame);
	}

	splashPlayBtn.addEventListener('click', function () {
		splashEl.classList.add('hidden');
		requestGameFullscreen();
		startAfterSplash();
	});

	// External start message from the parent page "PLAY" button.
	window.addEventListener('message', function (event) {
		var msg = event.data;
		if (!msg || typeof msg !== 'object' || msg.type !== 'pointnet-games:start') {
			return;
		}
		splashEl.classList.add('hidden');
		requestGameFullscreen();
		startAfterSplash();
	});

	if (fsCloseBtn) {
		fsCloseBtn.addEventListener('click', function () {
			exitGameFullscreen();
		});
	}
