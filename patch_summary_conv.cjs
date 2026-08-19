const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const targetSummary = `                                <div>
                                    <span class="font-bold text-[#8b0000]">2.</span> \${conv2 ? \`<span class="italic">«\${conv2}»</span>\` : '<span class="text-gray-400">________________________</span>'}
                                    \${touch2 ? \`<div class="text-[7pt] text-gray-700 font-sans uppercase font-bold pl-2">Опора: \${touch2}</div>\` : ''}
                                </div>`;

const replaceSummary = targetSummary + `
                                <div class="mt-1">
                                    <span class="font-bold text-[#8b0000]">3.</span> \${conv3 ? \`<span class="italic">«\${conv3}»</span>\` : '<span class="text-gray-400">________________________</span>'}
                                    \${touch3 ? \`<div class="text-[7pt] text-gray-700 font-sans uppercase font-bold pl-2">Опора: \${touch3}</div>\` : ''}
                                </div>`;

if(code.includes(targetSummary)) {
    code = code.replace(targetSummary, replaceSummary);
    fs.writeFileSync('app.js', code);
    console.log("Success app.js part 2");
} else {
    console.log("Target not found!");
}
