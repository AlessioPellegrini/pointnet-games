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
	return board;
}

/* A tile blocks other tiles only if it's still on the board
   (not removed, not moved into the staging box). */
function hasTile(board, z, x, y) {
	var t = board.get(makeKey(z, x, y));
	return !!t && !t.removed && !t.staging;
}

/* Half-cover: a tile at odd x AND odd-spaced y in the layer above
   sits exactly on the CROSSING of FOUR tiles below (x±1, y±1)
   and blocks all four. */
function hasHalfCoverAbove(board, tile) {
	function halfAt(z, x, y) {
		var t = board.get(makeKey(z, x, y));
		return !!t && !t.removed && !t.staging && t.isHalf;
	}
	/* The half tile's grid row (y) coincides with the lower of the
	   two base rows it straddles. Base row y is covered by a half
	   on the SAME row (above it) or on the row ABOVE (y+1). */
	var aboveY = tile.z + 1;
	return halfAt(aboveY, tile.x - 1, tile.y) ||
	       halfAt(aboveY, tile.x + 1, tile.y) ||
	       halfAt(aboveY, tile.x - 1, tile.y + 1) ||
	       halfAt(aboveY, tile.x + 1, tile.y + 1);
}

function isFree(board, tile) {
	if (tile.removed || tile.staging) return false;
	if (hasTile(board, tile.z + 1, tile.x, tile.y)) return false;
	if (hasHalfCoverAbove(board, tile)) return false;
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
			if (!has[t.z - 1 + ',' + t.x + ',' + t.y]) {
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

	function isFreeForSolver(t) {
		if (removed.has(t.key)) return false;
		if (hasLive(t.z + 1, t.x, t.y)) return false;
		if (hasLiveHalf(t.z + 1, t.x - 1, t.y) ||
		    hasLiveHalf(t.z + 1, t.x + 1, t.y) ||
		    hasLiveHalf(t.z + 1, t.x - 1, t.y + 1) ||
		    hasLiveHalf(t.z + 1, t.x + 1, t.y + 1)) return false;
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
var TILE_W = 42, TILE_H = 56;
var SIDE_R = 2;                 // right face (px)
var SIDE_B = 3;                 // bottom face (px)
var STEP_X = 22;                // horizontal pitch between x-cells (2 cells = 44px)
var STEP_Y = 61;                // vertical pitch between rows
var Z_OFFSET_X = 5;             // horizontal plane shift (dx per plane) — slight right shift
var Z_OFFSET_Y = 8;             // upward plane shift (dy per plane) — slight up shift
var PAD = 8;                    // breathing room around the board
var TOP_PAD_EXTRA = 2;          // extra top clearance — LOWER = board sits higher

function computeMetrics(tiles) {
	var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ = 0;
	tiles.forEach(function (t) {
		if (t.x < minX) minX = t.x;
		if (t.x > maxX) maxX = t.x;
		if (t.y < minY) minY = t.y;
		if (t.y > maxY) maxY = t.y;
		if (t.z > maxZ) maxZ = t.z;
	});
	return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, maxZ: maxZ };
}

/* Top pad = max plane thickness. Pushes the whole stack down so
   upper-plane tiles at the first row are NEVER clipped at the
   top of the board. (This was the 23/24 bug: their top 8px were
   cut off by overflow:hidden in every previous version.) */
function layoutPos(t, m) {
	var topPad = m.maxZ * Z_OFFSET_Y + TOP_PAD_EXTRA;
	/* Half-cover tiles (isHalf) sit exactly on the crossing of
	   FOUR base tiles below: grid x is at a half-step (x*STEP_X
	   is already the midpoint), and y is pushed DOWN by half the
	   row pitch so it straddles two base rows perfectly. */
	var shiftX = t.isHalf ? 0 : t.z * Z_OFFSET_X;
	/* Full tiles on upper planes shift slightly UP (shiftY positive
	   → y subtracts z*Z_OFFSET_Y), so stacked tiles sit just above
	   the tile beneath — a subtle pseudo-3D offset without ever
	   dipping below the lower grid. */
	var shiftY = t.isHalf ? Math.round(STEP_Y / 2) : t.z * Z_OFFSET_Y;
	return {
		x: PAD + (t.x - m.minX) * STEP_X + shiftX,
		y: PAD + topPad + (t.y - m.minY) * STEP_Y - shiftY,
		/* translateZ neutral — tiles perfectly stacked. */
		tz: 0
	};
}

function boardSize(m) {
	var topPad = m.maxZ * Z_OFFSET_Y + TOP_PAD_EXTRA;
	return {
		w: PAD + (m.maxX - m.minX) * STEP_X + m.maxZ * Z_OFFSET_X + TILE_W + SIDE_R + PAD,
		h: PAD + topPad + (m.maxY - m.minY) * STEP_Y + TILE_H + SIDE_B + PAD
	};
}