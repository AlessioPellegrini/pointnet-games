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
		autoMatching: false
	};

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
		app.tiles = generateLevel(app.levelIndex);
		app.board = buildBoard(app.tiles);
		/* Per-level staging capacity comes from the generated level. */
		MAX_STAGING = (typeof LAST_LEVEL_DEF !== 'undefined' && LAST_LEVEL_DEF && LAST_LEVEL_DEF.maxStaging) || 4;
		app.staging = [];
		app.peeking = null;
		app.tileEls = [];
		app.score = 0;
		app.elapsed = 0;
		app.history = [];
		app.combo = 0;
		app.lastMatchTime = 0;
		app.shufflesLeft = 3;
		app.stars = 0;
		app.undoUsed = 0;
		pairsLeftAtStart = pairsLeft();
		app.timerStarted = false;

		app._metrics = computeMetrics(app.tiles);
		app._boardSize = boardSize(app._metrics);

		levelLabelEl.textContent = app.levelIndex + 1;
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
			fsCloseBtn.style.display = 'flex';
		}
	}

	function exitGameFullscreen() {
		var inIframe = window.parent !== window;
		if (inIframe) {
			window.parent.postMessage({ type: 'pointnet-games:fullscreen-exit' }, '*');
		} else {
			document.body.classList.remove('pointnet-games-fs');
			fsCloseBtn.style.display = 'none';
		}
	}

	/* Defer startGame() to the next animation frame so the splash fade
	   is applied before the board renders. The WordPress async iframe
	   resize is handled by refitUntilStable() inside startGame(), so a
	   single rAF is enough — double rAF only delayed the board. */
	function startAfterSplash() {
		/* Avvia la colonna sonora: qui c'è una user gesture reale
		   (click su PLAY / "GIOCA" del plugin) → autoplay policy ok. */
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

	fsCloseBtn.addEventListener('click', function () {
		exitGameFullscreen();
	});

	var musicBtn = document.getElementById('btn-music');
	if (musicBtn) {
		musicBtn.addEventListener('click', function () {
			if (typeof toggleMusic === 'function') toggleMusic();
		});
	}
