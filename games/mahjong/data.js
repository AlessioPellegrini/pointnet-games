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
	'default': ['🀄', '🍀', '🌸', '🔥', '❄️', '💎', '⭐', '🌙', '☀️', '🍃', '💜', '🔷', '🍄', '🎈', '🌈', '🍕', '⚽', '🎲', '🐍', '🦋', '🌵', '🍇', '🐙', '🦄', '🍩', '🍪', '🧁', '🍭', '🎯', '🎮', '🎧', '📦', '🔔', '🎁', '🦉', '🐢', '🐳', '🦩', '🌺', '🍁', '🌊', '⛰️', '🏝️', '🌋', '🏰', '🚀', '🛸', '⚓', '🎪', '🎨', '🎬', '🏮', '🔮', '⚡', '🌀', '💫', '✨', '☄️', '🪐', '🌌', '🫧', '🍉', '🍓', '🍊', '🥝', '🍌', '🥐', '🧀'],
	'red':     ['🍎', '🌹', '❤️', '🍒', '🦞', '🔴', '🐞', '🎒', '🍉', '🐙', '🧣', '🍅', '🌶️', '🎈', '🩸', '🧲', '💄', '🍓', '🧧', '🦀', '🍁', '🛑', '🔺', '🏎️', '🍑', '❣️', '🧡', '🍗', '🥩', '🍷', '🎀', '👠', '🖍️', '🌹', '🌺', '🍄', '🦩', '🐟', '🦐', '🍆', '🍠', '🟥', '🥵', '🔥', '🏮', '🌋', '💖', '💃', '🚨', '🎇', '🧸', '🍬', '🍧', '🍎', '🥊', '♨️', '🍒', '🌸', '🫚', '🫒', '🦞', '🍁', '🫖', '🍇', '🍫', '🍭', '🍩'],
	'green':   ['🌿', '🦎', '💚', '🍏', '🦠', '🫑', '🐸', '🐢', '🥑', '🐲', '🌲', '🍀', '🧪', '🍐', '🦜', '🥦', '🐍', '🥒', '🌵', '🌱', '🦗', '🍈', '🍃', '🥬', '🌾', '🫛', '🥝', '🥭', '🍃', '🌳', '🎄', '🌴', '🍀', '☘️', '🧿', '🦖', '🦕', '🐊', '🦍', '🦜', '🍉', '🥒', '🍐', '🥦', '🫑', '🥑', '🍏', '🍵', '🥗', '🍃', '🌿', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🍀', '☘️', '🧫', '🦴', '🫘', '🫚', '🍜', '🥠', '🍃', '💶', '🧤', '🟢'],
	'blue':    ['🐟', '🌊', '💙', '🧢', '🦋', '🐳', '🔵', '🫐', '🧊', '🐬', '💧', '☂️', '🧤', '⚓', '🦈', '🥶', '💠', '🔷', '🌧️', '⛵', '🐧', '🧿', '🐋', '🦑', '🪼', '🐠', '🐡', '🦀', '🦞', '🐚', '🌌', '❄️', '☃️', '🛷', '⛄', '🧊', '💙', '🩵', '🚙', '✈️', '🛳️', '🚤', '🧜', '🧞', '🧝', '👻', '💤', '🌫️', '🌀', '🌊', '🌧️', '⛈️', '🌩️', '🫧', '💦', '🔹', '🔵', '💎', '🌐', '🧊', '🥛', '🍼', '🧂', '🫖', '🪣', '💧', '🌊'],
	'gold':    ['⭐', '👑', '🏆', '🔔', '💛', '🪙', '🍯', '🐝', '🌻', '⚜️', '🌟', '🤴', '👸', '💰', '🥇', '✨', '🔶', '🍋', '🦁', '🍞', '🌽', '🟡', '🍌', '🥭', '🍍', '🧀', '🫒', '🌾', '🐤', '🐥', '🦆', '🦢', '🦅', '🦉', '🦁', '🐯', '🐅', '🦁', '🎖️', '🏅', '🎗️', '🪗', '🪘', '🎺', '🎷', '🎸', '🎹', '🎻', '🥁', '🎤', '📯', '🪇', '🫙', '💡', '🏮', '🕯️', '🔆', '☀️', '🟨', '🟧', '🍟', '🍿', '🥞', '🧇', '🥜', '🌰', '🟡', '💫'],
	'dark':    ['🕷️', '🦇', '🌑', '🖤', '🐈', '🧛', '🕯️', '💀', '🪦', '🌘', '🦉', '⚫', '🌃', '🐉', '🔮', '🌫️', '🦂', '🥷', '🕸️', '😈', '🍆', '🦇', '🐺', '🐗', '🦡', '🐀', '🐍', '🦎', '🐸', '🦂', '🕷️', '🕸️', '👻', '💀', '☠️', '🧟', '🧙', '🧛', '🧝', '🧞', '⚰️', '⚱️', '🪦', '🌒', '🌓', '🌔', '🌖', '🌗', '🌘', '🌑', '🌚', '🪐', '☄️', '🛸', '👽', '🤖', '⚫', '🔘', '🕶️', '🖤', '💜', '🔮', '🪄', '🥷', '🌙', '✨', '🧿', '🪬']
};

