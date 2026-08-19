const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const targetListeners = `document.getElementById('btn-random-conviction2')?.addEventListener('click', () => {
    generateRandomConviction('conviction2', 'touchstone2');
});`;

const replaceListeners = targetListeners + `

document.getElementById('btn-random-conviction3')?.addEventListener('click', () => {
    generateRandomConviction('conviction3', 'touchstone3');
});`;

code = code.replace(targetListeners, replaceListeners);

const targetState = `    const conv2 = document.getElementById('conviction2')?.value || '';
    const touch2 = document.getElementById('touchstone2')?.value || '';`;

const replaceState = targetState + `
    const conv3 = document.getElementById('conviction3')?.value || '';
    const touch3 = document.getElementById('touchstone3')?.value || '';`;

code = code.replace(targetState, replaceState);

fs.writeFileSync('app.js', code);
console.log("Success app.js part 1");
