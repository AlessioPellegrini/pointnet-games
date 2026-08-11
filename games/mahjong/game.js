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

	/* ============================================================
	   DOM TILES
	   ============================================================ */
	function createTileEl(t, i) {
		var el = document.createElement('div');
		el.className = 'tile z' + t.z + (t.isHalf ? ' half' : '');
		el.dataset.index = i;

		var overlay = document.createElement('div');
		overlay.className = 'tile-overlay';

		/* SVG tiles (riichi-mahjong-tiles): the face is an <img> filling
		   the whole tile. No text symbol, no plane/num badges needed —
		   the SVG already shows the suit, number and frame. */
		if (t.svg) {
			var svg = document.createElement('img');
			svg.className = 'tile-svg';
			svg.src = t.svg;
			svg.alt = '';
			svg.draggable = false;
			el.appendChild(overlay);
			el.appendChild(svg);
			return el;
		}

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
		app._fitW = wrapW;
		app._fitH = wrapH;

		/* transform: scale() is used for fit. Centring with the raw
		   formula is correct here (unlike zoom, transform:scale() does
		   not change the layout box). */
		boardEl.style.width = size.w + 'px';
		boardEl.style.height = size.h + 'px';
		boardEl.style.left = Math.round((wrapW - size.w * s) / 2) + 'px';
		boardEl.style.top = Math.round((wrapH - size.h * s) / 2) + 'px';

		/* Two-phase re-rasterization. The blur on WordPress happened
		   because after the iframe resize, changing scale() alone
		   reused the previously rasterized (small) board texture and
		   upscaled it. Removing the transform on the first frame makes
		   the browser discard that texture; re-applying the new scale
		   on the NEXT paint generates a fresh texture at the current
		   viewport resolution → crisp tiles at any embed size, without
		   the layout cost of CSS zoom. */
		boardEl.style.transform = 'none';
		requestAnimationFrame(function () {
			boardEl.style.transform = 'scale(' + s + ')';
		});
	}

	/* Re-fit loop. The WordPress parent resizes the game iframe
	   asynchronously after the fullscreen-request round-trip, so a single
	   fit can run at the small embed size → the board is fitted small then
	   upscaled (blurred) to fullscreen. This loop re-checks the real
	   board-wrap size every animation frame and re-fits whenever it
	   changes, until it stabilizes. Self-terminates after ~600ms, so it
	   costs almost nothing when the size is already correct. */
	function refitUntilStable() {
		var deadline = Date.now() + 600;
		var stableFrames = 0;

		function tick() {
			var w = wrap.clientWidth;
			var h = wrap.clientHeight;
			if (w !== app._fitW || h !== app._fitH) {
				stableFrames = 0;
				fitBoard();
			} else {
				stableFrames++;
			}
			if (stableFrames >= 3 || Date.now() > deadline) return;
			requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
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
				var st = app.staging[i];
				if (st.svg) {
					var simg = document.createElement('img');
					simg.className = 'staging-svg';
					simg.src = st.svg;
					simg.alt = '';
					slot.appendChild(simg);
				} else {
					slot.textContent = st.symbol;
				}
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
				/* COMBO CHAIN (v0.7.0): a match within 3s of the previous
				   one raises the multiplier (x1 → x2 → x3 … x5 max). */
				var now = Date.now();
				if (app.combo > 0 && now - app.lastMatchTime <= 3000) {
					app.combo = Math.min(5, app.combo + 1);
				} else {
					app.combo = 1;
				}
				app.lastMatchTime = now;
				var gained = 100 * app.combo;
				app.score += gained;
				scoreEl.textContent = app.score;
				/* HISTORY (v0.7.0): record the match with its score so
				   undo can refund it, and discard the previous 'move'
				   entry of the first tile (it was consumed by the match). */
				for (var h = app.history.length - 1; h >= 0; h--) {
					if (app.history[h].type === 'move' && app.history[h].tile === prev) {
						app.history.splice(h, 1);
						break;
					}
				}
				app.history.push({ type: 'match', prev: prev, tile: tile, gained: gained });
				if (comboEl) {
					if (app.combo >= 2) {
						comboEl.textContent = '🔥 x' + app.combo;
						comboEl.classList.add('show');
					} else {
						comboEl.classList.remove('show');
					}
				}
				matched = true;
				break;
			}
		}

		/* HISTORY (v0.7.0 bug fix): a single tile that stays in the box
		   WITHOUT matching must be undoable too. Record the move so
		   undo can return it to the board. */
		if (!matched) {
			app.history.push({ type: 'move', tile: tile });
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

			/* If its match is already in staging → turn the tile over,
			   SHOW its symbol first, then auto-match with a short pause.
			   Without the intermediate updateStates()+pause the tile goes
			   to staging still showing its back (no reveal feedback). */
			for (var i = 0; i < app.staging.length; i++) {
				if (app.staging[i].symbol === tile.symbol) {
					app.peeking = null;
					updateStates();
					app.autoMatching = true;
					setTimeout(function () {
						app.autoMatching = false;
						moveToStaging(tile);
					}, 250);
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

	/* ============================================================
	   UNDO (v0.7.0: using undo costs the 3★ rating)
	   History entries:
	     { type: 'match', prev, tile, gained }  — a matched pair removed
	     { type: 'move',  tile }                — a single tile sent to staging
	   ============================================================ */
	function undo() {
		if (app.history.length === 0) return;
		app.undoUsed++;
		var entry = app.history.pop();

		if (entry.type === 'match') {
			entry.prev.removed = false;
			entry.tile.removed = false;
			entry.prev.faceDown = false;
			entry.tile.faceDown = false;
			entry.prev.staging = false;
			entry.tile.staging = false;
			/* Refund the score earned by the match (and reset the combo
			   counter so it starts fresh from the next match). */
			app.score -= entry.gained || 0;
			if (app.score < 0) app.score = 0;
			scoreEl.textContent = app.score;
			app.combo = 0;
			app.lastMatchTime = 0;
			if (comboEl) comboEl.classList.remove('show');
		} else if (entry.type === 'move') {
			var t = entry.tile;
			t.staging = false;
			t.faceDown = false;
			app.staging = app.staging.filter(function (s) { return s !== t; });
		} else {
			/* Legacy entry: plain array [tileA, tileB] from before v0.7.0. */
			var pair = entry;
			pair[0].removed = false;
			pair[1].removed = false;
			pair[0].faceDown = false;
			pair[1].faceDown = false;
			pair[0].staging = false;
			pair[1].staging = false;
		}

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

	/* ============================================================
	   SHUFFLE POWER-UP (v0.7.0) — 3 uses per level.
	   Re-assigns symbols among the REMAINING (removed=false, not in
	   staging) tiles, keeping the exact same multiset so pairs still
	   exist. Resets the combo and re-covers peeking tiles.
	   ============================================================ */
	function shuffleBoard() {
		if (app.shufflesLeft <= 0) return;
		var remaining = [];
		app.tiles.forEach(function (t) {
			if (!t.removed && !t.staging) {
				remaining.push(t);
				t.memoShuffleIdx = remaining.length - 1;
			}
		});
		if (remaining.length < 4) return;

		var syms = remaining.map(function (t) { return t.symbol; });
		var rng = createRng(Math.floor(Math.random() * 1e9));
		shuffle(syms, rng);

		remaining.forEach(function (t) {
			t.symbol = syms[t.memoShuffleIdx];
			t.faceDown = false;
		});
		app.peeking = null;
		app.combo = 0;
		app.lastMatchTime = 0;
		if (comboEl) comboEl.classList.remove('show');

		app.shufflesLeft--;
		if (shuffleCountEl) shuffleCountEl.textContent = 'x' + app.shufflesLeft;
		if (shuffleBtn && app.shufflesLeft <= 0) shuffleBtn.disabled = true;
		updateStates();
	}

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
		app.stars = computeStars();
		var levelNum = app.levelIndex + 1;
		saveStars(levelNum, app.stars);
		app.levelIndex = Math.min(levelNum, 299);
		saveGame();
		modalTitle.textContent = '🏆 Level ' + levelNum + ' Cleared!';
		if (modalStars) {
			var starStr = '';
			for (var si = 0; si < 3; si++) starStr += (si < app.stars) ? '⭐' : '☆';
			modalStars.textContent = starStr;
		}
		modalStats.textContent = 'Time: ' + app.elapsed + 's   ·   Score: ' + app.score +
			'   ·   Best: ' + (bestStars[levelNum] || 0) + '⭐';
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
	   ARCADE PERSISTENCE — level reached + debug URL ?level=N.
	   ============================================================ */
	function readUrlParams() {
		try {
			var qs = new URLSearchParams(window.location.search);
			var lvl = parseInt(qs.get('level'), 10);
			if (!isNaN(lvl) && lvl >= 1) app.levelIndex = Math.min(lvl - 1, 299);
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
				if (!isNaN(n) && n >= 0) app.levelIndex = Math.min(n, 299);
			}
		} catch (e) {}
	}

	/* ============================================================
	   STAR RATING PERSISTENCE (v0.7.0) — best stars per level.
	   ============================================================ */
	var bestStars = {};
	var pairsLeftAtStart = 1;

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

	readUrlParams();
	if (!new URLSearchParams(window.location.search).get('level')) loadGame();
	loadStars();
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
	if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleBoard);
	document.getElementById('btn-new').addEventListener('click', startGame);
	document.getElementById('btn-play-again').addEventListener('click', startGame);

	/* Level selector: jump to any level */
	document.getElementById('btn-level-go').addEventListener('click', function () {
		var n = parseInt(document.getElementById('level-input').value, 10);
		if (isNaN(n) || n < 1) n = 1;
		app.levelIndex = Math.min(n - 1, 299);
		saveGame();
		startGame();
	});

	window.addEventListener('resize', function () {
		if (app.tiles.length) fitBoard();
	});

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
		});
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

	/* The board is rendered only when PLAY is pressed: startGame()
	   is called from the splash button / pointnet-games:start.
	   Rendering at init would compute a wrong board scale and make
	   the tiles appear low-res. */
	initWPGamesBridge();
	wirePostMessageAPI();
})();