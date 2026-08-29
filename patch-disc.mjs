import fs from 'fs';
let code = fs.readFileSync('v6Generator.js', 'utf8');

const regex = /const activeDiscs = Object\.entries\(v6State\.disciplines \|\| \{\}\)\.filter\(\(\[_, val\]\) => val > 0\);[\s\S]*?for \(let i = activeDiscs\.length; i < totalSlots; i\+\+\) \{[\s\S]*?\}[\s\S]*?\}/;

const replacement = `const activeDiscs = Object.entries(v6State.disciplines || {}).filter(([_, val]) => val > 0);
    const hasAnyPowers = Array.isArray(v6State.selectedPowers) && v6State.selectedPowers.length > 0;
    let discHtml = '';

    if (!hasAnyPowers) {
        discHtml = \`
            <div class="bg-red-50/50 border border-red-200 rounded-xl p-4 text-center mt-2 mx-1 mb-3">
                <div class="text-base mb-1">⚠️</div>
                <div class="text-[10px] font-bold text-red-900 uppercase tracking-wider mb-1">Сили не обрані</div>
                <div class="text-[8px] text-red-700 leading-relaxed max-w-[200px] mx-auto">
                    Будь ласка, поверніться на <button onclick="goToV6Step(6)" class="underline font-bold hover:text-red-900">Крок 6</button> та оберіть Сили Крові.
                </div>
            </div>
        \`;
        for (let i = 0; i < 2; i++) {
            discHtml += \`
                <div class="mb-2.5 pb-1 border-b border-zinc-200 last:border-b-0 last:pb-0">
                    <div class="flex justify-between items-end border-b-[1.5px] border-black pb-0.5 mb-1">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-300 font-serif">Дисципліна</span>
                        \${drawDots(0, 5)}
                    </div>
                    <div class="border-b border-zinc-200 h-3 mb-1"></div>
                    <div class="border-b border-zinc-200 h-3"></div>
                </div>
            \`;
        }
    } else {
        if (activeDiscs.length > 0) {
            activeDiscs.forEach(([discId, dots]) => {
                const disc = getV6Disciplines().find(d => d.id === discId);
                const name = disc ? disc.name.split(' (')[0] : discId;
                const powers = (disc && Array.isArray(disc.powers))
                    ? disc.powers.filter(p => Array.isArray(v6State.selectedPowers) && v6State.selectedPowers.includes(p.id))
                    : [];
                
                discHtml += \`
                    <div class="mb-2.5 pb-1 border-b border-zinc-200 last:border-b-0 last:pb-0">
                        <div class="flex justify-between items-end border-b-[1.5px] border-black pb-0.5 mb-1">
                            <span class="text-[10px] font-bold uppercase tracking-wider font-serif text-black">\${name}</span>
                            \${drawDots(dots, 5)}
                        </div>
                        \${powers.length > 0 ? \`
                            <div class="space-y-1 pl-1 mb-1">
                                \${powers.map(p => \`
                                    <div class="text-[8.5px] border-b border-zinc-100 last:border-0 pb-0.5 leading-tight">
                                        <div class="flex items-center justify-between gap-1">
                                            <span class="font-bold text-zinc-900 truncate">• \${p.name}</span>
                                            <span class="text-[6.5px] text-[#8b0000] font-sans font-bold uppercase px-1 py-0.2 bg-red-50 rounded border border-red-200 shrink-0">
                                                Ранг \${p.rank} • \${formatV6Activate(p.activate)} • \${formatV6Cost(p.cost)}
                                            </span>
                                        </div>
                                        \${p.shortDesc ? \`<p class="text-[7.5px] text-zinc-600 mt-0.5 leading-snug line-clamp-1">\${p.shortDesc}</p>\` : (p.desc ? \`<p class="text-[7.5px] text-zinc-600 mt-0.5 leading-snug line-clamp-1">\${p.desc.split('\\n')[0]}</p>\` : '')}
                                    </div>
                                \`).join('')}
                            </div>
                        \` : \`
                            <div class="pl-1 text-[7.5px] text-zinc-400 italic py-0.5">
                                • Не обрано сил (\${dots} ⬤ доступно)
                            </div>
                            <div class="border-b border-dashed border-zinc-200 h-2.5 mb-1"></div>
                        \`}
                    </div>
                \`;
            });
        }
        
        // Fill placeholder slots if less than 2
        const totalSlots = Math.max(2, activeDiscs.length);
        for (let i = activeDiscs.length; i < totalSlots; i++) {
            discHtml += \`
                <div class="mb-2.5 pb-1 border-b border-zinc-200 last:border-b-0 last:pb-0">
                    <div class="flex justify-between items-end border-b-[1.5px] border-black pb-0.5 mb-1">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-300 font-serif">Дисципліна</span>
                        \${drawDots(0, 5)}
                    </div>
                    <div class="border-b border-zinc-200 h-3 mb-1"></div>
                    <div class="border-b border-zinc-200 h-3"></div>
                </div>
            \`;
        }
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('v6Generator.js', code);
console.log("Patched successfully");
