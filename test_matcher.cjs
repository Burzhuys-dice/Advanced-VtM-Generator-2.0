const fs = require('fs');
const glossary = JSON.parse(fs.readFileSync('data/vtm_glossary.json', 'utf8'));

// Build pattern table
// For each term, extract the clean headword and define regex variations
const termRules = [];

glossary.forEach((item, index) => {
    // Remove (АРХАЇЧНЕ), (ГРУБЕ), (ВУЛЬГАРНЕ) from term name for matching
    const rawHead = item.term.replace(/\s*\([^)]*\)/g, '').trim();
    
    // We want rules that match various inflections in Ukrainian
    // Let's create patterns for each
    termRules.push({
        index: index,
        term: item.term,
        cleanTerm: rawHead,
        definition: item.definition
    });
});

console.log("Extracted terms sample:", termRules.slice(0, 15));