/* LEVEL CONFIGURATION + progression logic.
   LAYOUT_BUILDERS now lives in layouts.js (loaded before this file). */
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
	/* covered = NUMBER OF VISIBLE COVERED TILES (since v0.4.0: one tile
	   per pair is covered, its twin is face-up).
	   quads = each symbol has 4 copies (2 pairs) — you have to remember
	   if a pair already came out and its twin is still on the board.
	   NOTE: the themed sets (default/red/green/blue/gold/dark) remain
	   the norm; the classic set appears only OCCASIONALLY so we don't
	   lose the cute emoji look.
	   v0.5.0: 50 steps — 9 new layout builders (pagoda, butterfly,
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
	/* v0.5.0 — 3 new figure layouts (zigzag, rings, temple) */
	{ layout: 'zigzag',      variant: 'small',  symSet: 'dark',    covered: 4, maxStaging: 3 },
	{ layout: 'rings',       variant: 'small',  symSet: 'blue',    covered: 6, maxStaging: 3 },
	{ layout: 'temple',      variant: 'small',  symSet: 'gold',    covered: 6, maxStaging: 3 },
	{ layout: 'zigzag',      variant: 'medium', symSet: 'dark',    covered: 8, maxStaging: 2 },
	{ layout: 'rings',       variant: 'medium', symSet: 'blue',    covered: 10, maxStaging: 2 },
	{ layout: 'temple',      variant: 'medium', symSet: 'gold',    covered: 12, maxStaging: 2 },
	/* QUAD MODE — mix: mostly themed sets, classic every so often */
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
   DIFFICULTY (v0.5.0) — computeDifficulty() gives an objective
   score to every layout×variant combination, computed from
   geometric parameters (independent of the shuffle):
     - tileCount : more tiles = longer
     - maxZ      : more tiers = more hidden tiles
     - blocked   : edge tile with both sides occupied
     - covered   : visible covered tiles (memory)
   Base 0..100 split into: small (0-24), medium (25-49),
   large (50-74), very large (75-100).
   ============================================================ */
function computeDifficulty(layout, covered) {
	var byZ = {}, maxZ = 0;
	for (var i = 0; i < layout.length; i++) {
		var z = layout[i].z;
		if (z > maxZ) maxZ = z;
		(byZ[z] = byZ[z] || []).push(layout[i]);
	}
	/* blocked: tile at z>0 or with a neighbour on BOTH sides on the same z */
	var blocked = 0;
	for (var j = 0; j < layout.length; j++) {
		var t = layout[j];
		blocked += (t.z > 0) ? 1 : 0;
	}
	var tilePart = Math.min(60, Math.round(layout.length * 60 / 108));
	var layerPart = Math.min(20, maxZ * 7);
	var coverPart = Math.min(15, covered * 3);
	var freePart = 0; /* estimated: more blocked tiles above → more closed */
	if (maxZ >= 3) freePart += 5;
	if (layout.length >= 80) freePart += 5;
	var score = tilePart + layerPart + coverPart + freePart;
	return Math.min(100, score);
}

/* ============================================================
   AUTOMATIC PROGRESSION (v0.6.0) — generates 300 levels with
   maximum VARIETY and a real difficulty curve.
   - Pool: ALL layout×variant combinations, sorted by
     playable tile-count (multiples of 4).
   - GROWING GLOBAL FLOOR: quantile of the REAL pool tile-counts
     with no gaps (tileLevels), progress^2.2 curve → the count
     trend rises towards the final mega-tables.
   - Between adjacent levels only a small -8 tile swing is
     allowed (for VARIETY), never drastic drops.
   - GLOBAL round-robin PICK on the [minTiles, bandMax] band:
     NEVER two equal layouts in a row.
   - Band bandMax = minTiles+16 (capped 108): the 124-tile layout
     (spiral/medium, unique) is EXCLUDED until the FINAL BOSS in
     the last 3 levels.
   - covered: proportional to the level and layout size.
   - maxStaging: 4 → 3 → 2 as you advance.
   - Quads: from level 200+, layouts ≥ 60 tiles, alternating.
   ============================================================ */
