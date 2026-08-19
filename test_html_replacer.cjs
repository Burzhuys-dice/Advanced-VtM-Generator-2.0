const fs = require('fs');

const testHtml = `
<div class="p-4 bg-gray-100">
    <h3 class="font-bold text-red-600">Клан Бруха</h3>
    <p>Для <strong>Бруха</strong> Кров — це паливо. Ваш <a href="#" class="text-blue-500">Сір</a> прийшов до вас у темряві.</p>
    <div data-info="Маскарад і Камарилья">Камарилья ретельно оберігає Маскарад від Другої Інквізиції.</div>
</div>
`;

// Simple terms for testing
const testTerms = [
    { term: "КРОВ", regex: /кров(?:'|’)?(?:і|ю)?/i },
    { term: "СIP", regex: /[сc][іi][рr](?:а|ові|ом|еві|и|ів|ам|ами|ах)?/i },
    { term: "КАМАРИЛЬЯ", regex: /камариль(?:я|ї|єю|ю|і)/i },
    { term: "МАСКАРАД", regex: /маскарад(?:у|ом|і)?/i },
    { term: "ДРУГА ІНКВІЗИЦІЯ", regex: /друг(?:а|ої|ій|у|ою)\s+інквізиці(?:я|ї|єю|ю|і)/i }
];

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function replaceTermsInPlainText(text) {
    let result = text;
    testTerms.forEach(rule => {
        const pattern = new RegExp(`(?<![а-яіїєґa-z0-9_])(${rule.regex.source})(?![а-яіїєґa-z0-9_])`, 'gui');
        result = result.replace(pattern, (match) => {
            const escapedTerm = escapeHtml(rule.term);
            return `<span class="vtm-glossary-term" data-term="${escapedTerm}" onclick="event.stopPropagation(); openGlossaryModalWithTerm('${escapedTerm}')" title="Термін словника: ${escapedTerm}">${match}</span>`;
        });
    });
    return result;
}

function highlightGlossaryTerms(html) {
    if (!html || typeof html !== 'string') return html;
    const parts = html.split(/(<[^>]+>)/g);
    return parts.map(part => {
        if (part.startsWith('<') && part.endsWith('>')) {
            return part;
        }
        return replaceTermsInPlainText(part);
    }).join('');
}

const res = highlightGlossaryTerms(testHtml);
console.log("Result HTML:\n", res);
