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

/* Rimuove coordinate duplicate (stessa z,x,y) mantenendo il primo.
   Usato dai builder le cui figure si sovrappongono (es. helix). */
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
			/* 4×5 base + 3×3 half-cover sopra (riga extra per supporto) */
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
			/* v0.6.0 — base piena 6×8 + mezza copertura 5×7 sopra.
			   Ogni mezza tile sta sull'incrocio di 4 tile piene. */
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
			/* v0.6.0 — base piena 6×9 (max righe) + mezza copertura 5×8. */
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
			/* Croce a bracci spessi: 5×5 con barra centrale 3×5 + 5×3 */
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					if (Math.abs(y - 2) <= 1 || Math.abs(x - 2) <= 1) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			/* layer 1: centro 3×3 */
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
			/* v0.6.0 — z1 3 righe (y1..3) e non 4: la riga 4 (x8)
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
			/* CROCE XL rimbalzata: z1 solo sulle righe piene della base
			   (y2..3), z2 ridotta, vertice unico — zero tile sospese. */
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
			/* v0.6.0: le 4 torri interne (x2/x8, y3/y4) erano a z2
			   senza z1 sotto → sospese. Le metto a z1 (supportate
			   dalla base piena) così il disegno resta ma la fisica è valida. */
			pts.push({ z: 1, x: 2, y: 3 }, { z: 1, x: 8, y: 3 }, { z: 1, x: 2, y: 4 }, { z: 1, x: 8, y: 4 });
			return pts; // 48+20+4+4 = 76
		}
	},

	'dragon': {
		'small': function () {
			/* 5 righe: 6,4,6,4,6 + layer superiore 4,2,4,2 */
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
			/* TARTARUGA pulita: carapace = anello 5×5 (x0..8, y1..5),
			   interno 2×2 rialzato, testa x10, coda, zampe.
			   Nessuna tile sospesa, nessun duplicato, bounds ≤ 10×8. */
			var pts = [];
			/* anello: x ogni 2, y 1..5 */
			for (var y = 1; y < 6; y++) {
				for (var x = 0; x < 5; x++) {
					if (y === 1 || y === 5 || x === 0 || x === 4) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			/* interno 2×2 (x 4..6, y 2..3): base + colmo */
			pts.push({ z: 0, x: 4, y: 2 }, { z: 0, x: 4, y: 3 }, { z: 0, x: 6, y: 2 }, { z: 0, x: 6, y: 3 });
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 4, y: 3 }, { z: 1, x: 6, y: 2 }, { z: 1, x: 6, y: 3 });
			/* testa (x10, y2..4) */
			pts.push({ z: 0, x: 10, y: 2 }, { z: 0, x: 10, y: 3 }, { z: 0, x: 10, y: 4 });
			/* coda (sopra a sinistra) */
			pts.push({ z: 0, x: 2, y: 0 });
			/* zampe in basso */
			pts.push({ z: 0, x: 2, y: 6 }, { z: 0, x: 8, y: 6 });
			return pts; // 16 anello + 8 interno + 3 testa + 1 coda + 2 zampe = 30
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
			/* Rombo: righe 1,3,5,6,5,3,1 (max 6 tile = span 0..10).
			   Interno 1,3,1 sopra; pinnacolo centrato. */
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
		/* FISICA: ogni tile a z>0 è FULL e poggia su una FULL tile
		   direttamente sotto (z-1, stessa x, stessa y). Piani pieni
		   che si restringono di 2 colonne/2 righe — niente half-cover,
		   niente tile sospese. */
		'medium': function () {
			var pts = [];
			/* base piena 5×6 (x 0..8, y 0..5) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: full 3×4 (x 2,4,6; y 1..4) */
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 2; x1 <= 6; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* piano 2: full 1×2 (x 4; y 2..3) */
			for (var y2 = 2; y2 < 4; y2++) pts.push({ z: 2, x: 4, y: y2 });
			/* vertice */
			pts.push({ z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 30+12+2+1 = 45
		},
		'large': function () {
			var pts = [];
			/* base piena 6×7 (x 0..10, y 0..6) */
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: full 4×5 (x 2,4,6,8; y 1..5) */
			for (var y1 = 1; y1 < 6; y1++) {
				for (var x1 = 2; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* piano 2: full 2×3 (x 4,6; y 2..4) */
			for (var y2 = 2; y2 < 5; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* vertice */
			pts.push({ z: 3, x: 6, y: 3 });
			return evenTrim(pts); // 42+20+6+1 = 69
		},
		'xl': function () {
			var pts = [];
			/* base piena 6×9 (x 0..10, y 0..8) */
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: full 5×7 (x 0,2,4,6,8; y 1..7) */
			for (var y1 = 1; y1 < 8; y1++) {
				for (var x1 = 0; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* piano 2: full 3×5 (x 2,4,6; y 2..6) */
			for (var y2 = 2; y2 < 7; y2++) {
				for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: y2 });
			}
			/* piano 3: full 1×3 (x 4; y 3..5) */
			for (var y3 = 3; y3 < 6; y3++) pts.push({ z: 3, x: 4, y: y3 });
			/* vertice */
			pts.push({ z: 4, x: 4, y: 4 });
			return evenTrim(pts); // 54+35+15+3+1 = 108
		}
	},

	'labyrinth': {
		'small': function () {
			/* LABIRINTO: base piena (supporto universale) + MURO
			   PERIMETRALE rialzato + muri interni con aperture
			   → corridoi di un labirinto ben visibili in 3D. */
			var pts = [];
			/* layer 0: base piena 6×7 (x 0..10, y 0..6) */
			for (var by = 0; by < 7; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: muro perimetrale rialzato */
			for (var x0 = 0; x0 <= 10; x0 += 2) {
				pts.push({ z: 1, x: x0, y: 0 });
				pts.push({ z: 1, x: x0, y: 6 });
			}
			for (var y1 = 1; y1 < 6; y1++) {
				pts.push({ z: 1, x: 0, y: y1 });
				pts.push({ z: 1, x: 10, y: y1 });
			}
			/* layer 1: piattaforme sotto i muri interni (supporto) */
			pts.push({ z: 1, x: 2, y: 2 }, { z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			pts.push({ z: 1, x: 4, y: 4 }, { z: 1, x: 6, y: 4 }, { z: 1, x: 8, y: 4 });
			pts.push({ z: 1, x: 8, y: 3 });
			/* layer 2: muri interni sfalsati con aperture (corridoio a S) */
			for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: 2 });
			for (var x3 = 4; x3 <= 8; x3 += 2) pts.push({ z: 2, x: x3, y: 4 });
			/* layer 3: pilastri interni per profondità (supportati da z2) */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 6, y: 4 }, { z: 3, x: 8, y: 4 });
			/* v0.9.2: dedupe — la piattaforma (1,2,4) era pushata 2 volte
			   (loop x3 a y4 + esplicita a y4) → tile sovrapposta. */
			return evenTrim(dedupePts(pts)); // 101 uniche → 100
		},
		'medium': function () {
			/* LABIRINTO grande: base piena 6×8 + perimetro + più corridoi. */
			var pts = [];
			/* layer 0: base piena 6×8 (x 0..10, y 0..7) */
			for (var by = 0; by < 8; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: perimetro rialzato */
			for (var x0 = 0; x0 <= 10; x0 += 2) {
				pts.push({ z: 1, x: x0, y: 0 });
				pts.push({ z: 1, x: x0, y: 7 });
			}
			for (var y1 = 1; y1 < 7; y1++) {
				pts.push({ z: 1, x: 0, y: y1 });
				pts.push({ z: 1, x: 10, y: y1 });
			}
			/* layer 1: piattaforme sotto i muri interni (supporto) */
			for (var x2 = 2; x2 <= 8; x2 += 2) { pts.push({ z: 1, x: x2, y: 2 }); }
			for (var x3 = 2; x3 <= 6; x3 += 2) { pts.push({ z: 1, x: x3, y: 4 }); }
			for (var x4 = 4; x4 <= 8; x4 += 2) { pts.push({ z: 1, x: x4, y: 6 }); }
			pts.push({ z: 1, x: 8, y: 3 }, { z: 1, x: 8, y: 4 }, { z: 1, x: 8, y: 5 });
			pts.push({ z: 1, x: 2, y: 3 }, { z: 1, x: 2, y: 4 }, { z: 1, x: 2, y: 5 });
			/* layer 2: muri interni alternati (S allargata) */
			for (var x2b = 2; x2b <= 8; x2b += 2) pts.push({ z: 2, x: x2b, y: 2 });
			for (var x3b = 2; x3b <= 6; x3b += 2) pts.push({ z: 2, x: x3b, y: 4 });
			for (var x4b = 4; x4b <= 8; x4b += 2) pts.push({ z: 2, x: x4b, y: 6 });
			/* v0.9.2: dedupe — (1,2,4) era pushata 2 volte (loop x3 + esplicita) */
			return evenTrim(dedupePts(pts)); // 101 uniche → 100
			/* (rimossi: z2/z3 colonne verticali x8/x2 y3..5 — troppo dense,
			   il solver andava in timeout su quasi tutti gli shuffle) */
		}
	},

	'pyramid_half': {
		'small': function () {
			/* PIRAMIDE EGIZIANA: piani full centrati che si restringono
			   5×6 → 3×4 → 1×2 → vertice. Ogni piano poggia su quello sotto. */
			var pts = [];
			/* base piena 5×6 (x 0..8, y 0..5) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: 3×4 (x 2,4,6; y 1..4) */
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 2; x1 <= 6; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* piano 2: 1×2 (x 4; y 2..3) */
			for (var y2 = 2; y2 < 4; y2++) pts.push({ z: 2, x: 4, y: y2 });
			/* vertice (x 4, y 3) */
			pts.push({ z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 30+12+2+1 = 45
		},
		'medium': function () {
			/* PIRAMIDE EGIZIANA 4 piani: 6×7 → 4×5 → 2×3 → vertice. */
			var pts = [];
			/* base piena 6×7 (x 0..10, y 0..6) */
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: 4×5 (x 2,4,6,8; y 1..5) */
			for (var y1 = 1; y1 < 6; y1++) {
				for (var x1 = 2; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* piano 2: 2×3 (x 4,6; y 2..4) */
			for (var y2 = 2; y2 < 5; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* vertice (x 6, y 3) */
			pts.push({ z: 3, x: 6, y: 3 });
			return evenTrim(pts); // 42+20+6+1 = 69
		},
		'large': function () {
			/* PIRAMIDE EGIZIANA 4 piani: 6×8 → 4×6 → 2×4 → vertice. */
			var pts = [];
			/* base piena 6×8 (x 0..10, y 0..7) */
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
			/* vertice (x 6, y 4) */
			pts.push({ z: 3, x: 6, y: 4 });
			return evenTrim(pts); // 48+24+8+1 = 81
		},
		'xl': function () {
			/* PIRAMIDE EGIZIANA 5 piani: 6×9 → 5×7 → 3×5 → 1×3 → vertice.
			   Dal più largo al più stretto, centrato, fino alla punta. */
			var pts = [];
			/* base piena 6×9 (x 0..10, y 0..8) */
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* piano 1: 5×7 (x 0,2,4,6,8; y 1..7) */
			for (var y1 = 1; y1 < 8; y1++) {
				for (var x1 = 0; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* piano 2: 3×5 (x 2,4,6; y 2..6) */
			for (var y2 = 2; y2 < 7; y2++) {
				for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: y2 });
			}
			/* piano 3: 1×3 (x 4; y 3..5) */
			for (var y3 = 3; y3 < 6; y3++) pts.push({ z: 3, x: 4, y: y3 });
			/* vertice (x 4, y 4) */
			pts.push({ z: 4, x: 4, y: 4 });
			return evenTrim(pts); // 54+35+15+3+1 = 108
		}
	},

	'checker': {
		'small': function () {
			/* SCACCHIERA rialzata: base piena di supporto + celle pari
			   rialzate (pattern visivo a scacchiera) — tutte supportate. */
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
			/* v0.6.0: base PIENA 6×7 (una mezza tile a z1 richiede 4
			   tile piene sotto nell'incrocio — la scacchiera era troppo
			   rada e 15 mezze restavano sospese). */
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
			/* Silhouette a U: due torri (2×2 in pianta) + ponte largo sopra */
			var pts = [];
			/* torre sinistra: base 2×3 + layer 2×2 */
			for (var y0 = 0; y0 < 3; y0++) {
				pts.push({ z: 0, x: 0, y: y0 }, { z: 0, x: 2, y: y0 });
			}
			for (var y1 = 0; y1 < 2; y1++) {
				pts.push({ z: 1, x: 0, y: y1 }, { z: 1, x: 2, y: y1 });
			}
			/* torre destra: base 2×3 + layer 2×2 */
			for (var y2 = 0; y2 < 3; y2++) {
				pts.push({ z: 0, x: 6, y: y2 }, { z: 0, x: 8, y: y2 });
			}
			for (var y3 = 0; y3 < 2; y3++) {
				pts.push({ z: 1, x: 6, y: y3 }, { z: 1, x: 8, y: y3 });
			}
			/* ponte: fila di 5 tile sopra le due torri (layer 2) */
			for (var x4 = 0; x4 < 5; x4++) pts.push({ z: 2, x: x4 * 2, y: 0 });
			/* piloni centrali + ponte laterale (supporto incluso) */
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
			/* v0.6.0: piloni sotto il ponte centrale — z2 x4/x6 a y2
			   non avevano z1 sotto (solo x8 era supportata). */
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			for (var xm2 = 2; xm2 < 5; xm2++) pts.push({ z: 2, x: xm2 * 2, y: 2 });
			/* v0.9.2: dedupe — il ponte z1/z2 a x8,y1 e x8,y2 duplicava
			   le torri destre già presenti. */
			return dedupePts(pts); // 48 uniche
		}
	},

	'spiral': {
		'small': function () {
			/* SPIRALE VERA: base piena 6×6 + anelli rialzati con
			   APERTURE che collegano i giri verso il centro. */
			var pts = [];
			/* layer 0: base piena 6×6 */
			for (var by = 0; by < 6; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: anello esterno con GAP in basso a destra.
			   Top completo, sx completo, bottom da sx, dx dall'alto. */
			for (var x0 = 0; x0 <= 10; x0 += 2) pts.push({ z: 1, x: x0, y: 0 });
			for (var y1 = 1; y1 < 6; y1++) pts.push({ z: 1, x: 0, y: y1 });
			for (var x2 = 2; x2 <= 8; x2 += 2) pts.push({ z: 1, x: x2, y: 5 });
			for (var y3 = 1; y3 < 5; y3++) pts.push({ z: 1, x: 10, y: y3 });
			/* piattaforma interna z1 (poggia sulla base, supporta il giro) */
			for (var py = 1; py < 5; py++) {
				for (var px = 2; px <= 8; px += 2) pts.push({ z: 1, x: px, y: py });
			}
			/* layer 2: CORRIDOIO A S (aperto) — niente anello chiuso attorno
			   al centro. Le tile centrali restano raggiungibili e il livello
			   diventa risolvibile. Gap reali in (8,3) e (2,2). */
			for (var x4 = 2; x4 <= 8; x4 += 2) pts.push({ z: 2, x: x4, y: 1 });
			pts.push({ z: 2, x: 8, y: 2 }, { z: 2, x: 8, y: 4 });   // gap in (8,3)
			for (var x6 = 6; x6 >= 2; x6 -= 2) pts.push({ z: 2, x: x6, y: 4 });
			pts.push({ z: 2, x: 2, y: 3 });                          // gap in (2,2)
			return evenTrim(pts); // 36+19+16+9 = 80 → 80 (anello aperto)
		},
		'medium': function () {
			/* SPIRALE grande: base piena 6×8 + tre giri di anelli con gap. */
			var pts = [];
			/* layer 0: base piena 6×8 (y 0..7) */
			for (var by = 0; by < 8; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: anello esterno con gap in basso a destra */
			for (var x0 = 0; x0 <= 10; x0 += 2) pts.push({ z: 1, x: x0, y: 0 });
			for (var y1 = 1; y1 < 8; y1++) pts.push({ z: 1, x: 0, y: y1 });
			for (var x2 = 2; x2 <= 8; x2 += 2) pts.push({ z: 1, x: x2, y: 7 });
			for (var y3 = 1; y3 < 7; y3++) pts.push({ z: 1, x: 10, y: y3 });
			/* piattaforma interna z1 (supporto per il giro) */
			for (var py = 1; py < 7; py++) {
				for (var px = 2; px <= 8; px += 2) pts.push({ z: 1, x: px, y: py });
			}
			/* layer 2: giro medio */
			for (var x4 = 2; x4 <= 8; x4 += 2) pts.push({ z: 2, x: x4, y: 1 });
			for (var y5 = 1; y5 < 7; y5++) pts.push({ z: 2, x: 8, y: y5 });
			for (var x6 = 6; x6 >= 2; x6 -= 2) pts.push({ z: 2, x: x6, y: 6 });
			for (var y7 = 1; y7 < 6; y7++) pts.push({ z: 2, x: 2, y: y7 });
			/* supporto centro (z2 interno, poggia sulla piattaforma z1) */
			for (var yc = 2; yc < 5; yc++) {
				pts.push({ z: 2, x: 4, y: yc }, { z: 2, x: 6, y: yc });
			}
			/* layer 3: centro rialzato */
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
			/* ELICA/DOPPIA X: base piena + due BANDE DIAGONALI rialzate
			   che si incrociano → doppia elica vista dall'alto. */
			var pts = [];
			/* layer 0: base piena 6×7 (y 0..6) */
			for (var by = 0; by < 7; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: banda ↘ (gradini + riempitivi, spessa) */
			for (var i = 0; i < 5; i++) {
				pts.push({ z: 1, x: i * 2, y: i });
				pts.push({ z: 1, x: i * 2, y: i + 1 });
				pts.push({ z: 1, x: (i + 1) * 2, y: i + 1 });
			}
			/* layer 1: banda ↗ (speculare) */
			for (var j = 0; j < 5; j++) {
				pts.push({ z: 1, x: j * 2, y: 6 - j });
				pts.push({ z: 1, x: j * 2, y: 5 - j });
				pts.push({ z: 1, x: (j + 1) * 2, y: 5 - j });
			}
			/* supporto per l'incrocio centrale (x=6, y=3) */
			pts.push({ z: 1, x: 6, y: 3 });
			/* layer 2-3: incrocio centrale marcato */
			pts.push({ z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			pts.push({ z: 3, x: 6, y: 3 });
			/* v0.9.2: dedupe — le due bande diagonali si incrociano:
			   (4,3)/(6,3) e le celle di bordo erano pushate 2 volte. */
			return evenTrim(dedupePts(pts)); // 65 uniche → 64
		},
		'medium': function () {
			/* ELICA grande: base piena 6×9 + bande diagonali lunghe. */
			var pts = [];
			/* layer 0: base piena 6×9 (y 0..8) */
			for (var by = 0; by < 9; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: banda ↘ estesa (6 gradini + riempitivi).
			   v0.6.0: (i+1)*2 va in x=12 a i=5 → fuori griglia.
			   L'ultimo gradino aggiunge solo la riga verticale x=10. */
			for (var i = 0; i < 6; i++) {
				pts.push({ z: 1, x: i * 2, y: i });
				pts.push({ z: 1, x: i * 2, y: i + 1 });
				if (i < 5) pts.push({ z: 1, x: (i + 1) * 2, y: i + 1 });
				pts.push({ z: 1, x: i * 2, y: i + 2 });
			}
			/* layer 1: banda ↗ estesa (stesso fix: niente x=12) */
			for (var j = 0; j < 6; j++) {
				pts.push({ z: 1, x: j * 2, y: 8 - j });
				pts.push({ z: 1, x: j * 2, y: 7 - j });
				if (j < 5) pts.push({ z: 1, x: (j + 1) * 2, y: 7 - j });
				pts.push({ z: 1, x: j * 2, y: 6 - j });
			}
			/* layer 2-3: incrocio centrale */
			pts.push({ z: 2, x: 4, y: 4 }, { z: 2, x: 6, y: 4 });
			pts.push({ z: 2, x: 4, y: 5 }, { z: 2, x: 6, y: 5 });
			pts.push({ z: 3, x: 6, y: 4 });
			/* v0.9.2: dedupe — bande diagonali che si incrociano (vedi small). */
			return evenTrim(dedupePts(pts)); // 90 uniche → 88
		}
	},

	/* ---- NEW v0.5.0 FIGURE LAYOUTS ---- */

	'pagoda': {
		/* PAGODA: torre a piani convergenti. Ogni piano superiore è
		   centrato e poggia interamente su quello sotto (nessuna
		   sporgenza). Solo tile FULL. */
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
			/* vertice */
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
		/* FARFALLA: due ali speculari (triangoli che si allargano
		   verso il basso) + corpo centrale verticale. Solo FULL. */
		'small': function () {
			var pts = [];
			/* Z0: ali (5 righe, simmetriche attorno a x=4) */
			[[0, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: ali interne (4 righe, partono dalla 2a) */
			[[2, 6], [2, 4, 6], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: vertice corpo — poggia su Z1 (4,3) */
			pts.push({ z: 2, x: 4, y: 3 });
			return pts; // 19 + 8 + 1 = 28
		},
		'medium': function () {
			var pts = [];
			/* Z0: ali (6 righe, simmetriche attorno a x=4) */
			[[0, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8], [0, 2, 4, 6, 8], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: ali interne + corpo (4 righe, partono dalla 2a) */
			[[2, 6], [2, 4, 6], [2, 4, 6], [2, 4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: corpo (2 tile) */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* Z3: vertice */
			pts.push({ z: 3, x: 4, y: 3 });
			return pts; // 24 + 11 + 2 + 1 = 38
		}
	},

	'arrow': {
		/* FRECCIA: punta verso destra — testa a freccia + asta.
		   Piani pieni, solo FULL. */
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
		/* STELLA a 4 punte: due barre incrociate (verticale + orizzontale,
		   centro NON duplicato) + riempitivi diagonali. Solo FULL. */
		'small': function () {
			var pts = [];
			/* Z0: barra verticale + bracci orizzontali senza duplicati */
			for (var y = 0; y < 5; y++) pts.push({ z: 0, x: 4, y: y });
			pts.push({ z: 0, x: 0, y: 2 }, { z: 0, x: 2, y: 2 }, { z: 0, x: 6, y: 2 }, { z: 0, x: 8, y: 2 });
			/* Z1: punte interne + antenna superiore */
			pts.push({ z: 1, x: 4, y: 0 });
			pts.push({ z: 1, x: 4, y: 1 }, { z: 1, x: 4, y: 3 });
			pts.push({ z: 1, x: 2, y: 2 }, { z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			/* Z2: centro */
			pts.push({ z: 2, x: 4, y: 2 });
			return pts; // 9 + 6 + 1 = 16
		},
		'medium': function () {
			var pts = [];
			/* Z0: barra verticale + orizzontale (centro non duplicato) + diagonali */
			for (var y = 0; y < 7; y++) pts.push({ z: 0, x: 4, y: y });
			pts.push({ z: 0, x: 0, y: 3 }, { z: 0, x: 2, y: 3 }, { z: 0, x: 6, y: 3 }, { z: 0, x: 8, y: 3 }, { z: 0, x: 10, y: 3 });
			pts.push({ z: 0, x: 2, y: 1 }, { z: 0, x: 6, y: 1 }, { z: 0, x: 2, y: 5 }, { z: 0, x: 6, y: 5 });
			/* Z1: bracci interni */
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 4, y: 3 }, { z: 1, x: 4, y: 4 });
			pts.push({ z: 1, x: 2, y: 3 }, { z: 1, x: 6, y: 3 });
			/* Z2: centro */
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
		/* CASTELLO: base piena + mura perimetrali + torrione centrale
		   che supera le torri d'angolo. Più ricco di fortress:
		   doppio giro di mura e mastio centrale. Solo FULL. */
		'small': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: anello perimetrale + keep centrale 2×2 */
			for (var y1 = 0; y1 < 4; y1++) {
				for (var x1 = 0; x1 < 4; x1++) {
					if (y1 === 0 || y1 === 3 || x1 === 0 || x1 === 3) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			pts.push({ z: 1, x: 2, y: 1 }, { z: 1, x: 4, y: 1 }, { z: 1, x: 2, y: 2 }, { z: 1, x: 4, y: 2 });
			/* z2: torri d'angolo + keep */
			[[0, 0], [6, 0], [0, 3], [6, 3]].forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			pts.push({ z: 2, x: 2, y: 1 }, { z: 2, x: 4, y: 1 }, { z: 2, x: 2, y: 2 }, { z: 2, x: 4, y: 2 });
			return evenTrim(pts); // 16+16+8 = 40 → 40 (niente z3: troppo rado per il solver)
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: anello + keep 3×3 */
			for (var y1 = 0; y1 < 5; y1++) {
				for (var x1 = 0; x1 < 5; x1++) {
					if (y1 === 0 || y1 === 4 || x1 === 0 || x1 === 4) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			for (var y2 = 1; y2 < 4; y2++) {
				for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 1, x: x2 * 2, y: y2 });
			}
			/* z2: torri angolo + keep interno 2×2 */
			[[0, 0], [8, 0], [0, 4], [8, 4]].forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 6, y: 2 }, { z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			/* z3: torri top + keep top */
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
			/* z1: anello (20) + keep 4×4 interno */
			for (var y1 = 0; y1 < 6; y1++) {
				for (var x1 = 0; x1 < 6; x1++) {
					if (y1 === 0 || y1 === 5 || x1 === 0 || x1 === 5) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			for (var y2 = 1; y2 < 5; y2++) {
				for (var x2 = 1; x2 < 5; x2++) pts.push({ z: 1, x: x2 * 2, y: y2 });
			}
			/* z2: torri angolo + keep 2×2 */
			[[0, 0], [10, 0], [0, 5], [10, 5]].forEach(function (c) {
				pts.push({ z: 2, x: c[0], y: c[1] });
			});
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 6, y: 2 }, { z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			/* z3: torri top + keep top */
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
		/* ZIG-ZAG (fulmine): fasce sfalsate a destra/sinistra,
		   con un piano superiore sui tratti larghi. Solo FULL. */
		'small': function () {
			var pts = [];
			/* Z0: fasce alternate */
			[[0, 2, 4, 6], [4, 6, 8, 10], [0, 2, 4, 6, 8], [2, 4, 6, 8, 10], [0, 2, 4]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: piano sopra le due righe centrali larghe */
			[[4, 6], [4, 6], [4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: vertice (poggia su Z1 x4,y2) */
			pts.push({ z: 2, x: 4, y: 2 });
			return pts; // 21 + 6 + 1 = 28
		},
		'medium': function () {
			var pts = [];
			/* Z0: fasce alternate (6 righe) */
			[[0, 2, 4, 6], [4, 6, 8, 10], [0, 2, 4, 6], [4, 6, 8, 10], [0, 2, 4, 6], [4, 6, 8]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 0, x: row[i], y: y });
			});
			/* Z1: piano su tutte le righe interne */
			[[4, 6], [4, 6], [4, 6], [4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 1, x: row[i], y: y + 1 });
			});
			/* Z2: secondo piano (sopra Z1) */
			[[4, 6], [4, 6]].forEach(function (row, y) {
				for (var i = 0; i < row.length; i++) pts.push({ z: 2, x: row[i], y: y + 2 });
			});
			/* Z3: vertice (poggia su Z2 x4,y3) */
			pts.push({ z: 3, x: 4, y: 3 });
			return pts; // 23 + 8 + 4 + 1 = 36
		}
	},

	'rings': {
		/* DOPPIO ANELLO: due cornici quadrate rialzate (in alto a
		   sinistra e in basso a destra) su base piena + angoli
		   marcati. Solo FULL (la base piena dà supporto ovunque). */
		'small': function () {
			var pts = [];
			/* Z0: base solida 4×4 */
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* Z1: anello A 2×2 (x0..2, y0..1) + anello B 2×2 (x4..6, y2..3) */
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
			/* Z3: vertici gemelli (parità pari) */
			pts.push({ z: 3, x: 0, y: 0 }, { z: 3, x: 6, y: 3 });
			return pts; // 16 + 8 + 2 + 2 = 28
		},
		'medium': function () {
			var pts = [];
			/* Z0: base solida 6×6 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* Z1: anello A (cornice 3×4, x0..4, y0..3) */
			for (var xa = 0; xa <= 4; xa += 2) {
				pts.push({ z: 1, x: xa, y: 0 });
				pts.push({ z: 1, x: xa, y: 3 });
			}
			for (var ya = 1; ya < 3; ya++) {
				pts.push({ z: 1, x: 0, y: ya });
				pts.push({ z: 1, x: 4, y: ya });
			}
			/* Z1: anello B (cornice 3×4, x6..10, y2..5) */
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
			/* Z3: vertici gemelli (parità pari) */
			pts.push({ z: 3, x: 0, y: 0 }, { z: 3, x: 10, y: 5 });
			return pts; // 36 + 20 + 2 + 2 = 60
		}
	},

	'temple': {
		/* TEMPIO: base piena + sala interna rialzata + doppio tetto
		   spiovente (fronte/retro) con guglia centrale. Solo FULL.
		   Conteggi pari senza trim: small 38, medium 52. */
		'small': function () {
			var pts = [];
			/* Z0: base solida 5×5 */
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* Z1: colonne laterali (4) */
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
	   Tutte le tile sono FULL e ogni tile a z>0 poggia su una tile piena
	   alla stessa (x,y) a z-1 (conteggi sempre pari). */

	'lotus': {
		/* LOTO: base piena 6×5 + corolla di petali rialzati attorno
		   al centro + cuore rialzato (2×2). */
		'small': function () {
			var pts = [];
			/* z0: base 6×5 (x 0..10, y 0..4) = 30 */
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: petali corona + centro */
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
			/* z1: corolla doppia (16) */
			[[2, 0], [6, 0], [2, 1], [4, 1], [6, 1], [2, 2], [6, 2], [2, 3], [6, 3], [2, 4], [4, 4], [6, 4], [2, 5], [6, 5], [4, 2], [4, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: cuore doppio (4) — v0.6.1: x=3 dispari non ha supporto
			   in z1 (tile solo su x pari). Usiamo le 4 celle intorno
			   al centro che esistono in z1: (2,2),(6,2),(2,3),(6,3). */
			pts.push({ z: 2, x: 2, y: 2 }, { z: 2, x: 6, y: 2 }, { z: 2, x: 2, y: 3 }, { z: 2, x: 6, y: 3 });
			return evenTrim(pts); // 36 + 16 + 4 = 56
		}
	},

	'sphinx': {
		/* SFINGE: corpo base + zampa-sfondo rialzato + testa che si
		   innalza al centro. */
		'small': function () {
			var pts = [];
			/* z0: base 6×6 = 36 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: "zampe" + corpo centrale */
			[[2, 1], [8, 1], [2, 4], [8, 4], [4, 2], [4, 3], [6, 2], [6, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: torace */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* z3: testa */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 4, y: 3 });
			return pts; // 36 + 8 + 2 + 2 = 48
		}
	},

	'crown': {
		/* CORONA: base piena 6×6 + punte alternate su due file. */
		'small': function () {
			var pts = [];
			/* z0: base 6×6 = 36 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: punte file 0 e 5 (6 ciascuna = 12) */
			for (var x1 = 0; x1 < 6; x1++) {
				pts.push({ z: 1, x: x1 * 2, y: 0 });
				pts.push({ z: 1, x: x1 * 2, y: 5 });
			}
			/* z2: punte intermedie (3+3 = 6) */
			pts.push({ z: 2, x: 2, y: 0 }, { z: 2, x: 6, y: 0 }, { z: 2, x: 10, y: 0 });
			pts.push({ z: 2, x: 2, y: 5 }, { z: 2, x: 6, y: 5 }, { z: 2, x: 10, y: 5 });
			return pts; // 36 + 12 + 6 = 54
		}
	},

	'galaxy': {
		/* GALASSIA: base piena + ammassi di stelle rialzati in gruppi
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
			/* z2: centri ammassi + supporti nucleo (v0.6.1: z3 deve
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
			/* z1: ammassi estesi + bracci */
			var b1 = [[2, 1], [4, 1], [2, 2], [4, 2], [6, 3], [8, 3], [6, 4], [8, 4],
			         [2, 5], [4, 5], [2, 6], [4, 6], [4, 3], [6, 5], [6, 2], [4, 4]];
			b1.forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: centri + bracci interni */
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
			/* z3: nucleo doppio (supportato da z2) */
			pts.push({ z: 3, x: 4, y: 3 }, { z: 3, x: 6, y: 4 }, { z: 3, x: 4, y: 4 }, { z: 3, x: 6, y: 3 });
			return pts; // 48 + 16 + 10 + 4 = 78
		}
	},

	'totem': {
		/* TOTEM: base piena + colonna centrale a 3 livelli. */
		'small': function () {
			var pts = [];
			/* z0: base 5×6 = 30 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: colonna larga 3×2 */
			[[2, 2], [4, 2], [6, 2], [2, 3], [4, 3], [6, 3]].forEach(function (c) {
				pts.push({ z: 1, x: c[0], y: c[1] });
			});
			/* z2: colonna stretta 1×2 */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* z3: vertice doppio */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 4, y: 3 });
			return pts; // 30 + 6 + 2 + 2 = 40
		},
		'medium': function () {
			var pts = [];
			/* z0: base 6×6 = 36 */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: colonna larga 3×3 + basi laterali */
			[[0, 1], [1 * 1, 1], [2, 2], [4, 2], [6, 2], [2, 3], [4, 3], [6, 3], [2, 4], [4, 4], [6, 4]].forEach(function (c) {
				pts.push({ z: 1, x: c[0] * (c[0] === 1 ? 2 : 1), y: c[1] });
			});
			/* z2: colonna stretta 1×2 */
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 4, y: 3 });
			/* z3: vertice doppio */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 36 + 11 + 2 + 2 = 51 → 50
		}
	},

	/* ============================================================
	   NUOVE FIGURE v0.8.3 — 9 layout (chalice, mushroom, ship,
	   anchor, windmill, harp, lyre, skyscraper, crane).
	   Regole fisiche rispettate: FULL a z>0 poggia su FULL identica
	   sotto; niente half nuove (rischio zero supporti).
	   ============================================================ */
	'chalice': {
		'small': function () {
			var pts = [];
			/* base larga (z0) + vasca rialzata (z1) sopra di essa */
			for (var y = 0; y < 2; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
				pts.push({ z: 1, x: 4, y: y }, { z: 1, x: 6, y: y });
			}
			/* fusto (z0) */
			for (var f = 0; f < 2; f++) pts.push({ z: 0, x: 4, y: f + 2 }, { z: 0, x: 6, y: f + 2 });
			/* piede (z0) */
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
			/* radici larghe (z0) */
			for (var y = 0; y < 3; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* gambo z1 + cappello z2 (allineati, poggiano corretti) */
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
			/* piede/collinetta ai lati (z0) */
			for (var s = 0; s < 3; s++) pts.push({ z: 0, x: 0, y: s }, { z: 0, x: 10, y: s });
			/* v0.9.2: dedupe — (0,0),(10,0),(0,1),(10,1) erano già nella
			   base 6×2 e venivano ripushate dalla collinetta. */
			return dedupePts(pts); // 22 uniche
		}
	},

	'ship': {
		'small': function () {
			var pts = [];
			/* chiglia + scafo + coperta (z0) */
			for (var c = 1; c < 5; c++) pts.push({ z: 0, x: c * 2, y: 4 });
			for (var s = 0; s < 6; s++) pts.push({ z: 0, x: s * 2, y: 3 });
			for (var d = 0; d < 6; d++) pts.push({ z: 0, x: d * 2, y: 2 });
			/* ponte rialzato z1 (poggia sulla coperta) */
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
			/* anello + asta (z0) */
			for (var a = 0; a < 5; a++) pts.push({ z: 0, x: a * 2, y: 0 });
			pts.push({ z: 0, x: 4, y: 1 }, { z: 0, x: 4, y: 2 });
			pts.push({ z: 0, x: 4, y: 3 }, { z: 0, x: 4, y: 4 });
			/* traversa */
			for (var t = 0; t < 6; t++) pts.push({ z: 0, x: t * 2, y: 5 });
			/* bracci */
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
			/* perno rialzato (poggia sulla pala centrale z0) */
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
			/* v0.9.2: dedupe — il centro (0,4,2) era pushato da diagonale A,
			   asse orizzontale e asse verticale → 3 tile nella stessa cella. */
			return dedupePts(pts); // 18 uniche
		}
	},

	'harp': {
		/* ARPA: colonna sinistra + braccio obliquo discendente + base
		   piena con corde interne. Solo FULL. */
		'small': function () {
			var pts = [];
			/* colonna sinistra (z0) */
			for (var y = 0; y < 5; y++) pts.push({ z: 0, x: 2, y: y });
			/* base piena (z0) */
			for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: 4 });
			/* braccio obliquo: diagonale verso il basso-destra */
			pts.push({ z: 0, x: 4, y: 3 }, { z: 0, x: 6, y: 2 }, { z: 0, x: 8, y: 1 });
			/* corda interna (z0) */
			pts.push({ z: 0, x: 4, y: 1 }, { z: 0, x: 4, y: 2 });
			/* v0.9.2: dedupe — (0,2,4) era nella colonna E nella base. */
			return evenTrim(dedupePts(pts)); // 15 uniche → 14
		},
		'medium': function () {
			var pts = [];
			/* colonna sinistra + base + braccio obliquo + corde doppie */
			for (var y = 0; y < 6; y++) pts.push({ z: 0, x: 2, y: y });
			for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: 5 });
			pts.push({ z: 0, x: 4, y: 4 }, { z: 0, x: 6, y: 3 }, { z: 0, x: 8, y: 2 }, { z: 0, x: 10, y: 1 });
			/* corde interne doppie */
			for (var y2 = 1; y2 < 5; y2++) {
				pts.push({ z: 0, x: 4, y: y2 });
				pts.push({ z: 0, x: 6, y: y2 });
			}
			/* v0.9.2: dedupe — (0,2,5) colonna+base, (0,6,3)/(0,4,4)
			   braccio+corde. */
			return evenTrim(dedupePts(pts)); // 21 uniche → 20
		}
	},

	'lyre': {
		/* LIRA: due bracci laterali + traversa + piede al centro.
		   v0.9.2: i bracci partono da y=1 così la traversa di y=0 non
		   duplica (0,0) e (8,0) — prima la stessa cella riceveva 2
		   tile → parità rotta e tile sovrapposte. Conteggi unici:
		   small 6+5+3+2=16, medium 8+5+3+4=20. */
		'small': function () {
			var pts = [];
			/* bracci (z0): y 1..3 (la traversa copre y=0) */
			for (var y = 1; y < 4; y++) {
				pts.push({ z: 0, x: 0, y: y });
				pts.push({ z: 0, x: 8, y: y });
			}
			/* traversa in alto (z0) */
			for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: 0 });
			/* base (z0) */
			for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 3 });
			/* piede (z0) */
			pts.push({ z: 0, x: 4, y: 4 }, { z: 0, x: 6, y: 4 });
			return evenTrim(pts); // 16 uniche
		},
		'medium': function () {
			var pts = [];
			/* bracci più lunghi (z0): y 1..4 */
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
		/* GRATTACIELO: torre centrata su base larga, 4 piani che si
		   restringono verso l'alto. Molte tile nascoste sotto → alto. */
		'small': function () {
			var pts = [];
			/* base larga 6×4 (z0) */
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* torre z1: 2×2 (x 4,6; y 1..2) */
			for (var y1 = 1; y1 < 3; y1++) {
				pts.push({ z: 1, x: 4, y: y1 }, { z: 1, x: 6, y: y1 });
			}
			/* torre z2: 2×2 (x 4,6; y 1..2) */
			for (var y2 = 1; y2 < 3; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* vertice z3 */
			pts.push({ z: 3, x: 4, y: 1 }, { z: 3, x: 4, y: 2 });
			return pts; // 24 + 4 + 4 + 2 = 34
		},
		'medium': function () {
			var pts = [];
			/* base larga 6×6 (z0) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* torre z1: 4×4 (x 2..8, y 1..4) */
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 2; x1 <= 8; x1 += 2) pts.push({ z: 1, x: x1, y: y1 });
			}
			/* torre z2: 2×3 (x 4,6; y 2..4) */
			for (var y2 = 2; y2 < 5; y2++) {
				pts.push({ z: 2, x: 4, y: y2 }, { z: 2, x: 6, y: y2 });
			}
			/* torre z3: 1×2 (x 4; y 3..4) */
			for (var y3 = 3; y3 < 5; y3++) pts.push({ z: 3, x: 4, y: y3 });
			/* antenna z4 */
			pts.push({ z: 4, x: 4, y: 3 });
			return pts; // 36 + 16 + 6 + 2 + 1 = 61
		}
	},

	'crane': {
		/* GRU (uccello): ali diagonali spiegate + corpo + collo/becco.
		   Tutto a z0 con un piccolo crest rialzato al centro. */
		'small': function () {
			var pts = [];
			/* ali spiegate (z0), simmetriche attorno a x=4 */
			pts.push({ z: 0, x: 0, y: 1 }, { z: 0, x: 2, y: 0 });
			pts.push({ z: 0, x: 8, y: 1 }, { z: 0, x: 6, y: 0 });
			/* corpo (z0) */
			for (var x = 1; x < 4; x++) pts.push({ z: 0, x: x * 2, y: 1 });
			for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 2 });
			/* collo + becco */
			pts.push({ z: 0, x: 2, y: 3 }, { z: 0, x: 2, y: 4 });
			/* coda */
			pts.push({ z: 0, x: 8, y: 2 });
			/* crest rialzato (poggia sul corpo z0) */
			pts.push({ z: 1, x: 4, y: 1 });
			return evenTrim(pts); // 4 + 6 + 2 + 1 + 1 = 14 → 14
		},
		'medium': function () {
			var pts = [];
			/* ali più lunghe */
			pts.push({ z: 0, x: 0, y: 2 }, { z: 0, x: 2, y: 1 }, { z: 0, x: 0, y: 1 });
			pts.push({ z: 0, x: 8, y: 2 }, { z: 0, x: 6, y: 1 }, { z: 0, x: 10, y: 1 });
			/* corpo allungato */
			for (var x = 1; x < 5; x++) pts.push({ z: 0, x: x * 2, y: 2 });
			for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 3 });
			/* collo lungo + testa */
			pts.push({ z: 0, x: 2, y: 4 }, { z: 0, x: 2, y: 5 }, { z: 0, x: 4, y: 5 });
			/* coda */
			pts.push({ z: 0, x: 8, y: 3 });
			/* crest doppio rialzato */
			pts.push({ z: 1, x: 4, y: 2 }, { z: 1, x: 6, y: 2 });
			/* v0.9.2: dedupe — (0,8,2) era nell'ala destra E nel corpo. */
			return dedupePts(pts); // 18 uniche
		}
	},

	'temple_steps': {
		/* v0.9.2 — STACKING CLASSICO A OFFSET (ziggurat). Ogni piano è
		   CENTRATO e si appoggia sull'INCROCIO del piano sotto. Le HALF
		   del piano 1 partono dalla FILA 0 della base → tagliano a metà
		   la prima fila del piano base (niente "fluttuazione" / file
		   intere sotto le half), mentre le righe inferiori della base
		   restano intere come zoccolo stabile → bordi liberi e abbinabili.
		     z0 FULL (x pari)            base griglia
		     z1 HALF (x dispari)         da y=0 in giù, incroci delle FULL
		     z2 FULL (x pari)            incroci delle HALF, centrato
		   Conteggi multipli di 4: small 24, medium 40, large 52. */
		'small': function () {
			var pts = [];
			/* z0: FULL 4×4 (x 0..6, y 0..3) */
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: HALF 3×2 a partire da y=0 (tagliano a metà la fila 0):
			   half y0 poggia su FULL y0,y1; half y1 su FULL y1,y2 */
			for (var y1 = 0; y1 < 2; y1++) {
				for (var x1 = 1; x1 <= 5; x1 += 2) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
			}
			/* z2: FULL 2×1 (incroci delle half) */
			pts.push({ z: 2, x: 2, y: 0 }, { z: 2, x: 4, y: 0 });
			return pts; // 16 + 6 + 2 = 24
		},
		'medium': function () {
			var pts = [];
			/* z0: FULL 5×5 (x 0..8, y 0..4) */
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: HALF 4×3 a partire da y=0 (tagliano la fila 0):
			   half y0→FULL y0,1; y1→1,2; y2→2,3 — fila y4 zoccolo.
			   Le HALF y0 sono SEMPRE libere (nessun piano sopra) e le
			   FULL z0 dei bordi laterali lo sono altrettanto, quindi ci
			   sono abbastanza tile libere abbinabili (livello giocabile). */
			for (var y1 = 0; y1 < 3; y1++) {
				for (var x1 = 1; x1 <= 7; x1 += 2) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
			}
			/* z2: FULL 3×1 centrato (full x2,4,6 a y1 su half y1,y2) */
			for (var x2 = 2; x2 <= 6; x2 += 2) pts.push({ z: 2, x: x2, y: 1 });
			return pts; // 25 + 12 + 3 = 40
		},
		'large': function () {
			var pts = [];
			/* z0: FULL 6×6 (x 0..10, y 0..5) */
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			/* z1: HALF 5×3 a partire da y=0 (tagliano la fila 0):
			   half y0→FULL y0,1; y1→1,2; y2→2,3 — y4,y5 zoccolo */
			for (var y1 = 0; y1 < 3; y1++) {
				for (var x1 = 1; x1 <= 9; x1 += 2) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
			}
			/* z2: FULL 4×1 (x2,4,6,8 a y1, sugli incroci delle half y1,y2) */
			for (var x2 = 2; x2 <= 8; x2 += 2) pts.push({ z: 2, x: x2, y: 1 });
			/* z3: apice (poggia sulla full x4,y1) */
			pts.push({ z: 3, x: 4, y: 1 });
			return pts; // 36 + 15 + 4 + 1 = 56
		}
	}
};
