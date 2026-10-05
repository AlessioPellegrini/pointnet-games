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

		/* Key Tiles (v1.8.0): Ornate antique key illustration & metallic badge */
		if (t.isKey) {
			el.classList.add('key-tile', 'key-stage-' + t.keyStage);
			var keyStageNames = ['', 'Bronzo', 'Argento', 'Oro'];
			var keyBadgeIcons = ['', '🗝️🥉', '🗝️🥈', '🗝️🥇'];
			var keyFace = document.createElement('div');
			keyFace.className = 'key-face key-face-' + t.keyStage;
			keyFace.innerHTML =
				'<svg viewBox="0 0 36 56" class="key-svg-art">' +
				'<defs>' +
				'<linearGradient id="kg' + t.keyStage + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
				(t.keyStage === 1
					? '<stop offset="0%" stop-color="#fef3c7"/><stop offset="50%" stop-color="#d97706"/><stop offset="100%" stop-color="#78350f"/>'
					: (t.keyStage === 2
						? '<stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#475569"/>'
						: '<stop offset="0%" stop-color="#fffbeb"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/>')) +
				'</linearGradient>' +
				'</defs>' +
				'<path fill="url(#kg' + t.keyStage + ')" stroke="rgba(0,0,0,0.4)" stroke-width="1" d="M18,6 C13,6 9,10 9,15 C9,18.8 11.5,22 15,23.4 L15,44 L19,44 L19,39 L22,39 L22,35 L19,35 L19,30 L22,30 L22,26 L19,26 L19,23.4 C22.5,22 25,18.8 25,15 C25,10 21,6 18,6 Z M18,11 C20.2,11 22,12.8 22,15 C22,17.2 20.2,19 18,19 C15.8,19 14,17.2 14,15 C14,12.8 15.8,11 18,11 Z"/>' +
				'</svg>' +
				'<span class="key-sublabel">' + (keyStageNames[t.keyStage] || 'CHIAVE') + '</span>';
			el.appendChild(overlay);
			el.appendChild(keyFace);
			var kBadge = document.createElement('span');
			kBadge.className = 'key-badge';
			kBadge.textContent = keyBadgeIcons[t.keyStage] || '🗝️';
			el.appendChild(kBadge);
			return el;
		}

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
			var gBadge = document.createElement('span');
			gBadge.className = 'guardian-badge';
			gBadge.textContent = '🛡️';
			el.appendChild(gBadge);
			var lBadge = document.createElement('span');
			lBadge.className = 'lock-badge';
			lBadge.textContent = '🔒';
			el.appendChild(lBadge);
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

		var gBadge2 = document.createElement('span');
		gBadge2.className = 'guardian-badge';
		gBadge2.textContent = '🛡️';

		var lBadge2 = document.createElement('span');
		lBadge2.className = 'lock-badge';
		lBadge2.textContent = '🔒';

		el.appendChild(overlay);
		el.appendChild(sym);
		el.appendChild(plane);
		el.appendChild(num);
		el.appendChild(gBadge2);
		el.appendChild(lBadge2);
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
		renderConveyorTrackOverlay();
		updateStates();
		fitBoard();
	}

	/* Renders high-visibility animated track rails and slot markers beneath conveyor tiles */
	function renderConveyorTrackOverlay() {
		var old = boardEl.querySelector('.conveyor-track-layer');
		if (old) old.remove();
		if (!app.conveyorTrack || !app.conveyorTrack.length) return;

		var layer = document.createElement('div');
		layer.className = 'conveyor-track-layer';

		var svgNS = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute('class', 'conveyor-track-svg');
		if (app._boardSize) {
			svg.setAttribute('width', app._boardSize.w);
			svg.setAttribute('height', app._boardSize.h);
		}

		var pathPts = [];
		for (var i = 0; i < app.conveyorTrack.length; i++) {
			var pt = app.conveyorTrack[i];
			var pos = layoutPos({ z: 0, x: pt.x, y: pt.y }, app._metrics);
			pathPts.push((pos.x + 24) + ',' + (pos.y + 32));

			var slot = document.createElement('div');
			slot.className = 'conveyor-slot-indicator';
			slot.style.setProperty('--tx', (pos.x - 1) + 'px');
			slot.style.setProperty('--ty', (pos.y - 1) + 'px');
			layer.appendChild(slot);
		}

		if (pathPts.length > 2) {
			var path = document.createElementNS(svgNS, 'path');
			path.setAttribute('d', 'M ' + pathPts.join(' L ') + ' Z');
			path.setAttribute('class', 'conveyor-track-path');
			svg.appendChild(path);
			layer.insertBefore(svg, layer.firstChild);
		}

		boardEl.insertBefore(layer, boardEl.firstChild);
	}

	function updateStates() {
		/* AUTO-REVEAL (v0.9 blackout): an obscured tile becomes PLAYABLE
		   on its own as soon as it is FREE (nothing above and at least
		   one open side). Runs BEFORE marking classes, so the flip
		   never appears halfway. */
		for (var r = 0; r < app.tiles.length; r++) {
			var tr = app.tiles[r];
			if (tr.obscured && !tr.removed && !tr.staging && isFree(app.board, tr)) {
				tr.obscured = false;
			}
		}
		for (var i = 0; i < app.tiles.length; i++) {
			var t = app.tiles[i];
			var el = app.tileEls[i];
			if (!el) continue;
			var chained = !t.removed && !t.staging && isTileChained(t, app.chain);
			el.classList.toggle('removed', t.removed);
			el.classList.toggle('in-staging', t.staging && !t.removed);
			el.classList.toggle('blocked', !t.removed && !t.staging && !isFree(app.board, t));
			el.classList.toggle('shielded', !t.removed && !t.staging && !!t.shielded);
			el.classList.toggle('guardian', !t.removed && !t.staging && !!t.guardian);
			el.classList.toggle('chained', chained);
			el.classList.toggle('chain-stage-1', chained && t.chainStage === 1);
			el.classList.toggle('chain-stage-2', chained && t.chainStage === 2);
			el.classList.toggle('chain-stage-3', chained && t.chainStage === 3);
			el.classList.toggle('key-tile', !t.removed && !t.staging && !!t.isKey);
			el.classList.toggle('face-down', t.faceDown && !t.staging && !t.removed);
			el.classList.toggle('obscured', !t.removed && !t.staging && !!t.obscured);
			el.classList.toggle('hinted', !!t.hinted);
			el.classList.toggle('selected', t === app.selectedTile);
			el.classList.remove('wildcard', 'wildcard-flower', 'wildcard-season');
			if (t.wildcardGroup) {
				el.classList.add('wildcard', 'wildcard-' + t.wildcardGroup);
			}
			var svgEl = el.querySelector('.tile-svg');
			if (svgEl && t.svg) {
				if (svgEl.getAttribute('src') !== t.svg) {
					svgEl.src = t.svg;
				}
				el.classList.toggle('svg-black', t.svg.indexOf('/black/') !== -1);
			}
			if (el._symEl) {
				el._symEl.textContent = t.obscured ? '🀄' : (t.faceDown ? '🀄' : t.symbol);
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
	   PARTICLE EFFECTS & CELEBRATION (v1.0.8)
	   ============================================================ */
	function spawnBurstAt(x, y, count, colors) {
		colors = colors || ['#38bdf8', '#f59e0b', '#fbbf24', '#a855f7', '#ffffff'];
		count = count || 10;
		for (var i = 0; i < count; i++) {
			var p = document.createElement('div');
			p.className = 'particle';
			var size = 5 + Math.random() * 6;
			p.style.width = size + 'px';
			p.style.height = size + 'px';
			p.style.background = colors[Math.floor(Math.random() * colors.length)];
			p.style.left = x + 'px';
			p.style.top = y + 'px';

			var angle = Math.random() * Math.PI * 2;
			var dist = 35 + Math.random() * 55;
			p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
			p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');

			document.body.appendChild(p);
			setTimeout(function (el) {
				if (el && el.parentNode) el.parentNode.removeChild(el);
			}, 600, p);
		}
	}

	function spawnMatchParticles(tileA, tileB) {
		var idxA = app.tiles.indexOf(tileA);
		var idxB = app.tiles.indexOf(tileB);
		var elA = idxA >= 0 ? app.tileEls[idxA] : null;
		var elB = idxB >= 0 ? app.tileEls[idxB] : null;

		if (elA) {
			var rectA = elA.getBoundingClientRect();
			spawnBurstAt(rectA.left + rectA.width / 2, rectA.top + rectA.height / 2, 8);
		}
		if (elB) {
			var rectB = elB.getBoundingClientRect();
			spawnBurstAt(rectB.left + rectB.width / 2, rectB.top + rectB.height / 2, 8);
		}
	}

	function spawnShieldBreakParticles(shield) {
		if (!shield || !shield.protectedKeys) return;
		var colors = ['#00f5ff', '#38bdf8', '#60a5fa', '#facc15', '#ffffff'];
		shield.protectedKeys.forEach(function (k) {
			for (var i = 0; i < app.tiles.length; i++) {
				if (app.tiles[i].key === k) {
					var el = app.tileEls[i];
					if (el) {
						var rect = el.getBoundingClientRect();
						spawnBurstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, colors);
					}
					break;
				}
			}
		});
	}

	function spawnChainBreakParticles(stage) {
		if (!stage || !stage.chainedKeys) return;
		var colors = (stage.stage === 1)
			? ['#d97706', '#f59e0b', '#fbbf24', '#78350f', '#fef3c7']
			: ((stage.stage === 2)
				? ['#94a3b8', '#cbd5e1', '#e2e8f0', '#475569', '#ffffff']
				: ['#fbbf24', '#f59e0b', '#fef08a', '#b45309', '#ffffff']);

		stage.chainedKeys.forEach(function (k) {
			for (var i = 0; i < app.tiles.length; i++) {
				if (app.tiles[i].key === k) {
					var el = app.tileEls[i];
					if (el) {
						el.classList.remove('chained', 'chain-stage-1', 'chain-stage-2', 'chain-stage-3');
						el.classList.add('chain-shatter');
						setTimeout(function (targetEl) {
							if (targetEl) targetEl.classList.remove('chain-shatter');
						}, 650, el);
						var rect = el.getBoundingClientRect();
						spawnBurstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 16, colors);
					}
					break;
				}
			}
		});
	}

	/* CLASSIC MATCH ANIMATION (v1.4.7):
	   When a pair is matched on the board, creates glowing floating clones
	   that lift and dissolve with particles, providing satisfying tactile feedback. */
	function animateClassicMatch(tileA, tileB) {
		var idxA = app.tiles.indexOf(tileA);
		var idxB = app.tiles.indexOf(tileB);
		var elA = idxA >= 0 ? app.tileEls[idxA] : null;
		var elB = idxB >= 0 ? app.tileEls[idxB] : null;

		function createFlyer(el) {
			if (!el) return null;
			var rect = el.getBoundingClientRect();
			var clone = el.cloneNode(true);
			clone.classList.remove('selected', 'hinted', 'dragging', 'blocked');
			clone.classList.add('matching-flyer');
			clone.style.cssText =
				'position:fixed;margin:0;z-index:1000;pointer-events:none;' +
				'left:' + rect.left + 'px;top:' + rect.top + 'px;' +
				'width:' + rect.width + 'px;height:' + rect.height + 'px;' +
				'transition:transform 360ms cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 320ms ease, filter 320ms ease;' +
				'box-shadow: 0 0 24px rgba(56, 189, 248, 0.9), 0 8px 24px rgba(0,0,0,0.5);' +
				'transform: scale(1.0);';
			document.body.appendChild(clone);
			return clone;
		}

		var flyerA = createFlyer(elA);
		var flyerB = createFlyer(elB);

		if (flyerA || flyerB) {
			requestAnimationFrame(function () {
				if (flyerA) {
					flyerA.style.transform = 'translateY(-24px) scale(1.2)';
					flyerA.style.opacity = '0';
					flyerA.style.filter = 'brightness(1.6)';
				}
				if (flyerB) {
					flyerB.style.transform = 'translateY(-24px) scale(1.2)';
					flyerB.style.opacity = '0';
					flyerB.style.filter = 'brightness(1.6)';
				}
			});
			setTimeout(function () {
				if (flyerA && flyerA.parentNode) flyerA.parentNode.removeChild(flyerA);
				if (flyerB && flyerB.parentNode) flyerB.parentNode.removeChild(flyerB);
			}, 400);
		}
	}
	window.animateClassicMatch = animateClassicMatch;

	/* CONVEYOR TILE SLIDE (v1.5.0):
	   Smoothly slides tiles that moved along the conveyor track. */
	function updateConveyorTilePositions(shiftedList) {
		if (!shiftedList || !shiftedList.length) return;
		for (var s = 0; s < shiftedList.length; s++) {
			var item = shiftedList[s];
			var idx = app.tiles.indexOf(item.tile);
			var el = (idx >= 0) ? app.tileEls[idx] : null;
			if (el && !item.tile.removed && !item.tile.staging) {
				el.classList.add('conveyor-moving');
				var pos = layoutPos(item.tile, app._metrics);
				el.style.setProperty('--tx', pos.x + 'px');
				el.style.setProperty('--ty', pos.y + 'px');
			}
		}
		setTimeout(function () {
			for (var k = 0; k < shiftedList.length; k++) {
				var tidx = app.tiles.indexOf(shiftedList[k].tile);
				var tel = (tidx >= 0) ? app.tileEls[tidx] : null;
				if (tel) tel.classList.remove('conveyor-moving');
			}
		}, 520);
		updateStates();
	}
	window.updateConveyorTilePositions = updateConveyorTilePositions;

	function spawnVictoryConfetti() {
		var colors = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#fbbf24'];
		var count = 50;
		var vw = window.innerWidth;
		var vh = window.innerHeight;

		for (var i = 0; i < count; i++) {
			var c = document.createElement('div');
			c.className = 'confetti';
			var w = 6 + Math.random() * 8;
			var h = 8 + Math.random() * 12;
			c.style.width = w + 'px';
			c.style.height = h + 'px';
			c.style.borderRadius = (Math.random() > 0.5 ? '2px' : '50%');
			c.style.background = colors[Math.floor(Math.random() * colors.length)];

			var startX = Math.random() * vw;
			var startY = Math.random() * (vh * 0.3);
			c.style.left = startX + 'px';
			c.style.top = startY + 'px';

			var dx = (Math.random() - 0.5) * 180;
			var dy = (vh * 0.6) + Math.random() * (vh * 0.4);
			var rot = (Math.random() * 720 - 360) + 'deg';
			var dur = (1.5 + Math.random() * 1.2) + 's';

			c.style.setProperty('--dx', dx + 'px');
			c.style.setProperty('--dy', dy + 'px');
			c.style.setProperty('--rot', rot);
			c.style.setProperty('--dur', dur);

			document.body.appendChild(c);
			setTimeout(function (el) {
				if (el && el.parentNode) el.parentNode.removeChild(el);
			}, 2800, c);
		}
	}
