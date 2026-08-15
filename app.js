async function init() {
    state.archetypesData = { attributes: [], skills: [] }; // Ініціалізація стану архетипів
    state.manualDisciplines = []; // Ініціалізація ручних дисциплін
    await fetchAllData();
    
    let discKeys = Array.isArray(disciplinesData) ? disciplinesData.map(d => d.id) : Object.keys(disciplinesData);
    discKeys.forEach(d => {
        if(state.disciplines[d] === undefined) state.disciplines[d] = 0;
    });
    Object.values(attributesData).flat().forEach(a => {
        if(state.attributes[a.id] === undefined) state.attributes[a.id] = 1;
    });
    Object.values(skillsData).flat().forEach(s => {
        if(state.skills[s.id] === undefined) state.skills[s.id] = 0;
    });

    populateClanSelects();
    changeClan(Object.keys(clansData)[0] || 'unknown'); 
    renderAttributes();
    renderSkills();
    populateCustomSpecDropdown();
    updateTrackers();
    updateHumanityDisplay();
    
    // Переносимо виклик сюди, коли всі поля вже точно існують у DOM
    updateHeaderInfo();
    
    document.getElementById('character-name')?.addEventListener('input', updateHeaderInfo);
    
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) loadingStatus.innerText = 'Крок за кроком (Дані завантажено)';
}

async function fetchAllData() {
    try {
        const [advRes, predRes, coreRes, clansRes, discRes, archRes] = await Promise.all([
            fetch('data/vtm_merits_data.json'),
            fetch('data/vtm_predator-types_1'),
            fetch('data/vtm_char_and_skills.json'),
            fetch('data/vtm_clans'),
            fetch('data/vtm_disciplines'),
            fetch('data/vtm_archetypes.json') // Завантажуємо файл архетипів
        ]);

        if(advRes.ok) {
            state.advantagesData = await advRes.json();
            populateAdvantageCategories();
        }
        renderAvailableAdvantages();

        if(predRes.ok) state.predatorData = await predRes.json();
        renderPredatorTypes();

        if(coreRes.ok) {
            const coreData = await coreRes.json();
            if(coreData.attributes) attributesData = coreData.attributes;
            if(coreData.skills) {
                if(coreData.skills.physical) skillsData.physical = coreData.skills.physical;
                if(coreData.skills.social) skillsData.social = coreData.skills.social;
                if(coreData.skills.mental) skillsData.mental = coreData.skills.mental;
            }
        }

        if(clansRes.ok) {
            const cData = await clansRes.json();
            if (Array.isArray(cData)) {
                clansData = {};
                cData.forEach(clan => {
                    clansData[clan.id] = clan;
                });
            } else if(cData && Object.keys(cData).length > 0) {
                clansData = cData;
            }
        }

        if(discRes.ok) {
            const dJson = await discRes.json();
            
            let discKeys = Array.isArray(disciplinesData) ? disciplinesData.map(d => d.id) : Object.keys(disciplinesData);
            discKeys.forEach(k => disciplinesPowersMap[k] = []);

            let rawPowers = dJson.powers || (Array.isArray(dJson) ? dJson : []);
            if (Array.isArray(rawPowers)) {
                rawPowers.forEach(power => {
                    let dKey = power.disc;
                    if (dKey && disciplinesPowersMap[dKey]) {
                        disciplinesPowersMap[dKey].push({
                            id: power.ability_name || power.name,
                            name: power.ability_name || power.name,
                            level: Number(power.level || 1),
                            desc: power.effect_description || power.desc || '',
                            requirement: power.requirement || power.requirements || power.prerequisite || power.prerequisites || '',
                            rouseCost: power.rouse_cost || '',
                            dicePool: power.dice_pool || '',
                            resistance: power.resistance || ''
                        });
                    }
                });
            }
        }

        // Обробка архетипів
        if(archRes && archRes.ok) {
            state.archetypesData = await archRes.json();
        }
        populateArchetypes();
        populateManualDisciplineDropdown();

    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        document.getElementById('loading-status').innerText = 'Помилка завантаження даних';
    }
}
async function generateRandomConviction(convictionFieldId, touchstoneFieldId) {
    try {
        const response = await fetch('data/vtm_convictions.json');
        if (!response.ok) {
            throw new Error('Не вдалося завантажити файл з переконаннями');
        }
        const data = await response.json();
        
        // Обираємо випадковий об'єкт з масиву (який містить і text, і touchstone)
        const randomItem = getRandomItem(data);
        
        const convField = document.getElementById(convictionFieldId);
        const touchField = document.getElementById(touchstoneFieldId);
        
        if (convField && randomItem) {
            convField.value = randomItem.conviction;
        }
        if (touchField && randomItem) {
            touchField.value = randomItem.touchstone;
        }
    } catch (error) {
        console.error('Помилка завантаження переконань:', error);
    }
}
document.getElementById('btn-random-conviction1')?.addEventListener('click', () => {
    generateRandomConviction('conviction1', 'touchstone1');
});

document.getElementById('btn-random-conviction2')?.addEventListener('click', () => {
    generateRandomConviction('conviction2', 'touchstone2');
});

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
// Заповнення випадаючих списків архетипів
function populateArchetypes() {
    const attrSelect = document.getElementById('attr-archetype-select');
    const skillSelect = document.getElementById('skill-archetype-select');

    if (attrSelect && state.archetypesData.attributes) {
        let html = '<option value="">-- Вручну / Оберіть шаблон --</option>';
        state.archetypesData.attributes.forEach(a => {
            html += `<option value="${a.id}">${a.name}</option>`;
        });
        attrSelect.innerHTML = html;
    }

    if (skillSelect && state.archetypesData.skills) {
        let html = '<option value="">-- Вручну / Оберіть шаблон --</option>';
        state.archetypesData.skills.forEach(s => {
            html += `<option value="${s.id}">${s.name}</option>`;
        });
        skillSelect.innerHTML = html;
    }
}
   
// Застосування архетипу до характеристик
function applyAttributeArchetype(archId) {
    if (!archId) return; // Якщо обрано "Вручну", не змінюємо поточні дані
    
    const archetype = state.archetypesData.attributes.find(a => a.id === archId);
    if (!archetype) return;

    // Скидаємо всі характеристики до базового рівня (1)
    Object.keys(state.attributes).forEach(k => state.attributes[k] = 1);

    // Застосовуємо значення з архетипу
    for (const [key, val] of Object.entries(archetype.values)) {
        if (state.attributes[key] !== undefined) {
            state.attributes[key] = val;
        }
    }
    
    renderAttributes();
    updateTrackers();
}

// Застосування архетипу до навичок
function applySkillArchetype(archId) {
    if (!archId) return; // Якщо обрано "Вручну", не змінюємо поточні дані
    
    const archetype = state.archetypesData.skills.find(s => s.id === archId);
    if (!archetype) return;

    // Скидаємо всі навички до базового рівня (0)
    Object.keys(state.skills).forEach(k => state.skills[k] = 0);

    // Застосовуємо значення з архетипу
    for (const [key, val] of Object.entries(archetype.values)) {
        if (state.skills[key] !== undefined) {
            state.skills[key] = val;
        }
    }
    
    renderSkills();
    updateTrackers();
}

