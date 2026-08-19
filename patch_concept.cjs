const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const target1 = "const concept = document.getElementById('concept-phrase')?.value || '';";
const replacement1 = "const concept = document.getElementById('concept-phrase')?.value || '';\n    const shortConcept = concept.split(/[:\\-\\—]/)[0].trim();";

const target2 = "if (summaryConceptEl) summaryConceptEl.innerText = `${concept || 'Без концепту'} | ${clanName} | ${predatorName}`;";
const replacement2 = "if (summaryConceptEl) summaryConceptEl.innerText = `${shortConcept || 'Без концепту'} | ${clanName} | ${predatorName}`;";

const target3 = "<div class=\"vtm-profile-cell\"><span class=\"vtm-cell-label\">Концепт:</span> <span class=\"vtm-cell-val\">${concept}</span></div>";
const replacement3 = "<div class=\"vtm-profile-cell\"><span class=\"vtm-cell-label\">Концепт:</span> <span class=\"vtm-cell-val\">${shortConcept}</span></div>";

const target4 = "<p class=\"mb-2\"><strong class=\"text-gray-700 uppercase text-xs tracking-wider block\">Концепт:</strong> <span class=\"text-gray-900 font-serif text-base\">${concept || 'Не вказано'}</span></p>";
const replacement4 = "<p class=\"mb-2\"><strong class=\"text-gray-700 uppercase text-xs tracking-wider block\">Концепт:</strong> <span class=\"text-gray-900 font-serif text-base\">${shortConcept || 'Не вказано'}</span></p>";

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);
code = code.replace(target4, replacement4);

fs.writeFileSync('app.js', code);
