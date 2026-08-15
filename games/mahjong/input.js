/* ============================================================
   MAHJONG ARCADE - input.js
   Staging box, click/tap logic, undo, hint, shuffle, drag events.
   Depends on app.js + ui.js globals.
   ============================================================ */
'use strict';

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
					/* v0.8.0: dark staging slots for classic-dark tiles. */
					if (st.svg.indexOf('/black/') !== -1) slot.classList.add('svg-black');
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

		/* Game over: 4 tiles in the box without any match.
		   Il livello NON cambia (startGame rigioca lo stesso) →
		   il bottone deve dirlo: "Riprova". */
		if (!matched && app.staging.length >= MAX_STAGING) {
			stopTimer();
			modalTitle.textContent = '💀 Staging Full!';
			modalStats.textContent = '4 tiles, no match — try again!';
			if (btnPlayAgain) btnPlayAgain.textContent = '🔄 Riprova';
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
