const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

code = code.replace(/p4Html = \\`/g, "p4Html = `");
code = code.replace(/<\/div>\\`/g, "</div>`");
fs.writeFileSync('v6Generator.js', code);
