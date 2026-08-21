const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

code = code.replace(
  '${merit.desc || \'Очікує повного тексту...\'}',
  '${(merit.desc || \'\').replace(/\\*\\*(.*?)\\*\\*/g, \'<strong class="font-bold text-zinc-900">$1</strong>\')}'
);

fs.writeFileSync('v6Generator.js', code);
console.log('Patched merit markdown rendering');