function buildProgression(count) {
	var out = [];
	/* v0.9.2: a layout is blackout-compatible if it has AT LEAST one
	   free z0 tile at start (auto-reveal). labyrinth/medium after the
	   dedupe ended up on a blackout level with a 100% covered base
	   → no free obscured tile → blocked start. */
	function hasFreeBase(layout) {
		var has = {};
		for (var h = 0; h < layout.length; h++) {
			var p = layout[h];
			has[p.z + ',' + p.x + ',' + p.y] = p;
		}
		for (var j = 0; j < layout.length; j++) {
			var t = layout[j];
			if (t.z !== 0) continue;
			if (has['1,' + t.x + ',' + t.y]) continue;                 /* FULL above */
			var hh = has['1,' + (t.x - 1) + ',' + t.y] ||
			         has['1,' + (t.x + 1) + ',' + t.y] ||
			         has['1,' + (t.x - 1) + ',' + (t.y - 1)] ||
			         has['1,' + (t.x + 1) + ',' + (t.y - 1)];
			if (hh && hh.isHalf) continue;                             /* HALF above */
			var left = has['0,' + (t.x - 2) + ',' + t.y];
			var right = has['0,' + (t.x + 2) + ',' + t.y];
			if (left && right) continue;                               /* laterally blocked */
			return true;
		}
		return false;
	}
	/* pool of all standard layout×variant combinations + dedicated conveyor pool */
	var pool = [];
	var conveyorPool = [];
	Object.keys(LAYOUT_BUILDERS).forEach(function (layout) {
		if (layout === 'classic_144') return;
		Object.keys(LAYOUT_BUILDERS[layout]).forEach(function (variant) {
			var b = LAYOUT_BUILDERS[layout][variant]();
			var nb = b.filter(function (p) { return p.y >= 0; });
			var tc = nb.length;
			if (tc % 2 !== 0) tc -= 1;
			var entry = {
				layout: layout,
				variant: variant,
				tiles: tc,
				playableTiles: tc - (tc % 4),
				score: computeDifficulty(nb, 0),
				isHalf: nb.some(function (t) { return t.isHalf; }),
				freeBase: hasFreeBase(nb)
			};
			if (layout.indexOf('conveyor_') === 0) {
				conveyorPool.push(entry);
			} else {
				pool.push(entry);
			}
		});
	});
	pool.sort(function (a, b) { return a.playableTiles - b.playableTiles || a.score - b.score || a.tiles - b.tiles; });
	conveyorPool.sort(function (a, b) { return a.playableTiles - b.playableTiles || a.score - b.score; });

	/* Unique pool tile-counts in order (no gaps): the growth floor is
	   picked as a quantile of this list, so it never lands on a value
	   that no layout has (e.g. there is no layout between 108 and 124). */
	var tileLevels = [];
	var seenTileLevel = {};
	for (var tl = 0; tl < pool.length; tl++) {
		var pt = pool[tl].playableTiles;
		if (!seenTileLevel[pt]) { seenTileLevel[pt] = 1; tileLevels.push(pt); }
	}
	tileLevels.sort(function (a, b) { return a - b; });

	/* 4 difficulty zones (quartiles of the sorted pool) */
	var zones = [[], [], [], []];
	for (var zi = 0; zi < pool.length; zi++) {
		zones[Math.min(3, Math.floor(zi / pool.length * 4))].push(pool[zi]);
	}
	/* initial shuffle per zone: varies the starting order */
	var rng = createRng(1234);
	for (var zi2 = 0; zi2 < zones.length; zi2++) shuffle(zones[zi2], rng);

	/* real half-cover layouts, sorted by score (for the right zone) */
	var halfPool = pool.filter(function (p) { return p.isHalf; });
	var halfCount = 0;

	var symSets = ['default', 'red', 'green', 'blue', 'gold', 'dark', 'classic', 'classic-dark'];
	/* global round-robin counter */
	var rr0 = 0;
	var prevLayout = null;
	var lastTiles = 0;
	/* v0.9.3: coverage guarantee for the 38 layouts — the HALF preference
	   on blackouts could permanently drop a layout from rotation
	   (e.g. crown, unique at 52 tiles). Track the ones already used. */
	var usedLayouts = {};
	var blackCount = 0; /* blackout counter for the HALF/freeBase alternation */

	var arcadeTotal = count - Math.floor(count / 10);
	var arcadeIndex = 0;

	for (var n = 0; n < count; n++) {
		/* CLASSIC CHALLENGE: every 10 levels (10, 20, 30, ...) */
		if ((n + 1) % 10 === 0) {
			var isDarkClassic = ((n + 1) % 20 === 0);
			out.push({
				layout: 'classic_144',
				variant: 'large',
				symSet: isDarkClassic ? 'classic-dark' : 'classic',
				covered: 0,
				maxStaging: 4,
				quads: false,
				blackout: false,
				mode: 'classic',
				multiplier: 1.5,
				index: n + 1
			});
			continue;
		}

		var progress = arcadeIndex / arcadeTotal;
		arcadeIndex++;
		/* Zone only for symSet selection (never back). */
		var zoneIdx = Math.min(3, Math.floor(progress * 4));

		/* v0.8.2: the tile-count TREND is always growing (levels advance
		   towards the final mega-tables) but a small -8 tile swing is
		   allowed between adjacent levels. This keeps VARIETY: the pool
		   has gaps (56→60→64→68→76→80→84→92→96) and few layouts per
		   band; with a strict no-drop you'd get stuck on the band's
		   minimum layout for dozens of levels. The GLOBAL FLOOR is a
		   quantile of the real tile-counts (tileLevels) with a VERY
		   SLOW curve (progress^2.2) that guarantees the underlying
		   growing trend.
		   Choice band: [minTiles, bandMax] where
		     - minTiles = max(floorTiles, lastTiles - 8)  → trend +
		       small swing for variety
		     - bandMax  = minTiles + 16 (capped at 108 until floor<124) →
		       more layouts available per band; the 124-tile layout
		       (spiral/medium, unique) stays out until the FINAL BOSS
		       in the last 1%. */
		/* Smooth monotonic progression:
		   floorIdx linearly moves through the unique tileLevels (12 -> 124).
		   minTiles is the strict floor of the current level band.
		   bandMax allows adjacent tile tiers for figure variety without dropping to small layouts in late game. */
		var floorIdx = Math.min(tileLevels.length - 1, Math.floor(progress * (tileLevels.length - 1)));
		if (progress >= 0.98) floorIdx = tileLevels.length - 1;
		var floorTiles = tileLevels[floorIdx];
		var minTiles = Math.max(floorTiles, lastTiles - 8);
		var bandMaxIdx = Math.min(tileLevels.length - 1, floorIdx + 3);
		var bandMax = (progress >= 0.98) ? 124 : Math.min(108, tileLevels[bandMaxIdx]);

		/* v0.9 blackout: base plane (z=0) all obscured, auto-reveals.
		   Active on levels 101+ (alternating). */
		var blackout = n >= 100 && (n % 2 === 0);

		var candidates = pool.filter(function (item) {
			return item.playableTiles >= minTiles && item.playableTiles <= bandMax;
		});
		if (!candidates.length) {
			candidates = pool.filter(function (item) {
				return item.playableTiles >= minTiles && item.playableTiles <= Math.min(108, minTiles + 16);
			});
		}
		if (!candidates.length) {
			candidates = pool.filter(function (item) {
				return item.playableTiles >= minTiles;
			});
		}
		if (!candidates.length) {
			candidates = pool.filter(function (item) {
				return item.playableTiles === lastTiles;
			});
		}
		/* v0.9.2: blackout levels must have at least one free z0 tile
		   at start (freeBase) — otherwise no obscured tile can reveal
		   and the level starts blocked. */
		if (blackout) {
			var wantHalf = (blackCount % 2 === 0);
			var halfFb = candidates.filter(function (c) { return c.isHalf && c.freeBase; });
			if (wantHalf && halfFb.length) {
				candidates = halfFb;
			} else {
				var fbCandidates = candidates.filter(function (c) { return c.freeBase; });
				if (fbCandidates.length) {
					candidates = fbCandidates;
				} else {
					var allFb = pool.filter(function (c) { return c.freeBase && c.playableTiles >= minTiles - 8; });
					if (allFb.length) candidates = allFb;
				}
			}
			blackCount++;
		}

		/* round-robin over the candidate set: variation without locks */
		if (!candidates || !candidates.length) candidates = pool;
		var idx = rr0 % candidates.length;
		var item = candidates[idx];
		var guard = 0;
		while (item.layout === prevLayout && guard < candidates.length) {
			idx = (idx + 1) % candidates.length;
			item = candidates[idx];
			guard++;
		}
		rr0++;
		prevLayout = item.layout;

		/* half-cover every 7 levels: forced ONLY if compatible with the
		   growth band (no drops, no early jumps). */
		var forceHalf = ((n + 1) % 7 === 0);
		if (forceHalf && halfPool.length) {
			var halfCandidates = halfPool.filter(function (p) {
				return p.playableTiles >= minTiles && p.playableTiles <= bandMax;
			});
			if (halfCandidates.length) {
				var hTarget = progress * (halfCandidates.length - 1);
				var hIdx = Math.max(0, Math.min(halfCandidates.length - 1, Math.round(hTarget + ((halfCount % 3) - 1))));
				item = halfCandidates[hIdx];
				halfCount++;
				prevLayout = item.layout;
				if (blackout && !item.freeBase) {
					var hb2 = candidates.filter(function (c) { return c.isHalf && c.freeBase; });
					if (!hb2.length) hb2 = candidates.filter(function (c) { return c.freeBase; });
					if (hb2.length) {
						item = hb2[0];
						prevLayout = item.layout;
					}
				}
			}
		}

		/* Special Conveyor Challenge every 10 levels on the 5s (15, 25, 35, 45...) */
		var isConveyorLevel = ((n + 1) % 10 === 5);

		/* Coverage guarantee: if there are layouts never used
		   that fit the current band (and respect freeBase on
		   blackouts), pick the one with fewest tiles. */
		if (!isConveyorLevel) {
			var unused = pool.filter(function (c) {
				if (usedLayouts[c.layout]) return false;
				if (c.playableTiles > bandMax) return false;
				if (n > 80 && c.playableTiles < minTiles) return false;
				if (blackout && !c.freeBase) return false;
				return true;
			});
			if (unused.length) {
				unused.sort(function (a, b) { return a.playableTiles - b.playableTiles || a.score - b.score; });
				item = unused[0];
				prevLayout = item.layout;
			}
		}

		if (isConveyorLevel && conveyorPool.length) {
			var convCandidates = conveyorPool.filter(function (p) {
				return p.playableTiles >= minTiles && p.playableTiles <= bandMax;
			});
			if (!convCandidates.length) {
				convCandidates = conveyorPool.filter(function (p) {
					return p.playableTiles <= bandMax;
				});
			}
			if (!convCandidates.length) convCandidates = [conveyorPool[0]];
			var unusedConv = convCandidates.filter(function (p) { return !usedLayouts[p.layout]; });
			var poolToUse = unusedConv.length ? unusedConv : convCandidates;
			var convIdx = Math.min(poolToUse.length - 1, Math.floor(progress * poolToUse.length));
			item = poolToUse[convIdx];
			prevLayout = item.layout;
		}

		usedLayouts[item.layout] = true;
		lastTiles = item.playableTiles;

		/* covered: grows with the level but never beyond floor(tiles/6) pairs */
		var maxCov = Math.max(2, Math.min(8, Math.floor(item.playableTiles / 6)));
		var cov = Math.min(maxCov, Math.floor(progress * maxCov * 1.3));

		/* maxStaging: 4 fisso per tutti i livelli Arcade (v1.0.0 Arcade fix) */
		var staging = 4;

		/* quads: only levels ≥ 200, layouts ≥ 60 tiles, alternating */
		var qt = item.playableTiles;
		var quads = n >= 199 && qt >= 60 && (n % 2 === 0);

		var sym = symSets[(n + Math.floor(progress * 8) + zoneIdx) % symSets.length];

		out.push({
			layout: item.layout,
			variant: item.variant,
			symSet: sym,
			covered: cov,
			maxStaging: staging,
			quads: quads,
			blackout: blackout,
			mode: 'arcade',
			multiplier: 1.0,
			isConveyor: isConveyorLevel || (item.layout.indexOf('conveyor_') === 0),
			index: n + 1
		});
	}
	return out;
}

