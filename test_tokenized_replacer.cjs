const fs = require('fs');

const rules = [
    { term: "КРОВНІ ПУТА", regex: /кровн(?:і|их|им|ими)\s+пут(?:а|ам|ами|ах)?/i },
    { term: "КРОВ", regex: /кров(?:'|’)?(?:і|ю)?/i },
    { term: "СIP", regex: /[сc][іi][рr](?:а|ові|ом|еві|и|ів|ам|ами|ах)?/i },
    { term: "КАМАРИЛЬЯ", regex: /камариль(?:я|ї|єю|ю|і)/i },
    { term: "МАСКАРАД", regex: /маскарад(?:у|ом|і)?/i },
    { term: "ДРУГА ІНКВІЗИЦІЯ", regex: /друг(?:а|ої|ій|у|ою)\s+інквізиці(?:я|ї|єю|ю|і)/i }
];

// Single pass finder:
// We find all matches and their start/end indices, sort by length (longest match first) and position,
// eliminate overlapping ranges, then rebuild the string.

function replaceTermsSinglePass(plainText) {
    const matches = [];
    
    rules.forEach(rule => {
        // Match with boundaries
        const pat = new RegExp(`(?<![а-яіїєґa-z0-9_])(${rule.regex.source})(?![а-яіїєґa-z0-9_])`, 'gui');
        let m;
        while ((m = pat.exec(plainText)) !== null) {
            matches.push({
                start: m.index,
                end: m.index + m[0].length,
                matchedText: m[0],
                term: rule.term
            });
        }
    });

    if (matches.length === 0) return plainText;

    // Sort matches: earlier start first; if same start, longer match first
    matches.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return (b.end - b.start) - (a.end - a.start);
    });

    // Filter out overlapping matches (keep earlier/longer)
    const nonOverlapping = [];
    let lastEnd = 0;
    matches.forEach(m => {
        if (m.start >= lastEnd) {
            nonOverlapping.push(m);
            lastEnd = m.end;
        }
    });

    // Reconstruct string
    let result = '';
    let curr = 0;
    nonOverlapping.forEach(m => {
        result += plainText.slice(curr, m.start);
        const safeTerm = m.term.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        result += `<span class="vtm-glossary-term cursor-pointer text-inherit underline decoration-dotted decoration-red-500/80 hover:decoration-solid hover:decoration-red-600 hover:text-red-700 dark:hover:text-red-400 transition-colors font-medium" data-term="${safeTerm}" onclick="event.stopPropagation(); openGlossaryModalWithTerm('${safeTerm}')" title="Словник: ${safeTerm}">${m.matchedText}</span>`;
        curr = m.end;
    });
    result += plainText.slice(curr);
    return result;
}

const sample = "Ваш Сір наклав кровні пута. Кров тече рікою. Камарилья та Маскарад під загрозою Другої Інквізиції.";
console.log(replaceTermsSinglePass(sample));
