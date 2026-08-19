const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const standardClass = "w-full rounded border-gray-300 p-2 text-sm border bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500";
const standardTextarea = standardClass + " resize-y";

// 1. character-name
html = html.replace(
    'class="custom-input text-xl w-full border border-gray-300 rounded p-2"', 
    `class="${standardClass}"`
);

// 2. concept-phrase
html = html.replace(
    'class="custom-input text-base sm:text-lg w-full border border-gray-300 rounded p-2.5 resize-y leading-relaxed"',
    `class="${standardTextarea}"`
);

// 3. concept-bg
html = html.replace(
    'class="custom-input w-full border border-gray-300 rounded p-2 text-sm leading-relaxed"',
    `class="${standardTextarea}"`
);

// 4. chronicle-tenets
html = html.replace(
    'class="w-full rounded border-gray-300 p-2 text-sm border bg-white"',
    `class="${standardTextarea}"` // wait, there might be multiple of these
);

fs.writeFileSync('index.html', html);
console.log("Fixed standard fields");