/* Generate the full progression once (lazy). */
var PROGRESSION = null;
function ensureProgression() {
	if (!PROGRESSION) PROGRESSION = buildProgression(330);
	return PROGRESSION;
}

function getLevelDef(index) {
	index = Math.max(0, Math.min(index, 329));
	var p = ensureProgression()[index];
	return {
		layout: p.layout,
		variant: p.variant,
		symSet: p.symSet,
		covered: p.covered,
		maxStaging: p.maxStaging || 4,
		quads: !!p.quads,
		blackout: !!p.blackout,
		mode: p.mode || 'arcade',
		multiplier: p.multiplier || 1.0,
		isConveyor: !!p.isConveyor,
		index: p.index
	};
}

/* ============================================================
   NATIVE REVERSE GENERATION ENGINE (v1.6.0)
   Constructive generation: simulates forward removal on an unassigned
   layout, assigning matching pairs from deck only to positions that
   are actively free at that simulation step.
   Guarantees 100% solvability and 0 vertical identical blockages.
   ============================================================ */
function generateConstructiveLevel(layout, deck, mode, rng) {
	var total = layout.length;
	var slots = [];
	var slotMap = {};
	for (var c = 0; c < total; c++) {
		var p = layout[c];
		var key = makeKey(p.z, p.x, p.y);
		var s = {
			index: c,
			z: p.z,
			x: p.x,
			y: p.y,
			isHalf: !!p.isHalf,
			key: key,
			removed: false,
			tile: null
		};
		slots.push(s);
		slotMap[key] = s;
	}

	function hasLive(z, x, y) {
		var s = slotMap[makeKey(z, x, y)];
		return !!s && !s.removed;
	}

	function hasLiveHalf(z, x, y) {
		var s = slotMap[makeKey(z, x, y)];
		return !!s && !s.removed && s.isHalf;
	}

	function hasLiveFull(z, x, y) {
		var s = slotMap[makeKey(z, x, y)];
		return !!s && !s.removed && !s.isHalf;
	}

	function isFreeSlot(s) {
		if (s.removed) return false;
		if (hasLive(s.z + 1, s.x, s.y)) return false;
		if (hasLiveHalf(s.z + 1, s.x - 1, s.y) ||
		    hasLiveHalf(s.z + 1, s.x + 1, s.y) ||
		    hasLiveHalf(s.z + 1, s.x - 1, s.y - 1) ||
		    hasLiveHalf(s.z + 1, s.x + 1, s.y - 1)) return false;
		if (s.isHalf && (
		    hasLiveFull(s.z + 1, s.x - 1, s.y) ||
		    hasLiveFull(s.z + 1, s.x + 1, s.y) ||
		    hasLiveFull(s.z + 1, s.x - 1, s.y - 1) ||
		    hasLiveFull(s.z + 1, s.x + 1, s.y - 1))) return false;

		var hasLeft = hasLive(s.z, s.x - 2, s.y);
		var hasRight = hasLive(s.z, s.x + 2, s.y);
		return !(hasLeft && hasRight);
	}

	function unblockScore(s) {
		var score = 0;
		if (slotMap[makeKey(s.z - 1, s.x, s.y)]) score += 4;
		if (slotMap[makeKey(s.z, s.x - 2, s.y)]) score += 1;
		if (slotMap[makeKey(s.z, s.x + 2, s.y)]) score += 1;
		return score;
	}

	var deckIdx = 0;
	var history = [];

	while (slots.some(function (s) { return !s.removed; })) {
		var freeSlots = slots.filter(isFreeSlot);
		if (freeSlots.length >= 2 && deckIdx <= deck.length - 2) {
			freeSlots.sort(function (a, b) {
				return (unblockScore(b) - unblockScore(a)) + (rng.next() - 0.5) * 2;
			});
			var s1 = freeSlots[0];
			var s2 = freeSlots[1];
			for (var i = 1; i < freeSlots.length; i++) {
				if (freeSlots[i].x !== s1.x || freeSlots[i].y !== s1.y) {
					s2 = freeSlots[i];
					break;
				}
			}
			s1.removed = true;
			s2.removed = true;
			var d1 = deck[deckIdx++];
			var d2 = deck[deckIdx++];
			s1.tile = { z: s1.z, x: s1.x, y: s1.y, isHalf: s1.isHalf, symbol: d1.symbol, svg: d1.svg, wildcardGroup: d1.wildcardGroup, label: s1.index + 1, removed: false, staging: false, faceDown: false, obscured: false, hinted: false };
			s2.tile = { z: s2.z, x: s2.x, y: s2.y, isHalf: s2.isHalf, symbol: d2.symbol, svg: d2.svg, wildcardGroup: d2.wildcardGroup, label: s2.index + 1, removed: false, staging: false, faceDown: false, obscured: false, hinted: false };
			history.push({ s1: s1, s2: s2, d1: d1, d2: d2 });
		} else {
			var remaining = slots.filter(function (s) { return !s.removed; });
			while (remaining.length >= 2 && deckIdx <= deck.length - 2) {
				var r1 = remaining.shift();
				var r2 = remaining.shift();
				r1.removed = true;
				r2.removed = true;
				var rd1 = deck[deckIdx++];
				var rd2 = deck[deckIdx++];
				r1.tile = { z: r1.z, x: r1.x, y: r1.y, isHalf: r1.isHalf, symbol: rd1.symbol, svg: rd1.svg, wildcardGroup: rd1.wildcardGroup, label: r1.index + 1, removed: false, staging: false, faceDown: false, obscured: false, hinted: false };
				r2.tile = { z: r2.z, x: r2.x, y: r2.y, isHalf: r2.isHalf, symbol: rd2.symbol, svg: rd2.svg, wildcardGroup: rd2.wildcardGroup, label: r2.index + 1, removed: false, staging: false, faceDown: false, obscured: false, hinted: false };
			}
			break;
		}
	}

	var resultTiles = slots.map(function (s) { return s.tile; });
	if (typeof fixVerticalCollisions === 'function') {
		fixVerticalCollisions(resultTiles);
	}
	return resultTiles;
}

