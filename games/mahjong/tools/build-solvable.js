/* ============================================================
   MAHJONG ARCADE — tools/build-solvable.js (v1.0.0 Arcade & Classic)
   Precomputes solvability for all 330 levels OFFLINE and writes
   solvable-levels.js (a globals JS loaded BEFORE data.js).

   USO:
     node games/mahjong/tools/build-solvable.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..');
const ctx = { console, process };
vm.createContext(ctx);

const load = [
  fs.readFileSync(path.join(dir, 'layouts.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'engine.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'data.js'), 'utf8')
].join('\n');

/* Eseguiamo il precompute DENTRO il contesto vm: replica esattamente
   il ciclo di generateLevel (stesso seed, stesso shuffle, stesso
   solver) ma senza covered/blackout (non influiscono sulla
   solvibilità) e registra l'attempt vincente + le metriche. */
const snippet = `
(function () {
  const out = {};
  for (let levelIndex = 0; levelIndex < 330; levelIndex++) {
    process.stdout.write('L' + (levelIndex + 1) + '... ');
    const t0 = Date.now();
    const def = getLevelDef(levelIndex);
    const chosen = LAYOUT_BUILDERS[def.layout][def.variant]();
    const layout = chosen.filter(p => p.y >= 0);
    const isClassic = (def.mode === 'classic');
    const copiesPerSymbol = 4;
    let tileCount = layout.length;
    if (!isClassic) {
      if (tileCount % copiesPerSymbol !== 0) tileCount -= (tileCount % copiesPerSymbol);
      if (layout.length > tileCount) layout.length = tileCount;
      else if (layout.length % copiesPerSymbol !== 0) layout.length -= layout.length % copiesPerSymbol;
    }

    const symbols = SYMBOL_SETS[def.symSet] || SYMBOL_SETS['default'];
    const unique = [];
    const seen = {};
    for (let u = 0; u < symbols.length; u++) {
      if (!seen[symbols[u]]) { seen[symbols[u]] = 1; unique.push(symbols[u]); }
    }

    let winner = null;
    for (let attempt = 0; attempt < 80; attempt++) {
      const rng = createRng(42 + attempt * 7 + levelIndex);
      const deck = [];
      if (isClassic && layout.length === 144) {
        for (let si = 0; si < 34; si++) {
          const csym = unique[si % unique.length];
          for (let ccopy = 0; ccopy < 4; ccopy++) {
            deck.push({ symbol: csym, wildcardGroup: null });
          }
        }
        const flowers = ['Flower1', 'Flower2', 'Flower3', 'Flower4'];
        const seasons = ['Season1', 'Season2', 'Season3', 'Season4'];
        for (let f = 0; f < 4; f++) deck.push({ symbol: flowers[f], wildcardGroup: 'flower' });
        for (let s = 0; s < 4; s++) deck.push({ symbol: seasons[s], wildcardGroup: 'season' });
      } else {
        const symbolsNeeded = Math.ceil(layout.length / copiesPerSymbol);
        for (let i = 0; i < symbolsNeeded; i++) {
          const sym = unique[i % unique.length];
          for (let copy = 0; copy < copiesPerSymbol; copy++) {
            if (deck.length < layout.length) deck.push({ symbol: sym, wildcardGroup: null });
          }
        }
      }
      shuffle(deck, rng);
      const tiles = layout.map((co, c) => ({
        z: co.z, x: co.x, y: co.y, isHalf: !!co.isHalf,
        symbol: deck[c].symbol,
        wildcardGroup: deck[c].wildcardGroup || null,
        key: co.z + ',' + co.x + ',' + co.y,
        removed: false, staging: false, faceDown: false, obscured: false
      }));
      const board = buildBoard(tiles);
      const solvable = solveBoard(board, def.mode);
      if (solvable) { winner = { attempt, tiles, board }; break; }
      const freeCount = tiles.filter(t => !t.removed && !t.staging && isFree(board, t)).length;
      if (freeCount >= 4) { winner = { attempt, tiles, board }; break; }
    }
    if (!winner) { throw new Error('L' + (levelIndex + 1) + ' no solvable shuffle found'); }

    const board = winner.board;
    const total = winner.tiles.length;
    const freeAtStart = winner.tiles.filter(t => !t.removed && !t.staging && isFree(board, t)).length;
    let maxZ = 0;
    winner.tiles.forEach(t => { if (t.z > maxZ) maxZ = t.z; });
    const buried = total - freeAtStart;

    out[levelIndex] = {
      attempt: winner.attempt,
      layout: def.layout,
      variant: def.variant,
      mode: def.mode,
      maxZ,
      freeStart: freeAtStart,
      buried,
      buriedPct: Math.round(buried / total * 100)
    };
    console.log('ok (attempt ' + winner.attempt + ', ' + (Date.now() - t0) + 'ms)');
  }
  return out;
})()`;

const result = vm.runInContext(load + '\n' + snippet, ctx);

/* Scrive solvable-levels.js (globals JS, NON JSON, così si carica
   con <script> senza fetch). */
const body = Object.keys(result).map(k => {
  const r = result[k];
  return '"' + k + '":{"attempt":' + r.attempt + ',"layout":"' + r.layout +
    '","variant":"' + r.variant + '","mode":"' + r.mode + '","maxZ":' + r.maxZ +
    ',"freeStart":' + r.freeStart + ',"buried":' + r.buried +
    ',"buriedPct":' + r.buriedPct + '}';
}).join(',\n');

const out = [
  '/* ============================================================',
  '   AUTO-GENERATED by tools/build-solvable.js — DO NOT edit.',
  '   Precomputed solvability for all 330 levels (v1.0.0 Arcade & Classic).',
  '   Regenerate with: node tools/build-solvable.js',
  '   ============================================================ */',
  '',
  'var SOLVABLE_LEVELS = {\n' + body + '\n};',
  ''
].join('\n');

fs.writeFileSync(path.join(dir, 'solvable-levels.js'), out);
console.log('[build-solvable] scritto solvable-levels.js con ' + Object.keys(result).length + ' livelli');
console.log('[build-solvable] esempio L1:', JSON.stringify(result[0]));
console.log('[build-solvable] esempio L10 (Classic):', JSON.stringify(result[9]));
console.log('[build-solvable] esempio L330:', JSON.stringify(result[329]));
