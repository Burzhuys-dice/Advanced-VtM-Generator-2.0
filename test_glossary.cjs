const fs = require('fs');
const glossary = JSON.parse(fs.readFileSync('data/vtm_glossary.json', 'utf8'));

console.log(`Total glossary terms: ${glossary.length}`);