function generateLevel(levelIndex) {
	var level = getLevelDef(levelIndex);
	LAST_LEVEL_DEF = level;
	var chosen = LAYOUT_BUILDERS[level.layout][level.variant]();
	var layout = chosen.filter(function (p) { return p.y >= 0; });
	if (typeof validateSupport === 'function') {
		var badSupport = validateSupport(layout);
		if (badSupport.length) {
			console.warn('[mahjong] ' + level.layout + '/' + level.variant +
				' has ' + badSupport.length + ' unsupported tiles:', badSupport);
		}
	}
	var fullSize = layout.length;
	var isClassic = (level.mode === 'classic');
	var copiesPerSymbol = 4;
	var tileCount = fullSize;

	if (!isClassic) {
		if (tileCount % copiesPerSymbol !== 0) tileCount -= (tileCount % copiesPerSymbol);
		if (layout.length > tileCount) {
			layout = layout.slice(0, tileCount);
		} else if ((layout.length % copiesPerSymbol) !== 0) {
			layout = layout.slice(0, layout.length - (layout.length % copiesPerSymbol));
		}
	}

	var symbols = SYMBOL_SETS[level.symSet] || SYMBOL_SETS['default'];
	var uniqueSymbols = [];
	var seenSym = {};
	for (var u = 0; u < symbols.length; u++) {
		if (!seenSym[symbols[u]]) {
			seenSym[symbols[u]] = 1;
			uniqueSymbols.push(symbols[u]);
		}
	}
	var svgDir = null;
	if (level.symSet === 'classic') svgDir = 'regular';
	else if (level.symSet === 'classic-dark') svgDir = 'black';

	var rng = createRng(42 + levelIndex * 13);
	var deck = [];

	if (isClassic && layout.length === 144) {
		var flowers = ['Flower1', 'Flower2', 'Flower3', 'Flower4'];
		var seasons = ['Season1', 'Season2', 'Season3', 'Season4'];

		if (levelIndex < 60) {
			for (var z1s = 0; z1s < 12; z1s++) {
				var z1sym = uniqueSymbols[z1s % uniqueSymbols.length];
				for (var z1c = 0; z1c < 12; z1c++) {
					deck.push({
						symbol: z1sym,
						svg: svgDir ? 'assets/' + svgDir + '/' + z1sym + '.svg' : null,
						wildcardGroup: null
					});
				}
			}
		} else if (levelIndex < 150) {
			for (var z2s = 0; z2s < 17; z2s++) {
				var z2sym = uniqueSymbols[z2s % uniqueSymbols.length];
				for (var z2c = 0; z2c < 8; z2c++) {
					deck.push({
						symbol: z2sym,
						svg: svgDir ? 'assets/' + svgDir + '/' + z2sym + '.svg' : null,
						wildcardGroup: null
					});
				}
			}
			for (var f2 = 0; f2 < 4; f2++) {
				deck.push({
					symbol: flowers[f2],
					svg: svgDir ? 'assets/' + svgDir + '/' + flowers[f2] + '.svg' : null,
					wildcardGroup: 'flower'
				});
			}
			for (var s2 = 0; s2 < 4; s2++) {
				deck.push({
					symbol: seasons[s2],
					svg: svgDir ? 'assets/' + svgDir + '/' + seasons[s2] + '.svg' : null,
					wildcardGroup: 'season'
				});
			}
		} else if (levelIndex < 250) {
			for (var z3s = 0; z3s < 20; z3s++) {
				var z3sym = uniqueSymbols[z3s % uniqueSymbols.length];
				var copies3 = (z3s < 16) ? 6 : 10;
				for (var z3c = 0; z3c < copies3; z3c++) {
					deck.push({
						symbol: z3sym,
						svg: svgDir ? 'assets/' + svgDir + '/' + z3sym + '.svg' : null,
						wildcardGroup: null
					});
				}
			}
			for (var f3 = 0; f3 < 4; f3++) {
				deck.push({
					symbol: flowers[f3],
					svg: svgDir ? 'assets/' + svgDir + '/' + flowers[f3] + '.svg' : null,
					wildcardGroup: 'flower'
				});
			}
			for (var s3 = 0; s3 < 4; s3++) {
				deck.push({
					symbol: seasons[s3],
					svg: svgDir ? 'assets/' + svgDir + '/' + seasons[s3] + '.svg' : null,
					wildcardGroup: 'season'
				});
			}
		} else {
			for (var si = 0; si < 34; si++) {
				var csym = uniqueSymbols[si % uniqueSymbols.length];
				for (var ccopy = 0; ccopy < 4; ccopy++) {
					deck.push({
						symbol: csym,
						svg: svgDir ? 'assets/' + svgDir + '/' + csym + '.svg' : null,
						wildcardGroup: null
					});
				}
			}
			for (var f = 0; f < 4; f++) {
				deck.push({
					symbol: flowers[f],
					svg: svgDir ? 'assets/' + svgDir + '/' + flowers[f] + '.svg' : null,
					wildcardGroup: 'flower'
				});
			}
			for (var s = 0; s < 4; s++) {
				deck.push({
					symbol: seasons[s],
					svg: svgDir ? 'assets/' + svgDir + '/' + seasons[s] + '.svg' : null,
					wildcardGroup: 'season'
				});
			}
		}
	} else {
		var symbolsNeeded = Math.ceil(layout.length / copiesPerSymbol);
		for (var i = 0; i < symbolsNeeded; i++) {
			var sym = uniqueSymbols[i % uniqueSymbols.length];
			for (var copy = 0; copy < copiesPerSymbol; copy++) {
				if (deck.length < layout.length) {
					deck.push({
						symbol: sym,
						svg: svgDir ? 'assets/' + svgDir + '/' + sym + '.svg' : null,
						wildcardGroup: null
					});
				}
			}
		}
	}

	shuffle(deck, rng);

	var tiles = generateConstructiveLevel(layout, deck, level.mode, rng);
	var board = buildBoard(tiles);

	if (level.blackout) applyBlackout(tiles);
	if (level.covered > 0) applyFaceDown(tiles, level.covered, board, level.mode);
	tiles.conveyorTrack = chosen.conveyorTrack || null;
	return tiles;
}

