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
	/* SVG tile sets (riichi-mahjong-tiles). The "symbols" are the
	   base SVG filenames (Man1..Sou9, Ton/ Nan/Shaa/Pei, Chun/Haku/
	   Hatsu) plus the 4 bonus for flower/season if needed. game.js
	   renders these as <img> with src assets/<variant>/<name>.svg. */
	/* SVGs interleaved by family (Man → Pin → Sou → winds → dragons):
	   in QUAD mode only a few symbols are used per level, so alternating
	   families keeps the board varied (character tiles alone all look
	   like "letters" to a western player). */
	'classic': ['Man1', 'Pin1', 'Sou1', 'Man2', 'Pin2', 'Sou2', 'Man3', 'Pin3', 'Sou3',
	            'Man4', 'Pin4', 'Sou4', 'Man5', 'Pin5', 'Sou5', 'Man6', 'Pin6', 'Sou6',
	            'Man7', 'Pin7', 'Sou7', 'Man8', 'Pin8', 'Sou8', 'Man9', 'Pin9', 'Sou9',
	            'Ton', 'Nan', 'Shaa', 'Pei', 'Chun', 'Haku', 'Hatsu'],
	'classic-dark': ['Man1', 'Pin1', 'Sou1', 'Man2', 'Pin2', 'Sou2', 'Man3', 'Pin3', 'Sou3',
	                 'Man4', 'Pin4', 'Sou4', 'Man5', 'Pin5', 'Sou5', 'Man6', 'Pin6', 'Sou6',
	                 'Man7', 'Pin7', 'Sou7', 'Man8', 'Pin8', 'Sou8', 'Man9', 'Pin9', 'Sou9',
	                 'Ton', 'Nan', 'Shaa', 'Pei', 'Chun', 'Haku', 'Hatsu'],
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
			return evenTrim(pts); // 42 + 24 perim + 7 piatt + 6 mura + 3 pill = 82 → 82
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
			return evenTrim(pts); // 48+28+15+12 = 103 → 102
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
			for (var xm2 = 2; xm2 < 5; xm2++) pts.push({ z: 2, x: xm2 * 2, y: 2 });
			return pts; // 24 base + 12 torri + 8 torri2 + 3 ponte + 3 ponte2 = 50
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
			return evenTrim(pts); // 48 + 24 + 20 + 6 + 1 = 99
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
			return evenTrim(pts); // 42 + 31 + 3 = 76
		},
		'medium': function () {
			/* ELICA grande: base piena 6×9 + bande diagonali lunghe. */
			var pts = [];
			/* layer 0: base piena 6×9 (y 0..8) */
			for (var by = 0; by < 9; by++) {
				for (var bx = 0; bx < 6; bx++) pts.push({ z: 0, x: bx * 2, y: by });
			}
			/* layer 1: banda ↘ estesa (6 gradini + riempitivi) */
			for (var i = 0; i < 6; i++) {
				pts.push({ z: 1, x: i * 2, y: i });
				pts.push({ z: 1, x: i * 2, y: i + 1 });
				pts.push({ z: 1, x: (i + 1) * 2, y: i + 1 });
				pts.push({ z: 1, x: i * 2, y: i + 2 });
			}
			/* layer 1: banda ↗ estesa */
			for (var j = 0; j < 6; j++) {
				pts.push({ z: 1, x: j * 2, y: 8 - j });
				pts.push({ z: 1, x: j * 2, y: 7 - j });
				pts.push({ z: 1, x: (j + 1) * 2, y: 7 - j });
				pts.push({ z: 1, x: j * 2, y: 6 - j });
			}
			/* layer 2-3: incrocio centrale */
			pts.push({ z: 2, x: 4, y: 4 }, { z: 2, x: 6, y: 4 });
			pts.push({ z: 2, x: 4, y: 5 }, { z: 2, x: 6, y: 5 });
			pts.push({ z: 3, x: 6, y: 4 });
			return evenTrim(pts); // 54 + 48 + 5 = 107 → 106
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

var STEP_RANGES = buildStepRanges(50);

var ORDERED_STEPS = [
	/* covered = NUMERO DI TILE COPERTE VISIBILI (da v0.4.0: una sola
	   tile per coppia è coperta, la gemella è scoperta).
	   quads = ogni simbolo ha 4 copie (2 coppie) — devi ricordare
	   se una coppia è già uscita e la gemella è ancora in tavola.
	   NOTA: i set tematici (default/red/green/blue/gold/dark) restano
	   la norma; il set classic compare solo OGNI TANTO per non perdere
	   il look emoji carino.
	   v0.5.0: 50 step — 9 nuovi layout builder (pagoda, butterfly,
	   arrow, star, hourglass, castle, zigzag, rings, temple). */
	{ layout: 'dragon',      variant: 'small',  symSet: 'default', covered: 0, maxStaging: 4 },
	{ layout: 'cross',       variant: 'small',  symSet: 'red',     covered: 0, maxStaging: 4 },
	{ layout: 'pagoda',      variant: 'small',  symSet: 'blue',    covered: 2, maxStaging: 4 },
	{ layout: 'pyramid',     variant: 'small',  symSet: 'green',   covered: 2, maxStaging: 4 },
	{ layout: 'butterfly',   variant: 'small',  symSet: 'gold',    covered: 4, maxStaging: 4 },
	{ layout: 'turtle',      variant: 'small',  symSet: 'blue',    covered: 2, maxStaging: 4 },
	{ layout: 'arrow',       variant: 'small',  symSet: 'green',   covered: 4, maxStaging: 4 },
	{ layout: 'checker',     variant: 'small',  symSet: 'gold',    covered: 4, maxStaging: 4 },
	{ layout: 'halfcover',   variant: 'small',  symSet: 'dark',    covered: 4, maxStaging: 3 },
	{ layout: 'diamond',     variant: 'small',  symSet: 'default', covered: 4, maxStaging: 3 },
	{ layout: 'hourglass',   variant: 'small',  symSet: 'dark',    covered: 6, maxStaging: 3 },
	{ layout: 'cross',       variant: 'medium', symSet: 'red',     covered: 6, maxStaging: 3 },
	{ layout: 'pyramid_half', variant: 'small', symSet: 'green',   covered: 6, maxStaging: 3 },
	{ layout: 'star',        variant: 'small',  symSet: 'red',     covered: 6, maxStaging: 3 },
	{ layout: 'dragon',      variant: 'medium', symSet: 'blue',    covered: 6, maxStaging: 3 },
	{ layout: 'castle',      variant: 'small',  symSet: 'default', covered: 8, maxStaging: 3 },
	{ layout: 'labyrinth',   variant: 'small',  symSet: 'gold',    covered: 8, maxStaging: 3 },
	{ layout: 'bridge',      variant: 'small',  symSet: 'dark',    covered: 8, maxStaging: 3 },
	{ layout: 'pyramid',     variant: 'medium', symSet: 'default', covered: 8, maxStaging: 3 },
	{ layout: 'pagoda',      variant: 'medium', symSet: 'blue',    covered: 10, maxStaging: 3 },
	{ layout: 'spiral',      variant: 'small',  symSet: 'red',     covered: 10, maxStaging: 3 },
	{ layout: 'turtle',      variant: 'medium', symSet: 'green',   covered: 10, maxStaging: 3 },
	{ layout: 'diamond',     variant: 'medium', symSet: 'blue',    covered: 10, maxStaging: 3 },
	{ layout: 'butterfly',   variant: 'medium', symSet: 'gold',    covered: 12, maxStaging: 3 },
	{ layout: 'wall',        variant: 'medium', symSet: 'gold',    covered: 12, maxStaging: 3 },
	{ layout: 'helix',       variant: 'small',  symSet: 'dark',    covered: 12, maxStaging: 3 },
	{ layout: 'fortress',    variant: 'small',  symSet: 'default', covered: 12, maxStaging: 3 },
	{ layout: 'pyramid',     variant: 'large',  symSet: 'red',     covered: 14, maxStaging: 3 },
	{ layout: 'hourglass',   variant: 'medium', symSet: 'red',     covered: 14, maxStaging: 2 },
	{ layout: 'pyramid_half', variant: 'medium', symSet: 'green',  covered: 14, maxStaging: 3 },
	{ layout: 'labyrinth',   variant: 'medium', symSet: 'blue',    covered: 14, maxStaging: 2 },
	{ layout: 'arrow',       variant: 'medium', symSet: 'green',   covered: 14, maxStaging: 2 },
	{ layout: 'pyramid_half', variant: 'large', symSet: 'gold',    covered: 16, maxStaging: 2 },
	{ layout: 'pyramid_half', variant: 'xl',     symSet: 'dark',    covered: 16, maxStaging: 2 },
	{ layout: 'wall',        variant: 'large',  symSet: 'dark',    covered: 16, maxStaging: 2 },
	{ layout: 'wall',        variant: 'xl',     symSet: 'default', covered: 16, maxStaging: 2 },
	{ layout: 'star',        variant: 'medium', symSet: 'classic', covered: 4, maxStaging: 2 },
	{ layout: 'castle',      variant: 'small',  symSet: 'classic-dark', covered: 12, maxStaging: 2 },
	/* v0.5.0 — 3 nuovi layout figura (zigzag, rings, temple) */
	{ layout: 'zigzag',      variant: 'small',  symSet: 'dark',    covered: 4, maxStaging: 3 },
	{ layout: 'rings',       variant: 'small',  symSet: 'blue',    covered: 6, maxStaging: 3 },
	{ layout: 'temple',      variant: 'small',  symSet: 'gold',    covered: 6, maxStaging: 3 },
	{ layout: 'zigzag',      variant: 'medium', symSet: 'dark',    covered: 8, maxStaging: 2 },
	{ layout: 'rings',       variant: 'medium', symSet: 'blue',    covered: 10, maxStaging: 2 },
	{ layout: 'temple',      variant: 'medium', symSet: 'gold',    covered: 12, maxStaging: 2 },
	/* QUAD MODE — mix: la maggior parte usa i temi, classic ogni tanto */
	{ layout: 'dragon',      variant: 'small',  symSet: 'red',     covered: 0, maxStaging: 4, quads: true },
	{ layout: 'cross',       variant: 'small',  symSet: 'classic', covered: 2, maxStaging: 4, quads: true },
	{ layout: 'pyramid',     variant: 'small',  symSet: 'green',   covered: 4, maxStaging: 4, quads: true },
	{ layout: 'turtle',      variant: 'small',  symSet: 'classic', covered: 4, maxStaging: 3, quads: true },
	{ layout: 'labyrinth',   variant: 'small',  symSet: 'blue',    covered: 6, maxStaging: 3, quads: true },
	{ layout: 'spiral',      variant: 'small',  symSet: 'gold',    covered: 8, maxStaging: 3, quads: true }
];

/* Holds the level definition last generated — game.js reads
   maxStaging from here when starting a level. */
var LAST_LEVEL_DEF = null;

/* ============================================================
   DIFFICOLTÀ (v0.5.0) — computeDifficulty() dà un punteggio
   oggettivo ad ogni combinazione layout×variante, calcolato su
   parametri geometrici (non dipende dal shuffle):
     - tileCount : più tile = più lungo
     - maxZ      : più livelli = più tile nascoste
     - blocked   : tile a bordo con entrambi i lati occupati
     - covered   : tile coperte visibili (memoria)
   Base 0..100 divisa in: piccola (0-24), media (25-49),
   grande (50-74), molto grande (75-100).
   ============================================================ */
function computeDifficulty(layout, covered) {
	var byZ = {}, maxZ = 0;
	for (var i = 0; i < layout.length; i++) {
		var z = layout[i].z;
		if (z > maxZ) maxZ = z;
		(byZ[z] = byZ[z] || []).push(layout[i]);
	}
	/* blocked: tile a z>0 o con vicino a sx E dx sulla stessa z */
	var blocked = 0;
	for (var j = 0; j < layout.length; j++) {
		var t = layout[j];
		blocked += (t.z > 0) ? 1 : 0;
	}
	var tilePart = Math.min(60, Math.round(layout.length * 60 / 108));
	var layerPart = Math.min(20, maxZ * 7);
	var coverPart = Math.min(15, covered * 3);
	var freePart = 0; /* stimato: più tile bloccate sopra → più chiuse */
	if (maxZ >= 3) freePart += 5;
	if (layout.length >= 80) freePart += 5;
	var score = tilePart + layerPart + coverPart + freePart;
	return Math.min(100, score);
}

/* ============================================================
   PROGRESSIONE AUTOMATICA (v0.5.0) — genera fino a 300 livelli.
   Per ogni livello: partiamo dagli step esistenti (ordine soft di
   difficoltà) e li ri-usiamo a difficoltà crescente, schedulando
   prima i più facili e aumentando covered/close fino al massimo.
   ============================================================ */
function buildProgression(count) {
	var out = [];
	/* pool: ogni step esistente, ripetuto più volte con difficoltà (covered) crescente */
	var pool = [];
	for (var i = 0; i < ORDERED_STEPS.length; i++) {
		var def = ORDERED_STEPS[i];
		for (var rep = 0; rep < 6; rep++) {
			pool.push({
				layout: def.layout,
				variant: def.variant,
				symSet: def.symSet,
				maxStaging: def.maxStaging || 4,
				quads: !!def.quads,
				coveredIdx: rep,
				slot: i
			});
		}
	}
	/* copriamo i livelli facendo girare il pool: i livelli 0..99 usano
	   coveredIdx 0..3, i successivi up a 5. */
	for (var n = 0; n < count; n++) {
		var item = pool[n % pool.length];
		/* covered: cresce col livello ma mai oltre il 40% delle coppie */
		var maxPairs = 8;
		var cov = Math.min(maxPairs, Math.floor((n / count) * maxPairs));
		var symSets = ['default', 'red', 'green', 'blue', 'gold', 'dark', 'classic', 'classic-dark'];
		var sym = symSets[(n + item.slot) % symSets.length];
		/* alterna alcune volte quad mode per livelli alti */
		if (n >= 250) item = { layout: item.layout, variant: item.variant, symSet: item.symSet, maxStaging: item.maxStaging, quads: !item.quads, slot: item.slot };
		out.push({
			layout: item.layout,
			variant: item.variant,
			symSet: sym,
			covered: cov,
			maxStaging: item.maxStaging,
			quads: item.quads,
			index: n + 1
		});
	}
	return out;
}

/* Genera la progressione completa una sola volta (lazy). */
var PROGRESSION = null;
function ensureProgression() {
	if (!PROGRESSION) PROGRESSION = buildProgression(300);
	return PROGRESSION;
}

function getLevelDef(index) {
	index = Math.max(0, Math.min(index, 299));
	var p = ensureProgression()[index];
	return {
		layout: p.layout,
		variant: p.variant,
		symSet: p.symSet,
		covered: p.covered,
		maxStaging: p.maxStaging || 4,
		quads: !!p.quads,
		min: p.index,
		max: p.index
	};
}

function generateLevel(levelIndex) {
	var level = getLevelDef(levelIndex);
	LAST_LEVEL_DEF = level;
	var chosen = LAYOUT_BUILDERS[level.layout][level.variant]();
	var layout = chosen.filter(function (p) { return p.y >= 0; });
	/* PHYSICS CHECK: every tile above layer 0 must have support below.
	   Logs offenders to console — the board still loads, but the
	   developer sees exactly which tiles were built floating. */
	if (typeof validateSupport === 'function') {
		var badSupport = validateSupport(layout);
		if (badSupport.length) {
			console.warn('[mahjong] ' + level.layout + '/' + level.variant +
				' has ' + badSupport.length + ' unsupported tiles:', badSupport);
		}
	}
	var fullSize = layout.length;

	/* IMPORTANT (v0.4.0 rebalance): use the FULL layout every time.
	   Trimming tiles with slice(0, N) destroyed the shapes — it cut
	   off upper layers and half-cover tiles, leaving only the dense
	   rectangular base. Difficulty comes from the shape/variant, not
	   from removing tiles. */
	/* QUAD MODE (v0.5.0): each symbol has FOUR copies (2 pairs) —
	   you must remember whether a pair already matched and the twin
	   pair is still on the board. Requires layout length divisible by 4. */
	var copiesPerSymbol = level.quads ? 4 : 2;
	var tileCount = fullSize;
	if (tileCount % copiesPerSymbol !== 0) tileCount -= (tileCount % copiesPerSymbol);
	if (layout.length > tileCount) {
		layout = layout.slice(0, tileCount);
	} else if ((layout.length % copiesPerSymbol) !== 0) {
		layout = layout.slice(0, layout.length - (layout.length % copiesPerSymbol));
	}

	var symbols = SYMBOL_SETS[level.symSet] || SYMBOL_SETS['default'];
	/* SVG tile sets: map the symbol to the bundled SVG file under
	   assets/regular (white tiles) or assets/black (dark tiles). */
	var svgDir = null;
	if (level.symSet === 'classic') svgDir = 'regular';
	else if (level.symSet === 'classic-dark') svgDir = 'black';
	var lastBest = null;
	var symbolsNeeded = Math.ceil(layout.length / copiesPerSymbol);

	for (var attempt = 0; attempt < 80; attempt++) {
		var rng = createRng(42 + attempt * 7 + levelIndex);
		var deck = [];
		for (var i = 0; i < symbolsNeeded; i++) {
			var sym = symbols[i % symbols.length];
			for (var copy = 0; copy < copiesPerSymbol; copy++) {
				if (deck.length < layout.length) deck.push(sym);
			}
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
				svg: svgDir ? 'assets/' + svgDir + '/' + deck[c] + '.svg' : null,
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

/* Cover numPairs SINGLE tiles (memory mechanic).
   IMPORTANT: only ONE tile per pair is covered — the twin stays
   face-up. This way a covered tile can match with its uncovered
   twin (or with another covered tile of the same symbol). */
function applyFaceDown(tiles, numPairs) {
	var done = 0;
	var guard = 0;
	while (done < numPairs && guard < 100) {
		guard++;
		var idx = Math.floor(Math.random() * tiles.length);
		if (tiles[idx].faceDown) continue;
		/* Only cover the selected tile; the matching tile remains visible. */
		tiles[idx].faceDown = true;
		done++;
	}
}
