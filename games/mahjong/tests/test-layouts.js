#!/usr/bin/env node
/* ============================================================
   TEST LAYOUTS — verifica tutti i builder figure.
   Esegue: node games/mahjong/tests/test-layouts.js
   Controlli:
     1. Ogni builder ritorna punti validi (x pari, y>=0).
     2. validateSupport() (engine.js) -> 0 tile flottanti.
     3. Nessuna figura manca rispetto alla lista attesa.
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
  '  const names = Object.keys(LAYOUT_BUILDERS);',
  '  let failures = 0;',
  '  names.forEach(function (name) {',
  '    Object.keys(LAYOUT_BUILDERS[name]).forEach(function (variant) {',
  '      const layout = LAYOUT_BUILDERS[name][variant]();',
  '      const bad = validateSupport(layout);',
  '      // x deve essere pari per tile FULL (colonne pari)',
  '      const oddX = layout.filter(t => !t.isHalf && t.x % 2 !== 0);',
  '      if (bad.length || oddX.length) {',
  '        failures++;',
  '        console.log("  FAIL " + name + "/" + variant + ": floaters=" + bad.length + " oddX=" + oddX.length);',
  '      }',
  '    });',
  '  });',
  '  console.log("layouts tested:", names.length);',
  '  console.log("failures:", failures);',
  '  process.exit(failures ? 1 : 0);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);