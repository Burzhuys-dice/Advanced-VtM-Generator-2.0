const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const standardInput = 'w-full rounded border-gray-300 p-2 text-sm border bg-white focus:border-[#8b0000] focus:ring-[#8b0000] outline-none shadow-sm transition-colors';
const standardTextarea = standardInput + ' resize-y leading-relaxed';

// Use regex to replace class="..." for all relevant inputs in step 1.
const idsText = ['character-name', 'chronicle-name', 'sire-name', 'ambition-phrase', 'desire-phrase', 'bio-dob', 'bio-dod', 'bio-age', 'bio-appearance', 'bio-distinguishing'];
const idsTextarea = ['concept-phrase', 'concept-bg', 'chronicle-tenets', 'conviction1', 'touchstone1', 'conviction2', 'touchstone2', 'conviction3', 'touchstone3'];

idsText.forEach(id => {
    const regex = new RegExp(`(id="${id}"[^>]*class=")[^"]*(")`);
    html = html.replace(regex, `$1${standardInput}$2`);
});

idsTextarea.forEach(id => {
    const regex = new RegExp(`(id="${id}"[^>]*class=")[^"]*(")`);
    html = html.replace(regex, `$1${standardTextarea}$2`);
});

fs.writeFileSync('index.html', html);
console.log("All text inputs and textareas in step 1 standardized!");