/* Cover numPairs SINGLE tiles (memory mechanic).
   Ensures that at least one free matchable pair remains uncovered so the
   level always starts playable. */
function applyFaceDown(tiles, numPairs, board, mode) {
	if (numPairs <= 0) return;
	for (var attempt = 0; attempt < 30; attempt++) {
		for (var t = 0; t < tiles.length; t++) tiles[t].faceDown = false;
		var done = 0;
		var guard = 0;
		while (done < numPairs && guard < 100) {
			guard++;
			var idx = Math.floor(Math.random() * tiles.length);
			if (tiles[idx].faceDown) continue;
			tiles[idx].faceDown = true;
			done++;
		}
		if (!board) return;
		var freeList = [];
		for (var p = 0; p < tiles.length; p++) {
			var tp = tiles[p];
			if (tp.removed || tp.staging || tp.faceDown || tp.obscured) continue;
			if (isFree(board, tp)) freeList.push(tp);
		}
		var hasPair = false;
		for (var f1 = 0; f1 < freeList.length; f1++) {
			for (var f2 = f1 + 1; f2 < freeList.length; f2++) {
				if (canMatch(freeList[f1], freeList[f2], mode)) { hasPair = true; break; }
			}
			if (hasPair) break;
		}
		if (hasPair || (mode === 'arcade' && freeList.length >= 4)) return;
	}
}

/* BLACKOUT (v0.9): obscures ALL base-plane tiles (z=0).
   Each obscured tile stays inert until it becomes FREE (isFree):
   the auto-reveal in ui.js reveals it as soon as it has no tiles
   above and at least one open side. COEXISTS with covered (random
   memory): a z=0 tile can be both obscured and faceDown. */
function applyBlackout(tiles) {
	for (var i = 0; i < tiles.length; i++) {
		if (tiles[i].z === 0) tiles[i].obscured = true;
	}
}
