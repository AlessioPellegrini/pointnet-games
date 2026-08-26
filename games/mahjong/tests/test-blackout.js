#!/usr/bin/env node
/* ============================================================
   TEST BLACKOUT (v0.9) — verifica la meccanica "piano base oscurato".
   Esegue: node games/mahjong/tests/test-blackout.js
   Controlli:
     1. I livelli blackout partono SOLO da n>=224 (1-based: 225+)
        e sono alternati (n pari, 0-based).
     2. generateLevel() su un livello blackout mette obscured=true
        su TUTTE e SOLO le tile z=0 (mai su z>0).
     3. generateLevel() su un livello non-blackout NON produce tile obscured.
     4. Il totale tile è sempre multiplo di 4 (4 copie per simbolo).
     5. Esiste almeno una tile obscured LIBERA all'avvio → l'auto-reveal
        (ui.js) la scoprirebbe subito e il livello è giocabile.
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
  '  const progression = buildProgression(300);',
  '  const blackIdx = [];',
  '  progression.forEach((p, i) => { if (p.blackout) blackIdx.push(i); });',
  '  /* v0.9.3: il blackout parte da livello ~101 (indice 100) ed è alternato */',
  '  const badRange = blackIdx.filter(i => i < 100);',
  '  const badAlt = blackIdx.filter(i => i % 2 !== 0);',
  '  console.log("blackout levels:", blackIdx.length, "range:", blackIdx.length ? (blackIdx[0] + 1) + "-" + (blackIdx[blackIdx.length - 1] + 1) : "none");',
  '  let failures = (badRange.length + badAlt.length) ? badRange.concat(badAlt) : [];',
  '',
  '  /* Campioni da controllare con generateLevel() */',
  '  const samples = [100, 99, 120, 224, 249, 274, 298];',
  '  samples.forEach(function (idx) {',
  '    const tiles = generateLevel(idx);',
  '    const def = getLevelDef(idx);',
  '    const obscuredZ0 = tiles.filter(t => t.obscured && t.z === 0).length;',
  '    const obscuredHigh = tiles.filter(t => t.obscured && t.z > 0).length;',
  '    const z0Total = tiles.filter(t => t.z === 0).length;',
  '    const total = tiles.length;',
  '    if (def.blackout) {',
  '      if (obscuredZ0 !== z0Total) failures.push("L" + (idx + 1) + " z0 partial " + obscuredZ0 + "/" + z0Total);',
  '      if (obscuredHigh !== 0) failures.push("L" + (idx + 1) + " z>0 obscured: " + obscuredHigh);',
  '      /* auto-reveal: almeno una obscured libera all\'inizio */',
  '      const board = buildBoard(tiles);',
  '      const freeObscured = tiles.filter(t => t.obscured && isFree(board, t)).length;',
  '      if (freeObscured === 0) failures.push("L" + (idx + 1) + " no free obscured tile (blocked start)");',
  '    } else {',
  '      if (obscuredZ0 + obscuredHigh !== 0) failures.push("L" + (idx + 1) + " unexpected obscured");',
  '    }',
  '    if (total % 4 !== 0) failures.push("L" + (idx + 1) + " total not %4: " + total);',
  '  });',
  '',
  '  if (failures.length) {',
  '    console.log("FAIL:");',
  '    failures.forEach(f => console.log("  -", f));',
  '    process.exit(1);',
  '  }',
  '  console.log("PASS");',
  '  process.exit(0);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);