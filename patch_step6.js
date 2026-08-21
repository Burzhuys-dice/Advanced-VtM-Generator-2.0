const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

const targetStr = `            \` : ''}

            <div class="flex justify-between pt-6 mt-8 border-t border-zinc-100">
                <button onclick="goToV6Step(5)"`;

const replacement = `            \` : ''}

            <!-- MERITS -->
            <div>
                <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                    <span>✨</span> Переваги (Merits)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    \${getV6Merits().map(merit => {
                        const isSel = v6State.selectedMerits.includes(merit.id);
                        return \`
                            <div class="p-4 rounded-xl border transition-all \${
                                isSel ? 'border-[#8b0000] bg-red-50/40 shadow-sm ring-1 ring-red-900/20' : 'border-zinc-200 bg-white hover:bg-zinc-50'
                            }">
                                <div class="flex items-center justify-between mb-1">
                                    <h4 class="font-bold text-xs text-zinc-900">\${merit.name}</h4>
                                    <button onclick="toggleV6Merit('\${merit.id}')" class="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all \${isSel ? 'bg-[#8b0000] text-white' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}">\${isSel ? 'Обрано' : 'Обрати'}</button>
                                </div>
                                <div class="text-[10px] text-zinc-400 mb-2">Вимога: \${merit.prereq || 'немає'}</div>
                                <p class="text-[11px] text-zinc-600 leading-relaxed mb-3">\${merit.shortDesc || ''}</p>
                                
                                <details class="group">
                                    <summary class="text-[10px] text-[#8b0000] font-bold cursor-pointer select-none list-none inline-flex items-center gap-1">
                                        <span class="group-open:hidden">▶ Повний опис</span>
                                        <span class="hidden group-open:inline">▼ Сховати опис</span>
                                    </summary>
                                    <div class="mt-2 text-[11px] text-zinc-700 whitespace-pre-wrap p-2 bg-zinc-50 rounded border border-zinc-100">
                                        \${merit.desc || 'Очікує повного тексту...'}
                                    </div>
                                </details>
                            </div>
                        \`;
                    }).join('')}
                </div>
            </div>

            <div class="flex justify-between pt-6 mt-8 border-t border-zinc-100">
                <button onclick="goToV6Step(5)"`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacement);
    code = code.replace('Дисципліни, Сили [Maturing] та Риси', 'Дисципліни, Сили [Maturing], Риси та Переваги');
    fs.writeFileSync('v6Generator.js', code);
    console.log('Successfully patched Step 6');
} else {
    console.log('Target string not found in v6Generator.js');
}
