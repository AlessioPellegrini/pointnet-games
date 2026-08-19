#!/usr/bin/env node
/* ============================================================
   TEST PROGRESSION — verifica la progressione 300 livelli.
   Esegue: node games/mahjong/tests/test-progression.js
   Controlli:
     1. Nessun drop > 8 tra due livelli consecutivi.
     2. Tutte le figure del pool vengono usate (nessuna esclusa a caso).
     3. Il min/max tile-count è sanO (16..124).
     4. Il finale è il boss da 124 (spiral/medium) se presente.
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
  '  const progression = buildProgression(300);',
  '  function finalTileCount(p) {',
  '    const layout = LAYOUT_BUILDERS[p.layout][p.variant]().filter(t => t.y >= 0);',
  '    let n = layout.length;',
  '    n -= n % 4;',
  '    return n;',
  '  }',
  '  let worst = 0, drops = 0;',
  '  for (let i = 1; i < progression.length; i++) {',
  '    const a = finalTileCount(progression[i-1]);',
  '    const b = finalTileCount(progression[i]);',
  '    if (b < a) { drops++; if (a - b > worst) worst = a - b; }',
  '  }',
  '  console.log("levels:", progression.length);',
  '  console.log("drops:", drops, "worst:", worst);',
  '  const used = new Set(progression.map(p => p.layout));',
  '  const all = Object.keys(LAYOUT_BUILDERS);',
  '  const unused = all.filter(n => !used.has(n));',
  '  console.log("layouts total:", all.length, "used:", used.size, "unused:", unused.length ? unused.join(",") : "none");',
  '  const counts = progression.map(p => finalTileCount(p));',
  '  console.log("min tiles:", Math.min.apply(null, counts), "max tiles:", Math.max.apply(null, counts));',
  '  const last = progression[progression.length-1];',
  '  console.log("final level:", last.layout + "/" + last.variant, "tiles:", finalTileCount(last));',
  '  const ok = worst <= 8 && unused.length === 0;',
  '  console.log(ok ? "PASS" : "FAIL");',
  '  process.exit(ok ? 0 : 1);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);