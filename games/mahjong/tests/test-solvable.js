#!/usr/bin/env node
/* ============================================================
   TEST SOLVABLE (Piano A, v0.9.5) — verifica il precompute.
   Esegue: node games/mahjong/tests/test-solvable.js

   Controlli:
     1. solvable-levels.js esiste e SOLVABLE_LEVELS copre 300 livelli.
     2. generateLevel() con il precompute NON esegue il DFS: ogni
        livello si genera in < 250ms (prima 3-6s sui livelli densi).
     3. Il livello generato è giocabile (coppia libera e scoperte).
    ============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = path.join(__dirname, '..');
const ctx = { console, process };
vm.createContext(ctx);
const load = [
  fs.readFileSync(path.join(dir, 'layouts.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'solvable-levels.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'data.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'engine.js'), 'utf8')
].join('\n') + '\n' + [
  '(function () {',
  '  let failures = 0;',
  '',
  '  /* 1. copertura dei 300 livelli */',
  '  const keys = Object.keys(SOLVABLE_LEVELS).map(Number);',
  '  if (keys.length !== 300) {',
  '    failures++;',
  '    console.log("FAIL: SOLVABLE_LEVELS ha " + keys.length + " livelli (attesi 300)");',
  '  }',
  '',
  '  /* 2. generateLevel veloce (nessun DFS runtime) */',
  '  const dense = [199, 224, 249, 274, 298, 299];',
  '  let worst = 0;',
  '  dense.forEach(function (idx) {',
  '    const t0 = Date.now();',
  '    const tiles = generateLevel(idx);',
  '    const ms = Date.now() - t0;',
  '    if (ms > worst) worst = ms;',
  '    if (ms > 250) {',
  '      failures++;',
  '      console.log("FAIL: L" + (idx + 1) + " generato in " + ms + "ms (>250, DFS runtime presente?)");',
  '    }',
  '  });',
  '  console.log("peggiore livello denso: " + worst + "ms");',
  '',
  '  /* 3. giocabilità di un campione */',
  '  [0, 50, 100, 174, 209, 249].forEach(function (idx) {',
  '    const tiles = generateLevel(idx);',
  '    const board = buildBoard(tiles);',
  '    const sym = {};',
  '    tiles.forEach(function (t) {',
  '      if (t.removed || t.staging || t.faceDown) return;',
  '      if (!isFree(board, t)) return;',
  '      sym[t.symbol] = (sym[t.symbol] || 0) + 1;',
  '    });',
  '    let hasPair = false;',
  '    for (const s in sym) if (sym[s] >= 2) hasPair = true;',
  '    if (!hasPair) {',
  '      failures++;',
  '      console.log("FAIL: L" + (idx + 1) + " nessuna coppia libera scoperta");',
  '    }',
  '  });',
  '',
  '  if (failures === 0) { console.log("PASS"); process.exit(0); }',
  '  console.log(failures + " failures");',
  '  process.exit(1);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);
