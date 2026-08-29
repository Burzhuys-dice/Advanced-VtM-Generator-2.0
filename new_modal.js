function openV6PowerModal(powerId, discId) {
    const disciplines = getV6Disciplines();
    let targetDisc = disciplines.find(d => d.id === discId);
    let targetPower = null;

    if (targetDisc) {
        targetPower = (targetDisc.powers || []).find(p => p.id === powerId);
    }
    
    if (!targetPower) {
        // search across all disciplines
        for (const d of disciplines) {
            const p = (d.powers || []).find(x => x.id === powerId);
            if (p) {
                targetDisc = d;
                targetPower = p;
                break;
            }
        }
    }

    if (!targetPower || !targetDisc) return;

    const currentDots = v6State.disciplines[targetDisc.id] || 0;
    const isLearned = v6State.selectedPowers.includes(targetPower.id);
    const canLearn = currentDots >= targetPower.rank;
    const discIcon = typeof DISCIPLINE_ICONS !== 'undefined' ? DISCIPLINE_ICONS[targetDisc.id] : null;

    // Badge styling for physical / mental / social
    const typeColors = {
        physical: 'bg-red-950/80 text-red-300 border-red-800',
        mental: 'bg-blue-950/80 text-blue-300 border-blue-800',
        social: 'bg-amber-950/80 text-amber-300 border-amber-800'
    };
    const powerType = (targetPower.type || 'physical').toLowerCase();
    const typeBadgeClass = typeColors[powerType] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

    // Format text with paragraph breaks and bullet list recognition
    const formatDescription = (text) => {
        if (!text) return '';
        const paragraphs = text.split('\n\n');
        return paragraphs.map(para => {
            const lines = para.split('\n');
            const hasBullets = lines.some(l => l.trim().startsWith('•') || l.trim().startsWith('*'));
            if (hasBullets) {
                const listItems = lines.map(line => {
                    const clean = line.replace(/^[•*]\s*/, '').trim();
                    const formatted = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
                    return `<li class="flex items-start gap-2.5 text-zinc-300 text-xs sm:text-sm leading-relaxed"><span class="text-red-500 font-bold shrink-0 mt-0.5">•</span><span>${formatted}</span></li>`;
                }).join('');
                return `<ul class="space-y-2.5 my-3 pl-1 bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800/90">${listItems}</ul>`;
            } else {
                const formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
                return `<p class="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3 last:mb-0">${formatted}</p>`;
            }
        }).join('');
    };

    // Maturing rendering
    let maturingHtml = '';
    if (targetPower.maturingLevels && targetPower.maturingLevels.length > 0) {
        maturingHtml = `
            <div class="mt-5 pt-4 border-t border-zinc-800/80">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-amber-500 text-base">📈</span>
                    <h4 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                        Посилення [Maturing]
                    </h4>
                </div>
                <div class="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    ${targetPower.maturing.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')}
                </div>
            </div>
        `;
    }

    const titleHtml = `
        <div class="flex flex-col gap-1">
            <span class="text-[10px] font-bold text-red-400 uppercase tracking-widest">${targetDisc.name.split(' (')[0]} • Ранг ${targetPower.rank}</span>
            <span>${targetPower.name}</span>
        </div>
    `;

    const contentHtml = `
        <div class="space-y-4 mb-4">
            <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${typeBadgeClass}">
                    ${targetPower.rankName || `Ранг ${targetPower.rank} ⬤ • ${targetPower.type || 'Physical'}`}
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-2.5">
                <div class="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">⚡ Активація:</div>
                    <div class="text-sm font-bold text-white font-mono">${formatV6Activate(targetPower.activate)}</div>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">🎯 Складність:</div>
                    <div class="text-sm font-bold text-white font-mono">${formatV6Difficulty(targetPower.difficulty)}</div>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">🎲 Пул:</div>
                    <div class="text-sm font-bold text-white font-mono">${formatV6Attribute(targetPower.attribute)}</div>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">🩸 Вартість:</div>
                    <div class="text-sm font-bold text-red-400 font-mono">${formatV6Cost(targetPower.cost)}</div>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">📏 Дистанція:</div>
                    <div class="text-sm font-bold text-white font-mono">${formatV6Distance(targetPower.distance)}</div>
                </div>
                <div class="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">⏳ Тривалість:</div>
                    <div class="text-sm font-bold text-white font-mono">${formatV6Duration(targetPower.duration)}</div>
                </div>
            </div>

            <!-- Description -->
            <div class="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 mt-4 relative overflow-hidden">
                <h4 class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-800/60 pb-2">
                    Система та Ефект
                </h4>
                <div class="text-zinc-300">
                    ${formatDescription(targetPower.desc)}
                </div>
                
                ${targetPower.system ? `
                    <h4 class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 border-b border-zinc-800/60 pb-2 mt-5">
                        Механіка (System)
                    </h4>
                    <div class="text-zinc-300">
                        ${formatDescription(targetPower.system)}
                    </div>
                ` : ''}

                ${maturingHtml}
            </div>
            
            <div class="pt-6 pb-2">
                ${isLearned ? `
                    <button onclick="toggleV6Power('${targetPower.id}'); closeV6PowerModal();" class="w-full px-5 py-3 rounded-xl text-sm font-bold bg-zinc-800/80 text-zinc-400 hover:bg-red-950/50 hover:text-red-400 border border-zinc-700/50 hover:border-red-900/60 transition-colors uppercase tracking-wider flex items-center justify-center gap-2">
                        <span>Забути силу</span>
                    </button>
                ` : (canLearn ? `
                    <button onclick="toggleV6Power('${targetPower.id}'); closeV6PowerModal();" class="w-full px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white shadow-lg shadow-red-900/20 uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                        <span>🩸</span> <span>Вивчити цю силу</span>
                    </button>
                ` : `
                    <div class="w-full text-zinc-500 text-xs uppercase font-bold px-4 py-3 border border-zinc-800/50 bg-black/20 rounded-xl text-center flex items-center justify-center gap-2">
                        <span>🔒</span> Потрібно ${targetPower.rank} ⬤ у ${targetDisc.name.split(' (')[0]}
                    </div>
                `)}
            </div>
        </div>
    `;

    openV6InfoDrawer(titleHtml, contentHtml);
}

function closeV6PowerModal() {
    closeV6InfoDrawer();
}
