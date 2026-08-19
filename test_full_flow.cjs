const fs = require('fs');

const clansData = JSON.parse(fs.readFileSync('data/clans.json', 'utf8') || '{}');
const predatorsData = JSON.parse(fs.readFileSync('data/predator_types.json', 'utf8') || '[]');
const advantagesData = JSON.parse(fs.readFileSync('data/merits_and_flaws.json', 'utf8') || '[]');
const glossary = JSON.parse(fs.readFileSync('data/vtm_glossary.json', 'utf8') || '[]');

console.log("Clans loaded:", Object.keys(clansData).length);
console.log("Predators loaded:", predatorsData.length);
console.log("Advantages loaded:", advantagesData.length);
console.log("Glossary loaded:", glossary.length);
