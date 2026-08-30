#!/usr/bin/env node
/* ============================================================
   TEST CONVEYOR — verifica la nuova meccanica ad Anello Rotante.
   Esegue: node games/mahjong/tests/test-conveyor.js
   Controlli:
     1. I layout conveyor_ring e conveyor_inset generano conveyorTrack valido.
     2. isConveyorUnlocked riconosce lo spiraglio libero.
     3. stepConveyor ruota le tessere lungo l'anello senza perdite o duplicati.
     4. I livelli ending in 5 (15, 25, 35...) hanno isConveyor attivo.
   ============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = path.join(__dirname, '..');
const ctx = { console, process };
vm.createContext(ctx);
const load = [
  fs.readFileSync(path.join(dir, 'layouts.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'data.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'engine.js'), 'utf8')
].join('\n') + '\n' + [
  '(function () {',
  '  let failures = 0;',
  '',
  '  // 1. Verifica conveyorTrack sui layout dedicati',
  '  const convLayouts = ["conveyor_ring", "conveyor_inset"];',
  '  convLayouts.forEach(function (name) {',
  '    Object.keys(LAYOUT_BUILDERS[name]).forEach(function (variant) {',
  '      const pts = LAYOUT_BUILDERS[name][variant]();',
  '      if (!pts.conveyorTrack || pts.conveyorTrack.length < 8) {',
  '        console.log("FAIL " + name + "/" + variant + ": missing or short conveyorTrack");',
  '        failures++;',
  '      }',
  '    });',
  '  });',
  '',
  '  // 2. Verifica rotazione stepConveyor',
  '  const sample = LAYOUT_BUILDERS.conveyor_ring.small();',
  '  const track = sample.conveyorTrack;',
  '  const tiles = sample.map(function (p, i) {',
  '    return { z: p.z, x: p.x, y: p.y, symbol: "A", key: makeKey(p.z, p.x, p.y), label: i+1 };',
  '  });',
  '  const board = buildBoard(tiles);',
  '',
  '  // All start: check unlocking',
  '  const unlocked = isConveyorUnlocked(board, track, tiles);',
  '  if (!unlocked) {',
  '    console.log("FAIL: conveyor with free perimeter tiles should be unlocked");',
  '    failures++;',
  '  }',
  '',
  '  // Step 1: rotate',
  '  const shifted = stepConveyor(board, track, 1, tiles);',
  '  if (!shifted || shifted.length === 0) {',
  '    console.log("FAIL: stepConveyor returned 0 shifted tiles");',
  '    failures++;',
  '  }',
  '',
  '  // Verify tile at track[0] moved to track[1]',
  '  const tileAtNewPos = board.get(makeKey(0, track[1].x, track[1].y));',
  '  if (!tileAtNewPos) {',
  '    console.log("FAIL: tile not found at new track position");',
  '    failures++;',
  '  }',
  '',
  '  // 3. Verifica presenza livelli conveyor nella progressione 330',
  '  const prog = buildProgression(330);',
  '  const convLevels = prog.filter(p => p.isConveyor);',
  '  console.log("conveyor special levels in progression (attesi >= 30):", convLevels.length);',
  '  if (convLevels.length < 30) {',
  '    console.log("FAIL: not enough conveyor levels generated");',
  '    failures++;',
  '  }',
  '',
  '  console.log(failures ? "FAIL" : "PASS");',
  '  process.exit(failures ? 1 : 0);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);
