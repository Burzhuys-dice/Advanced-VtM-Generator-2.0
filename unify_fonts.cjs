const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We only want to modify step-1 inputs, or just all inputs/textareas globally if they should match.
// Let's just fix the classes on the specific inputs in Step 1.

// Character Name
html = html.replace('sm:text-lg p-2 border font-serif', 'text-sm p-2 border');

// Concept Phrase
html = html.replace('sm:text-base p-2 border', 'text-sm p-2 border');

// Replace sm:text-sm with text-sm across textareas
html = html.replace(/sm:text-sm p-2/g, 'text-sm p-2');

fs.writeFileSync('index.html', html);
console.log("Replaced font classes");
