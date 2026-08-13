/* ============================================================
   MAHJONG ARCADE - ui.js
   Tile DOM creation, board rebuild, state classes, board fitting.
   Depends on app.js globals (app, boardEl, wrap).
   ============================================================ */
'use strict';

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
			/* v0.8.0: classic-dark tiles need a dark face, or their
			   white details are invisible on the light gradient. */
			if (t.svg.indexOf('/black/') !== -1) el.classList.add('svg-black');
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
