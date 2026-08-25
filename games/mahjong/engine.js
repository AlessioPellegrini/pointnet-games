/* ============================================================
   MAHJONG ARCADE — engine.js
   Board model, solver, geometry/layout math. No DOM access.
   Depends on data.js (buildBoard/solveBoard used by generateLevel).
   ============================================================ */

/* ============================================================
   BOARD MODEL + SOLVER
   ============================================================ */
function makeKey(z, x, y) { return z + ',' + x + ',' + y; }

function buildBoard(tiles) {
	var board = new Map();
	for (var i = 0; i < tiles.length; i++) {
		var t = tiles[i];
		t.key = makeKey(t.z, t.x, t.y);
		board.set(t.key, t);
	}
	/* v0.9.2 — GEOGRAFIA VISIVA della scala a offset, calcolata
	   ricorsivamente (per z crescente):
	     - onHalf:     FULL senza supporto dritto sotto, su 4 HALF
	     - rowOff:     offset in RIGHE del centro della tile rispetto
	                   al suo y nominale (0.5 per HALF, 1.0 per FULL
	                   su 4 HALF; le FULL dritte EREDITANO il rowOff
	                   del supporto così l'apice resta sopra di esso)
	     - stackDepth: piani dritti consecutivi sopra l'ultimo
	                   supporto non-dritto (effetto 3D di profondità)
	   layoutPos() usa questi valori per centrare OGNI tile sul proprio
	   incrocio. Senza l'ereditarietà, l'apice z3 di temple_steps/large
	   riceveva l'offset 3D puro (z*Z_OFFSET_Y → in alto) mentre il suo
	   supporto stava sulla scala (più in basso) → la FULL sotto
	   sembrava libera ma era bloccata (es. livello 210). */
	var order = tiles.slice().sort(function (a, b) { return a.z - b.z; });
	for (var k = 0; k < order.length; k++) {
		var u = order[k];
		if (u.z === 0) { u.rowOff = 0; u.stackDepth = 0; u.onHalf = false; continue; }
		var direct = board.get(makeKey(u.z - 1, u.x, u.y));
		var a = board.get(makeKey(u.z - 1, u.x - 1, u.y));
		var b = board.get(makeKey(u.z - 1, u.x + 1, u.y));
		var c = board.get(makeKey(u.z - 1, u.x - 1, u.y + 1));
		var d = board.get(makeKey(u.z - 1, u.x + 1, u.y + 1));
		if (u.isHalf) {
			u.onHalf = false;
			u.stackDepth = 0;
			var supAvg = (a && b && c && d) ? (a.rowOff + b.rowOff + c.rowOff + d.rowOff) / 4 : 0;
			u.rowOff = supAvg + 0.5;
			continue;
		}
		var onHalfs = a && b && c && d && a.isHalf && b.isHalf && c.isHalf && d.isHalf;
		if (direct) {
			u.onHalf = false;
			u.rowOff = direct.rowOff || 0; /* resta sulla riga del supporto */
			u.stackDepth = (direct.stackDepth || 0) + 1;
		} else if (onHalfs) {
			u.onHalf = true;
			u.stackDepth = 0;
			u.rowOff = (a.rowOff + b.rowOff + c.rowOff + d.rowOff) / 4 + 0.5;
		} else {
			u.onHalf = false;
			u.rowOff = 0;
			u.stackDepth = 0;
		}
	}
	return board;
}

/* A tile blocks other tiles only if it's still on the board
   (not removed, not moved into the staging box). */
function hasTile(board, z, x, y) {
	var t = board.get(makeKey(z, x, y));
	return !!t && !t.removed && !t.staging;
}

/* FULL-only lookup (x even). Used by the classic offset stacking rule
   (v0.9): a FULL on an upper plane can rest on 4 HALF supports, and a
   HALF is covered by FULL tiles sitting on its crossing. */
function hasFullAt(board, z, x, y) {
	var t = board.get(makeKey(z, x, y));
	return !!t && !t.removed && !t.staging && !t.isHalf;
}

/* Half-cover: a tile at odd x AND odd-spaced y in the layer above
   sits exactly on the CROSSING of FOUR tiles below (x±1, y±1)
   and blocks all four. */