function populateManualDisciplineDropdown() {
    const select = document.getElementById('manual-disc-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Оберіть дисципліну --</option>';
    
    let options = [];
    if (Array.isArray(disciplinesData)) {
        options = disciplinesData.map(d => ({ id: d.id, name: d.name || d.id }));
    } else {
        options = Object.keys(disciplinesData).map(k => ({ id: k, name: disciplinesData[k].name || k }));
    }

    options.sort((a, b) => a.name.localeCompare(b.name));

    options.forEach(opt => {
        if(opt.id) select.innerHTML += `<option value="${opt.id}">${opt.name}</option>`;
    });
}

function addManualDisciplineFromSelect() {
    const select = document.getElementById('manual-disc-select');
    const discId = select.value;
    if (!discId) return;

    if (!state.manualDisciplines) state.manualDisciplines = [];
    
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    if (state.predatorChoices && state.predatorChoices.discipline) {
        availableDisc.push(state.predatorChoices.discipline);
    }

    if (!availableDisc.includes(discId) && !state.manualDisciplines.includes(discId)) {
        state.manualDisciplines.push(discId);
        if (state.disciplines[discId] === undefined) {
            state.disciplines[discId] = 0;
        }
        renderDisciplines();
    }
    
    select.value = ""; 
}

function getDisciplineInfo(discKey) {
    if (Array.isArray(disciplinesData)) {
        return disciplinesData.find(d => d.id === discKey) || { name: discKey, desc: 'Опис відсутній' };
    }
    return disciplinesData[discKey] || { name: discKey, desc: 'Опис відсутній' };
}

function renderPredatorTypes() {
    const grid = document.getElementById('predator-grid');
    if (state.predatorData.length === 0) return;

    let html = '';
    state.predatorData.forEach(predator => {
        const isSelected = state.selectedPredator === predator.id;
        
        let optionsHtml = '';
        if (isSelected) {
            let discOpts = (predator.discipline_options || []).map(opt => `
                <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded border border-transparent hover:border-gray-200 transition-colors" onclick="event.stopPropagation()">
                    <input type="radio" name="pred_disc" value="${opt.id}" 
                        onchange="setPredatorChoice('discipline', '${opt.id}')"
                        ${state.predatorChoices.discipline === opt.id ? 'checked' : ''} class="accent-[#4b0082]">
                    ${opt.name}
                </label>
            `).join('');

            let skillOpts = (predator.skill_options || []).map(opt => `
                <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded border border-transparent hover:border-gray-200 transition-colors" onclick="event.stopPropagation()">
                    <input type="radio" name="pred_skill" value="${opt.id}" 
                        onchange="setPredatorChoice('skill', '${opt.id}', '${opt.spec}')"
                        ${state.predatorChoices.skill === opt.id && state.predatorChoices.specName === opt.spec ? 'checked' : ''} class="accent-[#4b0082]">
                    ${opt.name}
                </label>
            `).join('');

            optionsHtml = `
                <div class="mt-4 pt-4 border-t border-purple-100 animate-[fadeIn_0.3s_ease-in-out]">
                    <div class="mb-3">
                        <span class="block text-[11px] font-bold text-[#4b0082] uppercase tracking-widest mb-1">Оберіть дисципліну (+1 крапка)</span>
                        <div class="flex flex-col gap-1">${discOpts}</div>
                    </div>
                    <div>
                        <span class="block text-[11px] font-bold text-[#4b0082] uppercase tracking-widest mb-1">Оберіть спеціалізацію (+1 крапка)</span>
                        <div class="flex flex-col gap-1">${skillOpts}</div>
                    </div>
                </div>
            `;
        }

        const modifierSymbol = (predator.humanity_modifier > 0) ? '+' : '';
        const modifierText = predator.humanity_modifier !== 0 ? `Людяність ${modifierSymbol}${predator.humanity_modifier}` : 'Людяність незмінна';

        let advantagesDisplay = '';
        if (predator.advantages_text || predator.advantages_text_full) {
            advantagesDisplay = `<div class="bg-purple-50 p-2 rounded text-indigo-800 border border-purple-100 flex flex-col gap-1">`;
            if (predator.advantages_text) {
                advantagesDisplay += `<span class="text-[11px] font-bold">${predator.advantages_text}</span>`;
            }
            if (predator.advantages_text_full) {
                advantagesDisplay += `<span class="text-[10px] leading-snug opacity-90">${predator.advantages_text_full}</span>`;
            }
            advantagesDisplay += `</div>`;
        } else {
            advantagesDisplay = `<div class="bg-purple-50 p-2 rounded text-[11px] font-bold text-indigo-800 border border-purple-100">Немає додаткових благ/вад</div>`;
        }

        html += `
            <div class="predator-card flex flex-col bg-white p-5 rounded-xl shadow-sm cursor-pointer ${isSelected ? 'selected' : 'border-gray-200 hover:border-gray-300'}" 
                 onclick="selectPredator('${predator.id}')">
                <div class="flex justify-between items-start mb-3 gap-2">
                    <h3 class="font-serif font-bold text-lg text-[#1a1a1a] leading-tight">${predator.name}</h3>
                    <span class="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-700 min-w-max text-right">${modifierText}</span>
                </div>
                <p class="text-xs text-gray-600 mb-3 flex-grow text-justify">${predator.description}</p>
                ${advantagesDisplay}
                ${optionsHtml}
            </div>
        `;
    });
    grid.innerHTML = html;
}

function selectPredator(id) {
    if (state.selectedPredator !== id) {
        state.selectedPredator = id;
        state.predatorChoices = { discipline: null, skill: null, specName: null };
        
        // Очищаємо попередні переваги від хижака, щоб вони не накопичувались при зміні вибору
        state.selectedAdvantages = state.selectedAdvantages.filter(adv => adv.source !== 'predator');
        
        const predator = state.predatorData.find(p => p.id === id);
        if (predator) {
            if (predator.discipline_options && predator.discipline_options.length > 0) {
                state.predatorChoices.discipline = predator.discipline_options[0].id;
            }
            if (predator.skill_options && predator.skill_options.length > 0) {
                state.predatorChoices.skill = predator.skill_options[0].id;
                state.predatorChoices.specName = predator.skill_options[0].spec;
            }

            // Додаємо нові переваги від хижака автоматично
            if (predator.auto_advantages && Array.isArray(predator.auto_advantages)) {
                predator.auto_advantages.forEach(autoAdv => {
                    const item = state.advantagesData.find(i => String(i.id) === String(autoAdv.id));
                    if (item) {
                        state.selectedAdvantages.push({
                            id: item.id,
                            name: item.name,
                            type: item.type,
                            cost: autoAdv.cost,
                            source: 'predator' // Мітка, щоб ігнорувати їх у лічильнику
                        });
                    }
                });
            }
        }
        
        renderPredatorTypes();
        applyPredatorGlobalUpdates();
        renderSelectedAdvantages(); // Оновлюємо візуальний список
        updateTrackers();           // Оновлюємо лічильники
    }
}


function setPredatorChoice(type, id, specName = null) {
    if (type === 'discipline') state.predatorChoices.discipline = id;
    if (type === 'skill') {
        state.predatorChoices.skill = id;
        state.predatorChoices.specName = specName;
    }
    if (event) event.stopPropagation();
    applyPredatorGlobalUpdates();
}

function applyPredatorGlobalUpdates() {
    updateHumanityDisplay();
    renderDisciplines();
    renderSkills();
    renderPredatorAdvantagesInfo();
    
    const specDisplay = document.getElementById('predator-spec-display');
    if (state.selectedPredator && state.predatorChoices.specName) {
        specDisplay.innerText = `Спеціалізація хижака: ${state.predatorChoices.specName}`;
        specDisplay.classList.remove('hidden');
    } else {
        specDisplay.classList.add('hidden');
    }
}

function renderPredatorAdvantagesInfo() {
    const infoDiv = document.getElementById('predator-adv-info');
    if (!infoDiv) return;
    
    if (state.selectedPredator) {
        const predator = state.predatorData.find(p => p.id === state.selectedPredator);
        if (predator && predator.advantages_text) {
            infoDiv.innerHTML = `
                <div class="bg-[#f8f5ff] border-l-4 border-[#4b0082] text-indigo-900 p-4 rounded shadow-sm">
                    <h4 class="font-bold text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span class="w-2 h-2 bg-[#4b0082] rounded-full inline-block"></span> Бонус вашого хижака
                    </h4>
                    <p class="text-sm font-medium">${predator.advantages_text}</p>
                </div>
            `;
            infoDiv.classList.remove('hidden');
        } else {
            infoDiv.classList.add('hidden');
        }
    } else {
        infoDiv.classList.add('hidden');
    }
}

function updateHumanityDisplay() {
    let currentHumanity = 7;
    if (state.selectedPredator) {
        const predator = state.predatorData.find(p => p.id === state.selectedPredator);
        if (predator && predator.humanity_modifier) {
            currentHumanity += predator.humanity_modifier;
        }
    }
    document.getElementById('humanity-display').innerText = currentHumanity;
}

function createDotsHTML(type, id, baseValue, maxDots = 5, bonusValue = 0, freeSpecDot = 0) {
    let html = '<div class="dot-container">';
    let totalValue = baseValue + bonusValue + freeSpecDot;
    if (totalValue > maxDots) totalValue = maxDots; 
    
    for (let i = 1; i <= maxDots; i++) {
        let dotClass = '';
        if (i <= baseValue) dotClass = 'filled';
        else if (i <= baseValue + bonusValue) dotClass = 'predator';
        else if (i <= totalValue) dotClass = 'spec-free';
        
        const min = type === 'attribute' ? 1 : 0;
        html += `<div class="dot ${dotClass}" onclick="handleDotClick('${type}', '${id}', ${i}, ${baseValue}, ${min})"></div>`;
    }
    html += '</div>';
    return html;
}

function handleDotClick(type, id, clickedIndex, baseValue, min) {
    let newValue = clickedIndex;
    if (clickedIndex === baseValue && baseValue > min) {
        newValue = clickedIndex - 1;
    }
    
    if (type === 'attribute') {
        state.attributes[id] = newValue;
        renderAttributes();
        document.getElementById('attr-archetype-select').value = ""; // Скидаємо селект при ручній зміні
    } else if (type === 'skill') {
        state.skills[id] = newValue;
        if (newValue === 0 && state.skillSpecs && state.skillSpecs[id] && state.skillSpecs[id].trim() !== '') {
            if (!state.freeSpecDots) state.freeSpecDots = {};
            state.freeSpecDots[id] = 1;
        } else {
            if (state.freeSpecDots && state.freeSpecDots[id]) {
                state.freeSpecDots[id] = 0;
            }
        }
        renderSkills();
        document.getElementById('skill-archetype-select').value = ""; // Скидаємо селект при ручній зміні
    } else if (type === 'discipline') {
        state.disciplines[id] = newValue;
        renderDisciplines();
    }
    updateTrackers();
}

function renderDisciplines() {
    const grid = document.getElementById('disciplines-grid');
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    
    if (state.predatorChoices.discipline && !availableDisc.includes(state.predatorChoices.discipline)) {
        availableDisc.push(state.predatorChoices.discipline);
    }
    
    if (state.manualDisciplines) {
        state.manualDisciplines.forEach(d => {
            if (!availableDisc.includes(d)) availableDisc.push(d);
        });
    }
    
    // --- Інтеграція Чарів Крові та Ритуалів ---
    let bsTotalDots = (state.disciplines['blood_sorcery'] || 0) + (state.predatorChoices.discipline === 'blood_sorcery' ? 1 : 0);
    if (bsTotalDots > 0) {
        if (!availableDisc.includes('blood_sorcery_rituals')) availableDisc.push('blood_sorcery_rituals');
        state.disciplines['blood_sorcery_rituals'] = bsTotalDots; 
    } else {
        availableDisc = availableDisc.filter(d => d !== 'blood_sorcery_rituals');
        state.disciplines['blood_sorcery_rituals'] = 0;
    }
    
    // --- Інтеграція Забуття та Церемоній ---
    let obTotalDots = (state.disciplines['oblivion'] || 0) + (state.predatorChoices.discipline === 'oblivion' ? 1 : 0);
    if (obTotalDots > 0) {
        if (!availableDisc.includes('oblivion_ceremonies')) availableDisc.push('oblivion_ceremonies');
        state.disciplines['oblivion_ceremonies'] = obTotalDots; 
    } else {
        availableDisc = availableDisc.filter(d => d !== 'oblivion_ceremonies');
        state.disciplines['oblivion_ceremonies'] = 0;
    }
    // ---------------------------------------
    
    let html = '<div class="space-y-6 bg-white p-6 border border-gray-200 rounded-lg">';
    
    if(availableDisc.length === 0) {
        html += '<p class="text-gray-500">Для цього клану немає доступних дисциплін у базі.</p>';
    }

    availableDisc.forEach(discKey => {
        const discInfo = getDisciplineInfo(discKey);
        const ukrName = discInfo.name || discKey; 
        
        // Для ритуалів та церемоній бонус хижака не рахується повторно
        let bonus = (discKey !== 'blood_sorcery_rituals' && discKey !== 'oblivion_ceremonies' && state.predatorChoices.discipline === discKey) ? 1 : 0;
        let baseDots = state.disciplines[discKey] || 0;
        let totalDots = baseDots + bonus;
        
        if(!state.disciplinePowers[discKey]) state.disciplinePowers[discKey] = {};

        // --- Візуальні точки для ритуалів/церемоній (неклікабельні) ---
        let dotsHtml = createDotsHTML('discipline', discKey, baseDots, 5, bonus);
        // --------------------------------------------------------------

        html += `
            <div class="group border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-serif text-xl font-bold text-gray-800 group-hover:text-[#8b0000] transition-colors">${ukrName}</span>
                    ${dotsHtml}
                </div>
                <p class="text-sm text-gray-500 text-justify leading-relaxed mb-4">${discInfo.desc || ''}</p>
        `;

        if (totalDots > 0) {
            html += `<div class="bg-gray-50 border-l-2 border-[#8b0000] p-4 rounded-r-lg space-y-4">
                        <h4 class="text-xs font-bold uppercase tracking-widest text-gray-800">Вибір здібностей</h4>`;
            
            let powersList = disciplinesPowersMap[discKey] || [];

            for (let dotLevel = 1; dotLevel <= totalDots; dotLevel++) {
                let availablePowers = powersList.filter(p => Number(p.level) <= totalDots);
                
                let optionsHtml = `<option value="">-- Оберіть варіант (макс. рівень ${totalDots}) --</option>`;
                availablePowers.forEach(p => {
                    let isSelected = state.disciplinePowers[discKey][dotLevel] === p.id;
                    let reqText = (p.requirement && String(p.requirement).trim().toLowerCase() !== 'немає' && String(p.requirement).trim() !== '') ? ` [Вимога: ${p.requirement}]` : '';
                    optionsHtml += `<option value="${p.id}" ${isSelected ? 'selected' : ''}>Рівень ${p.level}: ${p.name}${reqText}</option>`;
                });

                let selectedDesc = '';
                let selectedPowerId = state.disciplinePowers[discKey][dotLevel];
                if (selectedPowerId) {
                    let foundPower = availablePowers.find(p => p.id === selectedPowerId);
                    if (foundPower) {
                        selectedDesc = `
                            <div class="mt-2 text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-100 space-y-1">
                                <p class="italic leading-snug">${foundPower.desc}</p>
                                ${(foundPower.requirement && String(foundPower.requirement).trim().toLowerCase() !== 'немає' && String(foundPower.requirement).trim() !== '') ? `<p><strong>Вимога:</strong> ${foundPower.requirement}</p>` : ''}
                                ${(foundPower.rouseCost && String(foundPower.rouseCost).trim().toLowerCase() !== 'немає' && String(foundPower.rouseCost).trim() !== '') ? `<p><strong>Збурення:</strong> ${foundPower.rouseCost}</p>` : ''}
                                ${(foundPower.dicePool && String(foundPower.dicePool).trim().toLowerCase() !== 'немає' && String(foundPower.dicePool).trim() !== '') ? `<p><strong>Пул кубиків:</strong> ${foundPower.dicePool}</p>` : ''}
                                ${(foundPower.resistance && String(foundPower.resistance).trim().toLowerCase() !== 'немає' && String(foundPower.resistance).trim() !== '') ? `<p><strong>Опір:</strong> ${foundPower.resistance}</p>` : ''}
                            </div>
                        `;
                    }
                }

                // Змінюємо підпис залежно від того, це дисципліна, ритуал чи церемонія
                let labelTitle = `Здібність за ${dotLevel}-ю крапку`;
                if (discKey === 'blood_sorcery_rituals') labelTitle = `Ритуал ${dotLevel}`;
                if (discKey === 'oblivion_ceremonies') labelTitle = `Церемонія ${dotLevel}`;

                html += `
                    <div class="bg-white p-3 rounded border border-gray-200 shadow-sm">
                        <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">${labelTitle}</label>
                        <select onchange="setDisciplinePower('${discKey}', ${dotLevel}, this.value)" class="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm font-semibold text-gray-800 outline-none focus:border-[#8b0000]">
                            ${optionsHtml}
                        </select>
                        ${selectedDesc}
                    </div>
                `;
            }
            html += `</div>`;
        }
        html += `</div>`;
    });
    
    html += '</div>';
    grid.innerHTML = html;
}

function setDisciplinePower(discKey, dotLevel, powerId) {
    if(!state.disciplinePowers[discKey]) state.disciplinePowers[discKey] = {};
    state.disciplinePowers[discKey][dotLevel] = powerId;
    renderDisciplines();
}

function renderAttributes() {
    const grid = document.getElementById('attributes-grid');
    grid.innerHTML = '';
    const categories = [
        { key: 'physical', label: 'Фізичні' },
        { key: 'social', label: 'Соціальні' },
        { key: 'mental', label: 'Ментальні' }
    ];
    categories.forEach(cat => {
        let colHTML = `<div><h3 class="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wider">${cat.label}</h3><div class="space-y-4">`;
        (attributesData[cat.key] || []).forEach(attr => {
            colHTML += `
                <div class="flex justify-between items-center group">
                    <div class="flex flex-col pr-4">
                        <span class="font-serif text-lg text-gray-700 group-hover:text-[#8b0000] transition-colors">${attr.name}</span>
                        ${attr.desc ? `<span class="text-xs text-gray-500 italic mt-0.5 leading-tight">${attr.desc}</span>` : ''}
                    </div>
                    <div class="shrink-0">
                        ${createDotsHTML('attribute', attr.id, state.attributes[attr.id], 5, 0)}
                    </div>
                </div>
            `;
        });
        colHTML += `</div></div>`;
        grid.innerHTML += colHTML;
    });
    
    // Оновлюємо трекери здоров'я та сили волі
    if (typeof renderHealthWillpower === 'function') {
        renderHealthWillpower();
    }
}
function getDynamicSkillData(skillId) {
    let baseDots = state.skills[skillId] || 0;
    let manualSpec = state.skillSpecs ? (state.skillSpecs[skillId] || "") : "";
    
    let isPredator = (state.predatorChoices && state.predatorChoices.skill === skillId);
    let predSpec = isPredator ? state.predatorChoices.specName : "";
    let bonus = (isPredator && baseDots === 0) ? 1 : 0;
    
    let fixedSpecInput = document.getElementById('spec-' + skillId);
    let fixedSpecValue = fixedSpecInput ? fixedSpecInput.value.trim() : "";
    
    let customSpecSkill = document.getElementById('spec-custom-skill')?.value;
    let customSpecValue = document.getElementById('spec-custom-name')?.value.trim();
    let isCustom = (customSpecSkill === skillId && customSpecValue);

    let displaySpec = manualSpec;
    
    if (isPredator && predSpec) {
        if (!displaySpec) displaySpec = predSpec;
        else if (!displaySpec.toLowerCase().includes(predSpec.toLowerCase())) displaySpec = predSpec + ", " + displaySpec;
    }
    if (fixedSpecValue) {
        if (!displaySpec) displaySpec = fixedSpecValue;
        else if (!displaySpec.toLowerCase().includes(fixedSpecValue.toLowerCase())) displaySpec += ", " + fixedSpecValue;
    }
    if (isCustom) {
        if (!displaySpec) displaySpec = customSpecValue;
        else if (!displaySpec.toLowerCase().includes(customSpecValue.toLowerCase())) displaySpec += ", " + customSpecValue;
    }
    
    let freeSpecDot = 0;
    if (baseDots === 0 && bonus === 0 && displaySpec.trim() !== '') {
        freeSpecDot = 1;
    }
    
    return { baseDots, bonus, freeSpecDot, displaySpec };
}

function updateSkillSpec(skillId, newValue) {
    if (!state.skillSpecs) state.skillSpecs = {};
    state.skillSpecs[skillId] = newValue;
    renderSkills();
}
function renderSkills() {
    const grid = document.getElementById('skills-grid');
    grid.innerHTML = '';
    const categories = [
        { key: 'physical', label: 'Фізичні' },
        { key: 'social', label: 'Соціальні' },
        { key: 'mental', label: 'Ментальні' }
    ];

    if (!state.skillSpecs) state.skillSpecs = {};

    categories.forEach(cat => {
        let colHTML = `<div><h3 class="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wider">${cat.label}</h3><div class="space-y-4">`;
        (skillsData[cat.key] || []).forEach(skill => {
            const data = getDynamicSkillData(skill.id);
            
            colHTML += `
                <div class="flex justify-between items-start group">
                    <div class="flex flex-col pr-4 w-full">
                        <span class="font-serif text-base text-gray-700 group-hover:text-[#8b0000] transition-colors">${skill.name}</span>
                        ${skill.desc ? `<span class="text-[11px] text-gray-500 italic mt-0.5 leading-tight">${skill.desc}</span>` : ''}
                        <input type="text" placeholder="Спеціалізація..." 
                               value="${data.displaySpec}" 
                               onchange="updateSkillSpec('${skill.id}', this.value)"
                               class="mt-1 w-full bg-transparent border-b border-gray-200 px-1 py-0.5 text-[12px] text-gray-600 outline-none focus:border-[#8b0000] transition-colors placeholder:text-gray-300">
                    </div>
                    <div class="shrink-0 mt-0.5">
                        ${createDotsHTML('skill', skill.id, data.baseDots, 5, data.bonus, data.freeSpecDot)}
                    </div>
                </div>
            `;
        });
        colHTML += `</div></div>`;
        grid.innerHTML += colHTML;
    });
    
    // Оновлюємо трекери здоров'я та сили волі
    if (typeof renderHealthWillpower === 'function') {
        renderHealthWillpower();
    }
}

function parseDotOptions(costStr) {
    const str = String(costStr).trim();
    
    if (str.includes(',') || str.includes('/')) {
        return str.split(/[,/]/).map(part => part.replace(/[^•]/g, '').length).filter(n => n > 0);
    }
    
    if (str.includes('-')) {
        const parts = str.split('-');
        let min = parts[0].replace(/[^•]/g, '').length;
        let max = parts[parts.length - 1].replace(/[^•]/g, '').length;
        let res = [];
        for(let i = min; i <= max; i++) res.push(i);
        return res;
    } 
    
    if (str.includes('+')) {
        let min = str.replace(/[^•]/g, '').length;
        let res = [];
        for(let i = min; i <= 5; i++) res.push(i); 
        return res;
    }
    
    let count = str.replace(/[^•]/g, '').length;
    return [count > 0 ? count : 1];
}

function populateAdvantageCategories() {
    const select = document.getElementById('adv-category-filter');
    if (!select || !state.advantagesData) return;
    
    // Дістаємо всі унікальні категорії і сортуємо за алфавітом
    const categories = [...new Set(state.advantagesData.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    
    let html = '<option value="all">Всі категорії</option>';
    categories.forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
    });
    select.innerHTML = html;
}

function renderAvailableAdvantages() {
    const container = document.getElementById('available-advantages');
    if (state.advantagesData.length === 0) return;

    const searchQuery = document.getElementById('adv-search').value.toLowerCase();
    const filterType = document.getElementById('adv-type-filter').value;
    const filterCat = document.getElementById('adv-category-filter')?.value || 'all';
    const filterDots = document.getElementById('adv-dots-filter')?.value || 'all';

    const filtered = state.advantagesData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) || item.desc.toLowerCase().includes(searchQuery);
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesCat = filterCat === 'all' || item.category === filterCat;
        
        let matchesDots = true;
        if (filterDots !== 'all') {
            const options = parseDotOptions(item.cost);
            matchesDots = options.includes(parseInt(filterDots));
        }

        return matchesSearch && matchesType && matchesCat && matchesDots;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-gray-400 text-center py-4">Нічого не знайдено...</div>`;
        return;
    }

    let html = '';
    filtered.forEach(item => {
        let badgeClass = 'bg-gray-100 text-gray-700';
        let titleColor = 'text-gray-800';
        let typeLabel = 'Благо';
        if (item.type === 'merit') { badgeClass = 'bg-red-100 text-red-800'; titleColor = 'text-red-800'; typeLabel = 'Чеснота'; } 
        else if (item.type === 'flaw') { badgeClass = 'bg-gray-800 text-white'; titleColor = 'text-gray-900'; typeLabel = 'Вада'; } 
        else if (item.type === 'background') { badgeClass = 'bg-blue-100 text-blue-800'; titleColor = 'text-blue-800'; typeLabel = 'Надбання'; }

        const options = parseDotOptions(item.cost);
        let actionButtons = '';
        options.forEach(cost => {
            const isAlreadySelected = state.selectedAdvantages.some(s => s.id === item.id && s.cost === cost);
            actionButtons += `
                <button onclick="addAdvantage(${item.id}, ${cost})" 
                    class="px-2 py-1 text-xs font-bold rounded border transition-colors 
                    ${isAlreadySelected ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300 hover:bg-gray-100'}">
                    + ${cost} ⬤
                </button>
            `;
        });

        html += `
            <div class="border-b border-gray-100 pb-4 last:border-0">
                <div class="flex justify-between items-start mb-1 gap-2">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass}">${typeLabel} | ${item.category}</span>
                        <h4 class="font-serif font-bold text-base ${titleColor} mt-1">${item.name}</h4>
                    </div>
                    <div class="flex flex-wrap gap-1 justify-end min-w-max">
                        ${actionButtons}
                    </div>
                </div>
                <p class="text-xs text-gray-600 leading-snug">${item.desc}</p>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderSelectedAdvantages() {
    const container = document.getElementById('selected-advantages');
    if (state.selectedAdvantages.length === 0) {
        container.innerHTML = `<div class="text-gray-400 text-center py-10">Ви ще не обрали жодного блага чи вади.</div>`;
        return;
    }

    let html = '';
    state.selectedAdvantages.forEach((sel, index) => {
        let badgeClass = sel.type === 'flaw' ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-800';
        let isPredator = (sel.source === 'predator');
        
        // Якщо від хижака — показуємо бейдж замість кнопки видалення
        let actionHTML = isPredator 
            ? `<span class="text-[9px] font-bold text-[#4b0082] uppercase tracking-widest px-2 py-1 bg-purple-100 border border-purple-200 rounded">Від Хижака</span>`
            : `<button onclick="removeAdvantage(${index})" class="text-red-500 hover:text-red-700 p-1 font-bold text-lg leading-none">&times;</button>`;
        
        html += `
            <div class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center animate-[fadeIn_0.3s_ease-in-out]">
                <div>
                    <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass}">
                        ${sel.type === 'flaw' ? 'Вада' : 'Благо'}
                    </span>
                    <h4 class="font-serif font-bold text-sm text-gray-800 mt-1">${sel.name}</h4>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-bold text-sm text-gray-700">${sel.cost} ⬤</span>
                    ${actionHTML}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function addAdvantage(id, cost) {
    const item = state.advantagesData.find(i => i.id === id);
    if (!item) return;
    if (state.selectedAdvantages.some(s => s.id === id && s.cost === cost)) return;

    state.selectedAdvantages.push({ id: item.id, name: item.name, type: item.type, cost: cost });
    renderAvailableAdvantages(); 
    renderSelectedAdvantages();
    updateTrackers();
}

function removeAdvantage(index) {
    state.selectedAdvantages.splice(index, 1);
    renderAvailableAdvantages();
    renderSelectedAdvantages();
    updateTrackers();
}

function populateClanSelects() {
    let optionsHTML = '';
    for (const [key, data] of Object.entries(clansData)) {
        optionsHTML += `<option value="${key}">${data.name}</option>`;
    }
    
    // Безпечне присвоєння: перевіряємо, чи є елементи на сторінці
    const select1 = document.getElementById('clan-select-1');
    const select4 = document.getElementById('clan-select-4');
    
    if (select1) select1.innerHTML = optionsHTML;
    if (select4) select4.innerHTML = optionsHTML;
}

function changeClan(clanId) {
    state.clan = clanId;
    
    // Безпечне присвоєння значень
    const select1 = document.getElementById('clan-select-1');
    const select4 = document.getElementById('clan-select-4');
    if (select1) select1.value = clanId;
    if (select4) select4.value = clanId;
    
    const clanInfo = clansData[clanId] || {};
    
    const desc1 = document.getElementById('clan-desc-1');
    if (desc1) desc1.innerText = clanInfo.desc || '';
    
    const compulsionContainer = document.getElementById('clan-compulsion-container');
    const compulsionText = document.getElementById('clan-compulsion-text');
    if (compulsionContainer && compulsionText) {
        if (clanInfo.clan_compultion && clanInfo.clan_compultion.trim().toLowerCase() !== "відсутнє") {
            compulsionText.innerText = clanInfo.clan_compultion;
            compulsionContainer.classList.remove('hidden');
        } else {
            compulsionContainer.classList.add('hidden');
        }
    }

    const baneContainer = document.getElementById('clan-bane-container');
    const baneText = document.getElementById('clan-bane-text');
    if (baneContainer && baneText) {
        if (clanInfo.clan_bane && clanInfo.clan_bane.trim().toLowerCase() !== "відсутнє") {
            baneText.innerText = clanInfo.clan_bane;
            baneContainer.classList.remove('hidden');
        } else {
            baneContainer.classList.add('hidden');
        }
    }
    
    Object.keys(state.disciplines).forEach(k => state.disciplines[k] = 0);
    state.disciplinePowers = {}; 
    state.manualDisciplines = []; // Скидаємо вручну додані дисципліни при зміні клану

    renderDisciplines();
    updateTrackers();
    updateHeaderInfo();
}

function updateHeaderInfo() {
    const nameInput = document.getElementById('character-name');
    const displayName = (nameInput && nameInput.value.trim() !== '') ? nameInput.value : 'Безіменний';
    
    const clanName = (clansData && clansData[state.clan]) ? clansData[state.clan].name : 'Невідомо';
    
    const headerName = document.getElementById('header-char-name');
    const headerClan = document.getElementById('header-char-clan');
    
    if (headerName) headerName.innerText = displayName;
    if (headerClan) headerClan.innerText = clanName;
}

function populateCustomSpecDropdown() {
    const select = document.getElementById('spec-custom-skill');
    select.innerHTML = '<option value="">-- Оберіть навичку --</option>';
    let allSkills = [];
    Object.values(skillsData).forEach(arr => { allSkills = allSkills.concat(arr); });
    allSkills.sort((a, b) => a.name.localeCompare(b.name));
    allSkills.forEach(skill => {
        select.innerHTML += `<option value="${skill.id}">${skill.name}</option>`;
    });
}

function goToStep(step) {
    if (step === 7) {
        finishGen();
    }
    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    [1, 2, 3, 4, 5, 6, 7].forEach(i => {
        const btn = document.getElementById(`nav-step-${i}`);
        if(btn) {
            if (i === step) {
                btn.classList.add('bg-[#8b0000]', 'text-white');
                btn.classList.remove('text-gray-400', 'hover:bg-gray-800');
            } else {
                btn.classList.remove('bg-[#8b0000]', 'text-white');
                btn.classList.add('text-gray-400', 'hover:bg-gray-800');
            }
        }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTrackers() {
const discCounts = { 2: 0, 1: 0 };
    Object.entries(state.disciplines).forEach(([key, val]) => {
        // Ігноруємо ритуали та церемонії для лічильника дисциплін
        if (key === 'blood_sorcery_rituals' || key === 'oblivion_ceremonies') return; 
        
        if (val === 2) discCounts[2]++;
        else if (val === 1) discCounts[1]++;
        else if (val > 2) discCounts[2]++;
    });
    const discTracker = document.getElementById('disc-tracker');
    discTracker.innerHTML = [2, 1].map(val => {
        const current = discCounts[val];
        const target = 1;
        let badgeClass = current === target ? 'valid' : (current > target ? 'exceeded' : 'invalid');
        return `<div class="px-3 py-1 rounded border tracker-badge ${badgeClass}">
            ${val} ⬤ : ${current} / ${target}
        </div>`;
    }).join('');

    const attrCounts = { 4: 0, 3: 0, 2: 0, 1: 0 };
    Object.values(state.attributes).forEach(val => {
        if (val >= 1 && val <= 4) attrCounts[val]++;
    });
    const attrTracker = document.getElementById('attr-tracker');
    attrTracker.innerHTML = [4, 3, 2].map(val => {
        const current = attrCounts[val];
        const target = attrTarget[val];
        let badgeClass = current === target ? 'valid' : (current > target ? 'exceeded' : 'invalid');
        return `<div class="px-3 py-1 rounded border tracker-badge ${badgeClass}">
            ${val} ⬤ : ${current} / ${target}
        </div>`;
    }).join('');

    const skillCounts = { 4: 0, 3: 0, 2: 0, 1: 0 };
    Object.values(state.skills).forEach(val => {
        if (val >= 1 && val <= 4) skillCounts[val]++;
    });
    const target = skillTargets[state.distribution];
    const skillTracker = document.getElementById('skill-tracker');
    let skillHtml = '';
    [4, 3, 2, 1].forEach(val => {
        const targetVal = target[val] || 0;
        const current = skillCounts[val];
        if (targetVal > 0 || current > 0) {
            let badgeClass = current === targetVal ? 'valid' : (current > targetVal ? 'exceeded' : 'invalid');
            skillHtml += `<div class="px-3 py-1 rounded border tracker-badge ${badgeClass}">
                ${val} ⬤ : ${current} / ${targetVal}
            </div>`;
        }
    });
    skillTracker.innerHTML = skillHtml;

    let totalMeritsDots = 0;
    let totalFlawsDots = 0;
    state.selectedAdvantages.forEach(adv => {
        // Ігноруємо безкоштовні переваги, які дав тип хижака
        if (adv.source !== 'predator') {
            if (adv.type === 'flaw') totalFlawsDots += adv.cost;
            else totalMeritsDots += adv.cost; 
        }
    });
    
    const meritsEl = document.getElementById('merits-tracker');
    const flawsEl = document.getElementById('flaws-tracker');

    meritsEl.innerText = `${totalMeritsDots} / 7 ⬤`;
    flawsEl.innerText = `${totalFlawsDots} / 2 ⬤`;
    
    meritsEl.className = `px-3 py-1 text-sm font-bold rounded border tracker-badge ${totalMeritsDots === 7 ? 'valid' : (totalMeritsDots > 7 ? 'exceeded' : 'invalid')}`;
    flawsEl.className = `px-3 py-1 text-sm font-bold rounded border tracker-badge ${totalFlawsDots === 2 ? 'valid' : (totalFlawsDots > 2 ? 'exceeded' : 'invalid')}`;
}

function changeSkillDistribution() {
    state.distribution = document.getElementById('skill-distribution').value;
    updateTrackers();
}

function finishGen() {
    const name = document.getElementById('character-name').value || 'Безіменний Кревний';
    const concept = document.getElementById('concept-phrase').value || 'Невідомий концепт';
    const backgroundText = document.getElementById('concept-bg').value || 'Історія персонажа відсутня.';
    const clanInfo = clansData[state.clan] || {};
    const clanName = clanInfo.name || 'Невідомо';
    const clanCompulsion = clanInfo.clan_compultion && clanInfo.clan_compultion.trim().toLowerCase() !== "відсутнє" ? clanInfo.clan_compultion : 'Немає';
    const clanBane = clanInfo.clan_bane && clanInfo.clan_bane.trim().toLowerCase() !== "відсутнє" ? clanInfo.clan_bane : 'Немає';
    
    const predator = state.selectedPredator ? state.predatorData.find(p => p.id === state.selectedPredator) : null;
    const predatorName = predator ? predator.name : 'Не обрано';
    const predatorDesc = predator ? predator.description : '';
    
    let currentHumanity = 7;
    if (predator && predator.humanity_modifier) currentHumanity += predator.humanity_modifier;

    document.getElementById('summary-name').innerText = name;
    document.getElementById('summary-concept').innerText = `${concept} | ${clanName} | ${predatorName}`;
    document.getElementById('summary-humanity').innerText = currentHumanity;

    let summaryHTML = '';
    const cats = [{ key: 'physical', label: 'Фізичні' }, { key: 'social', label: 'Соціальні' }, { key: 'mental', label: 'Ментальні' }];

    // СЕКЦІЯ 1: КОНЦЕПТ ТА КЛАН (Вкладка 1)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">1. Концепт та Кров</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Концепт:</strong> <span class="text-gray-900 font-serif text-base">${concept}</span></p>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Клан:</strong> <span class="text-gray-900 font-serif text-base">${clanName}</span></p>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Історія / Фон:</strong> <span class="text-gray-700 font-serif italic block mt-1">${backgroundText}</span></p>
                </div>
                <div class="space-y-3 bg-white p-4 rounded border border-gray-100 print:border-gray-200">
                    <div><strong class="text-[#8b0000] uppercase text-[10px] tracking-widest block">Клановий примус:</strong> <p class="text-xs text-gray-800 leading-snug">${clanCompulsion}</p></div>
                    <div><strong class="text-red-700 uppercase text-[10px] tracking-widest block">Кланове прокляття:</strong> <p class="text-xs text-gray-800 leading-snug">${clanBane}</p></div>
                </div>
            </div>
        </div>
    `;

    // СЕКЦІЯ 2: ХАРАКТЕРИСТИКИ (Вкладка 2)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">2. Характеристики</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    `;
    cats.forEach(cat => {
        summaryHTML += `<div><h4 class="font-bold text-xs text-gray-400 uppercase mb-3">${cat.label}</h4><div class="space-y-2">`;
        (attributesData[cat.key] || []).forEach(attr => {
            summaryHTML += `<div class="flex justify-between items-center text-sm border-b border-gray-100 pb-1"><span class="font-serif font-bold text-gray-800">${attr.name}</span> <span>${createSummaryDots(state.attributes[attr.id])}</span></div>`;
        });
        summaryHTML += `</div></div>`;
    });
    summaryHTML += `</div></div>`;

    // СЕКЦІЯ 3: НАВИЧКИ ТА СПЕЦІАЛІЗАЦІЇ (Вкладка 3)
    if (!state.skillSpecs) state.skillSpecs = {};

    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">3. Навички та Спеціалізації</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    `;
    cats.forEach(cat => {
        summaryHTML += `<div><h4 class="font-bold text-xs text-gray-400 uppercase mb-3">${cat.label}</h4><div class="space-y-2">`;
        (skillsData[cat.key] || []).forEach(skill => {
            const data = getDynamicSkillData(skill.id);
            let totalDots = data.baseDots + data.bonus + data.freeSpecDot;
            
            if (totalDots > 0) {
                let specText = data.displaySpec ? ` <span class="text-[11px] text-gray-600 font-normal italic">(${data.displaySpec})</span>` : '';
                summaryHTML += `<div class="flex justify-between items-center text-sm border-b border-gray-100 pb-1"><span class="font-serif font-bold text-gray-800">${skill.name}${specText}</span> <span>${createSummaryDots(totalDots)}</span></div>`;
            }
        });
        summaryHTML += `</div></div>`;
    });
    summaryHTML += `</div></div>`;

    // СЕКЦІЯ 4: ХИЖАЦЬКІ ЗВИЧКИ (Вкладка 4)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">4. Хижацькі звички</h3>
            <div class="text-sm space-y-2">
                <p><strong>Обраний тип хижака:</strong> <span class="font-serif font-bold text-lg text-[#8b0000]">${predatorName}</span></p>
                ${predatorDesc ? `<p class="text-gray-600 text-xs italic">${predatorDesc}</p>` : ''}
                ${predator && predator.advantages_text ? `<p class="mt-2 text-xs bg-indigo-50 p-2.5 rounded border border-indigo-100 text-indigo-900"><strong>Бонуси хижака:</strong> ${predator.advantages_text}</p>` : ''}
            </div>
        </div>`;

    // СЕКЦІЯ 5: ДИСЦИПЛІНИ ТА ЗДІБНОСТІ (Вкладка 5)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">5. Дисципліни та Здібності</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    `;
    
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    if (state.predatorChoices.discipline && !availableDisc.includes(state.predatorChoices.discipline)) {
        availableDisc.push(state.predatorChoices.discipline);
    }
  if (state.manualDisciplines) {
        state.manualDisciplines.forEach(d => {
            if (!availableDisc.includes(d)) availableDisc.push(d);
        });
    }

    // --- ДОДАННЯ У ПІДСУМОК (Ритуали та Церемонії) ---
    let bsTotalDots = (state.disciplines['blood_sorcery'] || 0) + (state.predatorChoices.discipline === 'blood_sorcery' ? 1 : 0);
    if (bsTotalDots > 0 && !availableDisc.includes('blood_sorcery_rituals')) {
        availableDisc.push('blood_sorcery_rituals');
    }

    let obTotalDots = (state.disciplines['oblivion'] || 0) + (state.predatorChoices.discipline === 'oblivion' ? 1 : 0);
    if (obTotalDots > 0 && !availableDisc.includes('oblivion_ceremonies')) {
        availableDisc.push('oblivion_ceremonies');
    }
    let hasDisciplines = false;
    availableDisc.forEach(discKey => {
        let totalDots = (state.disciplines[discKey] || 0) + (state.predatorChoices.discipline === discKey ? 1 : 0);
        if (totalDots > 0) {
            hasDisciplines = true;
            const discInfo = getDisciplineInfo(discKey);
            const discName = discInfo.name || discKey;
            
            summaryHTML += `
                <div class="bg-white p-4 rounded-lg border border-gray-200 print:border-gray-300 print:bg-transparent shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <span class="font-serif font-bold text-lg text-[#8b0000] uppercase tracking-wider">${discName}</span> 
                        <span>${createSummaryDots(totalDots)}</span>
                    </div>
                    <ul class="space-y-2">
            `;

            for (let i = 1; i <= totalDots; i++) {
                let powerId = state.disciplinePowers[discKey]?.[i];
                if (powerId) {
                    let powerInfo = disciplinesPowersMap[discKey]?.find(p => p.id === powerId);
                    if (powerInfo) {
                        summaryHTML += `
                            <li class="text-sm border-t border-gray-100 pt-2 print:border-gray-200">
                                <div class="font-bold text-gray-800 mb-1">Рівень ${i}: ${powerInfo.name}</div>
                                <p class="text-xs text-gray-600 leading-snug text-justify mb-2">${powerInfo.desc}</p>
                                <div class="text-[11px] text-gray-500 space-y-0.5">
                                    ${(powerInfo.requirement && String(powerInfo.requirement).trim().toLowerCase() !== 'немає' && String(powerInfo.requirement).trim() !== '') ? `<p><span class="font-bold text-gray-700">Вимога:</span> ${powerInfo.requirement}</p>` : ''}
                                    ${(powerInfo.rouseCost && String(powerInfo.rouseCost).trim().toLowerCase() !== 'немає' && String(powerInfo.rouseCost).trim() !== '') ? `<p><span class="font-bold text-gray-700">Збурення:</span> ${powerInfo.rouseCost}</p>` : ''}
                                    ${(powerInfo.dicePool && String(powerInfo.dicePool).trim().toLowerCase() !== 'немає' && String(powerInfo.dicePool).trim() !== '') ? `<p><span class="font-bold text-gray-700">Пул:</span> ${powerInfo.dicePool}</p>` : ''}
                                </div>
                            </li>
                        `;
                    }
                }
            }
            summaryHTML += `</ul></div>`;
        }
    });

    if (!hasDisciplines) {
        summaryHTML += `<p class="text-sm text-gray-500 italic col-span-full">Персонаж ще не опанував жодних дисциплін.</p>`;
    }
    summaryHTML += `</div></div>`;

     // СЕКЦІЯ 6: БЛАГА ТА ВАДИ (Вкладка 6)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">6. Блага та Вади</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;
    
    if (state.selectedAdvantages.length === 0) {
        summaryHTML += `<p class="text-sm text-gray-500 italic col-span-full">Переваги чи недоліки відсутні.</p>`;
    } else {
        state.selectedAdvantages.forEach(adv => {
            let badgeClass = adv.type === 'flaw' ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-800';
            let label = adv.type === 'flaw' ? 'Вада' : 'Благо';
            let predatorBadge = adv.source === 'predator' ? `<span class="ml-2 text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 rounded uppercase tracking-wider print:hidden">Від хижака</span>` : '';
            
            summaryHTML += `
                <div class="flex justify-between items-center bg-white p-3 rounded border border-gray-200 print:border-gray-300 print:bg-transparent">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass} print:border print:border-gray-300 print:bg-transparent print:text-black">${label}</span>
                        <span class="font-serif font-bold text-gray-800 ml-2">${adv.name}</span>
                        ${predatorBadge}
                    </div>
                    <span class="font-bold text-sm text-gray-700">${adv.cost} ⬤</span>
                </div>
            `;
        });
    }
    summaryHTML += `</div></div>`;
    
    // Add Health and Willpower Trackers Placeholder to Summary
    summaryHTML += `
        <div class="mt-8 pt-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800 uppercase tracking-widest vtm-font">Здоров'я</h3>
                    <div class="text-xs text-gray-500 italic">Витривалість + 3</div>
                </div>
                <div id="health-tracker-step7" class="flex flex-wrap gap-2"></div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800 uppercase tracking-widest vtm-font">Сила Волі</h3>
                    <div class="text-xs text-gray-500 italic">Рішучість + Витримка</div>
                </div>
                <div id="willpower-tracker-step7" class="flex flex-wrap gap-2"></div>
            </div>
        </div>
    `;

    document.getElementById('summary-content').innerHTML = summaryHTML;
    renderHealthWillpower();
}

function createSummaryDots(count, max = 5) {
    let html = '<div class="flex gap-1">';
    for (let i = 1; i <= max; i++) {
        html += `<div class="w-2.5 h-2.5 rounded-full border border-[#1a1a1a] ${i <= count ? 'bg-[#8b0000] border-[#8b0000]' : 'bg-transparent'}"></div>`;
    }
    html += '</div>';
    return html;
}

// Обирає випадковий клан зі списку та оновлює форму
function setRandomClan() {
    const select = document.getElementById('clan-select-1');
    if (!select || select.options.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * select.options.length);
    select.selectedIndex = randomIndex;
    
    // Викликаємо існуючу функцію зміни клану, щоб оновити дисципліни та опис
    changeClan(select.value);
}

function openMenu() {
    document.getElementById('sidebar-nav').classList.remove('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.remove('hidden');
}

function closeMenu() {
    document.getElementById('sidebar-nav').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

function setupSpecializationInputs() {
    const inputs = ['spec-academics', 'spec-craft', 'spec-performance', 'spec-science', 'spec-custom-name'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderSkills);
    });
    const selectEl = document.getElementById('spec-custom-skill');
    if (selectEl) selectEl.addEventListener('change', renderSkills);
}

window.addEventListener('DOMContentLoaded', () => {
    init();
    setupSpecializationInputs();
});


// --- Dice Module ---
let diceMode = 'free';

function openDiceModal() {
    const m = document.getElementById('dice-modal');
    if(m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
    }
    populateDiceFreeSelect();
    populateDiceSheetSelects();
}

function closeDiceModal() {
    const m = document.getElementById('dice-modal');
    if(m) {
        m.classList.add('hidden');
        m.classList.remove('flex');
    }
}

function switchDiceTab(mode) {
    diceMode = mode;
    if (mode === 'free') {
        document.getElementById('dice-tab-free').classList.replace('border-transparent', 'border-[#8b0000]');
        document.getElementById('dice-tab-free').classList.replace('text-gray-500', 'text-white');
        document.getElementById('dice-tab-sheet').classList.replace('border-[#8b0000]', 'border-transparent');
        document.getElementById('dice-tab-sheet').classList.replace('text-white', 'text-gray-500');
        document.getElementById('dice-mode-free').classList.remove('hidden');
        document.getElementById('dice-mode-sheet').classList.add('hidden');
    } else {
        document.getElementById('dice-tab-sheet').classList.replace('border-transparent', 'border-[#8b0000]');
        document.getElementById('dice-tab-sheet').classList.replace('text-gray-500', 'text-white');
        document.getElementById('dice-tab-free').classList.replace('border-[#8b0000]', 'border-transparent');
        document.getElementById('dice-tab-free').classList.replace('text-white', 'text-gray-500');
        document.getElementById('dice-mode-sheet').classList.remove('hidden');
        document.getElementById('dice-mode-free').classList.add('hidden');
    }
    const container = document.getElementById('dice-container');
    if (container) container.innerHTML = '';
    document.getElementById('dice-results')?.classList.add('hidden');
}

function populateDiceFreeSelect() {
    const sel = document.getElementById('dice-free-total');
    if (!sel || sel.options.length > 0) return;
    for (let i = 1; i <= 10; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.text = i;
        sel.appendChild(opt);
    }
    sel.value = '1';
}

function generateDiceOptgroup() {
    let html = '<option value="">- Оберіть -</option>';
    
    // Attributes
    html += '<optgroup label="Характеристики">';
    Object.keys(attributesData).forEach(cat => {
        attributesData[cat].forEach(attr => {
            html += `<option value="attr_${attr.id}">${attr.name}</option>`;
        });
    });
    html += '</optgroup>';
    
    // Skills
    html += '<optgroup label="Навички">';
    Object.keys(skillsData).forEach(cat => {
        skillsData[cat].forEach(skill => {
            html += `<option value="skill_${skill.id}">${skill.name}</option>`;
        });
    });
    html += '</optgroup>';
    
    // Disciplines
    html += '<optgroup label="Дисципліни">';
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    if (state.predatorChoices && state.predatorChoices.discipline && !availableDisc.includes(state.predatorChoices.discipline)) {
        availableDisc.push(state.predatorChoices.discipline);
    }
    if (state.manualDisciplines) {
        state.manualDisciplines.forEach(d => {
            if (!availableDisc.includes(d)) availableDisc.push(d);
        });
    }
    // Add rituals and ceremonies if applicable
    let bsTotalDots = (state.disciplines['blood_sorcery'] || 0) + (state.predatorChoices && state.predatorChoices.discipline === 'blood_sorcery' ? 1 : 0);
    if (bsTotalDots > 0 && !availableDisc.includes('blood_sorcery_rituals')) availableDisc.push('blood_sorcery_rituals');
    
    let obTotalDots = (state.disciplines['oblivion'] || 0) + (state.predatorChoices && state.predatorChoices.discipline === 'oblivion' ? 1 : 0);
    if (obTotalDots > 0 && !availableDisc.includes('oblivion_ceremonies')) availableDisc.push('oblivion_ceremonies');

    availableDisc.forEach(d => {
        let name = disciplinesData[d] ? disciplinesData[d].name : d;
        if (d === 'blood_sorcery_rituals') name = 'Ритуали Чарів Крові';
        if (d === 'oblivion_ceremonies') name = 'Церемонії Забуття';
        html += `<option value="disc_${d}">${name}</option>`;
    });
    html += '</optgroup>';
    
    return html;
}

function populateDiceSheetSelects() {
    const html = generateDiceOptgroup();
    ['dice-sheet-1', 'dice-sheet-2', 'dice-sheet-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const currentVal = el.value;
            el.innerHTML = html;
            if (currentVal) el.value = currentVal;
        }
    });
    updateSheetDiceTotal();
}

function getDotsForSelection(val) {
    if (!val) return 0;
    const parts = val.split('_');
    const type = parts[0];
    const id = parts.slice(1).join('_');
    
    if (type === 'attr') return state.attributes[id] || 0;
    if (type === 'skill') {
        const data = getDynamicSkillData(id);
        return data.baseDots + data.bonus + data.freeSpecDot;
    }
    if (type === 'disc') {
        let discId = id;
        if (id === 'blood_sorcery_rituals') discId = 'blood_sorcery';
        if (id === 'oblivion_ceremonies') discId = 'oblivion';
        return state.disciplines[discId] || 0;
    }
    return 0;
}

function updateSheetDiceTotal() {
    let total = 0;
    total += getDotsForSelection(document.getElementById('dice-sheet-1')?.value);
    total += getDotsForSelection(document.getElementById('dice-sheet-2')?.value);
    total += getDotsForSelection(document.getElementById('dice-sheet-3')?.value);
    
    const bonusStr = document.getElementById('dice-sheet-bonus')?.value || '0';
    total += parseInt(bonusStr, 10) || 0;
    
    if (total < 0) total = 0;
    
    const display = document.getElementById('dice-sheet-total-display');
    if (display) display.innerText = total;
}

function rollDice() {
    let totalDice = 0;
    let hungerDice = 0;
    
    if (diceMode === 'free') {
        totalDice = parseInt(document.getElementById('dice-free-total')?.value) || 0;
        hungerDice = parseInt(document.getElementById('dice-free-hunger')?.value) || 0;
    } else {
        totalDice = parseInt(document.getElementById('dice-sheet-total-display')?.innerText) || 0;
        hungerDice = parseInt(document.getElementById('dice-sheet-hunger')?.value) || 0;
    }
    
    if (totalDice === 0) return;
    
    if (hungerDice > totalDice) hungerDice = totalDice;
    
    let normalDice = totalDice - hungerDice;
    
    const container = document.getElementById('dice-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    let successes = 0;
    let tens = 0;
    let hungerTens = 0;
    let bestialFailure = false;
    
    let diceHtml = '';

    // Normal Dice (Black with White Numbers)
    for(let i=0; i<normalDice; i++) {
        let res = Math.floor(Math.random() * 10) + 1;
        if (res >= 6) successes++;
        if (res === 10) tens++;
        
        let imgSrc = '';
        if (res <= 5) imgSrc = 'assets/failure.png';
        else if (res <= 9) imgSrc = 'assets/success.png';
        else imgSrc = 'assets/critical.png';
        
        diceHtml += `<div class="w-12 h-12 bg-black flex items-center justify-center rounded-lg border-2 border-gray-600 shadow-md p-1" title="Випало: ${res}"><img src="${imgSrc}" class="w-full h-full object-contain" alt="${res}"></div>`;
    }
    
    // Hunger Dice (Red with Black Numbers)
    for(let i=0; i<hungerDice; i++) {
        let res = Math.floor(Math.random() * 10) + 1;
        if (res >= 6) successes++;
        if (res === 10) {
            tens++;
            hungerTens++;
        }
        if (res === 1) bestialFailure = true;
        
        let imgSrc = '';
        if (res === 1) imgSrc = 'assets/bestial-failure.png';
        else if (res <= 5) imgSrc = 'assets/failure.png'; // User explicitly said failure.png for 2-5
        else if (res <= 9) imgSrc = 'assets/hunger-success.png';
        else imgSrc = 'assets/hunger-critical.png';
        
        diceHtml += `<div class="w-12 h-12 bg-[#8b0000] flex items-center justify-center rounded-lg border-2 border-black shadow-md shadow-red-900 p-1" title="Випало: ${res}"><img src="${imgSrc}" class="w-full h-full object-contain" alt="${res}"></div>`;
    }
    
    // Pairs of 10s give +2 successes each
    let critBonus = Math.floor(tens / 2) * 2;
    successes += critBonus;
    
    let messyCritical = (tens >= 2 && hungerTens >= 1);
    
    let summaryHtml = `
        <div class="w-full mt-4 p-3 bg-gray-800 rounded border border-gray-700 text-center">
            <div class="text-lg text-white">Успіхи: <span class="font-bold text-2xl text-[#8b0000] ml-2">${successes}</span></div>
            ${messyCritical ? '<div class="text-sm font-bold text-yellow-500 uppercase tracking-widest mt-2">Можливий Звіриний Розгром</div>' : ''}
            ${bestialFailure ? '<div class="text-sm font-bold text-red-500 uppercase tracking-widest mt-2">Можливий Звіриний Провал</div>' : ''}
        </div>
    `;
    
    container.innerHTML = `<div class="flex flex-wrap gap-2 justify-center w-full">${diceHtml}</div>${summaryHtml}`;
    
    document.getElementById('dice-results')?.classList.remove('hidden');
    
    // Add to history
    let rollName = '';
    if (diceMode === 'free') {
        rollName = 'Вільний кидок';
    } else {
        let parts = [];
        ['dice-sheet-1', 'dice-sheet-2', 'dice-sheet-3'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value) {
                parts.push(el.options[el.selectedIndex].text);
            }
        });
        
        let bonus = parseInt(document.getElementById('dice-sheet-bonus')?.value) || 0;
        if (bonus > 0) parts.push(`+${bonus}`);
        else if (bonus < 0) parts.push(`${bonus}`);
        
        rollName = parts.length > 0 ? parts.join(' + ') : 'Кидок з аркуша';
    }
    
    if (typeof diceHistory === 'undefined') {
        window.diceHistory = [];
    }
    
    window.diceHistory.unshift({ name: rollName, successes: successes, messy: messyCritical, bestial: bestialFailure });
    if (window.diceHistory.length > 5) window.diceHistory.pop();
    
    renderDiceHistory();
}

function renderDiceHistory() {
    const container = document.getElementById('dice-history-container');
    const list = document.getElementById('dice-history-list');
    if (!container || !list) return;

    if (!window.diceHistory || window.diceHistory.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    list.innerHTML = '';
    window.diceHistory.forEach(roll => {
        let alerts = [];
        if (roll.messy) alerts.push('<span class="text-yellow-500 text-[10px] ml-1 font-bold uppercase" title="Звіриний Розгром">!Розгром!</span>');
        if (roll.bestial) alerts.push('<span class="text-red-500 text-[10px] ml-1 font-bold uppercase" title="Звіриний Провал">!Провал!</span>');
        
        list.innerHTML += `
            <li class="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center">
                <span class="text-xs text-gray-300 truncate max-w-[200px]" title="${roll.name}">${roll.name}</span>
                <span class="text-sm font-bold text-white flex items-center">Успіхи: <span class="text-[#8b0000] ml-1 mr-1">${roll.successes}</span> ${alerts.join('')}</span>
            </li>
        `;
    });
}



// --- Health & Willpower Trackers ---

function getHealthMax() {
    return (state.attributes['stamina'] || 1) + 3;
}

function getWillpowerMax() {
    return (state.attributes['resolve'] || 1) + (state.attributes['composure'] || 1);
}

function handleDamageClick(type, index) {
    let arr = type === 'health' ? state.healthDamage : state.willpowerDamage;
    let max = type === 'health' ? getHealthMax() : getWillpowerMax();
    
    while(arr.length < max) arr.push(0);
    if(arr.length > max) arr.splice(max);
    
    arr[index] = (arr[index] + 1) % 3;
    
    renderHealthWillpower();
}

function renderHealthWillpower() {
    const healthMax = getHealthMax();
    const wpMax = getWillpowerMax();
    
    if (!state.healthDamage) state.healthDamage = [];
    if (!state.willpowerDamage) state.willpowerDamage = [];
    
    let hArr = state.healthDamage;
    while(hArr.length < healthMax) hArr.push(0);
    if(hArr.length > healthMax) hArr.splice(healthMax);
    
    let wArr = state.willpowerDamage;
    while(wArr.length < wpMax) wArr.push(0);
    if(wArr.length > wpMax) wArr.splice(wpMax);
    
    let hHtml = '';
    for(let i=0; i<healthMax; i++) {
        let content = hArr[i] === 1 ? '/' : (hArr[i] === 2 ? 'X' : '');
        hHtml += `<div class="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-400 bg-gray-50 flex items-center justify-center font-bold text-lg md:text-xl cursor-pointer hover:bg-gray-200 select-none text-red-600 print:border-gray-500" onclick="handleDamageClick('health', ${i})">${content}</div>`;
    }
    
    let wHtml = '';
    for(let i=0; i<wpMax; i++) {
        let content = wArr[i] === 1 ? '/' : (wArr[i] === 2 ? 'X' : '');
        wHtml += `<div class="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-400 bg-gray-50 flex items-center justify-center font-bold text-lg md:text-xl cursor-pointer hover:bg-gray-200 select-none text-red-600 print:border-gray-500" onclick="handleDamageClick('willpower', ${i})">${content}</div>`;
    }
    
    ['health-tracker-step2', 'health-tracker-step7'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = hHtml;
    });
    
    ['willpower-tracker-step2', 'willpower-tracker-step7'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = wHtml;
    });
}
