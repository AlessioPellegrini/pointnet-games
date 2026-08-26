/* ============================================================
   MAHJONG ARCADE — layouts.js
   Layout builders (collection of deterministic geometric patterns).
   Extracted from data.js so the progression logic stays small.
   Depends on globals: none (only evenTrim/dedupePts defined here).
   Loaded BEFORE data.js (buildProgression reads LAYOUT_BUILDERS lazily).
   ============================================================ */

/* ============================================================
   CLASSIC LAYOUTS — deterministic geometric patterns built
   from aligned rectangles / paths. All tiles are FULL tiles
   stacked straight above each other (same x, same y, z grows),
   so every upper plane sits perfectly aligned on the one below.
   Grid limits (mobile-first): max 6 columns (x 0..10) × 9 rows.
   ============================================================ */
function evenTrim(pts) {
	if (pts.length % 2 !== 0) return pts.slice(0, pts.length - 1);
	return pts;
}

/* Removes duplicate coordinates (same z,x,y), keeping the first.
   Used by builders whose shapes overlap (e.g. helix). */
function dedupePts(pts) {
	var seen = {}, out = [];
	for (var i = 0; i < pts.length; i++) {
		var k = pts[i].z + ',' + pts[i].x + ',' + pts[i].y;
		if (!seen[k]) { seen[k] = 1; out.push(pts[i]); }
	}
	return out;
}

