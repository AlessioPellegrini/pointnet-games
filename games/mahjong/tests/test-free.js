#!/usr/bin/env node
/* ============================================================
   TEST FREE — regressione off-by-one geometria HALF (v0.9.1).
   Esegue: node games/mahjong/tests/test-free.js

   Il bug: a tile base (bx,by) è coperta da una HALF che sta
   sull'incrocio delle righe by-1/by (half a riga by-1) o by/by+1
   (half a riga by). Il vecchio codice cercava la half a by+1 →
   la prima riga risultava iper-bloccata, l'ultima ipo-bloccata.

   Verifiche su halfcover/small (griglia 4×5, half 3×3 a z1):
     1. (0,0) deve essere LIBERA (nessuna half sopra: prima riga).
     2. (0,4) deve essere BLOCCATA (half (1,3) sull'incrocio
        (0,3),(2,3),(0,4),(2,4)).
     Con la logica sbagliata i due risultati erano INVERTITI.
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
  '  const layout = LAYOUT_BUILDERS["halfcover"]["small"]();',
  '  const tiles = layout.map((p, i) => ({',
  '    z: p.z, x: p.x, y: p.y, isHalf: !!p.isHalf, symbol: "S" + i,',
  '    key: p.z + "," + p.x + "," + p.y,',
  '    removed: false, staging: false, faceDown: false, obscured: false',
  '  }));',
  '  const board = buildBoard(tiles);',
  '  const byKey = {};',
  '  tiles.forEach(t => { byKey[t.key] = t; });',
  '',
  '  const t00 = byKey["0,0,0"];',
  '  const t04 = byKey["0,0,4"];',
  '  const free00 = t00 && isFree(board, t00);',
  '  const free04 = t04 && isFree(board, t04);',
  '  console.log("halfcover/small  (0,0) free =", free00, "| (0,4) free =", free04);',
  '',
  '  const ok00 = free00 === true;',
  '  const ok04 = free04 === false;',
  '',
  '  /* La half (1,3) copre (0,4)? Verifica diretta della coerenza */',
  '  const half13 = byKey["1,1,3"];',
  '  const halfCovers04 = half13 && hasHalfCoverAbove(board, t04);',
  '  if (halfCovers04 !== true) {',
  '    console.log("FAIL: hasHalfCoverAbove(0,4) non trova la half (1,3)");',
  '    process.exit(1);',
  '  }',
  '',
  '  if (ok00 && ok04) {',
  '    console.log("PASS");',
  '    process.exit(0);',
  '  }',
  '  console.log("FAIL: attesi (0,0) libera e (0,4) bloccata");',
  '  process.exit(1);',
  '})();'
].join('\n');
vm.runInContext(load, ctx);