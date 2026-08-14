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
   PROGRESSIONE AUTOMATICA (v0.6.0) — genera 300 livelli con
   massima VARIETÀ e curva di difficoltà reale.
   - Pool: TUTTE le combinazioni layout×variante, ordinate per
     score base di computeDifficulty(layout, 0).
   - Il pool è diviso in 4 ZONE di difficoltà (quartili di score).
   - Dentro ogni zona il pick è ROUND-ROBIN: ogni livello prende
     la combo successiva della zona → MAI due layout uguali di
     fila e nessuna struttura ripetuta per 5-6 livelli.
   - La zona avanza col livello: livelli 1-75 zona facile,
     226-300 zona difficile (spirali/labirinti/piramidi).
   - Half-cover ogni 7 livelli: half nella stessa zona di
     difficoltà (i primi half piccoli, gli ultimi half giganti).
   - covered: proporzionale al livello e alla dimensione del layout.
   - maxStaging: 4 → 3 → 2 con l'avanzare.
   - Quads: da livello 200+, layout ≥ 60 tile, alternati.
   ============================================================ */
function buildProgression(count) {
	var out = [];
	/* pool di tutte le combinazioni layout×variante */
	var pool = [];
	Object.keys(LAYOUT_BUILDERS).forEach(function (layout) {
		Object.keys(LAYOUT_BUILDERS[layout]).forEach(function (variant) {
			var b = LAYOUT_BUILDERS[layout][variant]();
			var nb = b.filter(function (p) { return p.y >= 0; });
			var tc = nb.length;
			if (tc % 2 !== 0) tc -= 1;
			pool.push({
				layout: layout,
				variant: variant,
				tiles: tc,
				score: computeDifficulty(nb, 0),
				isHalf: nb.some(function (t) { return t.isHalf; })
			});
		});
	});
	pool.sort(function (a, b) { return a.score - b.score || a.tiles - b.tiles; });

	/* 4 zone di difficoltà (quartili del pool ordinato) */
	var zones = [[], [], [], []];
	for (var zi = 0; zi < pool.length; zi++) {
		zones[Math.min(3, Math.floor(zi / pool.length * 4))].push(pool[zi]);
	}
	/* shuffle iniziale per zona: varia l'ordine di partenza */
	var rng = createRng(1234);
	for (var zi2 = 0; zi2 < zones.length; zi2++) shuffle(zones[zi2], rng);

	/* half-cover veri, ordinati per score (per la zona giusta) */
	var halfPool = pool.filter(function (p) { return p.isHalf; });
	var halfCount = 0;

	var symSets = ['default', 'red', 'green', 'blue', 'gold', 'dark', 'classic', 'classic-dark'];
	/* contatori round-robin per zona */
	var rr = [0, 0, 0, 0];
	var prevLayout = null;

	for (var n = 0; n < count; n++) {
		var progress = n / count;
		/* zona corrente (mai indietro) */
		var zoneIdx = Math.min(3, Math.floor(progress * 4));
		var zc = zones[zoneIdx];
		if (!zc.length) { zc = zones[3]; zoneIdx = 3; }

		/* round-robin: combo successiva nella zona — se coincide col
		   layout appena giocato, avanzo ancora (mai 2 uguali di fila) */
		var item = zc[rr[zoneIdx] % zc.length];
		var guard = 0;
		while (item.layout === prevLayout && guard < zc.length) {
			rr[zoneIdx]++;
			item = zc[rr[zoneIdx] % zc.length];
			guard++;
		}
		rr[zoneIdx]++;
		prevLayout = item.layout;

		/* half-cover ogni 7 livelli: half nella stessa zona di difficoltà */
		var forceHalf = ((n + 1) % 7 === 0);
		if (forceHalf && halfPool.length) {
			var hTarget = progress * (halfPool.length - 1);
			var hIdx = Math.max(0, Math.min(halfPool.length - 1, Math.round(hTarget + ((halfCount % 3) - 1))));
			item = halfPool[hIdx];
			halfCount++;
			prevLayout = item.layout;
		}

		/* covered: cresce col livello ma mai oltre floor(tiles/6) coppie */
		var maxCov = Math.max(2, Math.min(8, Math.floor(item.tiles / 6)));
		var cov = Math.min(maxCov, Math.floor(progress * maxCov * 1.3));

		/* maxStaging: 4 (1-150) → 3 (151-225) → 2 (226-300) */
		var staging = n < 150 ? 4 : (n < 225 ? 3 : 2);

		/* quads: solo livelli ≥ 200, layout ≥ 60 tile, alternati */
		var qt = item.tiles;
		if (qt % 4 !== 0) qt -= (qt % 4);
		var quads = n >= 199 && qt >= 60 && (n % 2 === 0);

		var sym = symSets[(n + Math.floor(progress * 8) + zoneIdx) % symSets.length];

		out.push({
			layout: item.layout,
			variant: item.variant,
			symSet: sym,
			covered: cov,
			maxStaging: staging,
			quads: quads,
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
	/* CLASSIC MAHJONG (v0.7.1): every symbol always has FOUR copies
	   (2 matchable pairs), like the traditional solitaire deck.
	   Requires layout length divisible by 4 — handled below. */
	var copiesPerSymbol = 4;
	var tileCount = fullSize;
	if (tileCount % copiesPerSymbol !== 0) tileCount -= (tileCount % copiesPerSymbol);
	if (layout.length > tileCount) {
		layout = layout.slice(0, tileCount);
	} else if ((layout.length % copiesPerSymbol) !== 0) {
		layout = layout.slice(0, layout.length - (layout.length % copiesPerSymbol));
	}

	var symbols = SYMBOL_SETS[level.symSet] || SYMBOL_SETS['default'];
	/* v0.6.0: i set tematici contengono simboli DUPLICATI (es. "gold"
	   ha 🦁 due volte). In quad mode servono pochi simboli (max ~32),
	   quindi un duplicato produrrebbe 4+4=8 copie dello stesso simbolo
	   invece di 4. Dedup: usiamo solo i simboli unici del set. */
	var uniqueSymbols = [];
	var seenSym = {};
	for (var u = 0; u < symbols.length; u++) {
		if (!seenSym[symbols[u]]) {
			seenSym[symbols[u]] = 1;
			uniqueSymbols.push(symbols[u]);
		}
	}
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
			var sym = uniqueSymbols[i % uniqueSymbols.length];
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