var LAYOUT_BUILDERS = {
	'halfcover': {
		'small': function () {
			/* 4×5 base + 3×3 half-cover on top (extra row for support) */
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 1; hy < 4; hy++) {
				for (var hx = 1; hx < 6; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			return evenTrim(pts); // 20+9 = 29 → 28
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 1; hy < 4; hy++) {
				for (var hx = 1; hx < 6; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			pts.push({ z: 0, x: 2, y: 5 });
			return pts; // 30
		},
		'large': function () {
			/* v0.6.0 — full 6×8 base + half-cover 5×7 on top.
			   Each half tile sits on the crossing of 4 full tiles. */
			var pts = [];
			for (var y = 0; y < 8; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 0; hy < 7; hy++) {
				for (var hx = 1; hx <= 9; hx += 2) pts.push({ z: 1, x: hx, y: hy, isHalf: true });
			}
			return evenTrim(pts); // 48 + 35 = 83 → 82
		},
		'xl': function () {
			/* v0.6.0 — full 6×9 base (max rows) + half-cover 5×8. */
			var pts = [];
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 0; hy < 8; hy++) {
				for (var hx = 1; hx <= 9; hx += 2) pts.push({ z: 1, x: hx, y: hy, isHalf: true });
			}
			return evenTrim(pts); // 54 + 40 = 94
		}
	},

	'cross': {
		'small': function () {
			/* Thick-arm cross: 5×5 with a central 3×5 + 5×3 bar */
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					if (Math.abs(y - 2) <= 1 || Math.abs(x - 2) <= 1) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			/* layer 1: 3×3 center */
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x1 = 1; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			pts.push({ z: 2, x: 4, y: 2 });
			return evenTrim(pts); // 21+9+1 = 31 → 30
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					if (Math.abs(y - 2) <= 1 || Math.abs(x - 2) <= 1) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y2 = 1; y2 < 4; y2++) {
				for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 1, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			return pts; // 32
		},
		'large': function () {
			/* v0.6.0 — z1 3 rows (y1..3) instead of 4: row 4 (x8)
			   non aveva supporto nella base a croce. */
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					if (Math.abs(y - 2) <= 1 || Math.abs(x - 2) <= 1) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y2 = 0; y2 < 3; y2++) {
				for (var x2 = 0; x2 < 4; x2++) pts.push({ z: 1, x: x2 * 2 + 2, y: y2 + 1 });
			}
			for (var y3 = 0; y3 < 2; y3++) {
				for (var x3 = 0; x3 < 2; x3++) pts.push({ z: 2, x: x3 * 2 + 4, y: y3 + 2 });
			}
			pts.push({ z: 3, x: 6, y: 3 });
			return evenTrim(pts); // 21+12+4+1 = 38
		},
		'xl': function () {
			/* BOUNCED XL CROSS: z1 only on the full rows of the base
			   (y2..3), reduced z2, single apex — zero floating tiles. */
			var pts = [];
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) {
					if (x === 2 || x === 3 || y === 2 || y === 3) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y2 = 2; y2 < 4; y2++) {
				for (var x2 = 1; x2 < 5; x2++) pts.push({ z: 1, x: x2 * 2, y: y2 });
			}
			for (var y3 = 2; y3 < 4; y3++) {
				for (var x3 = 2; x3 < 4; x3++) pts.push({ z: 2, x: x3 * 2, y: y3 });
			}
			pts.push({ z: 3, x: 6, y: 3 });
			return evenTrim(pts); // 26+8+4+1 = 39 → 38
		}
	},

	'pyramid': {
		'small': function () {
			var pts = [];
			var layers = [[4, 4], [3, 3], [2, 2], [1, 1]];
			for (var z = 0; z < layers.length; z++) {
				var w = layers[z][0], h = layers[z][1];
				var ox = Math.round((4 - w) / 2), oy = Math.round((4 - h) / 2);
				for (var y = 0; y < h; y++) {
					for (var x = 0; x < w; x++) pts.push({ z: z, x: (x + ox) * 2, y: y + oy });
				}
			}
			return pts; // 16+9+4+1 = 30
		},
		'medium': function () {
			var pts = [];
			var layers = [[4, 4], [3, 3], [2, 2], [1, 1]];
			for (var z = 0; z < layers.length; z++) {
				var w = layers[z][0], h = layers[z][1];
				var ox = Math.round((4 - w) / 2), oy = Math.round((4 - h) / 2);
				for (var y = 0; y < h; y++) {
					for (var x = 0; x < w; x++) pts.push({ z: z, x: (x + ox) * 2, y: y + oy });
				}
			}
			return pts; // 30
		},
		'large': function () {
			var pts = [];
			var layers = [[5, 5], [4, 4], [3, 3], [2, 2], [2, 1]];
			for (var z = 0; z < layers.length; z++) {
				var w = layers[z][0], h = layers[z][1];
				var ox = Math.round((5 - w) / 2), oy = Math.round((5 - h) / 2);
				for (var y = 0; y < h; y++) {
					for (var x = 0; x < w; x++) pts.push({ z: z, x: (x + ox) * 2, y: y + oy });
				}
			}
			return pts; // 56
		},
		'xl': function () {
			var pts = [];
			var layers = [[6, 7], [5, 6], [4, 4], [2, 3]];
			for (var z = 0; z < layers.length; z++) {
				var w = layers[z][0], h = layers[z][1];
				var ox = Math.round((6 - w) / 2), oy = Math.round((7 - h) / 2);
				for (var y = 0; y < h; y++) {
					for (var x = 0; x < w; x++) pts.push({ z: z, x: (x + ox) * 2, y: y + oy });
				}
			}
			return evenTrim(pts); // 42+30+16+6 = 94 → 94
		}
	},

	'fortress': {
		'small': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 4; y1++) {
				for (var x1 = 0; x1 < 4; x1++) {
					if (y1 === 0 || y1 === 3 || x1 === 0 || x1 === 3) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			[[0, 0], [3, 0], [0, 3], [3, 3]].forEach(function (c) {
				pts.push({ z: 2, x: c[0] * 2, y: c[1] });
			});
			return pts; // 32
		},
		'large': function () {
			var pts = [];
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 6; y1++) {
				for (var x1 = 0; x1 < 6; x1++) {
					if (y1 === 0 || y1 === 5 || x1 === 0 || x1 === 5) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			[[0, 0], [5, 0], [0, 5], [5, 5]].forEach(function (c) {
				pts.push({ z: 2, x: c[0] * 2, y: c[1] });
			});
			/* base per i pinnacoli centrali (z1, x6) */
			pts.push({ z: 1, x: 6, y: 2 }, { z: 1, x: 6, y: 3 });
			/* pinnacoli (z2) */
			pts.push({ z: 2, x: 6, y: 2 }, { z: 2, x: 6, y: 3 });
			/* pinnacoli (z3) */
			pts.push({ z: 3, x: 6, y: 2 }, { z: 3, x: 6, y: 3 });
			return pts; // 36+20+2+2+2 = 66
		},
		'xl': function () {
			var pts = [];
			for (var y = 0; y < 8; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 8; y1++) {
				for (var x1 = 0; x1 < 6; x1++) {
					if (y1 === 0 || y1 === 7 || x1 === 0 || x1 === 5) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			[[0, 0], [5, 0], [0, 7], [5, 7]].forEach(function (c) {
				pts.push({ z: 2, x: c[0] * 2, y: c[1] });
			});
			/* v0.6.0: the 4 inner towers (x2/x8, y3/y4) were at z2
			   without z1 below → floating. I move them to z1 (supported
			   dalla base piena) così il disegno resta ma la fisica è valida. */
			pts.push({ z: 1, x: 2, y: 3 }, { z: 1, x: 8, y: 3 }, { z: 1, x: 2, y: 4 }, { z: 1, x: 8, y: 4 });
			return pts; // 48+20+4+4 = 76
		}
	},

	'dragon': {
		'small': function () {
			/* 5 rows: 6,4,6,4,6 + upper layer 4,2,4,2 */
			var pts = [];
			for (var x0 = 0; x0 < 6; x0++) pts.push({ z: 0, x: x0 * 2, y: 0 });
			for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 0, x: x1 * 2, y: 1 });
			for (var x2 = 0; x2 < 6; x2++) pts.push({ z: 0, x: x2 * 2, y: 2 });
			for (var x3 = 1; x3 < 5; x3++) pts.push({ z: 0, x: x3 * 2, y: 3 });
			for (var x4 = 0; x4 < 6; x4++) pts.push({ z: 0, x: x4 * 2, y: 4 });
			/* layer 1 */
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x5 = 1; x5 < 5; x5++) pts.push({ z: 1, x: x5 * 2, y: y1 });
			}
			return evenTrim(pts); // 26+12 = 38 → 38
		},
		'medium': function () {
			var pts = [];
			for (var x0 = 0; x0 < 6; x0++) pts.push({ z: 0, x: x0 * 2, y: 0 });
			for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 0, x: x1 * 2, y: 1 });
			for (var x2 = 0; x2 < 6; x2++) pts.push({ z: 0, x: x2 * 2, y: 2 });
			for (var y1 = 0; y1 < 3; y1++) {
				for (var xi = 1; xi < 5; xi++) pts.push({ z: 1, x: xi * 2, y: y1 });
			}
			pts.push({ z: 2, x: 4, y: 0 });
			return evenTrim(pts); // 29 → 28
		},
		'large': function () {
			var pts = [];
			for (var x0 = 0; x0 < 6; x0++) pts.push({ z: 0, x: x0 * 2, y: 0 });
			for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 0, x: x1 * 2, y: 1 });
			for (var x2 = 0; x2 < 6; x2++) pts.push({ z: 0, x: x2 * 2, y: 2 });
			for (var x3 = 1; x3 < 5; x3++) pts.push({ z: 0, x: x3 * 2, y: 3 });
			for (var x4 = 0; x4 < 6; x4++) pts.push({ z: 0, x: x4 * 2, y: 4 });
			for (var y1 = 0; y1 < 3; y1++) {
				for (var xi = 1; xi < 5; xi++) pts.push({ z: 1, x: xi * 2, y: y1 });
			}
			pts.push({ z: 2, x: 4, y: 0 }, { z: 2, x: 6, y: 0 });
			return pts; // 40
		}
	},

	'turtle': {
		'small': function () {
			/* CLEAN TURTLE: shell = 5×5 ring (x0..8, y1..5),
			   inner raised 2×2, head x10, tail, legs.
			   No floating tiles, no duplicates, bounds ≤ 10×8. */
			var pts = [];
			/* ring: x every 2, y 1..5 */
			for (var y = 1; y < 6; y++) {
				for (var x = 0; x < 5; x++) {
					if (y === 1 || y === 5 || x === 0 || x === 4) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			/* inner 2×2 (x 4..6, y 2..3): base + ridge */
			pts.push({ z: 0, x: 4, y: 2 }, { z: 0, x: 4, y: 3 }, { z: 0, x: 6, y: 2 }, { z: 0, x: 6, y: 3 });
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 4, y: 3 }, { z: 1, x: 6, y: 2 }, { z: 1, x: 6, y: 3 });
			/* head (x10, y2..4) */
			pts.push({ z: 0, x: 10, y: 2 }, { z: 0, x: 10, y: 3 }, { z: 0, x: 10, y: 4 });
			/* tail (top-left) */
			pts.push({ z: 0, x: 2, y: 0 });
			/* legs at the bottom */
			pts.push({ z: 0, x: 2, y: 6 }, { z: 0, x: 8, y: 6 });
			return pts; // 16 ring + 8 inner + 3 head + 1 tail + 2 legs = 30
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 3; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 1, x: 10, y: 2 });            // head
			pts.push({ z: 0, x: 0, y: 5 });             // tail
			pts.push({ z: 0, x: 0, y: 6 }, { z: 0, x: 10, y: 6 }); // front legs
			return pts; // 50
		},
		'large': function () {
			var pts = [];
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 2; y2 < 4; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 1, x: 10, y: 2 });            // head
			pts.push({ z: 0, x: 0, y: 6 });             // tail
			pts.push({ z: 0, x: 0, y: 7 }, { z: 0, x: 10, y: 7 }); // front legs
			return pts; // 60
		}
	},

	/* ---- NEW v0.4.0 LAYOUTS ---- */

	'diamond': {
		'small': function () {
			/* DIAMOND: rows 1,3,5,6,5,3,1 (max 6 tiles = span 0..10).
			   Inner 1,3,1 on top; centered pinnacle. */
			var pts = [];
			var w = [1, 3, 5, 6, 5, 3, 1];
			for (var y = 0; y < w.length; y++) {
				var row = w[y];
				var start = Math.floor((7 - row) / 2);
				for (var i = 0; i < row; i++) pts.push({ z: 0, x: (start + i) * 2, y: y });
			}
			var w1 = [1, 3, 1];
			for (var y1 = 0; y1 < w1.length; y1++) {
				var row1 = w1[y1];
				var start1 = Math.floor((7 - row1) / 2);
				for (var i1 = 0; i1 < row1; i1++) pts.push({ z: 1, x: (start1 + i1) * 2, y: y1 + 2 });
			}
			pts.push({ z: 2, x: 6, y: 3 });
			return evenTrim(pts); // 24+5+1 = 30
		},
		'medium': function () {
			var pts = [];
			var base = [[1, 0], [3, 1], [5, 2], [6, 3], [5, 4], [3, 5], [1, 6]];
			for (var b = 0; b < base.length; b++) {
				var row = base[b][0];
				var y = base[b][1];
				var start = Math.floor((7 - row) / 2);
				for (var i = 0; i < row; i++) pts.push({ z: 0, x: (start + i) * 2, y: y });
			}
			var inner = [[1, 1], [3, 2], [3, 3], [1, 4]];
			for (var s = 0; s < inner.length; s++) {
				var row2 = inner[s][0];
				var y2 = inner[s][1];
				var start2 = Math.floor((7 - row2) / 2);
				for (var i2 = 0; i2 < row2; i2++) pts.push({ z: 1, x: (start2 + i2) * 2, y: y2 });
			}
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			return evenTrim(pts); // 24+8+3 = 35 → 34
		},
		'large': function () {
			var pts = [];
			var base = [[1, 0], [3, 1], [5, 2], [7, 3], [9, 4], [7, 5], [5, 6], [3, 7], [1, 8]];
			for (var b = 0; b < base.length; b++) {
				var row = base[b][0];
				var y = base[b][1];
				var start = Math.floor((9 - row) / 2);
				for (var i = 0; i < row; i++) pts.push({ z: 0, x: (start + i) * 2, y: y });
			}
			var inner = [[1, 1], [3, 2], [5, 3], [5, 4], [3, 5], [1, 6]];
			for (var s = 0; s < inner.length; s++) {
				var row2 = inner[s][0];
				var y2 = inner[s][1];
				var start2 = Math.floor((9 - row2) / 2);
				for (var i2 = 0; i2 < row2; i2++) pts.push({ z: 1, x: (start2 + i2) * 2, y: y2 });
			}
			var core = [[1, 2], [3, 3], [1, 4]];
			for (var c = 0; c < core.length; c++) {
				var row3 = core[c][0];
				var y3 = core[c][1];
				var start3 = Math.floor((9 - row3) / 2);
				for (var i3 = 0; i3 < row3; i3++) pts.push({ z: 2, x: (start3 + i3) * 2, y: y3 });
			}
			pts.push({ z: 3, x: 8, y: 3 });
			return evenTrim(pts); // 41+18+5+1 = 65 → 64
		}
	},

	'wall': {
		/* PHYSICS: every tile at z>0 is FULL and rests on a FULL tile
		   directly below (z-1, same x, same y). Full planes
		   shrinking by 2 columns/2 rows — no half-cover,
		   no floating tiles. */
		'medium': function () {
			var pts = [];
			/* full 5×6 base (x 0..8, y 0..5) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tier 1: full 3×4 (x 2,4,6; y 1..4) */
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 2; x1 <= 6; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* tier 2: full 1×2 (x 4; y 2..3) */
			for (var y2 = 2; y2 < 4; y2++) pts.push({ z: 2, x: 4, y: y2 });
			/* apex */
			pts.push({ z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 30+12+2+1 = 45
		},
		'large': function () {
			var pts = [];
			/* full 6×7 base (x 0..10, y 0..6) */
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tier 1: full 4×5 (x 2,4,6,8; y 1..5) */
			for (var y1 = 1; y1 < 6; y1++) {
				for (var x1 = 2; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* tier 2: full 2×3 (x 4,6; y 2..4) */
			for (var y2 = 2; y2 < 5; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* apex */
			pts.push({ z: 3, x: 6, y: 3 });
			return evenTrim(pts); // 42+20+6+1 = 69
		},
		'xl': function () {
			var pts = [];
			/* full 6×9 base (x 0..10, y 0..8) */
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tier 1: full 5×7 (x 0,2,4,6,8; y 1..7) */
			for (var y1 = 1; y1 < 8; y1++) {
				for (var x1 = 0; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* tier 2: full 3×5 (x 2,4,6; y 2..6) */
			for (var y2 = 2; y2 < 7; y2++) {
				for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: y2 });
			}
			/* tier 3: full 1×3 (x 4; y 3..5) */
			for (var y3 = 3; y3 < 6; y3++) pts.push({ z: 3, x: 4, y: y3 });
			/* apex */
			pts.push({ z: 4, x: 4, y: 4 });
			return evenTrim(pts); // 54+35+15+3+1 = 108
		}
	},

	'labyrinth': {
		'small': function () {
			/* LABYRINTH: full base (universal support) + RAISED
			   PERIMETER + inner walls with openings
			   → clearly visible 3D maze corridors. */
			var pts = [];
			/* layer 0: full 6×7 base (x 0..10, y 0..6) */
			for (var by = 0; by < 7; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: raised perimeter wall */
			for (var x0 = 0; x0 <= 10; x0 += 2) {
				pts.push({ z: 1, x: x0, y: 0 });
				pts.push({ z: 1, x: x0, y: 6 });
			}
			for (var y1 = 1; y1 < 6; y1++) {
				pts.push({ z: 1, x: 0, y: y1 });
				pts.push({ z: 1, x: 10, y: y1 });
			}
			/* layer 1: platforms under the inner walls (support) */
			pts.push({ z: 1, x: 2, y: 2 }, { z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			pts.push({ z: 1, x: 4, y: 4 }, { z: 1, x: 6, y: 4 }, { z: 1, x: 8, y: 4 });
			pts.push({ z: 1, x: 8, y: 3 });
			/* layer 2: staggered inner walls with openings (S corridor) */
			for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: 2 });
			for (var x3 = 4; x3 <= 8; x3 += 2) pts.push({ z: 2, x: x3, y: 4 });
			/* layer 3: inner pillars for depth (supported by z2) */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 6, y: 4 }, { z: 3, x: 8, y: 4 });
			/* v0.9.2: dedupe — platform (1,2,4) was pushed twice
			   (loop x3 at y4 + explicit at y4) → overlapping tile. */
			return evenTrim(dedupePts(pts)); // 101 unique → 100
		},
		'medium': function () {
			/* LARGE LABYRINTH: full 6×8 base + perimeter + more corridors. */
			var pts = [];
			/* layer 0: full 6×8 base (x 0..10, y 0..7) */
			for (var by = 0; by < 8; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: raised perimeter */
			for (var x0 = 0; x0 <= 10; x0 += 2) {
				pts.push({ z: 1, x: x0, y: 0 });
				pts.push({ z: 1, x: x0, y: 7 });
			}
			for (var y1 = 1; y1 < 7; y1++) {
				pts.push({ z: 1, x: 0, y: y1 });
				pts.push({ z: 1, x: 10, y: y1 });
			}
			/* layer 1: platforms under the inner walls (support) */
			for (var x2 = 2; x2 <= 8; x2 += 2) { pts.push({ z: 1, x: x2, y: 2 }); }
			for (var x3 = 2; x3 <= 6; x3 += 2) { pts.push({ z: 1, x: x3, y: 4 }); }
			for (var x4 = 4; x4 <= 8; x4 += 2) { pts.push({ z: 1, x: x4, y: 6 }); }
			pts.push({ z: 1, x: 8, y: 3 }, { z: 1, x: 8, y: 4 }, { z: 1, x: 8, y: 5 });
			pts.push({ z: 1, x: 2, y: 3 }, { z: 1, x: 2, y: 4 }, { z: 1, x: 2, y: 5 });
			/* layer 2: alternating inner walls (widened S) */
			for (var x2b = 2; x2b <= 8; x2b += 2) pts.push({ z: 2, x: x2b, y: 2 });
			for (var x3b = 2; x3b <= 6; x3b += 2) pts.push({ z: 2, x: x3b, y: 4 });
			for (var x4b = 4; x4b <= 8; x4b += 2) pts.push({ z: 2, x: x4b, y: 6 });
			/* v0.9.2: dedupe — (1,2,4) was pushed 2 times (loop x3 + explicit) */
			return evenTrim(dedupePts(pts)); // 101 unique → 100
			/* (removed: z2/z3 vertical columns x8/x2 y3..5 — too dense,
			   the solver timed out on almost every shuffle) */
		}
	},

	'pyramid_half': {
		'small': function () {
			/* EGYPTIAN PYRAMID: centered full planes that shrink
			   5×6 → 3×4 → 1×2 → apex. Each plane rests on the one below. */
			var pts = [];
			/* full 5×6 base (x 0..8, y 0..5) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tier 1: 3×4 (x 2,4,6; y 1..4) */
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 2; x1 <= 6; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* tier 2: 1×2 (x 4; y 2..3) */
			for (var y2 = 2; y2 < 4; y2++) pts.push({ z: 2, x: 4, y: y2 });
			/* apex (x 4, y 3) */
			pts.push({ z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 30+12+2+1 = 45
		},
		'medium': function () {
			/* EGYPTIAN PYRAMID 4 planes: 6×7 → 4×5 → 2×3 → apex. */
			var pts = [];
			/* full 6×7 base (x 0..10, y 0..6) */
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tier 1: 4×5 (x 2,4,6,8; y 1..5) */
			for (var y1 = 1; y1 < 6; y1++) {
				for (var x1 = 2; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* tier 2: 2×3 (x 4,6; y 2..4) */
			for (var y2 = 2; y2 < 5; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* apex (x 6, y 3) */
			pts.push({ z: 3, x: 6, y: 3 });
			return evenTrim(pts); // 42+20+6+1 = 69
		},
		'large': function () {
			/* EGYPTIAN PYRAMID 4 planes: 6×8 → 4×6 → 2×4 → apex. */
			var pts = [];
			/* full 6×8 base (x 0..10, y 0..7) */
			for (var y = 0; y < 8; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: 4×6 (x 2,4,6,8; y 1..6) */
			for (var y1 = 1; y1 < 7; y1++) {
				for (var x1 = 2; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* piano 2: 2×4 (x 4,6; y 2..5) */
			for (var y2 = 2; y2 < 6; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* apex (x 6, y 4) */
			pts.push({ z: 3, x: 6, y: 4 });
			return evenTrim(pts); // 48+24+8+1 = 81
		},
		'xl': function () {
			/* EGYPTIAN PYRAMID 5 planes: 6×9 → 5×7 → 3×5 → 1×3 → apex.
			   From the widest to the narrowest, centered, up to the tip. */
			var pts = [];
			/* full 6×9 base (x 0..10, y 0..8) */
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tier 1: 5×7 (x 0,2,4,6,8; y 1..7) */
			for (var y1 = 1; y1 < 8; y1++) {
				for (var x1 = 0; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* tier 2: 3×5 (x 2,4,6; y 2..6) */
			for (var y2 = 2; y2 < 7; y2++) {
				for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: y2 });
			}
			/* tier 3: 1×3 (x 4; y 3..5) */
			for (var y3 = 3; y3 < 6; y3++) pts.push({ z: 3, x: 4, y: y3 });
			/* apex (x 4, y 4) */
			pts.push({ z: 4, x: 4, y: 4 });
			return evenTrim(pts); // 54+35+15+3+1 = 108
		}
	},

	'checker': {
		'small': function () {
			/* RAISED CHECKERBOARD: solid support base + even cells
			   raised (checkerboard visual pattern) — all supported. */
			var pts = [];
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 1; x1 < 5; x1++) {
					if ((x1 + y1) % 2 === 0) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			return pts; // 36 + 8 = 44
		},
		'medium': function () {
			/* v0.6.0: SOLID 6×7 base (a half tile at z1 needs 4
			   full tiles below at the crossing — the checkerboard was too
			   sparse and 15 halves were left floating). */
			var pts = [];
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 6; y1++) {
				for (var x1 = 1; x1 < 10; x1 += 2) {
					if ((x1 + y1) % 2 === 0) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
				}
			}
			return evenTrim(pts); // 42 base + 15 mezze = 57 → 56
		}
	},

	'bridge': {
		'small': function () {
			/* U silhouette: two towers (2×2 footprint) + wide bridge on top */
			var pts = [];
			/* left tower: 2×3 base + 2×2 layer */
			for (var y0 = 0; y0 < 3; y0++) {
				pts.push({ z: 0, x: 0, y: y0 }, { z: 0, x: 2, y: y0 });
			}
			for (var y1 = 0; y1 < 2; y1++) {
				pts.push({ z: 1, x: 0, y: y1 }, { z: 1, x: 2, y: y1 });
			}
			/* right tower: 2×3 base + 2×2 layer */
			for (var y2 = 0; y2 < 3; y2++) {
				pts.push({ z: 0, x: 6, y: y2 }, { z: 0, x: 8, y: y2 });
			}
			for (var y3 = 0; y3 < 2; y3++) {
				pts.push({ z: 1, x: 6, y: y3 }, { z: 1, x: 8, y: y3 });
			}
			/* bridge: row of 5 tiles above the two towers (layer 2) */
			for (var x4 = 0; x4 < 5; x4++) pts.push({ z: 2, x: x4 * 2, y: 0 });
			/* central pylons + side bridge (support included) */
			pts.push({ z: 0, x: 4, y: 0 }, { z: 0, x: 4, y: 1 });
			pts.push({ z: 1, x: 4, y: 0 }, { z: 1, x: 4, y: 1 });
			return evenTrim(pts); // 12+8+5+4 = 29 → 28
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 3; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y4 = 0; y4 < 4; y4++) {
				for (var x4 = 3; x4 < 6; x4++) pts.push({ z: 0, x: x4 * 2, y: y4 });
			}
			for (var y1 = 0; y1 < 3; y1++) {
				for (var x1 = 0; x1 < 2; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
				for (var x1b = 4; x1b < 6; x1b++) pts.push({ z: 1, x: x1b * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 3; y2++) {
				for (var x2 = 0; x2 < 2; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
				for (var x2b = 4; x2b < 6; x2b++) pts.push({ z: 2, x: x2b * 2, y: y2 });
			}
			for (var xm = 2; xm < 5; xm++) pts.push({ z: 1, x: xm * 2, y: 1 });
			/* v0.6.0: pylons under the central bridge — z2 x4/x6 at y2
			   had no z1 below (only x8 was supported). */
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			for (var xm2 = 2; xm2 < 5; xm2++) pts.push({ z: 2, x: xm2 * 2, y: 2 });
			/* v0.9.2: dedupe — bridge z1/z2 at x8,y1 and x8,y2 duplicated
			   the already-present right towers. */
			return dedupePts(pts); // 48 unique
		}
	},

	'spiral': {
		'small': function () {
			/* TRUE SPIRAL: full 6×6 base + raised rings with
			   OPENINGS connecting the turns towards the center. */
			var pts = [];
			/* layer 0: full 6×6 base */
			for (var by = 0; by < 6; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: outer ring with a GAP at the bottom right.
			   Top completo, sx completo, bottom da sx, dx dall'alto. */
			for (var x0 = 0; x0 <= 10; x0 += 2) pts.push({ z: 1, x: x0, y: 0 });
			for (var y1 = 1; y1 < 6; y1++) pts.push({ z: 1, x: 0, y: y1 });
			for (var x2 = 2; x2 <= 8; x2 += 2) pts.push({ z: 1, x: x2, y: 5 });
			for (var y3 = 1; y3 < 5; y3++) pts.push({ z: 1, x: 10, y: y3 });
			/* inner platform z1 (rests on the base, supports the turn) */
			for (var py = 1; py < 5; py++) {
				for (var px = 2; px <= 8; px += 2) pts.push({ z: 1, x: px, y: py });
			}
			/* layer 2: S-SHAPED CORRIDOR (open) — no closed ring around
			   the center. The central tiles stay reachable and the level
			   becomes solvable. Real gaps at (8,3) and (2,2). */
			for (var x4 = 2; x4 <= 8; x4 += 2) pts.push({ z: 2, x: x4, y: 1 });
			pts.push({ z: 2, x: 8, y: 2 }, { z: 2, x: 8, y: 4 });   // gap in (8,3)
			for (var x6 = 6; x6 >= 2; x6 -= 2) pts.push({ z: 2, x: x6, y: 4 });
			pts.push({ z: 2, x: 2, y: 3 });                          // gap in (2,2)
			return evenTrim(pts); // 36+19+16+9 = 80 → 80 (open ring)
		},
		'medium': function () {
			/* LARGE SPIRAL: full 6×8 base + three ring turns with gaps. */
			var pts = [];
			/* layer 0: full 6×8 base (y 0..7) */
			for (var by = 0; by < 8; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: outer ring with a gap at the bottom right */
			for (var x0 = 0; x0 <= 10; x0 += 2) pts.push({ z: 1, x: x0, y: 0 });
			for (var y1 = 1; y1 < 8; y1++) pts.push({ z: 1, x: 0, y: y1 });
			for (var x2 = 2; x2 <= 8; x2 += 2) pts.push({ z: 1, x: x2, y: 7 });
			for (var y3 = 1; y3 < 7; y3++) pts.push({ z: 1, x: 10, y: y3 });
			/* inner platform z1 (support for the turn) */
			for (var py = 1; py < 7; py++) {
				for (var px = 2; px <= 8; px += 2) pts.push({ z: 1, x: px, y: py });
			}
			/* layer 2: middle turn */
			for (var x4 = 2; x4 <= 8; x4 += 2) pts.push({ z: 2, x: x4, y: 1 });
			for (var y5 = 1; y5 < 7; y5++) pts.push({ z: 2, x: 8, y: y5 });
			for (var x6 = 6; x6 >= 2; x6 -= 2) pts.push({ z: 2, x: x6, y: 6 });
			for (var y7 = 1; y7 < 6; y7++) pts.push({ z: 2, x: 2, y: y7 });
			/* center support (z2 inner, rests on the z1 platform) */
			for (var yc = 2; yc < 5; yc++) {
				pts.push({ z: 2, x: 4, y: yc }, { z: 2, x: 6, y: yc });
			}
			/* layer 3: raised center */
			for (var y8 = 2; y8 < 5; y8++) {
				pts.push({ z: 3, x: 4, y: y8 }, { z: 3, x: 6, y: y8 });
			}
			pts.push({ z: 4, x: 4, y: 4 });
			/* v0.9.2: dedupe — il giro z2 (8,1) e (2,1) duplicava i
			   lati verticali x8/x2 (inizio da y1). */
			return evenTrim(dedupePts(pts)); // 97 uniche → 96
		}
	},

	'helix': {
		'small': function () {
			/* HELIX/DOUBLE X: full base + two RAISED DIAGONAL BANDS
			   that cross → double helix seen from above. */
			var pts = [];
			/* layer 0: full 6×7 base (y 0..6) */
			for (var by = 0; by < 7; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: ↘ band (steps + fillers, thick) */
			for (var i = 0; i < 5; i++) {
				pts.push({ z: 1, x: i * 2, y: i });
				pts.push({ z: 1, x: i * 2, y: i + 1 });
				pts.push({ z: 1, x: (i + 1) * 2, y: i + 1 });
			}
			/* layer 1: ↗ band (mirror) */
			for (var j = 0; j < 5; j++) {
				pts.push({ z: 1, x: j * 2, y: 6 - j });
				pts.push({ z: 1, x: j * 2, y: 5 - j });
				pts.push({ z: 1, x: (j + 1) * 2, y: 5 - j });
			}
			/* support for the central crossing (x=6, y=3) */
			pts.push({ z: 1, x: 6, y: 3 });
			/* layer 2-3: marked central crossing */
			pts.push({ z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			pts.push({ z: 3, x: 6, y: 3 });
			/* v0.9.2: dedupe — the two diagonal bands cross:
			   (4,3)/(6,3) and the edge cells were pushed twice. */
			return evenTrim(dedupePts(pts)); // 65 unique → 64
		},
		'medium': function () {
			/* LARGE HELIX: full 6×9 base + long diagonal bands. */
			var pts = [];
			/* layer 0: full 6×9 base (y 0..8) */
			for (var by = 0; by < 9; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: extended ↘ band (6 steps + fillers).
			   v0.6.0: (i+1)*2 goes to x=12 at i=5 → off-grid.
			   The last step adds only the vertical row x=10. */
			for (var i = 0; i < 6; i++) {
				pts.push({ z: 1, x: i * 2, y: i });
				pts.push({ z: 1, x: i * 2, y: i + 1 });
				if (i < 5) pts.push({ z: 1, x: (i + 1) * 2, y: i + 1 });
				pts.push({ z: 1, x: i * 2, y: i + 2 });
			}
			/* layer 1: extended ↗ band (same fix: no x=12) */
			for (var j = 0; j < 6; j++) {
				pts.push({ z: 1, x: j * 2, y: 8 - j });
				pts.push({ z: 1, x: j * 2, y: 7 - j });
				if (j < 5) pts.push({ z: 1, x: (j + 1) * 2, y: 7 - j });
				pts.push({ z: 1, x: j * 2, y: 6 - j });
			}
			/* layer 2-3: central crossing */
			pts.push({ z: 2, x: 4, y: 4 }, { z: 2, x: 6, y: 4 });
			pts.push({ z: 2, x: 4, y: 5 }, { z: 2, x: 6, y: 5 });
			pts.push({ z: 3, x: 6, y: 4 });
			/* v0.9.2: dedupe — crossing diagonal bands (see small). */
			return evenTrim(dedupePts(pts)); // 90 unique → 88
		}
	},

	/* ---- NEW v0.5.0 FIGURE LAYOUTS ---- */

	'pagoda': {
		/* PAGODA: converging tier tower. Each upper tier is
		   centered and rests entirely on the one below (no
		   overhang). FULL tiles only. */
		'small': function () {
			var pts = [];
			/* piano 0: 4×4 (x 0..6, y 0..3) */
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: 4×3 (x 0..6, y 1..3) */
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x1 = 0; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			/* piano 2: 2×2 (x 2..4, y 1..2) */
			for (var y2 = 1; y2 < 3; y2++) {
				for (var x2 = 1; x2 < 3; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			/* apex */
			pts.push({ z: 3, x: 4, y: 2 });
			return evenTrim(pts); // 16+12+4+1 = 33 → 32
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 0; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 4; y2++) {
				for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			for (var y3 = 2; y3 < 4; y3++) pts.push({ z: 3, x: 4, y: y3 });
			pts.push({ z: 4, x: 4, y: 3 });
			return evenTrim(pts); // 25+20+9+2+1 = 57 → 56
		},
		'large': function () {
			var pts = [];
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 6; y1++) {
				for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 2; y2 < 5; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			for (var y3 = 3; y3 < 5; y3++) pts.push({ z: 3, x: 4, y: y3 });
			pts.push({ z: 4, x: 4, y: 4 });
			return evenTrim(pts); // 36+20+6+2+1 = 65 → 64
		}
	},

	'butterfly': {
		/* BUTTERFLY: two mirror wings (triangles widening
		   downwards) + a central vertical body. FULL only. */
		'small': function () {
			var pts = [];
			/* Z0: wings (5 rows, symmetrical around x=4) */
			[[0, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: inner wings (4 rows, start from the 2nd) */
			[[2, 6], [2, 4, 6], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: body apex — rests on Z1 (4,3) */
			pts.push({ z: 2, x: 4, y: 3 });
			return pts; // 19 + 8 + 1 = 28
		},
		'medium': function () {
			var pts = [];
			/* Z0: wings (6 rows, symmetrical around x=4) */
			[[0, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: inner wings + body (4 rows, start from the 2nd) */
			[[2, 6], [2, 4, 6], [2, 4, 6], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: body (2 tiles) */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* Z3: apex */
			pts.push({ z: 3, x: 4, y: 3 });
			return pts; // 24 + 11 + 2 + 1 = 38
		}
	},

	'arrow': {
		/* ARROW: point towards the right — arrowhead + shaft.
		   Full planes, FULL only. */
		'small': function () {
			var pts = [];
			var rows0 = [[0, 2, 4, 6, 8], [0, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8]];
			for (var y = 0; y < rows0.length; y++) {
				for (var i = 0; i < rows0[y].length; i++) pts.push({ z: 0, x: rows0[y][i], y: y });
			}
			var rows1 = [[0, 2, 4], [0, 2, 4, 6], [0, 2, 4]];
			for (var y1 = 0; y1 < rows1.length; y1++) {
				for (var i = 0; i < rows1[y1].length; i++) pts.push({ z: 1, x: rows1[y1][i], y: y1 });
			}
			return evenTrim(pts); // 16+10 = 26 → 26
		},
		'medium': function () {
			var pts = [];
			var rows0 = [[0, 2, 4, 6, 8], [0, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8]];
			for (var y = 0; y < rows0.length; y++) {
				for (var i = 0; i < rows0[y].length; i++) pts.push({ z: 0, x: rows0[y][i], y: y });
			}
			var rows1 = [[0, 2, 4, 6], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8], [0, 2, 4, 6], [0, 2, 4]];
			for (var y1 = 0; y1 < rows1.length; y1++) {
				for (var i = 0; i < rows1[y1].length; i++) pts.push({ z: 1, x: rows1[y1][i], y: y1 });
			}
			pts.push({ z: 2, x: 2, y: 2 });
			return evenTrim(pts); // 28+21+1 = 50 → 50
		}
	},

	'star': {
		/* 4-POINT STAR: two crossing bars (vertical + horizontal,
		   center NOT duplicated) + diagonal fillers. FULL only. */
		'small': function () {
			var pts = [];
			/* Z0: vertical bar + horizontal arms without duplicates */
			for (var y = 0; y < 5; y++) pts.push({ z: 0, x: 4, y: y });
			pts.push({ z: 0, x: 0, y: 2 }, { z: 0, x: 2, y: 2 }, { z: 0, x: 6, y: 2 }, { z: 0, x: 8, y: 2 });
			/* Z1: inner points + top antenna */
			pts.push({ z: 1, x: 4, y: 0 });
			pts.push({ z: 1, x: 4, y: 1 }, { z: 1, x: 4, y: 3 });
			pts.push({ z: 1, x: 2, y: 2 }, { z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			/* Z2: center */
			pts.push({ z: 2, x: 4, y: 2 });
			return pts; // 9 + 6 + 1 = 16
		},
		'medium': function () {
			var pts = [];
			/* Z0: vertical + horizontal bar (center not duplicated) + diagonals */
			for (var y = 0; y < 7; y++) pts.push({ z: 0, x: 4, y: y });
			pts.push({ z: 0, x: 0, y: 3 }, { z: 0, x: 2, y: 3 }, { z: 0, x: 6, y: 3 }, { z: 0, x: 8, y: 3 }, { z: 0, x: 10, y: 3 });
			pts.push({ z: 0, x: 2, y: 1 }, { z: 0, x: 6, y: 1 }, { z: 0, x: 2, y: 5 }, { z: 0, x: 6, y: 5 });
			/* Z1: inner arms */
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 4, y: 3 }, { z: 1, x: 4, y: 4 });
			pts.push({ z: 1, x: 2, y: 3 }, { z: 1, x: 6, y: 3 });
			/* Z2: center */
			pts.push({ z: 2, x: 4, y: 3 });
			return pts; // 16 + 5 + 1 = 22
		}
	},

	'hourglass': {
		/* CLESSIDRA: due triangoli opposti (uno che si allarga verso il
		   basso, uno che si restringe) uniti al collo centrale. FULL. */
		'small': function () {
			var pts = [];
			var top = [[4], [2, 4, 6], [0, 2, 4, 6, 8]];
			for (var y = 0; y < top.length; y++) {
				for (var i = 0; i < top[y].length; i++) pts.push({ z: 0, x: top[y][i], y: y });
			}
			var bot = [[0, 2, 4, 6, 8], [2, 4, 6], [4]];
			for (var y = 0; y < bot.length; y++) {
				for (var i = 0; i < bot[y].length; i++) pts.push({ z: 0, x: bot[y][i], y: y + 3 });
			}
			var top1 = [[4], [2, 4, 6]];
			for (var y = 0; y < top1.length; y++) {
				for (var i = 0; i < top1[y].length; i++) pts.push({ z: 1, x: top1[y][i], y: y + 1 });
			}
			var bot1 = [[2, 4, 6], [4]];
			for (var y = 0; y < bot1.length; y++) {
				for (var i = 0; i < bot1[y].length; i++) pts.push({ z: 1, x: bot1[y][i], y: y + 4 });
			}
			pts.push({ z: 1, x: 4, y: 3 });
			pts.push({ z: 2, x: 4, y: 3 });
			return evenTrim(pts); // 18+9+1 = 28 → 28
		},
		'medium': function () {
			var pts = [];
			var top = [[4], [2, 4, 6], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8, 10]];
			for (var y = 0; y < top.length; y++) {
				for (var i = 0; i < top[y].length; i++) pts.push({ z: 0, x: top[y][i], y: y });
			}
			var bot = [[0, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8], [2, 4, 6], [4]];
			for (var y = 0; y < bot.length; y++) {
				for (var i = 0; i < bot[y].length; i++) pts.push({ z: 0, x: bot[y][i], y: y + 4 });
			}
			var top1 = [[4], [2, 4, 6], [2, 4, 6, 8]];
			for (var y = 0; y < top1.length; y++) {
				for (var i = 0; i < top1[y].length; i++) pts.push({ z: 1, x: top1[y][i], y: y + 1 });
			}
			var bot1 = [[2, 4, 6, 8], [2, 4, 6], [4]];
			for (var y = 0; y < bot1.length; y++) {
				for (var i = 0; i < bot1[y].length; i++) pts.push({ z: 1, x: bot1[y][i], y: y + 4 });
			}
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 }, { z: 2, x: 4, y: 4 });
			pts.push({ z: 3, x: 4, y: 4 });
			return pts; // 30+16+3+1 = 50
		}
	},

	'castle': {
		/* CASTLE: full base + perimeter walls + central keep
		   that towers over the corner towers. Richer than fortress:
		   doppio giro di mura e mastio centrale. Solo FULL. */
		'small': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: perimeter ring + central 2×2 keep */
			for (var y1 = 0; y1 < 4; y1++) {
				for (var x1 = 0; x1 < 4; x1++) {
					if (y1 === 0 || y1 === 3 || x1 === 0 || x1 === 3) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			pts.push({ z: 1, x: 2, y: 1 }, { z: 1, x: 4, y: 1 }, { z: 1, x: 2, y: 2 }, { z: 1, x: 4, y: 2 });
			/* z2: corner towers + keep */
			[[0, 0], [6, 0], [0, 3], [6, 3]].forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			pts.push({ z: 2, x: 2, y: 1 }, { z: 2, x: 4, y: 1 }, { z: 2, x: 2, y: 2 }, { z: 2, x: 4, y: 2 });
			return evenTrim(pts); // 16+16+8 = 40 → 40 (no z3: too sparse for the solver)
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: ring + 3×3 keep */
			for (var y1 = 0; y1 < 5; y1++) {
				for (var x1 = 0; x1 < 5; x1++) {
					if (y1 === 0 || y1 === 4 || x1 === 0 || x1 === 4) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			for (var y2 = 1; y2 < 4; y2++) {
				for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 1, x: x2 * 2, y: y2 });
			}
			/* z2: corner towers + inner 2×2 keep */
			[[0, 0], [8, 0], [0, 4], [8, 4]].forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 6, y: 2 }, { z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			/* z3: top towers + top keep */
			[[0, 0], [8, 0], [0, 4], [8, 4]].forEach(function (c) {
				pts.push({ z: 3, x: c[0], y: c[1] });
			});
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 6, y: 2 });
			return evenTrim(pts); // 25+25+8+6 = 64 → 64
		},
		'large': function () {
			var pts = [];
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: ring (20) + inner 4×4 keep */
			for (var y1 = 0; y1 < 6; y1++) {
				for (var x1 = 0; x1 < 6; x1++) {
					if (y1 === 0 || y1 === 5 || x1 === 0 || x1 === 5) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			for (var y2 = 1; y2 < 5; y2++) {
				for (var x2 = 1; x2 < 5; x2++) pts.push({ z: 1, x: x2 * 2, y: y2 });
			}
			/* z2: corner towers + 2×2 keep */
			[[0, 0], [10, 0], [0, 5], [10, 5]].forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 6, y: 2 }, { z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			/* z3: top towers + top keep */
			[[0, 0], [10, 0], [0, 5], [10, 5]].forEach(function (c) {
				pts.push({ z: 3, x: c[0], y: c[1] });
			});
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 6, y: 2 });
			/* z4: mastio (supportato da z3) */
			pts.push({ z: 4, x: 6, y: 2 });
			return evenTrim(pts); // 36+36+8+6+1 = 87 → 86
		}
	},

	'zigzag': {
		/* ZIG-ZAG (lightning): bands staggered right/left,
		   con un piano superiore sui tratti larghi. Solo FULL. */
		'small': function () {
			var pts = [];
			/* Z0: alternating bands */
			[[0, 2, 4, 6], [4, 6, 8, 10], [0, 2, 4, 6, 8], [2, 4, 6, 8, 10], [0, 2, 4]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: tier above the two wide central rows */
			[[4, 6], [4, 6], [4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: apex (rests on Z1 x4,y2) */
			pts.push({ z: 2, x: 4, y: 2 });
			return pts; // 21 + 6 + 1 = 28
		},
		'medium': function () {
			var pts = [];
			/* Z0: alternating bands (6 rows) */
			[[0, 2, 4, 6], [4, 6, 8, 10], [0, 2, 4, 6], [4, 6, 8, 10], [0, 2, 4, 6], [4, 6, 8]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: tier on all inner rows */
			[[4, 6], [4, 6], [4, 6], [4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: second tier (above Z1) */
			[[4, 6], [4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 2, x: row[i], y: y + 2 });
			});
			/* Z3: apex (rests on Z2 x4,y3) */
			pts.push({ z: 3, x: 4, y: 3 });
			return pts; // 23 + 8 + 4 + 1 = 36
		}
	},

	'rings': {
		/* DOUBLE RING: two raised square frames (at the top-
		   sinistra e in basso a destra) su base piena + angoli
		   marcati. Solo FULL (la base piena dà supporto ovunque). */
		'small': function () {
			var pts = [];
			/* Z0: base solida 4×4 */
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* Z1: ring A 2×2 (x0..2, y0..1) + ring B 2×2 (x4..6, y2..3) */
			for (var xa = 0; xa <= 2; xa += 2) {
				pts.push({ z: 1, x: xa, y: 0 });
				pts.push({ z: 1, x: xa, y: 1 });
			}
			for (var xb = 4; xb <= 6; xb += 2) {
				pts.push({ z: 1, x: xb, y: 2 });
				pts.push({ z: 1, x: xb, y: 3 });
			}
			/* Z2: angoli marcati */
			pts.push({ z: 2, x: 0, y: 0 }, { z: 2, x: 6, y: 3 });
			/* Z3: twin apexes (even parity) */
			pts.push({ z: 3, x: 0, y: 0 }, { z: 3, x: 6, y: 3 });
			return pts; // 16 + 8 + 2 + 2 = 28
		},
		'medium': function () {
			var pts = [];
			/* Z0: base solida 6×6 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* Z1: ring A (3×4 frame, x0..4, y0..3) */
			for (var xa = 0; xa <= 4; xa += 2) {
				pts.push({ z: 1, x: xa, y: 0 });
				pts.push({ z: 1, x: xa, y: 3 });
			}
			for (var ya = 1; ya < 3; ya++) {
				pts.push({ z: 1, x: 0, y: ya });
				pts.push({ z: 1, x: 4, y: ya });
			}
			/* Z1: ring B (3×4 frame, x6..10, y2..5) */
			for (var xb = 6; xb <= 10; xb += 2) {
				pts.push({ z: 1, x: xb, y: 2 });
				pts.push({ z: 1, x: xb, y: 5 });
			}
			for (var yb = 3; yb < 5; yb++) {
				pts.push({ z: 1, x: 6, y: yb });
				pts.push({ z: 1, x: 10, y: yb });
			}
			/* Z2: angoli marcati */
			pts.push({ z: 2, x: 0, y: 0 }, { z: 2, x: 10, y: 5 });
			/* Z3: twin apexes (even parity) */
			pts.push({ z: 3, x: 0, y: 0 }, { z: 3, x: 10, y: 5 });
			return pts; // 36 + 20 + 2 + 2 = 60
		}
	},

	'temple': {
		/* TEMPLE: full base + raised inner hall + double roof
		   spiovente (fronte/retro) con guglia centrale. Solo FULL.
		   Even counts without trim: small 38, medium 52. */
		'small': function () {
			var pts = [];
			/* Z0: base solida 5×5 */
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* Z1: side columns (4) */
			pts.push({ z: 1, x: 0, y: 1 }, { z: 1, x: 0, y: 3 });
			pts.push({ z: 1, x: 8, y: 1 }, { z: 1, x: 8, y: 3 });
			/* Z1: tetti fronte/retro */
			pts.push({ z: 1, x: 2, y: 0 }, { z: 1, x: 4, y: 0 }, { z: 1, x: 6, y: 0 });
			pts.push({ z: 1, x: 2, y: 4 }, { z: 1, x: 4, y: 4 }, { z: 1, x: 6, y: 4 });
			/* Z2: tetti superiori */
			pts.push({ z: 2, x: 4, y: 0 }, { z: 2, x: 4, y: 4 });
			/* Z3: guglia */
			pts.push({ z: 3, x: 4, y: 0 });
			return pts; // 25 + 10 + 2 + 1 = 38
		},
		'medium': function () {
			var pts = [];
			/* Z0: base solida 5×5 */
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* Z1: sala interna 3×3 (x2..6, y1..3) */
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x1 = 2; x1 <= 6; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* Z1: tetti fronte/retro (x0..8 a y0 e y4) */
			for (var xf = 0; xf <= 8; xf += 2) {
				pts.push({ z: 1, x: xf, y: 0 });
				pts.push({ z: 1, x: xf, y: 4 });
			}
			/* Z2: tetti superiori (x2..6 a y0 e y4) */
			pts.push({ z: 2, x: 2, y: 0 }, { z: 2, x: 4, y: 0 }, { z: 2, x: 6, y: 0 });
			pts.push({ z: 2, x: 2, y: 4 }, { z: 2, x: 4, y: 4 }, { z: 2, x: 6, y: 4 });
			/* Z3: guglie gemelle */
			pts.push({ z: 3, x: 4, y: 0 }, { z: 3, x: 4, y: 4 });
			return pts; // 25 + 19 + 6 + 2 = 52
		}
	},

	/* ---- NEW v0.6.0 FIGURE LAYOUTS (lotus, sphinx, crown, galaxy, totem) ----
	   All tiles are FULL and every tile at z>0 rests on a full tile
	   at the same (x,y) at z-1 (counts always even). */

	'lotus': {
		/* LOTUS: full 6×5 base + raised petal corolla around
		   at the center + raised heart (2×2). */
		'small': function () {
			var pts = [];
			/* z0: base 6×5 (x 0..10, y 0..4) = 30 */
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: crown petals + center */
			[[2, 1], [4, 1], [6, 1], [2, 2], [6, 2], [2, 3], [6, 3], [2, 4], [4, 4], [6, 4], [4, 2], [4, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: cuore */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			return pts; // 30 + 12 + 2 = 44
		},
		'medium': function () {
			var pts = [];
			/* z0: base 6×6 = 36 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: double corolla (16) */
			[[2, 0], [6, 0], [2, 1], [4, 1], [6, 1], [2, 2], [6, 2], [2, 3], [6, 3], [2, 4], [4, 4], [6, 4], [2, 5], [6, 5], [4, 2], [4, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: double heart (4) — v0.6.1: odd x=3 has no support
			   in z1 (tiles only on even x). We use the 4 cells around
			   the center that exist in z1: (2,2),(6,2),(2,3),(6,3). */
			pts.push({ z: 2, x: 2, y: 2 }, { z: 2, x: 6, y: 2 }, { z: 2, x: 2, y: 3 }, { z: 2, x: 6, y: 3 });
			return evenTrim(pts); // 36 + 16 + 4 = 56
		}
	},

	'sphinx': {
		/* SPHINX: base body + raised background paw + head that
		   innalza al centro. */
		'small': function () {
			var pts = [];
			/* z0: base 6×6 = 36 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: "legs" + central body */
			[[2, 1], [8, 1], [2, 4], [8, 4], [4, 2], [4, 3], [6, 2], [6, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: thorax */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* z3: head */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 4, y: 3 });
			return pts; // 36 + 8 + 2 + 2 = 48
		}
	},

	'crown': {
		/* CROWN: full 6×6 base + alternating points on two rows. */
		'small': function () {
			var pts = [];
			/* z0: base 6×6 = 36 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: points on rows 0 and 5 (6 each = 12) */
			for (var x1 = 0; x1 < 6; x1++) {
				pts.push({ z: 1, x: x1 * 2, y: 0 });
				pts.push({ z: 1, x: x1 * 2, y: 5 });
			}
			/* z2: intermediate points (3+3 = 6) */
			pts.push({ z: 2, x: 2, y: 0 }, { z: 2, x: 6, y: 0 }, { z: 2, x: 10, y: 0 });
			pts.push({ z: 2, x: 2, y: 5 }, { z: 2, x: 6, y: 5 }, { z: 2, x: 10, y: 5 });
			return pts; // 36 + 12 + 6 = 54
		}
	},

	'galaxy': {
		/* GALAXY: full base + raised star clusters in groups
		   separati + nucleo centrale su più livelli. */
		'small': function () {
			var pts = [];
			/* z0: base 6×7 = 42 */
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: ammassi */
			[[2, 1], [4, 1], [2, 2], [4, 2], [6, 4], [8, 4], [6, 5], [8, 5], [4, 3], [6, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: cluster centers + nucleus supports (v0.6.1: z3 must
			   poggiare su z2 — aggiunti (4,3),(6,3)). */
			pts.push({ z: 2, x: 2, y: 1 }, { z: 2, x: 4, y: 1 }, { z: 2, x: 8, y: 4 }, { z: 2, x: 8, y: 5 });
			pts.push({ z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			/* z3: nucleo (supportato da z2) */
			pts.push({ z: 3, x: 4, y: 3 }, { z: 3, x: 6, y: 3 });
			return pts; // 42 + 10 + 6 + 2 = 60
		},
		'medium': function () {
			var pts = [];
			/* z0: base 6×8 = 48 */
			for (var y = 0; y < 8; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: extended clusters + arms */
			var b1 = [[2, 1], [4, 1], [2, 2], [4, 2], [6, 3], [8, 3], [6, 4], [8, 4],
			         [2, 5], [4, 5], [2, 6], [4, 6], [4, 3], [6, 5], [6, 2], [4, 4]];
			b1.forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: centers + inner arms */
			var b2 = [[2, 1], [4, 1], [6, 3], [8, 4], [2, 6], [4, 6], [4, 3], [6, 4]];
			b2.forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			/* z2 extra: (4,4) serve per supportare il nucleo,
			   (8,3) aggiunge simmetria e rende il totale pari (78) */
			var b3 = [[4, 4], [8, 3]];
			b3.forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			/* z3: double nucleus (supported by z2) */
			pts.push({ z: 3, x: 4, y: 3 }, { z: 3, x: 6, y: 4 }, { z: 3, x: 4, y: 4 }, { z: 3, x: 6, y: 3 });
			return pts; // 48 + 16 + 10 + 4 = 78
		}
	},

	'totem': {
		/* TOTEM: full base + central 3-tier column. */
		'small': function () {
			var pts = [];
			/* z0: base 5×6 = 30 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: wide 3×2 column */
			[[2, 2], [4, 2], [6, 2], [2, 3], [4, 3], [6, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: narrow 1×2 column */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* z3: double apex */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 4, y: 3 });
			return pts; // 30 + 6 + 2 + 2 = 40
		},
		'medium': function () {
			var pts = [];
			/* z0: base 6×6 = 36 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: wide 3×3 column + side bases */
			[[0, 1], [1 * 1, 1], [2, 2], [4, 2], [6, 2], [2, 3], [4, 3], [6, 3], [2, 4], [4, 4], [6, 4]].forEach(function (c) {
				pts.push({ z: 1, x: c[0] * (c[0] === 1 ? 2 : 1), y: c[1] });
			});
			/* z2: narrow 1×2 column */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* z3: double apex */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 36 + 11 + 2 + 2 = 51 → 50
		}
	},

	/* ============================================================
	   NEW v0.8.3 FIGURES — 9 layouts (chalice, mushroom, ship,
	   anchor, windmill, harp, lyre, skyscraper, crane).
	   Physics rules respected: FULL at z>0 rests on an identical FULL
	   below; no new halves (zero support risk).
	   ============================================================ */
	'chalice': {
		'small': function () {
			var pts = [];
			/* wide base (z0) + raised basin (z1) on top of it */
			for (var y = 0; y < 2; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
				pts.push({ z: 1, x: 4, y: y }, { z: 1, x: 6, y: y });
			}
			/* fusto (z0) */
			for (var f = 0; f < 2; f++) pts.push({ z: 0, x: 4, y: f + 2 }, { z: 0, x: 6, y: f + 2 });
			/* foot (z0) */
			for (var p = 0; p < 2; p++) {
				for (var x2 = 0; x2 < 6; x2++) pts.push({ z: 0, x: x2 * 2, y: p + 4 });
			}
			return pts; // 12 + 4 + 4 + 12 = 32
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 2; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
				for (var v = 2; v < 6; v++) pts.push({ z: 1, x: v * 2, y: y });
			}
			for (var f = 0; f < 3; f++) pts.push({ z: 0, x: 4, y: f + 2 }, { z: 0, x: 6, y: f + 2 });
			for (var p = 0; p < 2; p++) {
				for (var x2 = 0; x2 < 6; x2++) pts.push({ z: 0, x: x2 * 2, y: p + 5 });
			}
			return pts; // 12 + 12 + 6 + 12 = 42
		}
	},

	'mushroom': {
		'small': function () {
			var pts = [];
			/* wide roots (z0) */
			for (var y = 0; y < 3; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* stem z1 + cap z2 (aligned, rest correctly) */
			for (var g = 0; g < 3; g++) {
				pts.push({ z: 1, x: 4, y: g }, { z: 1, x: 6, y: g });
				pts.push({ z: 2, x: 4, y: g }, { z: 2, x: 6, y: g });
			}
			return pts; // 18 + 6 + 6 = 30
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 2; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var g = 0; g < 2; g++) {
				pts.push({ z: 1, x: 4, y: g }, { z: 1, x: 6, y: g });
				pts.push({ z: 2, x: 4, y: g }, { z: 2, x: 6, y: g });
			}
			/* foot/hillock on the sides (z0) */
			for (var s = 0; s < 3; s++) pts.push({ z: 0, x: 0, y: s }, { z: 0, x: 10, y: s });
			/* v0.9.2: dedupe — (0,0),(10,0),(0,1),(10,1) were already in the
			   base 6×2 e venivano ripushate dalla collinetta. */
			return dedupePts(pts); // 22 unique
		}
	},

	'ship': {
		'small': function () {
			var pts = [];
			/* keel + hull + deck (z0) */
			for (var c = 1; c < 5; c++) pts.push({ z: 0, x: c * 2, y: 4 });
			for (var s = 0; s < 6; s++) pts.push({ z: 0, x: s * 2, y: 3 });
			for (var d = 0; d < 6; d++) pts.push({ z: 0, x: d * 2, y: 2 });
			/* raised bridge z1 (rests on the deck) */
			for (var p = 1; p < 5; p++) pts.push({ z: 1, x: p * 2, y: 2 });
			return pts; // 4 + 6 + 6 + 4 = 20
		},
		'medium': function () {
			var pts = [];
			for (var c = 0; c < 3; c++) pts.push({ z: 0, x: c * 2 + 2, y: 5 }, { z: 0, x: c * 2 + 2, y: 6 });
			for (var y = 0; y < 2; y++) {
				for (var s = 0; s < 6; s++) pts.push({ z: 0, x: s * 2, y: y + 3 });
				for (var d = 0; d < 6; d++) pts.push({ z: 0, x: d * 2, y: y + 1 });
				for (var p = 1; p < 5; p++) pts.push({ z: 1, x: p * 2, y: y + 1 });
			}
			return pts; // 6 + 12 + 12 + 8 = 38
		}
	},

	'anchor': {
		'small': function () {
			var pts = [];
			/* ring + shaft (z0) */
			for (var a = 0; a < 5; a++) pts.push({ z: 0, x: a * 2, y: 0 });
			pts.push({ z: 0, x: 4, y: 1 }, { z: 0, x: 4, y: 2 });
			pts.push({ z: 0, x: 4, y: 3 }, { z: 0, x: 4, y: 4 });
			/* crossbar */
			for (var t = 0; t < 6; t++) pts.push({ z: 0, x: t * 2, y: 5 });
			/* arms */
			pts.push({ z: 0, x: 0, y: 6 }, { z: 0, x: 10, y: 6 });
			return evenTrim(pts); // 5+2+2+6+2 = 17 → 16
		},
		'medium': function () {
			var pts = [];
			for (var a = 0; a < 6; a++) pts.push({ z: 0, x: a * 2, y: 0 });
			for (var st = 0; st < 4; st++) pts.push({ z: 0, x: 4, y: st + 1 });
			for (var t = 0; t < 6; t++) pts.push({ z: 0, x: t * 2, y: 5 });
			pts.push({ z: 0, x: 0, y: 6 }, { z: 0, x: 10, y: 6 }, { z: 0, x: 0, y: 7 }, { z: 0, x: 10, y: 7 });
			return pts; // 6 + 4 + 6 + 4 = 20
		}
	},

	'windmill': {
		'small': function () {
			var pts = [];
			/* pale a croce di S.Andrea (z0) */
			pts.push({ z: 0, x: 0, y: 2 }, { z: 0, x: 2, y: 2 }, { z: 0, x: 4, y: 2 }, { z: 0, x: 6, y: 2 }, { z: 0, x: 8, y: 2 });
			pts.push({ z: 0, x: 2, y: 0 }, { z: 0, x: 2, y: 1 }, { z: 0, x: 2, y: 3 }, { z: 0, x: 2, y: 4 });
			pts.push({ z: 0, x: 6, y: 0 }, { z: 0, x: 6, y: 1 }, { z: 0, x: 6, y: 3 }, { z: 0, x: 6, y: 4 });
			/* raised pivot (rests on the central blade z0) */
			pts.push({ z: 1, x: 4, y: 2 });
			return pts; // 13 + 1 = 14
		},
		'medium': function () {
			var pts = [];
			/* diagonale A (z0) */
			pts.push({ z: 0, x: 0, y: 0 }, { z: 0, x: 2, y: 1 }, { z: 0, x: 4, y: 2 }, { z: 0, x: 6, y: 3 }, { z: 0, x: 8, y: 4 });
			/* diagonale B */
			pts.push({ z: 0, x: 0, y: 4 }, { z: 0, x: 2, y: 3 }, { z: 0, x: 6, y: 1 }, { z: 0, x: 8, y: 0 });
			/* assi orizzontale + verticale */
			for (var o = 0; o < 5; o++) pts.push({ z: 0, x: o * 2, y: 2 });
			for (var v = 0; v < 5; v++) pts.push({ z: 0, x: 4, y: v });
			pts.push({ z: 1, x: 4, y: 2 });
			/* v0.9.2: dedupe — center (0,4,2) was pushed by diagonal A,
			   asse orizzontale e asse verticale → 3 tile nella stessa cella. */
			return dedupePts(pts); // 18 unique
		}
	},

	'harp': {
		/* HARP: left column + descending oblique arm + base
		   full base with inner strings. FULL only. */
		'small': function () {
			var pts = [];
			/* left column (z0) */
			for (var y = 0; y < 5; y++) pts.push({ z: 0, x: 2, y: y });
			/* full base (z0) */
			for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: 4 });
			/* oblique arm: diagonal towards the bottom-right */
			pts.push({ z: 0, x: 4, y: 3 }, { z: 0, x: 6, y: 2 }, { z: 0, x: 8, y: 1 });
			/* corda interna (z0) */
			pts.push({ z: 0, x: 4, y: 1 }, { z: 0, x: 4, y: 2 });
			/* v0.9.2: dedupe — (0,2,4) was in the column E and the base. */
			return evenTrim(dedupePts(pts)); // 15 uniche → 14
		},
		'medium': function () {
			var pts = [];
			/* left column + base + oblique arm + double strings */
			for (var y = 0; y < 6; y++) pts.push({ z: 0, x: 2, y: y });
			for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: 5 });
			pts.push({ z: 0, x: 4, y: 4 }, { z: 0, x: 6, y: 3 }, { z: 0, x: 8, y: 2 }, { z: 0, x: 10, y: 1 });
			/* double inner strings */
			for (var y2 = 1; y2 < 5; y2++) {
				pts.push({ z: 0, x: 4, y: y2 });
				pts.push({ z: 0, x: 6, y: y2 });
			}
			/* v0.9.2: dedupe — (0,2,5) column+base, (0,6,3)/(0,4,4)
			   braccio+corde. */
			return evenTrim(dedupePts(pts)); // 21 uniche → 20
		}
	},

	'lyre': {
		/* LYRE: two side arms + crossbar + center foot.
		   v0.9.2: arms start at y=1 so the y=0 crossbar no longer
		   duplicates (0,0) and (8,0) — previously the same cell got 2
		   tiles → broken parity and overlapping tiles. Unique counts:
		   small 6+5+3+2=16, medium 8+5+3+4=20. */
		'small': function () {
			var pts = [];
			/* arms (z0): y 1..3 (the crossbar covers y=0) */
			for (var y = 1; y < 4; y++) {
				pts.push({ z: 0, x: 0, y: y });
				pts.push({ z: 0, x: 8, y: y });
			}
			/* top crossbar (z0) */
			for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: 0 });
			/* base (z0) */
			for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 3 });
			/* foot (z0) */
			pts.push({ z: 0, x: 4, y: 4 }, { z: 0, x: 6, y: 4 });
			return evenTrim(pts); // 16 uniche
		},
		'medium': function () {
			var pts = [];
			/* longer arms (z0): y 1..4 */
			for (var y = 1; y < 5; y++) {
				pts.push({ z: 0, x: 0, y: y });
				pts.push({ z: 0, x: 8, y: y });
			}
			for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: 0 });
			for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 4 });
			pts.push({ z: 0, x: 4, y: 5 }, { z: 0, x: 6, y: 5 });
			pts.push({ z: 0, x: 4, y: 6 }, { z: 0, x: 6, y: 6 });
			return pts; // 20 uniche
		}
	},

	'skyscraper': {
		/* SKYSCRAPER: tower centered on a wide base, 4 tiers that
		   restringono verso l'alto. Molte tile nascoste sotto → alto. */
		'small': function () {
			var pts = [];
			/* wide 6×4 base (z0) */
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tower z1: 2×2 (x 4,6; y 1..2) */
			for (var y1 = 1; y1 < 3; y1++) {
				pts.push({ z: 1, x: 4, y: y1 }, { z: 1, x: 6, y: y1 });
			}
			/* tower z2: 2×2 (x 4,6; y 1..2) */
			for (var y2 = 1; y2 < 3; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* apex z3 */
			pts.push({ z: 3, x: 4, y: 1 }, { z: 3, x: 4, y: 2 });
			return pts; // 24 + 4 + 4 + 2 = 34
		},
		'medium': function () {
			var pts = [];
			/* wide 6×6 base (z0) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* tower z1: 4×4 (x 2..8, y 1..4) */
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 2; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* tower z2: 2×3 (x 4,6; y 2..4) */
			for (var y2 = 2; y2 < 5; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* tower z3: 1×2 (x 4; y 3..4) */
			for (var y3 = 3; y3 < 5; y3++) pts.push({ z: 3, x: 4, y: y3 });
			/* antenna z4 */
			pts.push({ z: 4, x: 4, y: 3 });
			return pts; // 36 + 16 + 6 + 2 + 1 = 61
		}
	},

	'crane': {
		/* CRANE (bird): spread diagonal wings + body + neck/beak.
		   All at z0 with a small raised crest at the center. */
		'small': function () {
			var pts = [];
			/* spread wings (z0), symmetrical around x=4 */
			pts.push({ z: 0, x: 0, y: 1 }, { z: 0, x: 2, y: 0 });
			pts.push({ z: 0, x: 8, y: 1 }, { z: 0, x: 6, y: 0 });
			/* body (z0) */
			for (var x = 1; x < 4; x++) pts.push({ z: 0, x: x * 2, y: 1 });
			for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 2 });
			/* collo + becco */
			pts.push({ z: 0, x: 2, y: 3 }, { z: 0, x: 2, y: 4 });
			/* tail */
			pts.push({ z: 0, x: 8, y: 2 });
			/* raised crest (rests on the body z0) */
			pts.push({ z: 1, x: 4, y: 1 });
			return evenTrim(pts); // 4 + 6 + 2 + 1 + 1 = 14 → 14
		},
		'medium': function () {
			var pts = [];
			/* longer wings */
			pts.push({ z: 0, x: 0, y: 2 }, { z: 0, x: 2, y: 1 }, { z: 0, x: 0, y: 1 });
			pts.push({ z: 0, x: 8, y: 2 }, { z: 0, x: 6, y: 1 }, { z: 0, x: 10, y: 1 });
			/* elongated body */
			for (var x = 1; x < 5; x++) pts.push({ z: 0, x: x * 2, y: 2 });
			for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 3 });
			/* long neck + head */
			pts.push({ z: 0, x: 2, y: 4 }, { z: 0, x: 2, y: 5 }, { z: 0, x: 4, y: 5 });
			/* tail */
			pts.push({ z: 0, x: 8, y: 3 });
			/* raised double crest */
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			/* v0.9.2: dedupe — (0,8,2) was in the right wing AND the body. */
			return dedupePts(pts); // 18 unique
		}
	},

	'temple_steps': {
		/* v0.9.2 — CLASSIC OFFSET STACKING (ziggurat). Each tier is
		   CENTERED and rests on the CROSSING of the tier below. The
		   tier-1 HALF starts from ROW 0 of the base → they cut the
		   first base row in half (no "floating" / full rows under the
		   halves), while the lower base rows stay full as a stable
		   plinth → free and matchable edges.
		     z0 FULL (even x)            base grid
		     z1 HALF (odd x)             from y=0 down, FULL crossings
		     z2 FULL (even x)            HALF crossings, centered
		   Counts multiple of 4: small 24, medium 40, large 52. */
		'small': function () {
			var pts = [];
			/* z0: FULL 4×4 (x 0..6, y 0..3) */
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: HALF 3×2 starting from y=0 (cut row 0 in half):
			   half y0 rests on FULL y0,y1; half y1 on FULL y1,y2 */
			for (var y1 = 0; y1 < 2; y1++) {
				for (var x1 = 1; x1 <= 5; x1 += 2) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
			}
			/* z2: FULL 2×1 (half crossings) */
			pts.push({ z: 2, x: 2, y: 0 }, { z: 2, x: 4, y: 0 });
			return pts; // 16 + 6 + 2 = 24
		},
		'medium': function () {
			var pts = [];
			/* z0: FULL 5×5 (x 0..8, y 0..4) */
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: HALF 4×3 starting from y=0 (cut row 0 in half):
			   half y0→FULL y0,1; y1→1,2; y2→2,3 — row y4 plinth.
			   The y0 HALFs are ALWAYS free (no tier above) and the
			   z0 FULL side edges are too, so there are enough
			   matchable free tiles (playable level). */
			for (var y1 = 0; y1 < 3; y1++) {
				for (var x1 = 1; x1 <= 7; x1 += 2) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
			}
			/* z2: FULL 3×1 centered (full x2,4,6 at y1 on half y1,y2) */
			for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: 1 });
			return pts; // 25 + 12 + 3 = 40
		},
		'large': function () {
			var pts = [];
			/* z0: FULL 6×6 (x 0..10, y 0..5) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: HALF 5×3 starting from y=0 (cut row 0 in half):
			   half y0→FULL y0,1; y1→1,2; y2→2,3 — y4,y5 plinth */
			for (var y1 = 0; y1 < 3; y1++) {
				for (var x1 = 1; x1 <= 9; x1 += 2) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
			}
			/* z2: FULL 4×1 (x2,4,6,8 at y1, on the y1,y2 half crossings) */
			for (var x2 = 2; x2 <= 8; x2 += 2) pts.push({ z: 2, x: x2, y: 1 });
			/* z3: apex (rests on the full x4,y1) */
			pts.push({ z: 3, x: 4, y: 1 });
			return pts; // 36 + 15 + 4 + 1 = 56
		}
	}
};
