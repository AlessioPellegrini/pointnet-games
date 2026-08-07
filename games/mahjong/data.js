/* ============================================================
   MAHJONG ARCADE — data.js
   Pure data: symbol sets, layout builders, level progression.
   No DOM access. Exposes globals used by engine.js / game.js.
   ============================================================ */

/* Symbols + RNG helpers */
var SYMBOLS = ['🀄', '🍀', '🌸', '🔥', '❄️', '💎', '⭐', '🌙', '☀️', '🍃', '💜', '🔷', '🍄', '🎈', '🌈', '🍕', '⚽', '🎲'];

function createRng(seed) {
	var s = seed >>> 0;
	return {
		next: function () {
			s = (s * 1664525 + 1013904223) >>> 0;
			return s / 4294967296;
		}
	};
}

function shuffle(arr, rng) {
	for (var i = arr.length - 1; i > 0; i--) {
		var j = Math.floor(rng.next() * (i + 1));
		var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
	}
	return arr;
}

/* ============================================================
   THEMED SYMBOL SETS — emoji groups by palette.
   Each set has 70 symbols so every layout (up to 130 tiles /
   65 pairs) has enough distinct faces without recycling.
   ============================================================ */
var SYMBOL_SETS = {
	'default': ['🀄', '🍀', '🌸', '🔥', '❄️', '💎', '⭐', '🌙', '☀️', '🍃', '💜', '🔷', '🍄', '🎈', '🌈', '🍕', '⚽', '🎲', '🐍', '🦋', '🌵', '🍇', '🐙', '🦄', '🍩', '🍪', '🧁', '🍭', '🎯', '🎮', '🎧', '📦', '🔔', '🎁', '🌈', '🦉', '🐢', '🐳', '🦩', '🌺', '🍁', '🌊', '⛰️', '🏝️', '🌋', '🏰', '🚀', '🛸', '⚓', '🎪', '🎨', '🎬', '🏮', '🔮', '⚡', '🌀', '💫', '✨', '☄️', '🪐', '🌌', '🫧', '🍉', '🍓', '🍊', '🥝', '🍌', '🥐', '🧀'],
	'red':     ['🍎', '🌹', '❤️', '🍒', '🦞', '🔴', '🐞', '🎒', '🍉', '🐙', '🧣', '🍅', '🌶️', '🎈', '🩸', '🧲', '💄', '🍓', '🧧', '🦀', '🍁', '🛑', '🔺', '🐦🔥', '🍑', '❤️‍🔥', '🧡', '🍗', '🥩', '🍷', '🎀', '👠', '🖍️', '🌹', '🌺', '🍄', '🦩', '🐟', '🦐', '🍆', '🍠', '🟥', '🥵', '🔥', '🏮', '🌋', '💖', '💃', '🚨', '🎇', '🧸', '🍬', '🍧', '🍎', '🥊', '♨️', '🍒', '🌸', '🫚', '🫒', '🦞', '🍁', '🫖', '🍇', '🍫', '🍭', '🍩'],
	'green':   ['🌿', '🦎', '💚', '🍏', '🦠', '🫑', '🐸', '🐢', '🥑', '🐲', '🌲', '🍀', '🧪', '🍐', '🦜', '🥦', '🐍', '🥒', '🌵', '🌱', '🦗', '🍈', '🍃', '🥬', '🌾', '🫛', '🥝', '🥭', '🍃', '🌳', '🎄', '🌴', '🍀', '☘️', '🧿', '🦖', '🦕', '🐊', '🦍', '🦜', '🍉', '🥒', '🍐', '🥦', '🫑', '🥑', '🍏', '🍵', '🥗', '🍃', '🌿', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🍀', '☘️', '🧫', '🦴', '🫘', '🫚', '🍜', '🥠', '🍃', '💶', '🧤', '🟢'],
	'blue':    ['🐟', '🌊', '💙', '🧢', '🦋', '🐳', '🔵', '🫐', '🧊', '🐬', '💧', '☂️', '🧤', '⚓', '🦈', '🥶', '💠', '🔷', '🌧️', '⛵', '🐧', '🧿', '🐋', '🦑', '🪼', '🐠', '🐡', '🦀', '🦞', '🐚', '🌌', '❄️', '☃️', '🛷', '⛄', '🧊', '💙', '🩵', '🚙', '✈️', '🛳️', '🚤', '🧜', '🧞', '🧝', '👻', '💤', '🌫️', '🌀', '🌊', '🌧️', '⛈️', '🌩️', '🫧', '💦', '🔹', '🔵', '💎', '🌐', '🧊', '🥛', '🍼', '🧂', '🫖', '🪣', '💧', '🌊'],
	'gold':    ['⭐', '👑', '🏆', '🔔', '💛', '🪙', '🍯', '🐝', '🌻', '⚜️', '🌟', '🤴', '👸', '💰', '🥇', '✨', '🔶', '🍋', '🦁', '🍞', '🌽', '🟡', '🍌', '🥭', '🍍', '🧀', '🫒', '🌾', '🐤', '🐥', '🦆', '🦢', '🦅', '🦉', '🦁', '🐯', '🐅', '🦁', '🎖️', '🏅', '🎗️', '🪗', '🪘', '🎺', '🎷', '🎸', '🎹', '🎻', '🥁', '🎤', '📯', '🪇', '🫙', '💡', '🏮', '🕯️', '🔆', '☀️', '🟨', '🟧', '🍟', '🍿', '🥞', '🧇', '🥜', '🌰', '🟡', '💫'],
	'dark':    ['🕷️', '🦇', '🌑', '🖤', '🐈', '🧛', '🕯️', '💀', '🪦', '🌘', '🦉', '⚫', '🌃', '🐉', '🔮', '🌫️', '🦂', '🥷', '🕸️', '😈', '🍆', '🦇', '🐺', '🐗', '🦡', '🐀', '🐍', '🦎', '🐸', '🦂', '🕷️', '🕸️', '👻', '💀', '☠️', '🧟', '🧙', '🧛', '🧝', '🧞', '⚰️', '⚱️', '🪦', '🌒', '🌓', '🌔', '🌖', '🌗', '🌘', '🌑', '🌚', '🪐', '☄️', '🛸', '👽', '🤖', '⚫', '🔘', '🕶️', '🖤', '💜', '🔮', '🪄', '🥷', '🌙', '✨', '🧿', '🪬']
};

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

var LAYOUT_BUILDERS = {
	'halfcover': {
		'small': function () {
			/* 4×4 base + 3×3 half-cover sopra (pattern completo) */
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 1; hy < 4; hy++) {
				for (var hx = 1; hx < 6; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			return evenTrim(pts); // 16+9 = 25 → 24
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 1; hy < 4; hy++) {
				for (var hx = 1; hx < 6; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			pts.push({ z: 0, x: 2, y: 5 });
			return pts; // 26
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
			return pts; // 21+8+1 = 30
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
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					if (Math.abs(y - 2) <= 1 || Math.abs(x - 2) <= 1) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y2 = 0; y2 < 4; y2++) {
				for (var x2 = 0; x2 < 4; x2++) pts.push({ z: 1, x: x2 * 2 + 2, y: y2 + 1 });
			}
			for (var y3 = 0; y3 < 2; y3++) {
				for (var x3 = 0; x3 < 2; x3++) pts.push({ z: 2, x: x3 * 2 + 4, y: y3 + 2 });
			}
			pts.push({ z: 3, x: 6, y: 3 });
			return pts; // 42
		},
		'xl': function () {
			var pts = [];
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) {
					if (x === 2 || x === 3 || y === 2 || y === 3) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y2 = 2; y2 < 6; y2++) {
				for (var x2 = 1; x2 < 5; x2++) pts.push({ z: 1, x: x2 * 2, y: y2 });
			}
			for (var y3 = 3; y3 < 5; y3++) {
				for (var x3 = 2; x3 < 4; x3++) pts.push({ z: 2, x: x3 * 2, y: y3 });
			}
			pts.push({ z: 3, x: 6, y: 3 }, { z: 3, x: 6, y: 4 });
			return pts; // 26+16+4+2 = 48
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
			pts.push({ z: 3, x: 6, y: 2 }, { z: 3, x: 6, y: 3 });
			return pts; // 62
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
			pts.push({ z: 2, x: 2, y: 3 }, { z: 2, x: 8, y: 3 }, { z: 2, x: 2, y: 4 }, { z: 2, x: 8, y: 4 });
			return pts; // 48+20+8 = 76
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
			/* Anello 6×6 vuoto al centro + testa + coda + zampe.
			   Coordinate tutte ≥ 0 (il filter p.y>=0 le mantiene). */
			var pts = [];
			/* carapace = anello (offset y=1 per lasciare spazio sotto) */
			for (var y = 1; y < 7; y++) {
				for (var x = 0; x < 6; x++) {
					if (y === 1 || y === 6 || x === 0 || x === 5) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			/* interno: 2×2 centrale su layer 1 */
			pts.push({ z: 1, x: 4, y: 3 }, { z: 1, x: 4, y: 4 }, { z: 1, x: 6, y: 3 }, { z: 1, x: 6, y: 4 });
			/* testa (3 tile a destra) */
			pts.push({ z: 0, x: 10, y: 2 }, { z: 0, x: 10, y: 3 }, { z: 0, x: 12, y: 3 });
			/* coda (sopra a sinistra) */
			pts.push({ z: 0, x: 2, y: 0 });
			/* zampe in basso */
			pts.push({ z: 0, x: 2, y: 7 }, { z: 0, x: 8, y: 7 });
			return evenTrim(pts); // 20 anello+4+3+1+2 = 30
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
			/* Rombo 7×7: 1,3,5,7,5,3,1 + interno 1,3,1 */
			var pts = [];
			var w = [1, 3, 5, 7, 5, 3, 1];
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
			return evenTrim(pts); // 25+5+1 = 31 → 30
		},
		'medium': function () {
			var pts = [];
			var base = [[1, 0], [3, 1], [5, 2], [7, 3], [5, 4], [3, 5], [1, 6]];
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
			pts.push({ z: 2, x: 6, y: 2 }, { z: 2, x: 6, y: 3 }, { z: 2, x: 4, y: 3 });
			return evenTrim(pts); // 25+8+3 = 36 → 36
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
		'medium': function () {
			/* Muro con finestre: griglia a scacchiera con buchi
			   (celle (x+y) dispari vuote) + mattoni sfalsati sopra. */
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 6; x++) {
					if ((x + y) % 2 === 0) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y1 = 0; y1 < 3; y1++) {
				for (var x1 = 0; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2 + 2, y: y1 + 1 });
			}
			pts.push({ z: 2, x: 4, y: 1 }, { z: 2, x: 6, y: 1 }, { z: 2, x: 8, y: 1 });
			return evenTrim(pts); // 15+12+3 = 30
		},
		'large': function () {
			var pts = [];
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) {
					if ((x + y) % 2 === 0) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y1 = 0; y1 < 5; y1++) {
				for (var x1 = 0; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2 + 2, y: y1 + 1 });
			}
			for (var y2 = 1; y2 < 4; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			return evenTrim(pts); // 21+20+4 = 45 → 44
		},
		'xl': function () {
			var pts = [];
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) {
					if ((x + y) % 2 === 0) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y1 = 0; y1 < 7; y1++) {
				for (var x1 = 0; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2 + 2, y: y1 + 1 });
			}
			for (var y2 = 1; y2 < 5; y2++) {
				for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 6, y: 2 }, { z: 3, x: 6, y: 3 });
			return evenTrim(pts); // 27+28+6+3 = 64
		}
	},

	'labyrinth': {
		'small': function () {
			/* Serpentina: 5 righe piene alternate + corridoi ai lati. */
			var pts = [];
			for (var x0 = 0; x0 < 6; x0++) pts.push({ z: 0, x: x0 * 2, y: 0 });
			pts.push({ z: 0, x: 0, y: 1 }, { z: 0, x: 0, y: 2 });
			for (var x2 = 0; x2 < 6; x2++) pts.push({ z: 0, x: x2 * 2, y: 3 });
			pts.push({ z: 0, x: 10, y: 4 }, { z: 0, x: 10, y: 5 });
			for (var x5 = 0; x5 < 6; x5++) pts.push({ z: 0, x: x5 * 2, y: 6 });
			/* copertura sopra i corridoi */
			for (var x1 = 2; x1 < 11; x1 += 2) pts.push({ z: 1, x: x1, y: 0 });
			for (var y2 = 1; y2 < 3; y2++) pts.push({ z: 1, x: 2, y: y2 }, { z: 1, x: 4, y: y2 });
			for (var x3 = 2; x3 < 10; x3 += 2) pts.push({ z: 1, x: x3, y: 3 });
			return evenTrim(pts); // 22 base + 13 = 35 → 34
		},
		'medium': function () {
			var pts = [];
			for (var x0 = 0; x0 < 6; x0++) pts.push({ z: 0, x: x0 * 2, y: 0 });
			pts.push({ z: 0, x: 0, y: 1 }, { z: 0, x: 0, y: 2 });
			for (var x2 = 0; x2 < 6; x2++) pts.push({ z: 0, x: x2 * 2, y: 3 });
			pts.push({ z: 0, x: 10, y: 4 }, { z: 0, x: 10, y: 5 });
			for (var x5 = 0; x5 < 6; x5++) pts.push({ z: 0, x: x5 * 2, y: 6 });
			/* layer 1 sopra la serpentina */
			for (var x1 = 2; x1 < 11; x1 += 2) pts.push({ z: 1, x: x1, y: 0 });
			for (var y2 = 1; y2 < 3; y2++) pts.push({ z: 1, x: 2, y: y2 }, { z: 1, x: 4, y: y2 });
			for (var x3 = 2; x3 < 10; x3 += 2) pts.push({ z: 1, x: x3, y: 3 });
			return evenTrim(pts); // 22 base + 13 = 35 → 34
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
			/* Scacchiera VERA 6×6: layer 0 su celle alternate,
			   layer 1 half-cover sopra i buchi alternati. */
			var pts = [];
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 6; x++) {
					if ((x + y) % 2 === 0) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			/* half-cover sopra ogni buco (alternato). Partono da y=1:
			   su y=0 sforerebbero sopra il tabellone (shiftY=STEP_Y/2). */
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 1; x1 < 10; x1 += 2) {
					if ((x1 + y1) % 2 === 0) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
				}
			}
			return evenTrim(pts); // 18 layer0 + 9 layer1 = 27 → 26
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) {
					if ((x + y) % 2 === 0) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y1 = 0; y1 < 6; y1++) {
				for (var x1 = 1; x1 < 10; x1 += 2) {
					if ((x1 + y1) % 2 === 0) pts.push({ z: 1, x: x1, y: y1, isHalf: true });
				}
			}
			return evenTrim(pts); // 21 layer0 + 12 layer1 = 33 → 32
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
			/* ponte laterale centrale */
			pts.push({ z: 1, x: 4, y: 0 }, { z: 1, x: 4, y: 1 });
			return evenTrim(pts); // 12 base + 8 layer1 + 5 ponte + 2 = 27 → 26
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
			for (var xm2 = 2; xm2 < 5; xm2++) pts.push({ z: 2, x: xm2 * 2, y: 2 });
			return pts; // 24 base + 12 torri + 8 torri2 + 3 ponte + 3 ponte2 = 50
		}
	},

	'spiral': {
		'small': function () {
			/* Spirito GUIDATO dall'utente: base piena 6×6 su layer 0
			   (supporto universale) + percorso a spirale disegnato sui
			   layer 1-2 con tile rialzate → la figura spicca in 3D. */
			var pts = [];
			/* layer 0: base piena 6×6 */
			for (var by = 0; by < 6; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: anello esterno a spirale (perimetro 6×6) */
			for (var x0 = 0; x0 < 6; x0++) pts.push({ z: 1, x: x0 * 2, y: 0 });
			for (var y1 = 1; y1 < 6; y1++) {
				pts.push({ z: 1, x: 0, y: y1 }, { z: 1, x: 10, y: y1 });
			}
			/* giro interno a spirale (perimetro 4×4) */
			for (var x2 = 2; x2 < 10; x2 += 2) pts.push({ z: 1, x: x2, y: 5 });
			/* layer 2: giro interno 3×3 + centro */
			for (var x3 = 2; x3 < 8; x3 += 2) pts.push({ z: 2, x: x3, y: 1 });
			for (var y4 = 2; y4 < 5; y4++) {
				pts.push({ z: 2, x: 2, y: y4 }, { z: 2, x: 6, y: y4 });
			}
			/* centro rialzato layer 3 */
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 36 base + 20 anello + 4 giro2 + 10 + 2 = 72
		},
		'medium': function () {
			var pts = [];
			/* anello esterno */
			for (var x0 = 0; x0 < 5; x0++) pts.push({ z: 0, x: x0 * 2, y: 0 });
			for (var y1 = 1; y1 < 8; y1++) pts.push({ z: 0, x: 8, y: y1 });
			for (var x2 = 4; x2 >= 0; x2--) pts.push({ z: 0, x: x2 * 2, y: 7 });
			for (var y2 = 6; y2 >= 1; y2--) pts.push({ z: 0, x: 0, y: y2 });
			/* secondo giro */
			for (var x3 = 2; x3 < 6; x3 += 2) pts.push({ z: 0, x: x3, y: 1 });
			for (var y3 = 2; y3 < 7; y3++) pts.push({ z: 0, x: 6, y: y3 });
			for (var x4 = 4; x4 >= 2; x4 -= 2) pts.push({ z: 0, x: x4, y: 6 });
			/* terzo giro parziale + centro */
			for (var y4 = 5; y4 >= 2; y4--) pts.push({ z: 0, x: 2, y: y4 });
			pts.push({ z: 0, x: 4, y: 3 });
			/* layer superiore al centro */
			for (var y5 = 2; y5 < 4; y5++) pts.push({ z: 1, x: 4, y: y5 });
			pts.push({ z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 }, { z: 2, x: 4, y: 2 });
			return evenTrim(pts); // 32 layer0 + 5 = 37 → 36
		}
	},

	'helix': {
		'small': function () {
			/* X-CROCE DENSA: colonna verticale larga 2 × 7 righe +
			   riga orizzontale larga 2 × 7 colonne, incrociate al centro.
			   Tutte le tile si toccano → forma "+" immediatamente visibile. */
			var pts = [];
			/* colonna verticale (x=4,6; y 0..6) */
			for (var y = 0; y < 7; y++) {
				pts.push({ z: 0, x: 4, y: y }, { z: 0, x: 6, y: y });
			}
			/* riga orizzontale (x 0..12 a step 2; y=2,4) */
			for (var x = 0; x < 7; x++) {
				pts.push({ z: 0, x: x * 2, y: 2 }, { z: 0, x: x * 2, y: 4 });
			}
			/* centro rialzato (layer 1-2) per dare profondità alla X */
			pts.push({ z: 1, x: 4, y: 3 }, { z: 1, x: 6, y: 3 }, { z: 2, x: 4, y: 3 }, { z: 2, x: 6, y: 3 });
			return evenTrim(pts); // 14 + 14 = 28
		},
		'medium': function () {
			var pts = [];
			/* diagonale ↘ estesa */
			for (var i = 0; i < 7; i++) pts.push({ z: 0, x: i * 2, y: i });
			/* diagonale ↗ estesa */
			for (var j = 0; j < 7; j++) pts.push({ z: 0, x: j * 2, y: 6 - j });
			/* braccia secondarie per dare spessore alla X */
			pts.push({ z: 0, x: 0, y: 1 }, { z: 0, x: 1, y: 0 },
			          { z: 0, x: 6, y: 1 }, { z: 0, x: 7, y: 0 });
			pts.push({ z: 0, x: 0, y: 5 }, { z: 0, x: 1, y: 6 },
			          { z: 0, x: 6, y: 5 }, { z: 0, x: 7, y: 6 });
			/* nodi half-cover agli incroci interni */
			for (var hy = 1; hy < 6; hy++) {
				for (var hx = 1; hx < 8; hx += 2) {
					if ((hx + hy) % 2 === 0) pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			/* centro a doppio strato */
			pts.push({ z: 1, x: 6, y: 3 }, { z: 2, x: 6, y: 3 });
			return evenTrim(pts); // 22 layer0 + 9 + 2 = 33 → 32
		}
	}
};

/* ============================================================
   LEVEL CONFIGURATION — ORDERED_STEPS is the global 1→100
   progression (v0.4.0: 25 steps × 4 levels). Each step:
   { layout, variant, symSet, covered, maxStaging }
   Levels do NOT follow shapes: each step holds 4 levels with a
   progressive tile count (75%→100% of the variant).
   ============================================================ */
function buildStepRanges(count) {
	var ranges = [];
	for (var i = 0; i < count; i++) {
		ranges.push({
			min: Math.floor(i * 100 / count) + 1,
			max: Math.floor((i + 1) * 100 / count)
		});
	}
	return ranges;
}

var STEP_RANGES = buildStepRanges(26);

var ORDERED_STEPS = [
	{ layout: 'dragon',      variant: 'small',  symSet: 'default', covered: 0, maxStaging: 4 },
	{ layout: 'cross',       variant: 'small',  symSet: 'red',     covered: 0, maxStaging: 4 },
	{ layout: 'pyramid',     variant: 'small',  symSet: 'green',   covered: 1, maxStaging: 4 },
	{ layout: 'turtle',      variant: 'small',  symSet: 'blue',    covered: 1, maxStaging: 4 },
	{ layout: 'checker',     variant: 'small',  symSet: 'gold',    covered: 2, maxStaging: 4 },
	{ layout: 'halfcover',   variant: 'small',  symSet: 'dark',    covered: 2, maxStaging: 3 },
	{ layout: 'diamond',     variant: 'small',  symSet: 'default', covered: 2, maxStaging: 3 },
	{ layout: 'cross',       variant: 'medium', symSet: 'red',     covered: 3, maxStaging: 3 },
	{ layout: 'pyramid_half', variant: 'small', symSet: 'green',   covered: 3, maxStaging: 3 },
	{ layout: 'dragon',      variant: 'medium', symSet: 'blue',    covered: 3, maxStaging: 3 },
	{ layout: 'labyrinth',   variant: 'small',  symSet: 'gold',    covered: 4, maxStaging: 3 },
	{ layout: 'bridge',      variant: 'small',  symSet: 'dark',    covered: 4, maxStaging: 3 },
	{ layout: 'pyramid',     variant: 'medium', symSet: 'default', covered: 4, maxStaging: 3 },
	{ layout: 'spiral',      variant: 'small',  symSet: 'red',     covered: 5, maxStaging: 3 },
	{ layout: 'turtle',      variant: 'medium', symSet: 'green',   covered: 5, maxStaging: 3 },
	{ layout: 'diamond',     variant: 'medium', symSet: 'blue',    covered: 5, maxStaging: 3 },
	{ layout: 'wall',        variant: 'medium', symSet: 'gold',    covered: 6, maxStaging: 3 },
	{ layout: 'helix',       variant: 'small',  symSet: 'dark',    covered: 6, maxStaging: 3 },
	{ layout: 'fortress',    variant: 'large',  symSet: 'default', covered: 6, maxStaging: 3 },
	{ layout: 'pyramid',     variant: 'large',  symSet: 'red',     covered: 7, maxStaging: 3 },
	{ layout: 'pyramid_half', variant: 'medium', symSet: 'green',  covered: 7, maxStaging: 3 },
	{ layout: 'labyrinth',   variant: 'medium', symSet: 'blue',    covered: 7, maxStaging: 2 },
	{ layout: 'pyramid_half', variant: 'large', symSet: 'gold',    covered: 8, maxStaging: 2 },
	{ layout: 'pyramid_half', variant: 'xl',     symSet: 'dark',    covered: 8, maxStaging: 2 },
	{ layout: 'wall',        variant: 'large',  symSet: 'dark',    covered: 8, maxStaging: 2 },
	{ layout: 'wall',        variant: 'xl',     symSet: 'default', covered: 8, maxStaging: 2 }
];

/* Holds the level definition last generated — game.js reads
   maxStaging from here when starting a level. */
var LAST_LEVEL_DEF = null;

function getLevelDef(index) {
	index = Math.min(index, 99);
	for (var i = 0; i < STEP_RANGES.length; i++) {
		if (index + 1 >= STEP_RANGES[i].min && index + 1 <= STEP_RANGES[i].max) {
			var def = ORDERED_STEPS[i];
			return {
				layout: def.layout,
				variant: def.variant,
				symSet: def.symSet,
				covered: def.covered,
				maxStaging: def.maxStaging || 4,
				min: STEP_RANGES[i].min,
				max: STEP_RANGES[i].max
			};
		}
	}
	var last = ORDERED_STEPS[ORDERED_STEPS.length - 1];
	return {
		layout: last.layout,
		variant: last.variant,
		symSet: last.symSet,
		covered: last.covered,
		maxStaging: last.maxStaging || 4,
		min: STEP_RANGES[STEP_RANGES.length - 1].min,
		max: 100
	};
}

function generateLevel(levelIndex) {
	var level = getLevelDef(levelIndex);
	LAST_LEVEL_DEF = level;
	var chosen = LAYOUT_BUILDERS[level.layout][level.variant]();
	var layout = chosen.filter(function (p) { return p.y >= 0; });
	var fullSize = layout.length;

	/* IMPORTANT (v0.4.0 rebalance): use the FULL layout every time.
	   Trimming tiles with slice(0, N) destroyed the shapes — it cut
	   off upper layers and half-cover tiles, leaving only the dense
	   rectangular base. Difficulty comes from the shape/variant, not
	   from removing tiles. */
	var tileCount = fullSize;
	if (tileCount % 2 !== 0) tileCount--;
	if (layout.length > tileCount) {
		layout = layout.slice(0, tileCount);
	} else if ((layout.length % 2) !== 0) {
		layout = layout.slice(0, layout.length - 1);
	}

	var symbols = SYMBOL_SETS[level.symSet] || SYMBOL_SETS['default'];
	var lastBest = null;
	var symbolsNeeded = Math.ceil(layout.length / 2);

	for (var attempt = 0; attempt < 80; attempt++) {
		var rng = createRng(42 + attempt * 7 + levelIndex);
		var deck = [];
		for (var i = 0; i < symbolsNeeded; i++) {
			var sym = symbols[i % symbols.length];
			deck.push(sym);
			if (deck.length < layout.length) deck.push(sym);
		}
		shuffle(deck, rng);

		var tiles = [];
		for (var c = 0; c < layout.length; c++) {
			var co = layout[c];
			tiles.push({
				z: co.z,
				x: co.x,
				y: co.y,
				isHalf: !!co.isHalf,
				symbol: deck[c],
				label: c + 1,
				removed: false,
				staging: false,
				faceDown: false,
				hinted: false
			});
		}

		var board = buildBoard(tiles);
		var solvable = solveBoard(board);
		/* Heuristic fallback: if the DFS timed out (or is just too
		   strict for dense boards), accept when there are at least
		   4 free tiles — the staging box unlocks the rest. */
		if (solvable) {
			applyFaceDown(tiles, level.covered);
			return tiles;
		}
		if (!solvable) {
			var freeCount = 0;
			for (var f = 0; f < tiles.length; f++) {
				if (!tiles[f].removed && !tiles[f].staging && isFree(board, tiles[f])) freeCount++;
			}
			if (freeCount >= 4) {
				applyFaceDown(tiles, level.covered);
				return tiles;
			}
		}
		lastBest = tiles;
	}
	applyFaceDown(lastBest, level.covered);
	return lastBest;
}

/* Cover numPairs random pairs of tiles (memory mechanic) */
function applyFaceDown(tiles, numPairs) {
	var done = 0;
	var guard = 0;
	while (done < numPairs && guard < 50) {
		guard++;
		var idx = Math.floor(Math.random() * tiles.length);
		if (tiles[idx].faceDown) continue;
		var sym = tiles[idx].symbol;
		var pairIdx = -1;
		for (var i = 0; i < tiles.length; i++) {
			if (i !== idx && tiles[i].symbol === sym && !tiles[i].faceDown) {
				pairIdx = i;
				break;
			}
		}
		if (pairIdx !== -1) {
			tiles[idx].faceDown = true;
			tiles[pairIdx].faceDown = true;
			done++;
		}
	}
}