#!/usr/bin/env node
/* ============================================================
   TEST TEMPLE STEPS — regressione rendering FULL-su-HALF (v0.9.2).
   Esegue: node games/mahjong/tests/test-temple-steps.js

   Il bug: le FULL z2 di temple_steps poggiano sull'incrocio di 4
   HALF (offset stack), ma layoutPos() le disegnava con l'offset 3D
   delle FULL dritte (in alto a destra) → le HALF sotto sembravano
   libere ma erano bloccate ("libere ma non cliccabili", es. L175).

   Verifiche:
     1. buildBoard() marca come `onHalf` le FULL z2 senza supporto
        dritto ma con 4 HALF sotto (logica speculare a onHalfs in
        validateSupport).
     2. layoutPos() le centra sull'incrocio: y = riga + z*½ riga
        (shiftY negativo = giù), shiftX = 0.
     3. L'apice z3 di large resta stacking dritto (supporto FULL
        diretto) → NON onHalf.
     4. Parità: tutti i conteggi multipli di 4 (già coperto da
        generateLevel, qui verificato sul builder grezzo).
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
  '  /* 1. HALF z1 di medium: deve essere marcatura onHalf sulla FULL z2 */',
  '  const medium = LAYOUT_BUILDERS["temple_steps"]["medium"]();',
  '  const tiles = medium.map((p, i) => ({',
  '    z: p.z, x: p.x, y: p.y, isHalf: !!p.isHalf, symbol: "S" + i,',
  '    key: p.z + "," + p.x + "," + p.y,',
  '    removed: false, staging: false, faceDown: false, obscured: false',
  '  }));',
  '  const board = buildBoard(tiles);',
  '  const z2 = tiles.filter(t => t.z === 2);',
  '  const allOnHalf = z2.every(t => t.onHalf === true);',
  '  if (!allOnHalf) {',
  '    failures++;',
  '    console.log("FAIL: FULL z2 di temple_steps/medium non marcate onHalf");',
  '  }',
  '',
  '  /* 2. layoutPos: FULL z2 a (2,1) deve stare UNA RIGA sotto la sua',
  '        griglia (centrata sull\'incrocio delle HALF y1+y2). */',
  '  const m = computeMetrics(tiles);',
  '  const t21 = tiles.find(t => t.z === 2 && t.x === 2 && t.y === 1);',
  '  const pos = layoutPos(t21, m);',
  '  const expectedY = PAD + topPadOf(m) + (1 - m.minY) * STEP_Y + Math.round(2 * STEP_Y / 2);',
  '  if (pos.y !== expectedY || pos.x !== PAD + (2 - m.minX) * STEP_X) {',
  '    failures++;',
  '    console.log("FAIL: layoutPos FULL z2 centrata male: got (" + pos.x + "," + pos.y + ") expected (" + (PAD + (2 - m.minX) * STEP_X) + "," + expectedY + ")");',
  '  }',
  '',
  '  /* 2b. la HALF z1 (1,1) resta dov\'era (½ riga sotto) — nessuna regressione */',
  '  const h11 = tiles.find(t => t.z === 1 && t.x === 1 && t.y === 1);',
  '  const posH = layoutPos(h11, m);',
  '  const expectedYH = PAD + topPadOf(m) + (1 - m.minY) * STEP_Y + Math.round(1 * STEP_Y / 2);',
  '  if (posH.y !== expectedYH) {',
  '    failures++;',
  '    console.log("FAIL: layoutPos HALF z1 cambiata: got " + posH.y + " expected " + expectedYH);',
  '  }',
  '',
  '  /* 3. apice z3 di large: supporto FULL diretto → NON onHalf, ma deve',
  '        EREDITARE il rowOff del supporto (scala a offset) e stare appena',
  '        SOPRA di esso (stackDepth 1), non "ampiamente sopra". */',
  '  const large = LAYOUT_BUILDERS["temple_steps"]["large"]();',
  '  const tilesL = large.map((p, i) => ({',
  '    z: p.z, x: p.x, y: p.y, isHalf: !!p.isHalf, symbol: "S" + i,',
  '    key: p.z + "," + p.x + "," + p.y,',
  '    removed: false, staging: false, faceDown: false, obscured: false',
  '  }));',
  '  const boardL = buildBoard(tilesL);',
  '  const apex = tilesL.find(t => t.z === 3);',
  '  const support = tilesL.find(t => t.z === 2 && t.x === 4 && t.y === 1);',
  '  if (!apex || apex.onHalf) {',
  '    failures++;',
  '    console.log("FAIL: apice z3 di temple_steps/large deve essere stacking dritto (non onHalf)");',
  '  }',
  '  if (!apex || !support || Math.abs((apex.rowOff || 0) - (support.rowOff || 0)) > 0.001) {',
  '    failures++;',
  '    console.log("FAIL: apice z3 deve EREDITARE il rowOff del supporto (" + (apex ? apex.rowOff : "?") + " vs " + (support ? support.rowOff : "?") + ")");',
  '  }',
  '  const mL = computeMetrics(tilesL);',
  '  const posApex = layoutPos(apex, mL);',
  '  const posSup = layoutPos(support, mL);',
  '  const gap = posSup.y - posApex.y;',
  '  if (Math.abs(gap - Z_OFFSET_Y) > 1) {',
  '    failures++;',
  '    console.log("FAIL: apice z3 a y=" + posApex.y + ", supporto a y=" + posSup.y + " → gap " + gap + " (atteso ~" + Z_OFFSET_Y + "px)");',
  '  }',
  '',
  '  /* 4. rowOff della scala: HALF z1 = 0.5, FULL z2-on-HALF = 1.0 */',
  '  const tH = tilesL.find(t => t.z === 1 && t.x === 1 && t.y === 0);',
  '  const tF = tilesL.find(t => t.z === 2 && t.x === 2 && t.y === 1);',
  '  if (!tH || Math.abs((tH.rowOff || 0) - 0.5) > 0.001) {',
  '    failures++;',
  '    console.log("FAIL: HALF z1 rowOff atteso 0.5, got " + (tH ? tH.rowOff : "?"));',
  '  }',
  '  if (!tF || Math.abs((tF.rowOff || 0) - 1.0) > 0.001) {',
  '    failures++;',
  '    console.log("FAIL: FULL z2-on-HALF rowOff atteso 1.0, got " + (tF ? tF.rowOff : "?"));',
  '  }',
  '',
  '  /* 4. conteggi multipli di 4 (builders grezzi) */',
  '  ["small", "medium", "large"].forEach(function (v) {',
  '    const l = LAYOUT_BUILDERS["temple_steps"][v]();',
  '    if (l.length % 4 !== 0) {',
  '      failures++;',
  '      console.log("FAIL: temple_steps/" + v + " = " + l.length + " tile (non multiplo di 4)");',
  '    }',
  '  });',
  '',
  '  if (failures === 0) { console.log("PASS"); process.exit(0); }',
  '  console.log(failures + " failures");',
  '  process.exit(1);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);