function hasHalfCoverAbove(board, tile) {
	function halfAt(z, x, y) {
		var t = board.get(makeKey(z, x, y));
		return !!t && !t.removed && !t.staging && t.isHalf;
	}
	/* A half at grid row (y) straddles the two base rows y and y+1.
	   So a base tile at row `tile.y` is covered by a half whose grid
	   row is tile.y-1 (straddling y-1,y) or tile.y (straddling y,y+1).
	   v0.9.1 off-by-one fix: it was checking tile.y+1 → the top row
	   of the base was wrongly blocked and the bottom row wrongly free. */
	var aboveY = tile.z + 1;
	return halfAt(aboveY, tile.x - 1, tile.y) ||
	       halfAt(aboveY, tile.x + 1, tile.y) ||
	       halfAt(aboveY, tile.x - 1, tile.y - 1) ||
	       halfAt(aboveY, tile.x + 1, tile.y - 1);
}

/* Classic offset rule (mirror of hasHalfCoverAbove): a HALF tile at
   (x odd, y) is also covered when FULL tiles sit on the crossing ABOVE
   it — i.e. at (x±1, y) and (x±1, y+1) on the plane above. This only
   triggers on offset layouts where FULL planes rest on HALF planes. */
function hasFullCoverAbove(board, tile) {
	if (!tile.isHalf) return false;
	/* Mirror of hasHalfCoverAbove: FULL tiles resting on this HALF
	   straddle its grid row and the one below (y-1). */
	var aboveY = tile.z + 1;
	return hasFullAt(board, aboveY, tile.x - 1, tile.y) ||
	       hasFullAt(board, aboveY, tile.x + 1, tile.y) ||
	       hasFullAt(board, aboveY, tile.x - 1, tile.y - 1) ||
	       hasFullAt(board, aboveY, tile.x + 1, tile.y - 1);
}

function isFree(board, tile) {
	if (tile.removed || tile.staging) return false;
	if (hasTile(board, tile.z + 1, tile.x, tile.y)) return false;
	if (hasHalfCoverAbove(board, tile)) return false;
	if (tile.isHalf && hasFullCoverAbove(board, tile)) return false;
	var hasLeft = hasTile(board, tile.z, tile.x - 2, tile.y);
	var hasRight = hasTile(board, tile.z, tile.x + 2, tile.y);
	return !(hasLeft && hasRight);
}

/* PHYSICS RULE: every tile at z>0 MUST have support below.
   - A FULL tile (x,y) requires a FULL tile directly at (z-1, x, y).
   - A HALF tile (x,y) requires 4 FULL tiles at (x±1,y) and (x±1,y+1)
     on the layer below.
   Returns array of offending tile positions (empty = all valid). */
function validateSupport(layout) {
	var has = {};
	for (var i = 0; i < layout.length; i++) {
		var p = layout[i];
		var k = p.z + ',' + p.x + ',' + p.y;
		has[k] = p;
	}
	var bad = [];
	for (var j = 0; j < layout.length; j++) {
		var t = layout[j];
		if (t.z <= 0) continue;
		if (t.isHalf) {
			var ok = has[t.z - 1 + ',' + (t.x - 1) + ',' + t.y] &&
			         has[t.z - 1 + ',' + (t.x + 1) + ',' + t.y] &&
			         has[t.z - 1 + ',' + (t.x - 1) + ',' + (t.y + 1)] &&
			         has[t.z - 1 + ',' + (t.x + 1) + ',' + (t.y + 1)];
			if (!ok) bad.push('half ' + t.z + '/' + t.x + '/' + t.y);
		} else {
			/* v0.9 classic offset: a FULL is valid if there is a FULL
			   directly below (straight stack) OR 4 HALF supports under
			   its crossing (offset stack, planes alternate). */
			var direct = has[t.z - 1 + ',' + t.x + ',' + t.y];
			var h1 = has[t.z - 1 + ',' + (t.x - 1) + ',' + t.y];
			var h2 = has[t.z - 1 + ',' + (t.x + 1) + ',' + t.y];
			var h3 = has[t.z - 1 + ',' + (t.x - 1) + ',' + (t.y + 1)];
			var h4 = has[t.z - 1 + ',' + (t.x + 1) + ',' + (t.y + 1)];
			var onHalfs = h1 && h2 && h3 && h4 &&
			              h1.isHalf && h2.isHalf && h3.isHalf && h4.isHalf;
			if (!direct && !onHalfs) {
				bad.push('full ' + t.z + '/' + t.x + '/' + t.y);
			}
		}
	}
	return bad;
}

