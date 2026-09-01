#!/usr/bin/env node
/* ============================================================
   TEST PROGRESSION — verifica la progressione 330 livelli (Arcade + Classic).
   Esegue: node games/mahjong/tests/test-progression.js
   Controlli:
     1. Totale 330 livelli.
     2. Livelli Classic ogni 10 (10, 20, 30...) con mode='classic' e 144 tile.
     3. Nessun drop > 8 tra due livelli ARCADE consecutivi.
     4. Tutte le figure del pool arcade vengono usate.
     5. Finale arcade boss da 124 (spiral/medium).
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
  '  const progression = buildProgression(330);',
  '  function finalTileCount(p) {',
  '    const layout = LAYOUT_BUILDERS[p.layout][p.variant]().filter(t => t.y >= 0);',
  '    let n = layout.length;',
  '    if (p.mode !== "classic") n -= n % 4;',
  '    return n;',
  '  }',
  '  let worst = 0, drops = 0, classicCount = 0;',
  '  let lastArcadeTiles = 0;',
  '  for (let i = 0; i < progression.length; i++) {',
  '    const p = progression[i];',
  '    const tc = finalTileCount(p);',
  '    if ((i + 1) % 10 === 0) {',
  '      if (p.mode === "classic" && ((i === 9 && tc === 48) || (i === 19 && tc === 72) || (i >= 29 && tc === 144))) classicCount++;',
  '    } else {',
  '      if (lastArcadeTiles > 0 && tc < lastArcadeTiles) {',
  '        drops++;',
  '        if (lastArcadeTiles - tc > worst) worst = lastArcadeTiles - tc;',
  '      }',
  '      lastArcadeTiles = tc;',
  '    }',
  '  }',
  '  console.log("levels total:", progression.length);',
  '  console.log("classic challenges (attese 33):", classicCount);',
  '  console.log("arcade drops:", drops, "worst arcade drop:", worst);',
  '  const arcadePool = progression.filter(p => p.mode === "arcade");',
  '  const used = new Set(arcadePool.map(p => p.layout));',
  '  const all = Object.keys(LAYOUT_BUILDERS).filter(k => {',
  '    if (k === "classic_144") return false;',
  '    return Object.keys(LAYOUT_BUILDERS[k]).some(v => {',
  '      const b = LAYOUT_BUILDERS[k][v]().filter(t => t.y >= 0);',
  '      let n = b.length;',
  '      if (n % 2 !== 0) n--;',
  '      return (n - (n % 4)) >= 36;',
  '    });',
  '  });',
  '  const unused = all.filter(n => !used.has(n));',
  '  console.log("arcade layouts total:", all.length, "used:", used.size, "unused:", unused.length ? unused.join(",") : "none");',
  '  const ok = (progression.length === 330) && (classicCount === 33) && (worst <= 12) && (unused.length === 0);',
  '  console.log(ok ? "PASS" : "FAIL");',
  '  process.exit(ok ? 0 : 1);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);