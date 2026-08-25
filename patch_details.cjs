const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

const detailsHtmlFunc = `
function generateV6DetailsPagesHTML() {
    const clanObj = getV6Clan();
    const natureObj = getV6Nature();
    const charName = (v6State.characterDetails && v6State.characterDetails.name) ? escapeV6Html(v6State.characterDetails.name) : 'ПЕРСОНАЖ';
    
    // Page 2: Lifepaths, Merits, Clan Traits
    let p2Html = \`
    <div class="bg-white text-black font-sans mx-auto w-[210mm] min-h-[297mm] relative box-border overflow-hidden print:w-full print:h-full print:p-[10mm] print:shadow-none print:max-w-none break-before-page page-break-before-always mt-8 print:mt-0 shadow-2xl p-[10mm] flex flex-col">
        <!-- Outer border -->
        <div class="absolute inset-[6mm] border-[3px] border-black pointer-events-none print:inset-[4mm]">
            <div class="absolute -top-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
            <div class="absolute -top-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
            <div class="absolute -bottom-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
            <div class="absolute -bottom-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
        </div>
        
        <div class="relative z-10 h-full flex flex-col">
            <h1 class="font-serif font-bold text-4xl uppercase tracking-widest text-center mb-1">\${charName.toUpperCase()}'S DETAILS</h1>
            <p class="text-center text-zinc-600 mb-8 italic">Більш детальний опис сил та здібностей, що вказані в аркуші персонажа \${charName}.</p>
            
            <div class="flex gap-8 flex-1">
                <!-- Left Column: Lifepaths, Merits -->
                <div class="w-1/2 flex flex-col gap-6">
                    <div>
                        <h2 class="font-bold text-xl uppercase tracking-widest mb-1">Життєві Шляхи (Lifepaths)</h2>
                        <p class="text-sm text-zinc-600 mb-4">Професії та життєвий досвід \${charName}, і те, куди завели його життя та не-життя.</p>
                        \${v6State.lifepaths.map(lpId => {
                            const lp = getV6Lifepaths().find(p => p.id === lpId);
                            if (!lp) return '';
                            let lpHtml = \`<div class="mb-4">
                                <h3 class="font-bold italic text-lg border-b border-black pb-1 mb-2">\${lp.name}</h3>
                                <p class="text-sm text-zinc-800 leading-relaxed">\${lp.desc}</p>
                            </div>\`;
                            return lpHtml;
                        }).join('') || '<p class="italic text-zinc-400">Відсутні</p>'}
                    </div>
                    <div>
                        <h2 class="font-bold text-xl uppercase tracking-widest mb-1">Переваги (Merits)</h2>
                        <p class="text-sm text-zinc-600 mb-4">Природні таланти та унікальні характеристики \${charName}.</p>
                        \${v6State.selectedMerits.map(mId => {
                            const merit = getV6Merits().find(m => m.id === mId);
                            if (!merit) return '';
                            let prq = merit.prereq ? \`<p class="text-xs italic text-zinc-500 mb-2">Передумова: \${merit.prereq}</p>\` : '';
                            return \`<div class="mb-4">
                                <h3 class="font-bold italic text-lg border-b border-black pb-1 mb-1">\${merit.name}</h3>
                                \${prq}
                                <p class="text-sm text-zinc-800 leading-relaxed">\${merit.desc}</p>
                            </div>\`;
                        }).join('') || '<p class="italic text-zinc-400">Відсутні</p>'}
                    </div>
                </div>
                
                <!-- Right Column: Clan Traits -->
                <div class="w-1/2 flex flex-col gap-6">
                    <div>
                        <h2 class="font-bold text-xl uppercase tracking-widest mb-1">Кланові Риси (Clan Traits)</h2>
                        <p class="text-sm text-zinc-600 mb-4">Надприродні таланти \${charName}, успадковані через кров.</p>
                        \${v6State.selectedClanTraits.map(tId => {
                            const trait = (clanObj ? clanObj.traits : []).find(t => t.id === tId);
                            if (!trait) return '';
                            let prq = trait.prereq ? \`<p class="text-xs italic text-zinc-500 mb-2">Передумова: \${trait.prereq}</p>\` : '';
                            return \`<div class="mb-4">
                                <h3 class="font-bold italic text-lg border-b border-black pb-1 mb-1">\${trait.name}</h3>
                                \${prq}
                                <p class="text-sm text-zinc-800 leading-relaxed">\${trait.desc}</p>
                            </div>\`;
                        }).join('') || '<p class="italic text-zinc-400">Відсутні</p>'}
                    </div>
                </div>
            </div>
            <div class="mt-auto text-center text-xs font-bold tracking-widest uppercase">\${charName}</div>
        </div>
    </div>\`;
    
    // Page 3: Nature, Clan Aspects
    let p3Html = \`
    <div class="bg-white text-black font-sans mx-auto w-[210mm] min-h-[297mm] relative box-border overflow-hidden print:w-full print:h-full print:p-[10mm] print:shadow-none print:max-w-none break-before-page page-break-before-always mt-8 print:mt-0 shadow-2xl p-[10mm] flex flex-col">
        <!-- Outer border -->
        <div class="absolute inset-[6mm] border-[3px] border-black pointer-events-none print:inset-[4mm]">
            <div class="absolute -top-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
            <div class="absolute -top-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
            <div class="absolute -bottom-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
            <div class="absolute -bottom-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
        </div>
        
        <div class="relative z-10 h-full flex flex-col">
            <div class="flex gap-8 flex-1 mt-12">
                <!-- Left Column: Nature -->
                <div class="w-1/2 flex flex-col gap-6">
                    <div>
                        <h2 class="font-bold text-xl uppercase tracking-widest mb-1">Натура (Nature)</h2>
                        <p class="text-sm text-zinc-600 mb-4">Природа \${charName}, смертні імпульси в його основі та пов'язаний спалах.</p>
                        \${natureObj ? \`
                            <div class="mb-4">
                                <h3 class="font-bold italic text-lg border-b border-black pb-1 mb-2">\${natureObj.name}</h3>
                                <p class="text-sm text-zinc-800 leading-relaxed mb-2">\${natureObj.desc || natureObj.shortDesc || ''}</p>
                            </div>
                        \` : '<p class="italic text-zinc-400">Не обрано</p>'}
                    </div>
                </div>
                
                <!-- Right Column: Clan Aspects -->
                <div class="w-1/2 flex flex-col gap-6">
                    <div>
                        <h2 class="font-bold text-xl uppercase tracking-widest mb-1">Кланові Аспекти (Clan Aspects)</h2>
                        <p class="text-sm text-zinc-600 mb-4">\${charName} належить до клану \${clanObj ? clanObj.name : ''}, що дає велику силу, але й прокляття.</p>
                        \${clanObj ? \`
                            <div class="mb-4">
                                <h3 class="font-bold italic text-lg border-b border-black pb-1 mb-2">Клан. Звір: \${clanObj.beast}</h3>
                                <p class="text-sm text-zinc-800 leading-relaxed mb-4">\${clanObj.beastDesc || 'Звір прагне задовольнити свою природу.'}</p>
                                
                                <h3 class="font-bold italic text-lg border-b border-black pb-1 mb-2">Прокляття: \${clanObj.curse}</h3>
                                <p class="text-sm text-zinc-800 leading-relaxed mb-4">\${clanObj.curseDesc || 'Прокляття, що передається в крові клану.'}</p>
                                
                                <h3 class="font-bold italic text-lg border-b border-black pb-1 mb-2">Шаленство: \${clanObj.frenzy}</h3>
                                <p class="text-sm text-zinc-800 leading-relaxed">\${clanObj.frenzyDesc || 'Стан неконтрольованої люті та інстинктів.'}</p>
                            </div>
                        \` : '<p class="italic text-zinc-400">Не обрано</p>'}
                    </div>
                </div>
            </div>
            <div class="mt-auto text-center text-xs font-bold tracking-widest uppercase">\${charName}</div>
        </div>
    </div>\`;

    // Page 4+: Disciplines
    // Let's divide selected discipline powers into columns and pages.
    let selectedPowers = [];
    Object.keys(v6State.disciplinePowers).forEach(discId => {
        const powersArr = v6State.disciplinePowers[discId];
        if (powersArr && powersArr.length > 0) {
            const allPowers = getV6PowersForDiscipline(discId);
            powersArr.forEach(pId => {
                const p = allPowers.find(x => x.id === pId);
                if (p) {
                    selectedPowers.push({ discId, discName: getV6Disciplines().find(d => d.id === discId)?.name || discId, power: p });
                }
            });
        }
    });

    let p4Html = '';
    
    if (selectedPowers.length > 0) {
        // Group by discipline
        let powersByDisc = {};
        selectedPowers.forEach(item => {
            if (!powersByDisc[item.discId]) powersByDisc[item.discId] = { name: item.discName, powers: [] };
            powersByDisc[item.discId].powers.push(item.power);
        });

        let currentDiscHtmls = [];
        
        Object.keys(powersByDisc).forEach(discId => {
            const discData = powersByDisc[discId];
            let discHtmlStr = \`
                <div class="mb-8 break-inside-avoid">
                    <h2 class="font-serif font-bold text-3xl uppercase tracking-widest mb-2">\${discData.name.split(' (')[0].toUpperCase()}</h2>
                    <div class="w-full h-0.5 bg-black mb-4"></div>
            \`;
            
            discData.powers.forEach(p => {
                let pType = p.type || 'Дія';
                let pCost = p.cost || 'Немає';
                let pPrereq = p.prereq ? \`Передумова: \${p.prereq}\` : '';
                
                discHtmlStr += \`
                    <div class="mb-6 break-inside-avoid">
                        <h3 class="font-bold italic text-lg border-b-[1.5px] border-black pb-1 mb-1">\${p.name}</h3>
                        <p class="text-xs italic text-zinc-500 mb-2">\${p.level}-крапкова Сила (\${pPrereq})</p>
                        
                        <div class="bg-black text-white text-[10px] font-bold uppercase grid grid-cols-3 text-center tracking-widest mb-2">
                            <div class="py-1 border-r border-zinc-700">Активація</div>
                            <div class="py-1 border-r border-zinc-700">Тип</div>
                            <div class="py-1">Вартість</div>
                        </div>
                        <div class="text-[11px] grid grid-cols-3 text-center border-b border-black mb-2 pb-1">
                            <div>\${p.action || 'Дія'}</div>
                            <div>\${pType}</div>
                            <div>\${pCost}</div>
                        </div>
                        
                        <p class="text-sm text-zinc-800 leading-relaxed mt-3">\${p.desc}</p>
                    </div>
                \`;
            });
            discHtmlStr += \`</div>\`;
            currentDiscHtmls.push(discHtmlStr);
        });
        
        // Split disciplines roughly into 2 columns
        let leftColHtml = '';
        let rightColHtml = '';
        currentDiscHtmls.forEach((html, i) => {
            if (i % 2 === 0) leftColHtml += html;
            else rightColHtml += html;
        });

        p4Html = \`
        <div class="bg-white text-black font-sans mx-auto w-[210mm] min-h-[297mm] relative box-border overflow-hidden print:w-full print:h-full print:p-[10mm] print:shadow-none print:max-w-none break-before-page page-break-before-always mt-8 print:mt-0 shadow-2xl p-[10mm] flex flex-col">
            <!-- Outer border -->
            <div class="absolute inset-[6mm] border-[3px] border-black pointer-events-none print:inset-[4mm]">
                <div class="absolute -top-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                <div class="absolute -top-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
                <div class="absolute -bottom-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                <div class="absolute -bottom-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
            </div>
            
            <div class="relative z-10 h-full flex flex-col">
                <div class="flex justify-between items-end mb-8 mt-4">
                    <div>
                        <h1 class="font-bold text-2xl uppercase tracking-widest mb-1">Сили Дисциплін</h1>
                        <p class="text-sm text-zinc-600">Дисципліни \${charName}, які дають доступ до унікальних здібностей.</p>
                    </div>
                </div>
                
                <div class="flex gap-8 flex-1">
                    <div class="w-1/2 flex flex-col gap-6">
                        \${leftColHtml}
                    </div>
                    <div class="w-1/2 flex flex-col gap-6">
                        \${rightColHtml}
                    </div>
                </div>
                <div class="mt-auto text-center text-xs font-bold tracking-widest uppercase">\${charName}</div>
            </div>
        </div>\`;
    }

    return p2Html + p3Html + p4Html;
}
`;

code = code.replace('function generateV6PrintableHTML() {', detailsHtmlFunc + '\nfunction generateV6PrintableHTML() {');
code = code.replace('${content}', '${content}\n        ${generateV6DetailsPagesHTML()}');
fs.writeFileSync('v6Generator.js', code);
