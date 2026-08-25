const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

code = code.replace(
    /const allPowers = getV6PowersForDiscipline\(discId\);/g,
    "const disc = getV6Disciplines().find(d => d.id === discId);\n            const allPowers = disc && disc.powers ? disc.powers : [];"
);

fs.writeFileSync('v6Generator.js', code);