var SOLVER_NODE_BUDGET = 120000;  // abort search after this many nodes
/* Returns true (solvable), false (provably unsolvable) or
   null (node budget hit → unknown; caller may use a heuristic). */
function solveBoard(board) {
	var tileList = Array.from(board.values()).filter(function (t) {
		return !t.staging;
	});
	var removed = new Set();
	var nodes = 0;
	var aborted = false;

	function hasLive(z, x, y) {
		var t = board.get(makeKey(z, x, y));
		return !!t && !t.removed && !t.staging && !removed.has(t.key);
	}

	/* Half-cover in solver: same logic but respects the solver's
	   temporary "removed" set. A half tile blocks all 4 tiles
	   below at (x±1, y) and (x±1, y+1). */
	function hasLiveHalf(z, x, y) {
		var t = board.get(makeKey(z, x, y));
		return !!t && !t.removed && !t.staging && !removed.has(t.key) && t.isHalf;
	}

	/* FULL-only lookup respecting the solver's temporary state. */
	function hasLiveFull(z, x, y) {
		var t = board.get(makeKey(z, x, y));
		return !!t && !t.removed && !t.staging && !removed.has(t.key) && !t.isHalf;
	}

	function isFreeForSolver(t) {
		if (removed.has(t.key)) return false;
		if (hasLive(t.z + 1, t.x, t.y)) return false;
		if (hasLiveHalf(t.z + 1, t.x - 1, t.y) ||
		    hasLiveHalf(t.z + 1, t.x + 1, t.y) ||
		    hasLiveHalf(t.z + 1, t.x - 1, t.y - 1) ||
		    hasLiveHalf(t.z + 1, t.x + 1, t.y - 1)) return false;
		/* v0.9 classic offset: a HALF is also covered by FULL tiles
		   sitting on its crossing on the plane above. */
		if (t.isHalf &&
		    (hasLiveFull(t.z + 1, t.x - 1, t.y) ||
		     hasLiveFull(t.z + 1, t.x + 1, t.y) ||
		     hasLiveFull(t.z + 1, t.x - 1, t.y - 1) ||
		     hasLiveFull(t.z + 1, t.x + 1, t.y - 1))) return false;
		var hasLeft = hasLive(t.z, t.x - 2, t.y);
		var hasRight = hasLive(t.z, t.x + 2, t.y);
		return !(hasLeft && hasRight);
	}

	function rec() {
		if (aborted) return true;
		if (++nodes > SOLVER_NODE_BUDGET) {
			aborted = true;
			return true;
		}
		if (removed.size === tileList.length) return true;
		var free = [];
		for (var i = 0; i < tileList.length; i++) {
			var t = tileList[i];
			if (!removed.has(t.key) && isFreeForSolver(t)) free.push(t);
		}
		if (free.length === 0) return false;

		var bySym = {};
		for (var i = 0; i < free.length; i++) {
			var s = free[i].symbol;
			(bySym[s] = bySym[s] || []).push(free[i]);
		}
		var syms = Object.keys(bySym).sort(function (a, b) {
			return bySym[a].length - bySym[b].length;
		});
		for (var g = 0; g < syms.length; g++) {
			var members = bySym[syms[g]];
			for (var i2 = 0; i2 < members.length; i2++) {
				for (var j = i2 + 1; j < members.length; j++) {
					var a = members[i2], b = members[j];
					removed.add(a.key);
					removed.add(b.key);
					if (rec()) return true;
					removed.delete(a.key);
					removed.delete(b.key);
				}
			}
		}
		return false;
	}
	var res = rec();
	return aborted ? null : res;
}

/* ============================================================
   GEOMETRY — integer pixels for every tile.
   The board element is the ONLY thing that gets scaled.
   ============================================================ */
