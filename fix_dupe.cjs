const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(/const shortConcept = concept.split\(\/\[:\\\\-\\\\—\]\/\)\[0\]\.trim\(\);\n    const shortConcept = concept.split\(\/\[:\\\\-\\\\—\]\/\)\[0\]\.trim\(\);/g, "const shortConcept = concept.split(/[:\\\\-\\\\—]/)[0].trim();");

fs.writeFileSync('app.js', code);
