const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

const targetSummaryStr = `                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Вади</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>`;

const replacementSummary = `                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Переваги</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>
                                <div class="text-[9px] min-h-[45px] space-y-0.5 mb-4">
                                    \${v6State.selectedMerits.length > 0 ? v6State.selectedMerits.map(mId => {
                                        const merit = getV6Merits().find(m => m.id === mId);
                                        return merit ? \`<div class="border-b border-zinc-100 pb-0.5">• \${merit.name}</div>\` : '';
                                    }).join('') : '<p class="text-zinc-400 italic">Відсутні</p>'}
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Вади</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>`;

if (code.includes(targetSummaryStr)) {
    code = code.replace(targetSummaryStr, replacementSummary);
    fs.writeFileSync('v6Generator.js', code);
    console.log('Successfully patched Summary');
} else {
    console.log('Target string for summary not found');
}
