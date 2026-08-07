/* ============================================================
   MAHJONG ARCADE — game.js
   UI, DOM manipulation, staging box, click/drag handlers,
   timer, hint/undo, persistence and bootstrap.
   Depends on data.js + engine.js (loaded before this file).
   ============================================================ */
(function () {
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
	var overlayEl = document.getElementById('overlay');
	var modalTitle = document.getElementById('modal-title');
	var modalStats = document.getElementById('modal-stats');
	var stagingBoxEl = document.getElementById('staging-box');

	/* ============================================================
	   DOM TILES
	   ============================================================ */
	function createTileEl(t, i) {
		var el = document.createElement('div');
		el.className = 'tile z' + t.z + (t.isHalf ? ' half' : '');
		el.dataset.index = i;

		var overlay = document.createElement('div');
		overlay.className = 'tile-overlay';

		var sym = document.createElement('span');
		sym.className = 'tile-sym';
		el._symEl = sym;

		var plane = document.createElement('span');
		plane.className = 'plane-badge' + (t.z === 1 ? ' p2' : '') + (t.isHalf ? ' half-badge' : '');
		plane.textContent = (t.z + 1) + (t.isHalf ? '½' : '');

		var num = document.createElement('span');
		num.className = 'num-badge';
		num.textContent = t.label;

		el.appendChild(overlay);
		el.appendChild(sym);
		el.appendChild(plane);
		el.appendChild(num);
		return el;
	}

	function rebuildBoard() {
		boardEl.innerHTML = '';
		app.tileEls = [];
		app._metrics = computeMetrics(app.tiles);
		app._boardSize = boardSize(app._metrics);

		/* Paint order: plane first (base below upper), then row,
		   then column — so tiles are stacked exactly like a real
		   mahjong board and later elements paint on top. */
		var order = app.tiles.map(function (t, i) { return i; }).sort(function (a, b) {
			var ta = app.tiles[a], tb = app.tiles[b];
			if (ta.z !== tb.z) return ta.z - tb.z;
			if (ta.y !== tb.y) return ta.y - tb.y;
			return ta.x - tb.x;
		});

		for (var k = 0; k < order.length; k++) {
			var idx = order[k];
			var t = app.tiles[idx];
			var el = createTileEl(t, idx);
			var pos = layoutPos(t, app._metrics);
			el.style.setProperty('--tx', pos.x + 'px');
			el.style.setProperty('--ty', pos.y + 'px');
			el.style.setProperty('--tz', pos.tz + 'px');
			boardEl.appendChild(el);
			app.tileEls[idx] = el;
		}
		updateStates();
		fitBoard();
	}

	function updateStates() {
		for (var i = 0; i < app.tiles.length; i++) {
			var t = app.tiles[i];
			var el = app.tileEls[i];
			if (!el) continue;
			el.classList.toggle('removed', t.removed);
			el.classList.toggle('in-staging', t.staging && !t.removed);
			el.classList.toggle('blocked', !t.removed && !t.staging && !isFree(app.board, t));
			el.classList.toggle('face-down', t.faceDown && !t.staging && !t.removed);
			el.classList.toggle('hinted', !!t.hinted);
			if (el._symEl) {
				el._symEl.textContent = t.faceDown ? '🀄' : t.symbol;
			}
		}
	}

	/* ============================================================
	   FITTING — scale the whole board, never individual tiles.
	   ============================================================ */
	function fitBoard() {
		var size = app._boardSize;
		var wrapW = wrap.clientWidth || window.innerWidth;
		var wrapH = wrap.clientHeight || window.innerHeight;
		var s = Math.min((wrapW - 4) / size.w, (wrapH - 4) / size.h);
		app._scale = s;

		boardEl.style.width = size.w + 'px';
		boardEl.style.height = size.h + 'px';
		/* Centre explicitly: the scaled board has screen size size.*s.
		   Position its top-left so its centre sits exactly in the wrap. */
		boardEl.style.left = Math.round((wrapW - size.w * s) / 2) + 'px';
		boardEl.style.top = Math.round((wrapH - size.h * s) / 2) + 'px';
		boardEl.style.transform = 'scale(' + s + ')';
	}

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

	/* ============================================================
	   STAGING BOX — click a free tile to send it here.
	   Two same symbols → auto-match. 4 without match → game over.
	   ============================================================ */
	function renderStaging() {
		stagingBoxEl.innerHTML = '';
		for (var i = 0; i < MAX_STAGING; i++) {
			var slot = document.createElement('div');
			slot.className = 'staging-slot';
			if (i < app.staging.length) {
				slot.classList.add('filled');
				slot.textContent = app.staging[i].symbol;
			}
			stagingBoxEl.appendChild(slot);
		}
	}

	function moveToStaging(tile) {
		if (app.staging.length >= MAX_STAGING) return;
		if (tile.staging || tile.removed) return;

		/* Flight animation: capture source position & make a clone
		   while the tile is still visible on the board. */
		var srcEl = app.tileEls[app.tiles.indexOf(tile)];
		var srcRect = null;
		var flyer = null;
		if (srcEl) {
			srcRect = srcEl.getBoundingClientRect();
			flyer = srcEl.cloneNode(true);
			flyer.classList.remove('dragging', 'in-staging', 'removed', 'blocked', 'selected', 'hinted');
			flyer.style.cssText =
				'position:fixed;margin:0;z-index:500;pointer-events:none;will-change:transform;' +
				'transition:transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease;' +
				'left:' + srcRect.left + 'px;top:' + srcRect.top + 'px;' +
				'width:' + srcRect.width + 'px;height:' + srcRect.height + 'px;';
		}

		var pendingSlotIdx = app.staging.length;

		app.staging.push(tile);
		tile.staging = true;
		tile.faceDown = false;

		/* Auto-match: check if same symbol already in the box */
		var matched = false;
		for (var i = 0; i < app.staging.length - 1; i++) {
			var prev = app.staging[i];
			if (prev.symbol === tile.symbol && prev !== tile) {
				prev.staging = false;
				tile.staging = false;
				prev.removed = true;
				tile.removed = true;
				app.staging = app.staging.filter(function (t) {
					return t !== prev && t !== tile;
				});
				app.history.push([prev, tile]);
				app.score += 100;
				scoreEl.textContent = app.score;
				matched = true;
				break;
			}
		}

		pairsLeftEl.textContent = pairsLeft();
		updateStates();
		renderStaging();

		/* Launch the flying clone towards its slot */
		if (flyer) {
			var slot = stagingBoxEl.children[Math.min(pendingSlotIdx, MAX_STAGING - 1)] || stagingBoxEl;
			var dstRect = slot.getBoundingClientRect();
			var dx = dstRect.left - srcRect.left + (dstRect.width - srcRect.width) / 2;
			var dy = dstRect.top - srcRect.top + (dstRect.height - srcRect.height) / 2;
			var s = Math.max(0.1, Math.min(1,
				dstRect.width / srcRect.width,
				dstRect.height / srcRect.height
			));
			document.body.appendChild(flyer);
			flyer.offsetWidth; /* force reflow to start the transition */
			flyer.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
			if (matched) flyer.style.opacity = '0';
			setTimeout(function () { flyer.remove(); }, 350);
		}

		/* Game over: 4 tiles in the box without any match */
		if (!matched && app.staging.length >= MAX_STAGING) {
			stopTimer();
			modalTitle.textContent = '💀 Staging Full!';
			modalStats.textContent = '4 tiles, no match — try again!';
			overlayEl.classList.add('show');
			return;
		}

		if (pairsLeft() === 0) levelComplete();
	}

	/* ============================================================
	   CLICK / TAP LOGIC
	   face-down: 1st click reveals, 2nd click sends to staging.
	   face-up: 1st click sends to staging.
	   If a revealed tile matches one already in staging →
	   auto-match without an extra click.
	   ============================================================ */
	function handleTileClick(tile) {
		if (app.autoMatching) return;
		if (tile.removed || tile.staging) return;
		if (!isFree(app.board, tile)) {
			app.peeking = null;
			updateStates();
			return;
		}
		if (!app.timerStarted) startTimer();

		/* Case 1: covered tile → reveal (cover previous peeked) */
		if (tile.faceDown) {
			/* If the previously revealed tile matches this one →
			   BOTH go to staging immediately (auto-match, saves
			   an extra click on the first tile). */
			if (app.peeking && app.peeking.key !== tile.key &&
			    app.peeking.symbol === tile.symbol) {
				var first = app.peeking;
				app.peeking = null;
				tile.faceDown = false;
				updateStates();
				app.autoMatching = true;
				setTimeout(function () {
					app.autoMatching = false;
					moveToStaging(first);
					moveToStaging(tile);
				}, 250);
				return;
			}

			if (app.peeking && app.peeking.key !== tile.key) {
				app.peeking.faceDown = true;
			}
			tile.faceDown = false;
			app.peeking = tile;

			/* If its match is already in staging → auto-match */
			for (var i = 0; i < app.staging.length; i++) {
				if (app.staging[i].symbol === tile.symbol) {
					app.peeking = null;
					moveToStaging(tile);
					return;
				}
			}

			updateStates();
			return;
		}

		/* Case 2: click on the currently peeked tile → staging */
		if (app.peeking && app.peeking.key === tile.key) {
			app.peeking = null;
			moveToStaging(tile);
			return;
		}

		/* Case 3: face-up tile → staging (any peeking tile re-covers) */
		if (app.peeking) {
			/* AUTO-MATCH: the peeked tile and the clicked tile share
			   the same symbol → BOTH go to staging immediately (the
			   peeked tile must not be re-covered). */
			if (app.peeking.key !== tile.key && app.peeking.symbol === tile.symbol) {
				var first = app.peeking;
				app.peeking = null;
				moveToStaging(first);
				moveToStaging(tile);
				return;
			}
			/* Otherwise: re-cover the peeked tile. */
			app.peeking.faceDown = true;
			app.peeking = null;
		}
		moveToStaging(tile);
	}

	function match() {
		/* Kept for downstream compat — matches are automatic in staging. */
	}

	function undo() {
		if (app.history.length === 0) return;
		var pair = app.history.pop();
		pair[0].removed = false;
		pair[1].removed = false;
		pair[0].faceDown = false;
		pair[1].faceDown = false;
		pair[0].staging = false;
		pair[1].staging = false;
		updateStates();
		renderStaging();
		pairsLeftEl.textContent = pairsLeft();
	}

	function hint() {
		var free = [];
		app.board.forEach(function (t) {
			if (!t.removed && !t.staging && isFree(app.board, t)) free.push(t);
		});
		var bySymbol = {};
		free.forEach(function (t) {
			(bySymbol[t.symbol] = bySymbol[t.symbol] || []).push(t);
		});
		for (var sym in bySymbol) {
			if (bySymbol[sym].length >= 2) {
				bySymbol[sym][0].hinted = true;
				bySymbol[sym][1].hinted = true;
				updateStates();
				setTimeout(function () {
					bySymbol[sym][0].hinted = false;
					bySymbol[sym][1].hinted = false;
					updateStates();
				}, 2000);
				return;
			}
		}
	}

	function levelComplete() {
		stopTimer();
		app.levelIndex = Math.min(app.levelIndex + 1, 99);
		saveGame();
		modalTitle.textContent = '🏆 Level ' + (app.levelIndex + 1) + ' Cleared!';
		modalStats.textContent = 'Time: ' + app.elapsed + 's   ·   Score: ' + app.score;
		overlayEl.classList.add('show');
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
		app.timerStarted = false;

		app._metrics = computeMetrics(app.tiles);
		app._boardSize = boardSize(app._metrics);

		levelLabelEl.textContent = app.levelIndex + 1;
		timerEl.textContent = '0';
		scoreEl.textContent = '0';
		pairsLeftEl.textContent = pairsLeft();
		overlayEl.classList.remove('show');
		renderStaging();
		rebuildBoard();
	}

	/* ============================================================
	   ARCADE PERSISTENCE — level reached + debug URL ?level=N.
	   ============================================================ */
	function readUrlParams() {
		try {
			var qs = new URLSearchParams(window.location.search);
			var lvl = parseInt(qs.get('level'), 10);
			if (!isNaN(lvl) && lvl >= 1) app.levelIndex = Math.min(lvl - 1, 99);
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
				if (!isNaN(n) && n >= 0) app.levelIndex = Math.min(n, 99);
			}
		} catch (e) {}
	}

	readUrlParams();
	if (!new URLSearchParams(window.location.search).get('level')) loadGame();
	window.addEventListener('beforeunload', saveGame);

	/* ============================================================
	   DRAG TO PEEK — pointer events cover mouse + touch.
	   Tiles can be lifted and moved; on release they snap back.
	   Movement < 5px is treated as a normal click.
	   ============================================================ */
	var drag = {
		active: false,
		el: null,
		tile: null,
		startX: 0,
		startY: 0,
		baseX: 0,
		baseY: 0,
		moved: false
	};

	function tileFromEvent(e) {
		var el = e.target.closest('.tile');
		if (!el) return null;
		var idx = parseInt(el.dataset.index, 10);
		var tile = app.tiles[idx];
		if (!tile || tile.removed || tile.staging) return null;
		return { el: el, tile: tile };
	}

	boardEl.addEventListener('pointerdown', function (e) {
		if (app.autoMatching) return;
		var hit = tileFromEvent(e);
		if (!hit) {
			app.peeking = null;
			updateStates();
			return;
		}
		if (!isFree(app.board, hit.tile)) return;

		drag.active = true;
		drag.el = hit.el;
		drag.tile = hit.tile;
		drag.startX = e.clientX;
		drag.startY = e.clientY;
		drag.baseX = parseInt(hit.el.style.getPropertyValue('--tx'), 10);
		drag.baseY = parseInt(hit.el.style.getPropertyValue('--ty'), 10);
		drag.moved = false;
		hit.el.classList.add('dragging');
		try { hit.el.setPointerCapture(e.pointerId); } catch (err) {}
	});

	boardEl.addEventListener('pointermove', function (e) {
		if (!drag.active) return;
		var dx = e.clientX - drag.startX;
		var dy = e.clientY - drag.startY;
		if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
		if (!drag.moved) return;
		/* Divide by scale: the board is scaled via transform:scale(),
		   so screen pixels ≠ board-local pixels. */
		var s = app._scale || 1;
		drag.el.style.setProperty('--tx', (drag.baseX + dx / s) + 'px');
		drag.el.style.setProperty('--ty', (drag.baseY + dy / s) + 'px');
	});

	function endDrag() {
		if (!drag.active) return;
		var el = drag.el;
		var tile = drag.tile;
		var wasClick = !drag.moved;

		drag.active = false;
		drag.el = null;
		drag.tile = null;

		/* Snap back with animation */
		el.classList.remove('dragging');
		el.style.setProperty('--tx', drag.baseX + 'px');
		el.style.setProperty('--ty', drag.baseY + 'px');

		if (wasClick) handleTileClick(tile);
	}

	boardEl.addEventListener('pointerup', endDrag);
	boardEl.addEventListener('pointercancel', endDrag);

	document.getElementById('btn-hint').addEventListener('click', hint);
	document.getElementById('btn-undo').addEventListener('click', undo);
	document.getElementById('btn-new').addEventListener('click', startGame);
	document.getElementById('btn-play-again').addEventListener('click', startGame);

	/* Level selector: jump to any level */
	document.getElementById('btn-level-go').addEventListener('click', function () {
		var n = parseInt(document.getElementById('level-input').value, 10);
		if (isNaN(n) || n < 1) n = 1;
		app.levelIndex = Math.min(n - 1, 99);
		saveGame();
		startGame();
	});

	window.addEventListener('resize', function () {
		if (app.tiles.length) fitBoard();
	});

	startGame();
})();