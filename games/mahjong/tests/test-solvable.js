#!/usr/bin/env node
/* ============================================================
   TEST SOLVABLE (v1.0.0 Arcade & Classic) — verifica il precompute.
   Esegue: node games/mahjong/tests/test-solvable.js

   Controlli:
     1. solvable-levels.js esiste e SOLVABLE_LEVELS copre 330 livelli.
     2. generateLevel() con il precompute NON esegue il DFS: ogni
        livello si genera in < 250ms (inclusi i 144 classic).
     3. I livelli generati sono giocabili (coppia libera matchabile).
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
  fs.readFileSync(path.join(dir, 'engine.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'data.js'), 'utf8')
].join('\n') + '\n' + [
  '(function () {',
  '  let failures = 0;',
  '',
  '  /* 1. copertura dei 330 livelli */',
  '  const keys = Object.keys(SOLVABLE_LEVELS).map(Number);',
  '  if (keys.length !== 330) {',
  '    failures++;',
  '    console.log("FAIL: SOLVABLE_LEVELS ha " + keys.length + " livelli (attesi 330)");',
  '  }',
  '',
  '  /* 2. generateLevel veloce (nessun DFS runtime) */',
  '  const sample = [0, 9, 50, 99, 149, 199, 249, 299, 329];',
  '  let worst = 0;',
  '  sample.forEach(function (idx) {',
  '    const t0 = Date.now();',
  '    const tiles = generateLevel(idx);',
  '    const ms = Date.now() - t0;',
  '    if (ms > worst) worst = ms;',
  '    if (ms > 250) {',
  '      failures++;',
  '      console.log("FAIL: L" + (idx + 1) + " generato in " + ms + "ms (>250, DFS runtime presente?)");',
  '    }',
  '  });',
  '  console.log("peggiore livello campione: " + worst + "ms");',
  '',
  '  /* 3. giocabilità di un campione (almeno una coppia matchabile all avvio) */',
  '  [0, 9, 50, 99, 174, 209, 249, 329].forEach(function (idx) {',
  '    const def = getLevelDef(idx);',
  '    const tiles = generateLevel(idx);',
  '    const board = buildBoard(tiles);',
  '    const free = [];',
  '    tiles.forEach(function (t) {',
  '      if (t.removed || t.staging || t.faceDown || t.obscured) return;',
  '      if (isFree(board, t)) free.push(t);',
  '    });',
  '    let hasPair = false;',
  '    for (let i = 0; i < free.length; i++) {',
  '      for (let j = i + 1; j < free.length; j++) {',
  '        if (canMatch(free[i], free[j], def.mode)) { hasPair = true; break; }',
  '      }',
  '      if (hasPair) break;',
  '    }',
  '    const ok = hasPair || (def.mode === "arcade" && free.length >= 4);',
  '    if (!ok) {',
  '      failures++;',
  '      console.log("FAIL: L" + (idx + 1) + " (" + def.mode + ") livello non giocabile all avvio (free: " + free.length + ", pair: " + hasPair + ")");',
  '    }',
  '  });',
  '',
  '  if (failures === 0) { console.log("PASS"); process.exit(0); }',
  '  console.log(failures + " failures");',
  '  process.exit(1);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);
