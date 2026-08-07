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
			var pts = [];
			for (var y = 0; y < 3; y++) {
				for (var x = 0; x < 3; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 1; hy < 3; hy++) {
				for (var hx = 1; hx < 4; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			return evenTrim(pts); // 13 → 12
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
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					if (x === 2 || y === 2) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			pts.push({ z: 1, x: 2, y: 2 }, { z: 1, x: 4, y: 2 }, { z: 1, x: 2, y: 3 });
			pts.push({ z: 2, x: 4, y: 2 }, { z: 2, x: 2, y: 3 });
			return pts; // 14
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
			var layers = [[3, 3], [2, 2], [1, 1]];
			for (var z = 0; z < layers.length; z++) {
				var w = layers[z][0], h = layers[z][1];
				var ox = Math.round((3 - w) / 2), oy = Math.round((3 - h) / 2);
				for (var y = 0; y < h; y++) {
					for (var x = 0; x < w; x++) pts.push({ z: z, x: (x + ox) * 2, y: y + oy });
				}
			}
			return pts; // 14
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
			var pts = [];
			for (var x0 = 0; x0 < 4; x0++) pts.push({ z: 0, x: x0 * 2, y: 0 });
			for (var x1 = 1; x1 < 3; x1++) pts.push({ z: 0, x: x1 * 2, y: 1 });
			for (var x2 = 0; x2 < 4; x2++) pts.push({ z: 0, x: x2 * 2, y: 2 });
			for (var x3 = 1; x3 < 3; x3++) pts.push({ z: 0, x: x3 * 2, y: 3 });
			for (var yz = 1; yz < 3; yz++) {
				for (var xz = 1; xz < 3; xz++) pts.push({ z: 1, x: xz * 2, y: yz });
			}
			return pts; // 16
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
			var pts = [];
			for (var y = 0; y < 3; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 3; y1++) {
				for (var x1 = 1; x1 < 3; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			pts.push({ z: 1, x: 6, y: 1 });             // head
			pts.push({ z: 0, x: 2, y: 3 });             // tail
			pts.push({ z: 0, x: 0, y: 3 }, { z: 0, x: 6, y: 3 }); // front legs
			return pts; // 20
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
			var pts = [];
			for (var y = 0; y < 3; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 3; y1++) {
				for (var x1 = 1; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 3; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			return pts; // 12+6+4 = 22
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 3; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 3, x: 6, y: 2 });
			return evenTrim(pts); // 24+12+4+1 = 41 → 40
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
			pts.push({ z: 3, x: 6, y: 2 });
			return evenTrim(pts); // 36+16+4+1 = 57 → 56
		}
	},

	'wall': {
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 4; y1++) {
				for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 3; y2++) {
				for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 3, x: 4, y: 1 });
			return evenTrim(pts); // 30+16+6+1 = 53 → 52
		},
		'large': function () {
			var pts = [];
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 6; y1++) {
				for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 4; y2++) {
				for (var x2 = 1; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			return evenTrim(pts); // 42+24+6 = 72 → 72
		},
		'xl': function () {
			var pts = [];
			for (var y = 0; y < 9; y++) {
				for (var x = 0; x < 6; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 8; y1++) {
				for (var x1 = 1; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 1; y2 < 6; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 3, x: 4, y: 2 }, { z: 3, x: 6, y: 3 }, { z: 3, x: 4, y: 4 });
			return evenTrim(pts); // 54+32+8+3 = 97 → 96
		}
	},

	'labyrinth': {
		'small': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x1 = 1; x1 < 3; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			return evenTrim(pts); // 16+4 = 20
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 6; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 1; y1 < 5; y1++) {
				for (var x1 = 1; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var y2 = 2; y2 < 4; y2++) {
				for (var x2 = 2; x2 < 3; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			return evenTrim(pts); // 30+12+2 = 44
		}
	},

	'pyramid_half': {
		'small': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 0; hy < 3; hy++) {
				for (var hx = 1; hx < 6; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			return pts; // 16+9 = 25
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 0; hy < 4; hy++) {
				for (var hx = 1; hx < 8; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			for (var hy2 = 1; hy2 < 3; hy2++) {
				for (var hx2 = 3; hx2 < 6; hx2 += 2) {
					pts.push({ z: 2, x: hx2, y: hy2, isHalf: true });
				}
			}
			return pts; // 25+16+4 = 45
		}
	},

	'checker': {
		'small': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 0; hy < 3; hy++) {
				for (var hx = 1; hx < 6; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			return pts; // 16+9 = 25
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var hy = 0; hy < 4; hy++) {
				for (var hx = 1; hx < 8; hx += 2) {
					pts.push({ z: 1, x: hx, y: hy, isHalf: true });
				}
			}
			for (var y2 = 1; y2 < 3; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			return evenTrim(pts); // 25+16+4 = 45 → 44
		}
	},

	'bridge': {
		'small': function () {
			var pts = [];
			for (var y = 0; y < 3; y++) {
				for (var x = 0; x < 3; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y3 = 0; y3 < 3; y3++) {
				for (var x3 = 3; x3 < 6; x3++) pts.push({ z: 0, x: x3 * 2, y: y3 });
			}
			for (var y1 = 0; y1 < 2; y1++) {
				for (var x1 = 0; x1 < 2; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
				for (var x1b = 4; x1b < 6; x1b++) pts.push({ z: 1, x: x1b * 2, y: y1 });
			}
			for (var xm = 2; xm < 5; xm++) pts.push({ z: 1, x: xm * 2, y: 1 });
			return evenTrim(pts); // 18 base + 8 torri + 3 ponte = 29 → 28
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
			var pts = [];
			for (var y = 0; y < 5; y++) {
				for (var x = 0; x < 5; x++) {
					if (y === 0 || y === 4 || x === 0 || x === 4) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y1 = 1; y1 < 4; y1++) {
				for (var x1 = 1; x1 < 4; x1++) {
					if (y1 === 1 || y1 === 3 || x1 === 1 || x1 === 3) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			pts.push({ z: 2, x: 4, y: 2 });
			return evenTrim(pts); // 16+8+1 = 25 → 24
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 6; x++) {
					if (y === 0 || y === 6 || x === 0 || x === 5) pts.push({ z: 0, x: x * 2, y: y });
				}
			}
			for (var y1 = 1; y1 < 6; y1++) {
				for (var x1 = 1; x1 < 5; x1++) {
					if (y1 === 1 || y1 === 5 || x1 === 1 || x1 === 4) pts.push({ z: 1, x: x1 * 2, y: y1 });
				}
			}
			for (var y2 = 2; y2 < 5; y2++) {
				for (var x2 = 2; x2 < 4; x2++) pts.push({ z: 2, x: x2 * 2, y: y2 });
			}
			pts.push({ z: 3, x: 4, y: 3 });
			return evenTrim(pts); // 22+12+4+1 = 39 → 38
		}
	},

	'helix': {
		'small': function () {
			var pts = [];
			for (var y = 0; y < 3; y++) {
				for (var x = 0; x < 4; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 3; y1++) {
				for (var x1 = 0; x1 < 4; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var hy = 0; hy < 2; hy++) {
				for (var hx = 1; hx < 6; hx += 2) {
					pts.push({ z: 2, x: hx, y: hy, isHalf: true });
				}
			}
			return pts; // 12+12+4 = 28
		},
		'medium': function () {
			var pts = [];
			for (var y = 0; y < 4; y++) {
				for (var x = 0; x < 5; x++) pts.push({ z: 0, x: x * 2, y: y });
			}
			for (var y1 = 0; y1 < 4; y1++) {
				for (var x1 = 0; x1 < 5; x1++) pts.push({ z: 1, x: x1 * 2, y: y1 });
			}
			for (var hy = 0; hy < 3; hy++) {
				for (var hx = 1; hx < 8; hx += 2) {
					pts.push({ z: 2, x: hx, y: hy, isHalf: true });
				}
			}
			return pts; // 20+20+9 = 49
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

var STEP_RANGES = buildStepRanges(25);

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
	{ layout: 'cross',       variant: 'xl',     symSet: 'green',   covered: 7, maxStaging: 3 },
	{ layout: 'labyrinth',   variant: 'medium', symSet: 'blue',    covered: 7, maxStaging: 2 },
	{ layout: 'pyramid',     variant: 'xl',     symSet: 'gold',    covered: 8, maxStaging: 2 },
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

	/* Progressive tile count WITHIN each step:
	   grows from 75% to 100% of the variant's tiles across the
	   4 levels this step spans, so every step starts dense. A
	   GLOBAL floor also grows with the level number. */
	var span = level.max - level.min + 1;
	var pos = (levelIndex + 1) - level.min;
	var frac = 0.75 + 0.25 * (pos / Math.max(1, span - 1));
	var globalMin = Math.max(8, Math.round((levelIndex + 1) * 0.4));
	var tileCount = Math.floor(fullSize * frac);
	tileCount = Math.min(fullSize, Math.max(globalMin, tileCount));
	if (tileCount % 2 !== 0) tileCount--;

	/* Keep exactly an EVEN total. */
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