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

    const modal = document.getElementById('v6-power-modal');
    const content = document.getElementById('v6-power-modal-content');
    if (!modal || !content) return;

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
                <div class="space-y-2.5">
                    ${targetPower.maturingLevels.map(lvl => {
                        const isUnlocked = currentDots >= lvl.dots;
                        return `
                            <div class="p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isUnlocked 
                                    ? 'bg-amber-950/20 border-amber-800/60 shadow-sm ring-1 ring-amber-500/20' 
                                    : 'bg-zinc-900/50 border-zinc-800/80 opacity-70'
                            }">
                                <div class="flex items-start gap-2.5">
                                    <span class="font-mono text-sm font-black tracking-widest ${isUnlocked ? 'text-amber-400' : 'text-zinc-500'} shrink-0 pt-0.5">
                                        ${lvl.dotsSymbol || '•'.repeat(lvl.dots)}
                                    </span>
                                    <p class="text-xs sm:text-sm ${isUnlocked ? 'text-zinc-200 font-medium' : 'text-zinc-400'} leading-snug">
                                        ${lvl.desc.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')}
                                    </p>
                                </div>
                                <div class="shrink-0 self-end sm:self-center">
                                    ${isUnlocked 
                                        ? `<span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                                            ✓ Активно (${currentDots} ⬤)
                                           </span>`
                                        : `<span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700 flex items-center gap-1">
                                            🔒 Потрібно ${lvl.dots} ⬤
                                           </span>`
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } else if (targetPower.maturing) {
        maturingHtml = `
            <div class="mt-5 pt-4 border-t border-zinc-800/80">
                <div class="flex items-center gap-2 mb-2">
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

    content.innerHTML = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#8b0000] via-[#5c0000] to-zinc-950 p-5 flex items-start justify-between gap-4 shrink-0 border-b border-red-950">
            <div class="flex items-start gap-3.5">
                <div class="w-12 h-12 rounded-2xl bg-black/50 border border-red-500/30 flex items-center justify-center shrink-0 shadow-lg p-2 mt-0.5">
                    ${discIcon ? `<img src="${discIcon}" alt="${targetDisc.name}" class="w-full h-full object-contain filter drop-shadow" />` : `<span class="text-2xl">🔮</span>`}
                </div>
                <div>
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-red-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-red-800/50">
                            ${targetDisc.name}
                        </span>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${typeBadgeClass}">
                            ${targetPower.rankName || `Ранг ${targetPower.rank} ⬤ • ${targetPower.type || 'Physical'}`}
                        </span>
                    </div>
                    <h2 class="text-xl sm:text-2xl font-bold vtm-font tracking-wide text-white drop-shadow">
                        ${targetPower.name}
                    </h2>
                    ${targetPower.shortDesc ? `<p class="text-xs sm:text-sm text-red-200/90 font-medium mt-1">${targetPower.shortDesc}</p>` : ''}
                </div>
            </div>
            <button type="button" onclick="closeV6PowerModal()" class="text-white/70 hover:text-white p-2 rounded-xl hover:bg-black/30 transition-colors shrink-0" title="Закрити (Esc)">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5 bg-zinc-950">
            <!-- Attribute & Parameter Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div class="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                        <span>⚡</span> Активація:
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-white font-mono">
                        ${formatV6Activate(targetPower.activate)}
                    </div>
                </div>

                <div class="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                        <span>🎯</span> Складність:
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-white font-mono">
                        ${formatV6Difficulty(targetPower.difficulty)}
                    </div>
                </div>

                <div class="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                        <span>🎲</span> Характеристика:
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-white font-mono">
                        ${formatV6Attribute(targetPower.attribute)}
                    </div>
                </div>

                <div class="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                        <span>🩸</span> Вартість:
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-red-400 font-mono">
                        ${formatV6Cost(targetPower.cost)}
                    </div>
                </div>

                <div class="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                        <span>📏</span> Дистанція:
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-white font-mono">
                        ${formatV6Distance(targetPower.distance)}
                    </div>
                </div>

                <div class="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                        <span>⏳</span> Тривалість:
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-white font-mono">
                        ${formatV6Duration(targetPower.duration)}
                    </div>
                </div>
            </div>

            <!-- Description Block -->
            <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <span>📖</span> Опис та правила використання
                </h4>
                <div class="bg-zinc-900/40 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 shadow-inner">
                    ${formatDescription(targetPower.desc)}
                </div>
            </div>

            <!-- Maturing Block -->
            ${maturingHtml}
        </div>

        <!-- Footer Actions -->
        <div class="bg-zinc-900 p-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2 text-xs text-zinc-400">
                <span>Ваш рівень у ${targetDisc.name.split(' (')[0]}:</span>
                <span class="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">${currentDots} ⬤</span>
            </div>
            
            <div class="flex items-center gap-2 w-full sm:w-auto">
                <button type="button" onclick="closeV6PowerModal()" class="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 hover:text-white transition-colors">
                    Закрити
                </button>

                ${isLearned 
                    ? `<button type="button" onclick="toggleV6Power('${targetPower.id}'); openV6PowerModal('${targetPower.id}', '${targetDisc.id}')" class="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#8b0000] hover:bg-red-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5">
                        <span>✓</span> Сила обрана (Скасувати)
                       </button>`
                    : (canLearn 
                        ? `<button type="button" onclick="toggleV6Power('${targetPower.id}'); openV6PowerModal('${targetPower.id}', '${targetDisc.id}')" class="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-800 hover:bg-[#8b0000] border border-zinc-700 hover:border-red-600 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5">
                            <span>➕</span> Обрати цю силу
                           </button>`
                        : `<button type="button" disabled class="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-800/40 border border-zinc-800 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5">
                            <span>🔒</span> Потрібно ${targetPower.rank} ⬤
                           </button>`
                      )
                }
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeV6PowerModal() {
    const modal = document.getElementById('v6-power-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    document.body.style.overflow = '';
}