var TILE_W = 48, TILE_H = 64;
var SIDE_R = 1;                 // right face (px)
var SIDE_B = 3;                 // bottom face (px)
var STEP_X = 25;                // horizontal pitch between x-cells (2 cells = 50px)
var STEP_Y = 69;                // vertical pitch between rows
var Z_OFFSET_X = 3;             // horizontal plane shift (dx per plane) — upper planes shift RIGHT (3D look)
var Z_OFFSET_Y = 8;             // upward plane shift (dy per plane) — slight up shift
var PAD = 4;                    // breathing room around the board
var TOP_PAD_EXTRA = 2;          // extra top clearance — LOWER = board sits higher

function computeMetrics(tiles) {
	var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ = 0;
	var hasHalf = false;
	var maxRowOff = 0; /* max offset in righe della scala a offset */
	tiles.forEach(function (t) {
		if (t.x < minX) minX = t.x;
		if (t.x > maxX) maxX = t.x;
		if (t.y < minY) minY = t.y;
		if (t.y > maxY) maxY = t.y;
		if (t.z > maxZ) maxZ = t.z;
		if (t.isHalf) hasHalf = true;
		if ((t.rowOff || 0) > maxRowOff) maxRowOff = t.rowOff;
	});
	return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, maxZ: maxZ, hasHalf: hasHalf, maxRowOff: maxRowOff };
}

/* Top pad = max plane thickness. Pushes the whole stack down so
   upper-plane tiles at the first row are NEVER clipped at the top.
   Half tiles need NO extra top padding: they render DOWN (centered
   on the crossing of their 2x2 supports), so it would only waste
   vertical space. */
function topPadOf(m) {
	return m.maxZ * Z_OFFSET_Y + TOP_PAD_EXTRA;
}

function layoutPos(t, m) {
	var topPad = topPadOf(m);
	var rowOff = t.rowOff || 0;
	var stack = t.stackDepth || 0;
	/* HALF e FULL-on-HALF seguono la SCALA A OFFSET: il centro è
	   spostato in basso di rowOff righe rispetto al loro y nominale
	   (z1 HALF → ½, z2 FULL su HALF → 1, …), shiftX = 0 perché
	   l'incrocio è già centrato sulla colonna. Le FULL DITTE invece
	   ereditano il rowOff del supporto (così una FULL sopra una
	   scala resta sopra di essa) e aggiungono stack piani di effetto
	   3D (stackDepth × Z_OFFSET) — v0.9.2. Prima l'apice z3 di
	   temple_steps/large riceveva l'offset 3D puro (z*Z_OFFSET_Y →
	   in alto) mentre il suo supporto era in basso sulla scala: la
	   FULL sotto sembrava libera ma era bloccata (livello 210). */
	if (t.isHalf || t.onHalf) {
		return {
			x: PAD + (t.x - m.minX) * STEP_X,
			y: PAD + topPad + (t.y - m.minY) * STEP_Y + Math.round(rowOff * STEP_Y),
			tz: 0
		};
	}
	return {
		x: PAD + (t.x - m.minX) * STEP_X + stack * Z_OFFSET_X,
		y: PAD + topPad + (t.y - m.minY) * STEP_Y + Math.round(rowOff * STEP_Y) - stack * Z_OFFSET_Y,
		/* translateZ neutral — tiles perfectly stacked. */
		tz: 0
	};
}

function boardSize(m) {
	var topPad = topPadOf(m);
	/* Half tiles render DOWN (centered on their 2x2 support crossing),
	   so the last row needs extra room below. v0.9.2: pad basato sul
	   rowOff massimo della scala a offset (½ riga per HALF, 1 riga
	   per FULL-su-HALF). */
	var halfBottomPad = Math.round((m.maxRowOff || 0) * STEP_Y);
	return {
		/* The right shift of upper planes (maxZ * Z_OFFSET_X) is included
		   in the width so the board stays exactly centered. */
		w: PAD + (m.maxX - m.minX) * STEP_X + m.maxZ * Z_OFFSET_X + TILE_W + SIDE_R + PAD,
		h: PAD + topPad + (m.maxY - m.minY) * STEP_Y + TILE_H + SIDE_B + halfBottomPad + PAD
	};
}
