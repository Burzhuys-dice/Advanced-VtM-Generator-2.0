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
        const [advRes, predRes, coreRes, clansRes, discRes, archRes, namesRes, conceptsRes, glossRes] = await Promise.all([
            fetch('data/vtm_merits_data.json'),
            fetch('data/vtm_predator-types_1.json'),
            fetch('data/vtm_char_and_skills.json'),
            fetch('data/vtm_clans.json'),
            fetch('data/vtm_disciplines.json'),
            fetch('data/vtm_archetypes.json'), // Завантажуємо файл архетипів
            fetch('data/vtm_names.json'), // Завантажуємо файл імен
            fetch('data/vtm_consepts.json'), // Завантажуємо файл концептів
            fetch('data/vtm_glossary.json') // Завантажуємо файл словника
        ]);

        if (glossRes && glossRes.ok) {
            vtmGlossaryData = await glossRes.json();
        }

        if(advRes.ok) {
            state.advantagesData = await advRes.json();
            populateAdvantageCategories();
        }
        renderAvailableAdvantages();

        if(predRes.ok) state.predatorData = await predRes.json();
        renderPredatorTypes();

        if(namesRes.ok) {
            state.namesData = await namesRes.json();
        }

        if(conceptsRes.ok) {
            state.conceptsData = await conceptsRes.json();
        }

        if(coreRes.ok) {
            const coreDataRaw = await coreRes.json(); const coreData = Array.isArray(coreDataRaw) ? coreDataRaw[0] : coreDataRaw;
            if(coreData.attributes) {
                attributesData = coreData.attributes;
                window.attributesData = attributesData;
            }
            if(coreData.skills) {
                if(coreData.skills.physical) skillsData.physical = coreData.skills.physical;
                if(coreData.skills.social) skillsData.social = coreData.skills.social;
                if(coreData.skills.mental) skillsData.mental = coreData.skills.mental;
                window.skillsData = skillsData;
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
            window.clansData = clansData;
        }

        if(discRes.ok) {
            const dJson = await discRes.json();
            
            let discKeys = Array.isArray(disciplinesData) ? disciplinesData.map(d => d.id) : Object.keys(disciplinesData);
            discKeys.forEach(k => {
                disciplinesPowersMap[k] = [];
            });

            let rawPowers = dJson.powers || (Array.isArray(dJson) ? dJson : []);
            if (Array.isArray(rawPowers)) {
                rawPowers.forEach(power => {
                    let dKey = power.disc;
                    if (dKey) {
                        if (!disciplinesPowersMap[dKey]) disciplinesPowersMap[dKey] = [];
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
            window.disciplinesPowersMap = disciplinesPowersMap;
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

document.getElementById('btn-random-conviction3')?.addEventListener('click', () => {
    generateRandomConviction('conviction3', 'touchstone3');
});

async function generateCharacterName(gender) {
    try {
        let namesData = state.namesData;
        if (!namesData) {
            const res = await fetch('data/vtm_names.json');
            if (res.ok) {
                namesData = await res.json();
                state.namesData = namesData;
            }
        }

        if (!namesData) {
            console.error('Не вдалося завантажити список імен');
            return;
        }

        let firstNames = [];
        let surnames = [];

        if (gender === 'male' || gender === 'man') {
            firstNames = namesData.man_names || namesData.men_names || namesData.male_names || [];
            surnames = namesData.man_surnames || namesData.men_surnames || namesData.surnames || [];
        } else {
            firstNames = namesData.women_names || namesData.woman_names || namesData.female_names || [];
            surnames = namesData.women_surnames || namesData.woman_surnames || namesData.surnames || [];
        }

        if (!firstNames || firstNames.length === 0) {
            console.warn('Список імен порожній');
            return;
        }

        const randomFirstName = getRandomItem(firstNames);
        let fullName = randomFirstName;

        if (surnames && surnames.length > 0) {
            const randomSurname = getRandomItem(surnames);
            fullName = `${randomFirstName} ${randomSurname}`;
        }

        const nameInput = document.getElementById('character-name');
        if (nameInput) {
            nameInput.value = fullName;
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            updateHeaderInfo();

            // Приємне плавне підсвічування оновлення поля
            nameInput.classList.add('ring-2', 'ring-[#8b0000]', 'border-[#8b0000]');
            setTimeout(() => {
                nameInput.classList.remove('ring-2', 'ring-[#8b0000]', 'border-[#8b0000]');
            }, 350);
        }
    } catch (err) {
        console.error('Помилка під час генерації імені:', err);
    }
}

document.getElementById('btn-gen-male-name')?.addEventListener('click', () => {
    generateCharacterName('male');
});

document.getElementById('btn-gen-female-name')?.addEventListener('click', () => {
    generateCharacterName('female');
});

async function generateRandomConcept() {
    try {
        let conceptsData = state.conceptsData;
        if (!conceptsData || conceptsData.length === 0) {
            const res = await fetch('data/vtm_consepts.json');
            if (res.ok) {
                conceptsData = await res.json();
                state.conceptsData = conceptsData;
            }
        }

        if (!conceptsData || conceptsData.length === 0) {
            console.error('Не вдалося завантажити список концептів');
            return;
        }

        const randomItem = getRandomItem(conceptsData);
        if (!randomItem) return;

        let conceptText = '';
        if (typeof randomItem === 'string') {
            conceptText = randomItem;
        } else if (randomItem.concept) {
            conceptText = randomItem.concept;
        } else if (randomItem.name && randomItem.description) {
            conceptText = `${randomItem.name}: ${randomItem.description}`;
        } else if (randomItem.name) {
            conceptText = randomItem.name;
        }

        const conceptInput = document.getElementById('concept-phrase');
        if (conceptInput) {
            conceptInput.value = conceptText;
            conceptInput.dispatchEvent(new Event('input', { bubbles: true }));
            conceptInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Плавне підсвічування поля при генерації
            conceptInput.classList.add('ring-2', 'ring-[#8b0000]', 'border-[#8b0000]');
            setTimeout(() => {
                conceptInput.classList.remove('ring-2', 'ring-[#8b0000]', 'border-[#8b0000]');
            }, 350);
        }
    } catch (err) {
        console.error('Помилка під час генерації концепту:', err);
    }
}

document.getElementById('btn-gen-concept')?.addEventListener('click', () => {
    generateRandomConcept();
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
        
        const specialists = state.archetypesData.skills.filter(s => s.category === 'specialist');
        const balanced = state.archetypesData.skills.filter(s => s.category === 'balanced');
        const jacks = state.archetypesData.skills.filter(s => s.category === 'jack');
        
        if (specialists.length > 0) {
            html += '<optgroup label="🎯 Спеціалісти (1x4, 3x3, 3x2, 3x1)">';
            specialists.forEach(s => {
                html += `<option value="${s.id}">${s.name}</option>`;
            });
            html += '</optgroup>';
        }
        
        if (balanced.length > 0) {
            html += '<optgroup label="⚖️ Збалансовані (3x3, 5x2, 7x1)">';
            balanced.forEach(s => {
                html += `<option value="${s.id}">${s.name}</option>`;
            });
            html += '</optgroup>';
        }
        
        if (jacks.length > 0) {
            html += '<optgroup label="🤹 Майстри на всі руки (1x3, 8x2, 10x1)">';
            jacks.forEach(s => {
                html += `<option value="${s.id}">${s.name}</option>`;
            });
            html += '</optgroup>';
        }

        // Fallback if no category is defined
        if (specialists.length === 0 && balanced.length === 0 && jacks.length === 0) {
            state.archetypesData.skills.forEach(s => {
                html += `<option value="${s.id}">${s.name}</option>`;
            });
        }

        skillSelect.innerHTML = html;
    }
}
   
// Застосування архетипу до характеристик
function applyAttributeArchetype(archId) {
    const descElement = document.getElementById('attr-archetype-desc');
    
    if (!archId) {
        if (descElement) {
            descElement.classList.add('hidden');
            descElement.textContent = '';
        }
        return; // Якщо обрано "Вручну", не змінюємо поточні дані
    }
    
    const archetype = state.archetypesData.attributes.find(a => a.id === archId);
    if (!archetype) return;

    if (descElement && archetype.desc) {
        descElement.textContent = archetype.desc;
        descElement.classList.remove('hidden');
    } else if (descElement) {
        descElement.classList.add('hidden');
        descElement.textContent = '';
    }

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
    const descElement = document.getElementById('skill-archetype-desc');
    
    if (!archId) {
        if (descElement) {
            descElement.classList.add('hidden');
            descElement.textContent = '';
        }
        return; // Якщо обрано "Вручну", не змінюємо поточні дані
    }
    
    const archetype = state.archetypesData.skills.find(s => s.id === archId);
    if (!archetype) return;

    if (descElement && archetype.desc) {
        descElement.textContent = archetype.desc;
        descElement.classList.remove('hidden');
    } else if (descElement) {
        descElement.classList.add('hidden');
        descElement.textContent = '';
    }

    // Автоматично змінюємо метод розподілу відповідно до архетипу
    if (archetype.category) {
        state.distribution = archetype.category;
        const distSelect = document.getElementById('skill-distribution');
        if (distSelect) {
            distSelect.value = archetype.category;
        }
    }

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

const DISCIPLINE_ICONS = {
    'animalism': 'data/Disciplines/Animalism_symbol.png',
    'auspex': 'data/Disciplines/Auspex_symbol.png',
    'blood_sorcery': 'data/Disciplines/Blood_Sorcery_symbol.png',
    'blood_sorcery_rituals': 'data/Disciplines/Blood_Sorcery_symbol.png',
    'celerity': 'data/Disciplines/Celerity_symbol.png',
    'dominate': 'data/Disciplines/Dominate_symbol.png',
    'fortitude': 'data/Disciplines/Fortitude_symbol.png',
    'obfuscate': 'data/Disciplines/Obfuscate_symbol.png',
    'oblivion': 'data/Disciplines/Oblivion_symbol.png',
    'oblivion_ceremonies': 'data/Disciplines/Oblivion_symbol.png',
    'potence': 'data/Disciplines/Potence_symbol.png',
    'presence': 'data/Disciplines/Presence_symbol.png',
    'protean': 'data/Disciplines/Protean_symbol.png',
    'thin_blood_alchemy': 'data/Disciplines/Alchemy_symbol.png',
    'alchemy': 'data/Disciplines/Alchemy_symbol.png'
};

function getDisciplineIcon(discKey) {
    return DISCIPLINE_ICONS[discKey] || null;
}

const PREDATOR_CATEGORIES = [
    {
        id: 'violence',
        name: 'Насильство',
        icon: '⚔️',
        desc: 'Пряма агресія, насильницьке підкорення, фізичне переслідування та примус здобичі.',
        badgeStyle: 'bg-red-50 text-red-800 border-red-200',
        headerBorder: 'border-red-800',
        predatorIds: ['alleycat', 'extortionist', 'roadside_killer', 'montero']
    },
    {
        id: 'social',
        name: 'Соціум',
        icon: '🍷',
        desc: 'Полювання всередині людського суспільства: зв’язки, культи, нічні клуби, згода чи вдавання романтики.',
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
        headerBorder: 'border-amber-700',
        predatorIds: ['cleaner', 'cleaver', 'consensualist', 'osiris', 'scene_queen', 'siren']
    },
    {
        id: 'stealth',
        name: 'Непомітність',
        icon: '👤',
        desc: 'Таємне полювання: сплячі смертні, морги, хоспіси, терпляче вистежування чи смертоносні засідки.',
        badgeStyle: 'bg-zinc-100 text-zinc-800 border-zinc-300',
        headerBorder: 'border-zinc-700',
        predatorIds: ['sandman', 'graverobber', 'grim_reaper', 'pursuer', 'trapdoor']
    },
    {
        id: 'non_mortal',
        name: 'Виключення смертних з раціону',
        icon: '🩸',
        desc: 'Особливі дієтичні обмеження: пакетована кров, кров тварин або полювання на інших вампірів.',
        badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200',
        headerBorder: 'border-purple-800',
        predatorIds: ['bagger', 'blood_leech', 'farmer']
    }
];

let selectedPredatorCategoryFilter = 'all';

function setPredatorCategoryFilter(categoryId) {
    selectedPredatorCategoryFilter = categoryId;
    
    // Оновлення активного стилю кнопок фільтра
    const filterButtons = document.querySelectorAll('.pred-filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('bg-[#8b0000]', 'text-white', 'shadow-sm');
        btn.classList.add('text-gray-700');
    });
    
    const activeBtn = document.getElementById(`pred-filter-${categoryId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-[#8b0000]', 'text-white', 'shadow-sm');
        activeBtn.classList.remove('text-gray-700');
    }
    
    renderPredatorTypes();
}

function getPredatorChecks(id) {
    const checks = {
        'alleycat': 'Міць + Боротьба (для силового захоплення) або Кмітливість + Вуличний досвід (для пошуку злочинців)',
        'bagger': 'Інтелект + Вуличний досвід',
        'blood_leech': 'Цей тип хижака не радиться зводити до простого набору кісток',
        'cleaner': 'Маніпуляція + Хитрість',
        'consensualist': 'Маніпуляція + Переконливість',
        'farmer': 'Витримка + Розуміння тварин',
        'osiris': 'Маніпуляція + Хитрість або Залякування + Слава',
        'sandman': 'Спритність + Непомітність',
        'scene_queen': 'Маніпуляція + Переконливість',
        'siren': 'Харизма + Хитрість',
        'extortionist': 'Міць або Маніпуляція + Залякування',
        'graverobber': 'Рішучість + Медицина (для пошуку серед мерців) або Маніпуляція + Проникливість (для полювання серед живих)',
        'roadside_killer': 'Спритність або Харизма + Керування',
        'grim_reaper': 'Інтелект + Спостережливість або Медицина',
        'montero': 'Інтелект + Непомітність (для планування) або Рішучість + Непомітність (для терплячого очікування)',
        'pursuer': 'Інтелект + Розслідування (для пошуку жертви) або Витривалість + Непомітність (для тривалого стеження)',
        'trapdoor': 'Харизма + Непомітність (для заманювання), Спритність + Непомітність (для полювання на порушників) або Кмітливість + Спостережливість + крапки Прихистку (для навігації у лігві)'
    };
    return checks[id] || 'Немає специфічних рекомендацій';
}

function renderPredatorTypes() {
    const container = document.getElementById('predator-container') || document.getElementById('predator-grid');
    if (!container || state.predatorData.length === 0) return;

    const categoriesToRender = selectedPredatorCategoryFilter === 'all' 
        ? PREDATOR_CATEGORIES 
        : PREDATOR_CATEGORIES.filter(c => c.id === selectedPredatorCategoryFilter);

    let html = '';

    categoriesToRender.forEach(category => {
        // Знаходимо хижаків для поточної категорії у вказаному порядку
        const categoryPredators = [];
        category.predatorIds.forEach(id => {
            const item = state.predatorData.find(p => p.id === id || (id === 'cleaver' && p.id === 'cleaner') || (id === 'cleaner' && p.id === 'cleaver'));
            if (item && !categoryPredators.some(cp => cp.id === item.id)) {
                categoryPredators.push(item);
            }
        });

        if (categoryPredators.length === 0) return;

        let cardsHtml = '';
        categoryPredators.forEach(predator => {
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
            const modifierColor = predator.humanity_modifier > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : (predator.humanity_modifier < 0 ? 'bg-red-50 text-red-800 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200');

            let advantagesDisplay = '';
            if (predator.advantages_text || predator.advantages_text_full) {
                advantagesDisplay = `<div class="bg-purple-50/70 p-2.5 rounded-lg text-indigo-900 border border-purple-100 flex flex-col gap-1 mt-auto">`;
                if (predator.advantages_text) {
                    advantagesDisplay += `<span class="text-[11px] font-bold">${typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(predator.advantages_text) : predator.advantages_text}</span>`;
                }
                if (predator.advantages_text_full) {
                    advantagesDisplay += `<span class="text-[10px] leading-snug opacity-90">${typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(predator.advantages_text_full) : predator.advantages_text_full}</span>`;
                }
                advantagesDisplay += `</div>`;
            } else {
                advantagesDisplay = `<div class="bg-purple-50/70 p-2 rounded-lg text-[11px] font-bold text-indigo-900 border border-purple-100 mt-auto">Немає додаткових благ/вад</div>`;
            }

                        const arrowSvg = isSelected 
                ? '<svg class="w-4 h-4 text-[#4b0082]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>'
                : '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';

            const highlightedDesc = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(predator.description || '') : (predator.description || '');
            const highlightedChecks = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(getPredatorChecks(predator.id)) : getPredatorChecks(predator.id);

            cardsHtml += `
                <div class="predator-card flex flex-col bg-white rounded-xl border ${isSelected ? 'border-[#4b0082] shadow-md ring-1 ring-[#4b0082]' : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow'} cursor-pointer transition-all overflow-hidden"
                      onclick="selectPredator('${predator.id}')">
                    <!-- Завжди видимий заголовок -->
                    <div class="flex items-center justify-between p-4 sm:p-5">
                        <h3 class="font-serif font-bold text-base sm:text-lg ${isSelected ? 'text-[#4b0082]' : 'text-[#1a1a1a]'} leading-snug">${predator.name}</h3>
                        ${arrowSvg}
                    </div>
                    
                    <!-- Прихований контент -->
                    ${isSelected ? `
                    <div class="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 animate-[fadeIn_0.2s_ease-in-out]">
                        <div class="flex items-center justify-between gap-2 mb-3 w-full border-t border-gray-100 pt-3">
                            <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border max-w-[60%] truncate ${category.badgeStyle}">${category.icon} ${category.name}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap ${modifierColor}">${modifierText}</span>
                        </div>
                        <p class="text-xs text-gray-600 mb-4 leading-relaxed text-justify">${highlightedDesc}</p>
                        
                        <div class="bg-gray-50 border-l-2 border-[#4b0082] p-3 mb-4 rounded-r shadow-sm">
                            <span class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Рекомендовані перевірки:</span>
                            <span class="text-xs font-semibold text-gray-800">${highlightedChecks}</span>
                        </div>
                        
                        ${advantagesDisplay}
                        ${optionsHtml}
                    </div>
                    ` : ''}
                </div>
            `;
        });

        html += `
            <div class="category-section">
                <div class="flex items-center justify-between border-b-2 ${category.headerBorder} pb-2.5 mb-4">
                    <div class="flex items-center gap-2.5">
                        <span class="text-2xl">${category.icon}</span>
                        <div>
                            <h3 class="text-xl font-bold vtm-font text-gray-900 uppercase tracking-wider">${category.name}</h3>
                            <p class="text-xs text-gray-500 hidden sm:block">${category.desc}</p>
                        </div>
                    </div>
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full ${category.badgeStyle} border">${categoryPredators.length} ${categoryPredators.length === 1 ? 'тип' : (categoryPredators.length < 5 ? 'типи' : 'типів')}</span>
                </div>
                <p class="text-xs text-gray-500 sm:hidden mb-3">${category.desc}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    ${cardsHtml}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function selectPredator(id) {
    if (state.selectedPredator === id) {
        state.selectedPredator = null;
        state.predatorChoices = { discipline: null, skill: null, specName: null };
        state.selectedAdvantages = state.selectedAdvantages.filter(adv => adv.source !== 'predator');
        
        renderPredatorTypes();
        applyPredatorGlobalUpdates();
        renderSelectedAdvantages();
        updateTrackers();
        return;
    }

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
    if (state.selectedPredator && Array.isArray(state.predatorData)) {
        const predator = state.predatorData.find(p => p.id === state.selectedPredator);
        if (predator && predator.humanity_modifier) {
            currentHumanity += predator.humanity_modifier;
        }
    }
    const humDisplay = document.getElementById('humanity-display');
    if (humDisplay) {
        humDisplay.innerText = currentHumanity;
    }
    const summaryHum = document.getElementById('summary-humanity');
    if (summaryHum) {
        summaryHum.innerText = currentHumanity;
    }
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
        const descElement = document.getElementById('attr-archetype-desc');
        if (descElement) {
            descElement.classList.add('hidden');
            descElement.textContent = '';
        }
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
        const descElement = document.getElementById('skill-archetype-desc');
        if (descElement) {
            descElement.classList.add('hidden');
            descElement.textContent = '';
        }
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
        const iconSrc = getDisciplineIcon(discKey);
        
        // Для ритуалів та церемоній бонус хижака не рахується повторно
        let bonus = (discKey !== 'blood_sorcery_rituals' && discKey !== 'oblivion_ceremonies' && state.predatorChoices.discipline === discKey) ? 1 : 0;
        let baseDots = state.disciplines[discKey] || 0;
        let totalDots = baseDots + bonus;
        
        if(!state.disciplinePowers[discKey]) state.disciplinePowers[discKey] = {};

        // --- Візуальні точки для ритуалів/церемоній (неклікабельні) ---
        let dotsHtml = createDotsHTML('discipline', discKey, baseDots, 5, bonus);
        // --------------------------------------------------------------

        const iconHtml = iconSrc ? `
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center p-1.5 shrink-0 shadow-2xs group-hover:border-[#8b0000] group-hover:bg-red-50/60 transition-all">
                <img src="${iconSrc}" alt="${ukrName}" class="w-full h-full object-contain transition-transform group-hover:scale-105" loading="lazy">
            </div>
        ` : '';

        html += `
            <div class="group border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div class="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 mb-3">
                    <div class="flex items-center gap-3 min-w-0">
                        ${iconHtml}
                        <span class="font-serif text-xl font-bold text-gray-800 group-hover:text-[#8b0000] transition-colors">${ukrName}</span>
                    </div>
                    <div class="shrink-0">
                        ${dotsHtml}
                    </div>
                </div>
                <p class="text-sm text-gray-500 text-justify leading-relaxed mb-4">${typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(discInfo.desc || '') : (discInfo.desc || '')}</p>
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
                        const highlightedPowerDesc = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(foundPower.desc || '') : foundPower.desc;
                        const highlightedReq = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(foundPower.requirement || '') : foundPower.requirement;
                        selectedDesc = `
                            <div class="mt-2 text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-100 space-y-1">
                                <p class="italic leading-snug">${highlightedPowerDesc}</p>
                                ${(foundPower.requirement && String(foundPower.requirement).trim().toLowerCase() !== 'немає' && String(foundPower.requirement).trim() !== '') ? `<p><strong>Вимога:</strong> ${highlightedReq}</p>` : ''}
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

// --- КАТЕГОРІЇ БЛАГ ТА ВАД (РОЗДІЛИ: ОСНОВНІ, СПЕЦИФІЧНІ, ПРОСУНУТІ) ---
const CORE_ADV_CATEGORIES = [
    'Зовнішність',
    'Залежності',
    'Інше',
    'Надбання',
    'Психологічні',
    'Харчування',
    'Мови'
];

function isClanCaitiff() {
    if (!state.clan) return false;
    if (state.clan === 'unknown' || state.clan === 'caitiff') return true;
    const clanName = (clansData[state.clan]?.name || '').toLowerCase();
    return clanName.includes('каїтиф') || clanName.includes('каітиф') || clanName.includes('caitiff');
}

function isClanThinBlood() {
    if (!state.clan) return false;
    if (state.clan === 'thin-blood' || state.clan === 'thin_blood' || state.clan === 'thinblood') return true;
    const clanName = (clansData[state.clan]?.name || '').toLowerCase();
    return clanName.includes('рідкокров') || clanName.includes('thin-blood') || clanName.includes('thin blood');
}

function getCategorySection(category) {
    if (CORE_ADV_CATEGORIES.includes(category)) {
        return 'core';
    }
    const lower = (category || '').toLowerCase();
    if (lower.includes('каїтиф') || lower.includes('каітиф') || lower.includes('рідкокров') || lower.includes('thin-blood')) {
        return 'specific';
    }
    return 'advanced';
}

function isCategoryAllowedByClan(category) {
    const lower = (category || '').toLowerCase();
    if (lower.includes('каїтиф') || lower.includes('каітиф')) {
        return isClanCaitiff();
    }
    if (lower.includes('рідкокров') || lower.includes('thin-blood')) {
        return isClanThinBlood();
    }
    return true;
}

function getCategoriesCountWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'категорія';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'категорії';
    return 'категорій';
}

function populateAdvantageCategories() {
    const select = document.getElementById('adv-category-filter');
    if (!select || !state.advantagesData) return;
    
    const allCategories = [...new Set(state.advantagesData.map(item => item.category).filter(Boolean))];
    
    const coreCats = allCategories.filter(c => getCategorySection(c) === 'core').sort((a, b) => a.localeCompare(b, 'uk'));
    const specificCats = allCategories.filter(c => getCategorySection(c) === 'specific').sort((a, b) => a.localeCompare(b, 'uk'));
    const advancedCats = allCategories.filter(c => getCategorySection(c) === 'advanced').sort((a, b) => a.localeCompare(b, 'uk'));
    
    const prevValue = select.value;
    
    let html = '<option value="all">Всі категорії (всі розділи)</option>';
    
    if (coreCats.length > 0) {
        html += '<optgroup label="🌟 Основні категорії">';
        coreCats.forEach(cat => {
            html += `<option value="${cat}">${cat}</option>`;
        });
        html += '</optgroup>';
    }
    
    if (specificCats.length > 0) {
        html += '<optgroup label="🩸 Специфічні категорії">';
        specificCats.forEach(cat => {
            const isAllowed = isCategoryAllowedByClan(cat);
            if (isAllowed) {
                html += `<option value="${cat}">${cat} (доступно для вашого клану)</option>`;
            } else {
                const reqClan = (cat.toLowerCase().includes('каїтиф') || cat.toLowerCase().includes('каітиф')) ? 'клану Невідомо (Каїтиф)' : 'клану Рідкокровні';
                html += `<option value="${cat}" disabled>${cat} [🔒 тільки для ${reqClan}]</option>`;
            }
        });
        html += '</optgroup>';
    }
    
    if (advancedCats.length > 0) {
        html += '<optgroup label="📜 Просунуті категорії">';
        advancedCats.forEach(cat => {
            html += `<option value="${cat}">${cat}</option>`;
        });
        html += '</optgroup>';
    }
    
    select.innerHTML = html;
    
    if (prevValue && select.querySelector(`option[value="${prevValue}"]:not([disabled])`)) {
        select.value = prevValue;
    } else {
        select.value = 'all';
    }
}

function getMeritsCountWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'благо';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'блага';
    return 'благ';
}

function getFlawsCountWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'вада';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'вади';
    return 'вад';
}

function renderAdvantageCard(item) {
    let badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
    let typeLabel = 'Благо';
    let isFlaw = (item.type === 'flaw');

    if (item.type === 'merit') { 
        badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200'; 
        typeLabel = 'Чеснота'; 
    } else if (item.type === 'background') { 
        badgeClass = 'bg-blue-50 text-blue-800 border-blue-200'; 
        typeLabel = 'Надбання'; 
    } else if (item.type === 'flaw') { 
        badgeClass = 'bg-red-950 text-red-100 border-red-900'; 
        typeLabel = 'Вада'; 
    }

    const options = parseDotOptions(item.cost);
    let actionButtons = '';
    options.forEach(cost => {
        const isAlreadySelected = state.selectedAdvantages.some(s => s.id === item.id && s.cost === cost);
        if (isAlreadySelected) {
            actionButtons += `
                <button disabled 
                    class="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-1 shadow-none">
                    <span>✓ ${cost} ⬤</span>
                </button>
            `;
        } else {
            const btnColor = isFlaw
                ? 'border-red-300 hover:bg-red-900 hover:text-white hover:border-red-900 text-red-950 bg-white'
                : 'border-emerald-300 hover:bg-emerald-800 hover:text-white hover:border-emerald-800 text-emerald-950 bg-white';
            actionButtons += `
                <button onclick="addAdvantage(${item.id}, ${cost})" 
                    class="px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shadow-sm active:scale-95 flex items-center gap-1 ${btnColor}">
                    <span>+ ${cost} ⬤</span>
                </button>
            `;
        }
    });

    const cardBorder = isFlaw ? 'border-gray-200 hover:border-red-300' : 'border-gray-200 hover:border-emerald-300';

    return `
        <div class="bg-white p-3.5 rounded-xl border ${cardBorder} shadow-sm hover:shadow transition-all flex flex-col justify-between group">
            <div>
                <div class="flex justify-between items-start mb-1.5 gap-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}">${typeLabel}</span>
                        ${item.cost ? `<span class="text-[10px] text-gray-500 font-mono">(${item.cost})</span>` : ''}
                    </div>
                    <div class="flex flex-wrap gap-1.5 justify-end min-w-max">
                        ${actionButtons}
                    </div>
                </div>
                <h4 class="font-serif font-bold text-sm text-gray-900 leading-snug group-hover:text-[#8b0000] transition-colors">${item.name}</h4>
                <p class="text-xs text-gray-600 leading-relaxed text-justify mt-2">${typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(item.desc || '') : (item.desc || '')}</p>
            </div>
        </div>
    `;
}

function renderCategoryBlock(category, categoryItems, filterType, searchQuery, filterDots) {
    // Фільтруємо блага та надбання всередині категорії
    const filteredMerits = categoryItems.filter(item => {
        if (item.type !== 'merit' && item.type !== 'background') return false;
        
        if (filterType === 'flaw') return false;
        if (filterType === 'merit' && item.type !== 'merit') return false;
        if (filterType === 'background' && item.type !== 'background') return false;
        
        const matchesSearch = !searchQuery || 
            item.name.toLowerCase().includes(searchQuery) || 
            item.desc.toLowerCase().includes(searchQuery) || 
            (item.category && item.category.toLowerCase().includes(searchQuery));
        if (!matchesSearch) return false;

        if (filterDots !== 'all') {
            const options = parseDotOptions(item.cost);
            if (!options.includes(parseInt(filterDots))) return false;
        }

        return true;
    });

    // Фільтруємо вади всередині категорії
    const filteredFlaws = categoryItems.filter(item => {
        if (item.type !== 'flaw') return false;
        
        if (filterType === 'merit_background' || filterType === 'merit' || filterType === 'background') return false;
        
        const matchesSearch = !searchQuery || 
            item.name.toLowerCase().includes(searchQuery) || 
            item.desc.toLowerCase().includes(searchQuery) || 
            (item.category && item.category.toLowerCase().includes(searchQuery));
        if (!matchesSearch) return false;

        if (filterDots !== 'all') {
            const options = parseDotOptions(item.cost);
            if (!options.includes(parseInt(filterDots))) return false;
        }

        return true;
    });

    if (filteredMerits.length === 0 && filteredFlaws.length === 0) {
        return null;
    }

    const meritsCardsHtml = filteredMerits.map(item => renderAdvantageCard(item)).join('');
    const flawsCardsHtml = filteredFlaws.map(item => renderAdvantageCard(item)).join('');

    return `
        <div class="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <!-- Заголовок категорії -->
            <div class="bg-gray-100/90 px-4 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#8b0000] inline-block"></span>
                    <h3 class="font-bold text-base text-gray-900 uppercase tracking-wider vtm-font">${category}</h3>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <span class="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        ✦ ${filteredMerits.length} ${getMeritsCountWord(filteredMerits.length)}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-900 border border-red-200 font-semibold">
                        ✕ ${filteredFlaws.length} ${getFlawsCountWord(filteredFlaws.length)}
                    </span>
                </div>
            </div>

            <!-- ДВА СТОВПЧИКИ КАТЕГОРІЇ: 1-Й БЛАГА ТА НАДБАННЯ, 2-Й ВАДИ -->
            <div class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                <!-- Стовпчик 1: Блага (Чесноти) та Надбання -->
                <div class="p-4 flex flex-col bg-white">
                    <div class="flex items-center justify-between pb-2.5 mb-3.5 border-b border-emerald-200/80">
                        <span class="text-xs font-bold uppercase tracking-widest text-emerald-900 flex items-center gap-1.5">
                            <span class="text-emerald-700 font-black">✦</span> Блага (Чесноти) та Надбання
                        </span>
                        <span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">${filteredMerits.length}</span>
                    </div>
                    <div class="space-y-3 flex-grow">
                        ${filteredMerits.length > 0 ? meritsCardsHtml : '<div class="p-6 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200">Немає благ або надбань у цій категорії</div>'}
                    </div>
                </div>

                <!-- Стовпчик 2: Вади -->
                <div class="p-4 flex flex-col bg-gray-50/40">
                    <div class="flex items-center justify-between pb-2.5 mb-3.5 border-b border-red-200/80">
                        <span class="text-xs font-bold uppercase tracking-widest text-red-950 flex items-center gap-1.5">
                            <span class="text-red-700 font-black">✕</span> Вади (Flaws)
                        </span>
                        <span class="text-[11px] font-bold text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">${filteredFlaws.length}</span>
                    </div>
                    <div class="space-y-3 flex-grow">
                        ${filteredFlaws.length > 0 ? flawsCardsHtml : '<div class="p-6 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200">Немає вад у цій категорії</div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAvailableAdvantages() {
    const container = document.getElementById('available-advantages');
    if (!container || !state.advantagesData || state.advantagesData.length === 0) return;

    const searchInput = document.getElementById('adv-search');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterType = document.getElementById('adv-type-filter')?.value || 'all';
    const filterCat = document.getElementById('adv-category-filter')?.value || 'all';
    const filterDots = document.getElementById('adv-dots-filter')?.value || 'all';

    // Отримуємо унікальні категорії
    const allCategories = [...new Set(state.advantagesData.map(item => item.category).filter(Boolean))];

    // Розділяємо на 3 списки категорій
    let coreCategories = allCategories.filter(c => getCategorySection(c) === 'core').sort((a, b) => a.localeCompare(b, 'uk'));
    let specificCategories = allCategories.filter(c => getCategorySection(c) === 'specific').sort((a, b) => a.localeCompare(b, 'uk'));
    let advancedCategories = allCategories.filter(c => getCategorySection(c) === 'advanced').sort((a, b) => a.localeCompare(b, 'uk'));

    if (filterCat !== 'all') {
        coreCategories = coreCategories.filter(c => c === filterCat);
        specificCategories = specificCategories.filter(c => c === filterCat);
        advancedCategories = advancedCategories.filter(c => c === filterCat);
    }

    const renderGroupCategories = (catList) => {
        let htmlCards = [];
        catList.forEach(category => {
            // Перевіряємо кланові обмеження для специфічних категорій
            if (!isCategoryAllowedByClan(category)) {
                return;
            }
            const categoryItems = state.advantagesData.filter(item => item.category === category);
            const cardHtml = renderCategoryBlock(category, categoryItems, filterType, searchQuery, filterDots);
            if (cardHtml) {
                htmlCards.push(cardHtml);
            }
        });
        return htmlCards;
    };

    const coreCards = renderGroupCategories(coreCategories);
    const specificCards = renderGroupCategories(specificCategories);
    const advancedCards = renderGroupCategories(advancedCategories);

    let sectionsHtml = '';
    let totalRenderedCategories = coreCards.length + specificCards.length + advancedCards.length;

    // 1. ОСНОВНІ КАТЕГОРІЇ
    if (coreCards.length > 0) {
        sectionsHtml += `
            <div class="border border-emerald-200/90 rounded-2xl p-5 bg-emerald-50/20 shadow-xs mb-8">
                <div class="flex flex-wrap items-center justify-between border-b border-emerald-200 pb-3 mb-5 gap-2">
                    <div class="flex items-center gap-2.5">
                        <span class="text-xl">🌟</span>
                        <div>
                            <h3 class="font-bold text-base sm:text-lg text-emerald-950 uppercase tracking-wider vtm-font">Розділ: Основні категорії</h3>
                            <p class="text-xs text-emerald-800/80">Зовнішність, Залежності, Інше, Надбання, Психологічні, Харчування, Мови</p>
                        </div>
                    </div>
                    <span class="text-xs font-bold px-3 py-1 bg-white text-emerald-900 border border-emerald-300 rounded-full shadow-2xs">
                        ${coreCards.length} ${getCategoriesCountWord(coreCards.length)}
                    </span>
                </div>
                <div class="space-y-6">
                    ${coreCards.join('')}
                </div>
            </div>
        `;
    }

    // 2. СПЕЦИФІЧНІ КАТЕГОРІЇ
    const isSpecificFilterActive = filterCat === 'all' || getCategorySection(filterCat) === 'specific';
    if (isSpecificFilterActive) {
        let specificContent = '';
        const currentClanName = (clansData && clansData[state.clan]) ? clansData[state.clan].name : 'Невідомо';
        const isCaitiff = isClanCaitiff();
        const isThinBlood = isClanThinBlood();

        if (specificCards.length > 0) {
            specificContent = `<div class="space-y-6">${specificCards.join('')}</div>`;
        } else if (!isCaitiff && !isThinBlood && filterCat === 'all') {
            specificContent = `
                <div class="bg-white/80 border border-dashed border-purple-300 rounded-xl p-4 sm:p-5 text-purple-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl shrink-0">🔒</span>
                        <div>
                            <p class="font-bold text-sm text-purple-950">Специфічні блага та вади заблоковані</p>
                            <p class="text-xs text-purple-800 leading-relaxed mt-1">Категорія <strong>«Каїтифи»</strong> відкривається виключно для клану <em>«Невідомо (Каїтиф)»</em>, а категорія <strong>«Рідкокровні»</strong> — виключно для клану <em>«Рідкокровка (Thin-blood)»</em>.</p>
                        </div>
                    </div>
                    <div class="shrink-0 bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-lg text-xs font-semibold">
                        Ваш клан: ${currentClanName}
                    </div>
                </div>
            `;
        }

        if (specificContent) {
            sectionsHtml += `
                <div class="border border-purple-200/90 rounded-2xl p-5 bg-purple-50/20 shadow-xs mb-8">
                    <div class="flex flex-wrap items-center justify-between border-b border-purple-200 pb-3 mb-5 gap-2">
                        <div class="flex items-center gap-2.5">
                            <span class="text-xl">🩸</span>
                            <div>
                                <h3 class="font-bold text-base sm:text-lg text-purple-950 uppercase tracking-wider vtm-font">Розділ: Специфічні категорії</h3>
                                <p class="text-xs text-purple-800/80">Каїтифи (для клану Каїтіф) • Рідкокровні (для клану Рідкокровні)</p>
                            </div>
                        </div>
                        <span class="text-xs font-bold px-3 py-1 bg-white text-purple-900 border border-purple-300 rounded-full shadow-2xs">
                            ${specificCards.length > 0 ? `${specificCards.length} ${getCategoriesCountWord(specificCards.length)}` : (isCaitiff || isThinBlood ? '0 категорій' : 'Заблоковано')}
                        </span>
                    </div>
                    ${specificContent}
                </div>
            `;
        }
    }

    // 3. ПРОСУНУТІ КАТЕГОРІЇ
    if (advancedCards.length > 0) {
        sectionsHtml += `
            <div class="border border-gray-300 rounded-2xl p-5 bg-gray-50/30 shadow-xs mb-8">
                <div class="flex flex-wrap items-center justify-between border-b border-gray-200 pb-3 mb-5 gap-2">
                    <div class="flex items-center gap-2.5">
                        <span class="text-xl">📜</span>
                        <div>
                            <h3 class="font-bold text-base sm:text-lg text-gray-900 uppercase tracking-wider vtm-font">Розділ: Просунуті категорії</h3>
                            <p class="text-xs text-gray-600">Архаїчні, Узи, Надприродні, Вади Дисциплін, Зараження, Родовід, Діаблері, Гулі, Культи тощо</p>
                        </div>
                    </div>
                    <span class="text-xs font-bold px-3 py-1 bg-white text-gray-800 border border-gray-300 rounded-full shadow-2xs">
                        ${advancedCards.length} ${getCategoriesCountWord(advancedCards.length)}
                    </span>
                </div>
                <div class="space-y-6">
                    ${advancedCards.join('')}
                </div>
            </div>
        `;
    }

    if (totalRenderedCategories === 0 && !sectionsHtml) {
        container.innerHTML = `<div class="text-gray-400 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">Нічого не знайдено за вашим запитом...</div>`;
    } else {
        container.innerHTML = sectionsHtml;
    }
}

function renderSelectedAdvantages() {
    const container = document.getElementById('selected-advantages');
    if (!container) return;

    if (state.selectedAdvantages.length === 0) {
        container.innerHTML = `<div class="text-gray-400 text-center py-6 text-sm">Ви ще не обрали жодного блага чи вади. Натисніть кнопку <strong>+ [кількість] ⬤</strong> на потрібних картках у категоріях нижче.</div>`;
        return;
    }

    let html = '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">';
    state.selectedAdvantages.forEach((sel, index) => {
        let badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
        let typeLabel = 'Благо';
        let isFlaw = (sel.type === 'flaw');

        if (sel.type === 'merit') {
            badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            typeLabel = 'Чеснота';
        } else if (sel.type === 'background') {
            badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
            typeLabel = 'Надбання';
        } else if (sel.type === 'flaw') {
            badgeClass = 'bg-red-950 text-red-100 border-red-900';
            typeLabel = 'Вада';
        }

        let isPredator = (sel.source === 'predator');
        
        let actionHTML = isPredator 
            ? `<span class="text-[9px] font-bold text-[#4b0082] uppercase tracking-wider px-2 py-0.5 bg-purple-100 border border-purple-200 rounded">Від Хижака</span>`
            : `<button onclick="removeAdvantage(${index})" title="Видалити" class="text-gray-400 hover:text-red-700 p-1 font-bold text-lg leading-none transition-colors rounded hover:bg-red-50">&times;</button>`;
        
        const cardBorder = isFlaw ? 'border-red-200/80 bg-red-50/20' : 'border-emerald-200/80 bg-emerald-50/20';
        const costBadge = isFlaw 
            ? `<span class="font-bold text-xs text-red-950 bg-red-100/80 px-2 py-0.5 rounded border border-red-200">${sel.cost} ⬤</span>`
            : `<span class="font-bold text-xs text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">${sel.cost} ⬤</span>`;

        html += `
            <div class="bg-white border ${cardBorder} p-3 rounded-xl shadow-sm flex flex-col justify-between gap-2 animate-[fadeIn_0.25s_ease-in-out]">
                <div class="flex justify-between items-start gap-1">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeClass}">
                            ${typeLabel}
                        </span>
                        <h4 class="font-serif font-bold text-sm text-gray-900 mt-1 leading-snug">${sel.name}</h4>
                        ${sel.category ? `<span class="text-[10px] text-gray-500 italic block mt-0.5">${sel.category}</span>` : ''}
                    </div>
                    ${actionHTML}
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-gray-100 text-xs mt-1">
                    <span class="text-[10px] text-gray-400 font-mono">Вартість:</span>
                    ${costBadge}
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function addAdvantage(id, cost) {
    const item = state.advantagesData.find(i => i.id === id);
    if (!item) return;
    if (state.selectedAdvantages.some(s => s.id === id && s.cost === cost)) return;

    state.selectedAdvantages.push({ 
        id: item.id, 
        name: item.name, 
        type: item.type, 
        cost: cost,
        category: item.category,
        desc: item.desc,
        source: 'manual'
    });
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
    
    // Оновлення кнопки клану на першому кроці
    const clanBtnName = document.getElementById('clan-btn-name');
    const clanBtnIcon = document.getElementById('clan-btn-icon');
    const clanBtnIconWrapper = document.getElementById('clan-btn-icon-wrapper');
    if (clanBtnName && clanInfo) {
        clanBtnName.innerText = clanInfo.name || 'Невідомо';
    }
    if (clanBtnIcon) {
        const iconPath = (typeof getClanIconPath === 'function') ? getClanIconPath(clanId) : 'Clan_symbols/Caitiff_symbol.png';
        clanBtnIcon.src = iconPath;
        clanBtnIcon.alt = clanInfo.name || clanId;
        clanBtnIcon.style.display = 'block';
        if (clanBtnIconWrapper) clanBtnIconWrapper.style.display = 'flex';
    }
    
    const desc1 = document.getElementById('clan-desc-1');
    if (desc1) desc1.innerHTML = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(clanInfo.desc || '') : (clanInfo.desc || '');
    
    const compulsionContainer = document.getElementById('clan-compulsion-container');
    const compulsionText = document.getElementById('clan-compulsion-text');
    if (compulsionContainer && compulsionText) {
        if (clanInfo.clan_compultion && clanInfo.clan_compultion.trim().toLowerCase() !== "відсутнє") {
            // Bold the title
            let text = clanInfo.clan_compultion;
            const splitMatch = text.match(/^(.*?)(:|\.)(.*)$/);
            if (splitMatch) {
                text = `<strong class="font-bold">${splitMatch[1]}${splitMatch[2]}</strong> ${splitMatch[3]}`;
            }
            compulsionText.innerHTML = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(text) : text;
            compulsionContainer.classList.remove('hidden');
        } else {
            compulsionContainer.classList.add('hidden');
        }
    }

    const baneContainer = document.getElementById('clan-bane-container');
    const baneText = document.getElementById('clan-bane-text');
    if (baneContainer && baneText) {
        if (clanInfo.clan_bane && clanInfo.clan_bane.trim().toLowerCase() !== "відсутнє") {
            // Bold the title
            let text = clanInfo.clan_bane;
            // For bane, it might be "Основне прокляття — Назва: Опис" or "Назва: Опис"
            // We can replace both the main title and the alternative title
            text = text.replace(/^(.*?)(:|\.)/g, '<strong class="font-bold">$1$2</strong>');
            text = text.replace(/(Альтернативне прокляття.*?)(:|\.)/g, '<strong class="font-bold text-red-800">$1$2</strong>');
            baneText.innerHTML = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(text) : text;
            baneContainer.classList.remove('hidden');
        } else {
            baneContainer.classList.add('hidden');
        }
    }
    
    Object.keys(state.disciplines).forEach(k => state.disciplines[k] = 0);
    state.disciplinePowers = {}; 
    state.manualDisciplines = []; // Скидаємо вручну додані дисципліни при зміні клану

    // Видаляємо специфічні блага/вади, якщо обраний клан більше не підходить
    if (state.selectedAdvantages && state.selectedAdvantages.length > 0) {
        state.selectedAdvantages = state.selectedAdvantages.filter(sel => {
            if (!sel.category) return true;
            return isCategoryAllowedByClan(sel.category);
        });
    }

    renderDisciplines();
    updateTrackers();
    updateHeaderInfo();
    populateAdvantageCategories();
    renderAvailableAdvantages();
    renderSelectedAdvantages();
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

    if (meritsEl) {
        meritsEl.innerText = `${totalMeritsDots} / 7 ⬤`;
        meritsEl.className = `px-3 py-1 text-sm font-bold rounded border tracker-badge ${totalMeritsDots === 7 ? 'valid' : (totalMeritsDots > 7 ? 'exceeded' : 'invalid')}`;
    }
    if (flawsEl) {
        flawsEl.innerText = `${totalFlawsDots} / 2 ⬤`;
        flawsEl.className = `px-3 py-1 text-sm font-bold rounded border tracker-badge ${totalFlawsDots === 2 ? 'valid' : (totalFlawsDots > 2 ? 'exceeded' : 'invalid')}`;
    }

    const selectedCountNum = document.getElementById('selected-count-num');
    if (selectedCountNum) {
        selectedCountNum.innerText = state.selectedAdvantages.length;
    }
    const summaryTracker = document.getElementById('selected-advantages-summary-tracker');
    if (summaryTracker) {
        summaryTracker.innerHTML = `
            <span>Обрано: <strong class="text-white">${state.selectedAdvantages.length}</strong> пунктів</span>
            <span class="text-gray-500">•</span>
            <span class="${totalMeritsDots === 7 ? 'text-emerald-400 font-bold' : (totalMeritsDots > 7 ? 'text-amber-400 font-bold' : 'text-gray-300')}">Блага: ${totalMeritsDots}/7 ⬤</span>
            <span class="text-gray-500">•</span>
            <span class="${totalFlawsDots === 2 ? 'text-emerald-400 font-bold' : (totalFlawsDots > 2 ? 'text-amber-400 font-bold' : 'text-gray-300')}">Вади: ${totalFlawsDots}/2 ⬤</span>
        `;
    }
}

function changeSkillDistribution() {
    state.distribution = document.getElementById('skill-distribution').value;
    updateTrackers();
}

function switchSummaryView(view) {
    const officialContainer = document.getElementById('vtm-official-sheet');
    const cardsContainer = document.getElementById('summary-cards-container');
    const tabOfficial = document.getElementById('tab-btn-official');
    const tabCards = document.getElementById('tab-btn-cards');

    if (view === 'cards') {
        if (officialContainer) officialContainer.classList.add('hidden');
        if (cardsContainer) cardsContainer.classList.remove('hidden');
        if (tabCards) {
            tabCards.classList.add('bg-[#8b0000]', 'text-white', 'shadow-xs');
            tabCards.classList.remove('text-gray-600');
        }
        if (tabOfficial) {
            tabOfficial.classList.remove('bg-[#8b0000]', 'text-white', 'shadow-xs');
            tabOfficial.classList.add('text-gray-600');
        }
    } else {
        if (officialContainer) officialContainer.classList.remove('hidden');
        if (cardsContainer) cardsContainer.classList.add('hidden');
        if (tabOfficial) {
            tabOfficial.classList.add('bg-[#8b0000]', 'text-white', 'shadow-xs');
            tabOfficial.classList.remove('text-gray-600');
        }
        if (tabCards) {
            tabCards.classList.remove('bg-[#8b0000]', 'text-white', 'shadow-xs');
            tabCards.classList.add('text-gray-600');
        }
    }
}

function renderSheetDots(count, max = 5, extraClass = '') {
    let html = '<div class="vtm-dots">';
    for (let i = 1; i <= max; i++) {
        let isFilled = i <= count;
        html += `<span class="vtm-sheet-dot ${isFilled ? 'filled ' + extraClass : ''}"></span>`;
    }
    html += '</div>';
    return html;
}

function renderTrackBoxes(activeCount, total = 10) {
    let html = '<div class="vtm-tracker-boxes">';
    for (let i = 1; i <= total; i++) {
        let isActive = i <= activeCount;
        html += `<span class="vtm-track-box ${isActive ? 'active' : 'inactive'}"></span>`;
    }
    html += '</div>';
    return html;
}

function renderHungerBoxes(total = 5) {
    let html = '<div class="vtm-tracker-boxes">';
    for (let i = 1; i <= total; i++) {
        html += `<span class="vtm-hunger-box"></span>`;
    }
    html += '</div>';
    return html;
}

function renderHumanityBoxes(currentHumanity, total = 10) {
    let html = '<div class="vtm-tracker-boxes">';
    for (let i = 1; i <= total; i++) {
        let isFilled = i <= currentHumanity;
        html += `<span class="vtm-humanity-box ${isFilled ? 'filled' : ''}">${isFilled ? '■' : ''}</span>`;
    }
    html += '</div>';
    return html;
}

function getBloodPotencyTable(potency) {
    let p = Number(potency) || 0;
    if (p <= 0) {
        return {
            bloodSurge: "Додайте 1 кістку",
            damageMended: "1 легке",
            powerBonus: "Немає",
            rouseReroll: "Немає",
            feedingPenalty: "Немає",
            baneSeverity: "0"
        };
    } else if (p === 1) {
        return {
            bloodSurge: "Додайте 2 кістки",
            damageMended: "1 легке",
            powerBonus: "Немає",
            rouseReroll: "1-й рівень",
            feedingPenalty: "Немає",
            baneSeverity: "2"
        };
    } else if (p === 2) {
        return {
            bloodSurge: "Додайте 2 кістки",
            damageMended: "2 легких",
            powerBonus: "Додайте 1 кістку",
            rouseReroll: "1-й рівень",
            feedingPenalty: "Тварини/пакети вдвічі менше",
            baneSeverity: "2"
        };
    } else if (p === 3) {
        return {
            bloodSurge: "Додайте 2 кістки",
            damageMended: "2 легких",
            powerBonus: "Додайте 1 кістку",
            rouseReroll: "2-й рівень і нижче",
            feedingPenalty: "Тварини/пакети не втамовують",
            baneSeverity: "3"
        };
    } else {
        return {
            bloodSurge: "Додайте 3 кістки",
            damageMended: "3 легких",
            powerBonus: "Додайте 2 кістки",
            rouseReroll: "2-й рівень і нижче",
            feedingPenalty: "Тварини/пакети не втамовують",
            baneSeverity: "3"
        };
    }
}

function renderSkillSheetRow(skill) {
    const data = getDynamicSkillData(skill.id);
    let totalDots = data.baseDots + data.bonus + data.freeSpecDot;
    let specHtml = data.displaySpec ? ` <span class="vtm-skill-spec">(${data.displaySpec})</span>` : '';
    let dotClass = data.freeSpecDot > 0 ? 'spec-dot' : (data.bonus > 0 ? 'predator-dot' : '');
    return `
        <div class="vtm-skill-row">
            <div class="vtm-skill-title">
                <span>${skill.name}</span>${specHtml}
            </div>
            <div class="vtm-dots-leader"></div>
            ${renderSheetDots(totalDots, 5, dotClass)}
        </div>
    `;
}

function renderDisciplinesSheetBoxes(availableDisc) {
    let html = '';
    let activeDiscs = [];

    availableDisc.forEach(discKey => {
        let totalDots = (state.disciplines[discKey] || 0) + (state.predatorChoices.discipline === discKey ? 1 : 0);
        if (totalDots > 0) {
            const discInfo = getDisciplineInfo(discKey);
            const discName = discInfo.name || discKey;
            let powers = [];
            for (let i = 1; i <= totalDots; i++) {
                let powerId = state.disciplinePowers[discKey]?.[i];
                if (powerId) {
                    let powerInfo = disciplinesPowersMap[discKey]?.find(p => p.id === powerId);
                    if (powerInfo) {
                        powers.push({ level: i, name: powerInfo.name });
                    }
                }
            }
            activeDiscs.push({ key: discKey, name: discName, dots: totalDots, powers });
        }
    });

    for (let slot = 0; slot < 6; slot++) {
        if (slot < activeDiscs.length) {
            const d = activeDiscs[slot];
            html += `
                <div class="vtm-disc-box">
                    <div class="vtm-disc-header">
                        <span class="vtm-disc-name">${d.name}</span>
                        <div class="vtm-dots-leader"></div>
                        ${renderSheetDots(d.dots, 5)}
                    </div>
                    <div class="vtm-disc-powers">
                        ${d.powers.map(p => `<div class="vtm-disc-power-item">• <strong>${p.level}:</strong> ${p.name}</div>`).join('')}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="vtm-disc-box opacity-70">
                    <div class="vtm-disc-header">
                        <span class="vtm-disc-name text-gray-400">________________</span>
                        <div class="vtm-dots-leader"></div>
                        ${renderSheetDots(0, 5)}
                    </div>
                    <div class="vtm-disc-powers">
                        <div class="vtm-line-row"></div>
                        <div class="vtm-line-row"></div>
                    </div>
                </div>
            `;
        }
    }
    return html;
}

function renderMeritsFlawsSheetRows() {
    let html = '';
    const totalRows = 11;
    for (let i = 0; i < totalRows; i++) {
        if (i < state.selectedAdvantages.length) {
            const adv = state.selectedAdvantages[i];
            const typePrefix = adv.type === 'flaw' ? '[Вада]' : '[Благо]';
            html += `
                <div class="vtm-merit-row">
                    <div class="vtm-merit-name">
                        <span class="font-bold ${adv.type === 'flaw' ? 'text-gray-900' : 'text-[#8b0000]'}">${typePrefix}</span>
                        <span class="ml-1">${adv.name}</span>
                    </div>
                    <div class="vtm-dots-leader"></div>
                    ${renderSheetDots(adv.cost, 5)}
                </div>
            `;
        } else {
            html += `
                <div class="vtm-merit-row">
                    <div class="vtm-merit-name text-gray-400">________________________________</div>
                    <div class="vtm-dots-leader"></div>
                    ${renderSheetDots(0, 5)}
                </div>
            `;
        }
    }
    return html;
}

function finishGen() {
    const name = document.getElementById('character-name')?.value || 'Безіменний Кревний';
    const concept = document.getElementById('concept-phrase')?.value || '';
    const shortConcept = concept.split(/[:\-\—]/)[0].trim();
    const backgroundText = document.getElementById('concept-bg')?.value || '';
    const chronicle = document.getElementById('chronicle-name')?.value || '';
    const sire = document.getElementById('sire-name')?.value || '';
    const ambition = document.getElementById('ambition-phrase')?.value || '';
    const desire = document.getElementById('desire-phrase')?.value || '';
    const chronicleTenets = document.getElementById('chronicle-tenets')?.value || '';

    const bioTrueAge = document.getElementById('bio-true-age')?.value || '';
    const bioApparentAge = document.getElementById('bio-apparent-age')?.value || '';
    const bioDob = document.getElementById('bio-dob')?.value || '';
    const bioDod = document.getElementById('bio-dod')?.value || '';
    const bioAppearance = document.getElementById('bio-appearance')?.value || '';
    const bioDistinguishing = document.getElementById('bio-distinguishing')?.value || '';

    const conv1 = document.getElementById('conviction1')?.value || '';
    const touch1 = document.getElementById('touchstone1')?.value || '';
    const conv2 = document.getElementById('conviction2')?.value || '';
    const touch2 = document.getElementById('touchstone2')?.value || '';
    const conv3 = document.getElementById('conviction3')?.value || '';
    const touch3 = document.getElementById('touchstone3')?.value || '';

    const clanInfo = clansData[state.clan] || {};
    const clanName = clanInfo.name || 'Невідомо';
    let clanCompulsion = clanInfo.clan_compultion && clanInfo.clan_compultion.trim().toLowerCase() !== "відсутнє" ? clanInfo.clan_compultion : 'Немає';
    let clanBane = clanInfo.clan_bane && clanInfo.clan_bane.trim().toLowerCase() !== "відсутнє" ? clanInfo.clan_bane : 'Немає';

    if (clanCompulsion !== 'Немає') {
        const splitMatch = clanCompulsion.match(/^(.*?)(:|\.)(.*)$/);
        if (splitMatch) {
            clanCompulsion = `<strong class="font-bold">${splitMatch[1]}${splitMatch[2]}</strong> ${splitMatch[3]}`;
        }
    }

    if (clanBane !== 'Немає') {
        clanBane = clanBane.replace(/^(.*?)(:|\.)/g, '<strong class="font-bold">$1$2</strong>');
        clanBane = clanBane.replace(/(Альтернативне прокляття.*?)(:|\.)/g, '<strong class="font-bold text-[#8b0000]">$1$2</strong>');
    }
    
    const predator = state.selectedPredator ? state.predatorData.find(p => p.id === state.selectedPredator) : null;
    const predatorName = predator ? predator.name : 'Не обрано';
    const predatorDesc = predator ? predator.description : '';
    
    let currentHumanity = 7;
    if (predator && predator.humanity_modifier) currentHumanity += predator.humanity_modifier;

    let defaultGen = state.clan === 'thin_blood' ? '14-те' : '13-те';
    const generation = document.getElementById('generation-val')?.value || defaultGen;

    let bloodPotency = 1;
    if (state.clan === 'thin_blood') {
        bloodPotency = 0;
    } else if (predator && (predator.id === 'blood_leech' || predator.name?.toLowerCase().includes('п\'явка') || predator.name?.toLowerCase().includes('п’явка'))) {
        bloodPotency = 2;
    }
    const bpTable = getBloodPotencyTable(bloodPotency);

    const stamina = state.attributes['stamina'] || 1;
    const healthMax = stamina + 3;
    const resolve = state.attributes['resolve'] || 1;
    const composure = state.attributes['composure'] || 1;
    const willpowerMax = resolve + composure;

    const summaryNameEl = document.getElementById('summary-name');
    const summaryConceptEl = document.getElementById('summary-concept');
    const summaryHumanityEl = document.getElementById('summary-humanity');
    if (summaryNameEl) summaryNameEl.innerText = name;
    if (summaryConceptEl) summaryConceptEl.innerText = `${shortConcept || 'Без концепту'} | ${clanName} | ${predatorName}`;
    if (summaryHumanityEl) summaryHumanityEl.innerText = currentHumanity;
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    if (state.predatorChoices.discipline && !availableDisc.includes(state.predatorChoices.discipline)) {
        availableDisc.push(state.predatorChoices.discipline);
    }
    if (state.manualDisciplines) {
        state.manualDisciplines.forEach(d => {
            if (!availableDisc.includes(d)) availableDisc.push(d);
        });
    }

    let bsTotalDots = (state.disciplines['blood_sorcery'] || 0) + (state.predatorChoices.discipline === 'blood_sorcery' ? 1 : 0);
    if (bsTotalDots > 0 && !availableDisc.includes('blood_sorcery_rituals')) {
        availableDisc.push('blood_sorcery_rituals');
    }

    let obTotalDots = (state.disciplines['oblivion'] || 0) + (state.predatorChoices.discipline === 'oblivion' ? 1 : 0);
    if (obTotalDots > 0 && !availableDisc.includes('oblivion_ceremonies')) {
        availableDisc.push('oblivion_ceremonies');
    }

    // =========================================================================
    // 1. RENDER OFFICIAL VTM 5E PRINTABLE SHEET (PAGES 1 & 2)
    // =========================================================================
    let officialHTML = `
        <!-- PAGE 1 OF OFFICIAL VTM 5E SHEET -->
        <div class="vtm-sheet-page page-1">
            <div class="vtm-sheet-border">
                <div class="vtm-sheet-inner-border">
                    <!-- Title Banner -->
                    <div class="vtm-title-banner">
                        <div class="vtm-title-lines-left"></div>
                        <div class="vtm-main-title">
                            <h1 class="vtm-title-primary">ВАМПІРИ</h1>
                            <h2 class="vtm-title-secondary">МАСКАРАД</h2>
                        </div>
                        <div class="vtm-title-lines-right"></div>
                    </div>

                    <!-- 3x3 Profile Info Box -->
                    <div class="vtm-profile-grid">
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Ім'я:</span> <span class="vtm-cell-val">${name}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Хижак:</span> <span class="vtm-cell-val">${predatorName}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Хроніка:</span> <span class="vtm-cell-val">${chronicle}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Концепт:</span> <span class="vtm-cell-val">${shortConcept}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Клан:</span> <span class="vtm-cell-val">${clanName}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Амбіція:</span> <span class="vtm-cell-val">${ambition}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Сір:</span> <span class="vtm-cell-val">${sire}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Покоління:</span> <span class="vtm-cell-val">${generation}</span></div>
                        <div class="vtm-profile-cell"><span class="vtm-cell-label">Бажання:</span> <span class="vtm-cell-val">${desire}</span></div>
                    </div>

                    <!-- ATTRIBUTES SECTION -->
                    <div class="vtm-section-header">
                        <span class="vtm-section-title">ХАРАКТЕРИСТИКИ</span>
                    </div>
                    <div class="vtm-attributes-grid">
                        <!-- Physical -->
                        <div class="vtm-attr-col">
                            <div class="vtm-col-title">ФІЗИЧНІ</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Сила</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['strength'] || 1, 5)}</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Спритність</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['dexterity'] || 1, 5)}</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Витривалість</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['stamina'] || 1, 5)}</div>
                        </div>
                        <!-- Social -->
                        <div class="vtm-attr-col">
                            <div class="vtm-col-title">СОЦІАЛЬНІ</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Харизма</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['charisma'] || 1, 5)}</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Маніпулювання</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['manipulation'] || 1, 5)}</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Витримка</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['composure'] || 1, 5)}</div>
                        </div>
                        <!-- Mental -->
                        <div class="vtm-attr-col">
                            <div class="vtm-col-title">МЕНТАЛЬНІ</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Кмітливість</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['intelligence'] || 1, 5)}</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Інтуїція</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['wits'] || 1, 5)}</div>
                            <div class="vtm-stat-row"><span class="vtm-stat-name">Рішучість</span><div class="vtm-dots-leader"></div> ${renderSheetDots(state.attributes['resolve'] || 1, 5)}</div>
                        </div>
                    </div>

                    <!-- Health & Willpower Trackers -->
                    <div class="vtm-trackers-row">
                        <div class="vtm-tracker-block">
                            <span class="vtm-tracker-name">ЗДОРОВ'Я</span>
                            ${renderTrackBoxes(healthMax, 10)}
                        </div>
                        <div class="vtm-tracker-block">
                            <span class="vtm-tracker-name">СИЛА ВОЛІ</span>
                            ${renderTrackBoxes(willpowerMax, 10)}
                        </div>
                    </div>

                    <!-- SKILLS SECTION -->
                    <div class="vtm-section-header">
                        <span class="vtm-section-title">НАВИЧКИ</span>
                    </div>
                    <div class="vtm-skills-grid">
                        <!-- Physical Skills Col -->
                        <div class="vtm-skill-col">
                            <div class="vtm-col-title">ФІЗИЧНІ</div>
                            ${(skillsData.physical || []).map(s => renderSkillSheetRow(s)).join('')}
                        </div>
                        <!-- Social Skills Col -->
                        <div class="vtm-skill-col">
                            <div class="vtm-col-title">СОЦІАЛЬНІ</div>
                            ${(skillsData.social || []).map(s => renderSkillSheetRow(s)).join('')}
                        </div>
                        <!-- Mental Skills Col -->
                        <div class="vtm-skill-col">
                            <div class="vtm-col-title">МЕНТАЛЬНІ</div>
                            ${(skillsData.mental || []).map(s => renderSkillSheetRow(s)).join('')}
                        </div>
                    </div>

                    <!-- DISCIPLINES SECTION -->
                    <div class="vtm-section-header">
                        <span class="vtm-section-title">ДИСЦИПЛІНИ</span>
                    </div>
                    <div class="vtm-disciplines-grid">
                        ${renderDisciplinesSheetBoxes(availableDisc)}
                    </div>

                    <!-- BOTTOM BAR: RESONANCE, HUNGER, HUMANITY -->
                    <div class="vtm-bottom-bar">
                        <div class="vtm-bottom-item">
                            <span class="vtm-bottom-label">РЕЗОНАНС:</span>
                            <div class="vtm-resonance-line">${predator && predator.resonance ? predator.resonance : ''}</div>
                        </div>
                        <div class="vtm-bottom-item">
                            <span class="vtm-bottom-label">ГОЛОД:</span>
                            ${renderHungerBoxes(5)}
                        </div>
                        <div class="vtm-bottom-item">
                            <span class="vtm-bottom-label">ЛЮДЯНІСТЬ:</span>
                            ${renderHumanityBoxes(currentHumanity, 10)}
                        </div>
                    </div>
                    <div class="vtm-sheet-footer-note">Сторінка 1 з 2 • Офіційний бланк Vampire: The Masquerade 5th Edition</div>
                </div>
            </div>
        </div>

        <!-- PAGE 2 OF OFFICIAL VTM 5E SHEET -->
        <div class="vtm-sheet-page page-2">
            <div class="vtm-sheet-border">
                <div class="vtm-sheet-inner-border">
                    <!-- Title Banner -->
                    <div class="vtm-title-banner">
                        <div class="vtm-title-lines-left"></div>
                        <div class="vtm-main-title">
                            <h1 class="vtm-title-primary">ВАМПІРИ</h1>
                            <h2 class="vtm-title-secondary">МАСКАРАД</h2>
                        </div>
                        <div class="vtm-title-lines-right"></div>
                    </div>

                    <!-- TOP 3 BOXED CARDS -->
                    <div class="vtm-page2-top-grid">
                        <!-- Tenets -->
                        <div class="vtm-boxed-card">
                            <div class="vtm-card-title">ПРИНЦИПИ ХРОНІКИ</div>
                            <div class="vtm-card-content">
                                ${chronicleTenets ? `<p class="italic text-gray-800 leading-snug">${chronicleTenets}</p>` : `
                                    <div class="vtm-line-row"></div>
                                    <div class="vtm-line-row"></div>
                                    <div class="vtm-line-row"></div>
                                `}
                            </div>
                        </div>

                        <!-- Convictions & Touchstones -->
                        <div class="vtm-boxed-card">
                            <div class="vtm-card-title">ОПОРИ Й ПЕРЕКОНАННЯ</div>
                            <div class="vtm-card-content">
                                <div class="mb-1">
                                    <span class="font-bold text-[#8b0000]">1.</span> ${conv1 ? `<span class="italic">«${conv1}»</span>` : '<span class="text-gray-400">________________________</span>'}
                                    ${touch1 ? `<div class="text-[7pt] text-gray-700 font-sans uppercase font-bold pl-2">Опора: ${touch1}</div>` : ''}
                                </div>
                                <div>
                                    <span class="font-bold text-[#8b0000]">2.</span> ${conv2 ? `<span class="italic">«${conv2}»</span>` : '<span class="text-gray-400">________________________</span>'}
                                    ${touch2 ? `<div class="text-[7pt] text-gray-700 font-sans uppercase font-bold pl-2">Опора: ${touch2}</div>` : ''}
                                </div>
                                <div class="mt-1">
                                    <span class="font-bold text-[#8b0000]">3.</span> ${conv3 ? `<span class="italic">«${conv3}»</span>` : '<span class="text-gray-400">________________________</span>'}
                                    ${touch3 ? `<div class="text-[7pt] text-gray-700 font-sans uppercase font-bold pl-2">Опора: ${touch3}</div>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Clan Bane & Compulsion -->
                        <div class="vtm-boxed-card">
                            <div class="vtm-card-title">КЛАНОВЕ ПРОКЛЯТТЯ</div>
                            <div class="vtm-card-content space-y-1">
                                <div><span class="font-bold uppercase text-[7pt] text-[#8b0000] block">Примус (${clanName}):</span> <span class="text-[7pt] text-gray-800 leading-tight">${clanCompulsion}</span></div>
                                <div><span class="font-bold uppercase text-[7pt] text-[#8b0000] block">Прокляття:</span> <span class="text-[7pt] text-gray-800 leading-tight">${clanBane}</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- MAIN 2-COLUMN GRID -->
                    <div class="vtm-page2-main-grid">
                        <!-- LEFT COLUMN: MERITS & FLAWS (11 ROWS) + NOTES -->
                        <div class="vtm-page2-left-col">
                            <div class="vtm-col-title">ПЕРЕВАГИ Й ВАДИ</div>
                            <div class="vtm-merits-list">
                                ${renderMeritsFlawsSheetRows()}
                            </div>

                            <div class="vtm-col-title mt-3">ПРИМІТКИ ТА ІСТОРІЯ</div>
                            <div class="vtm-notes-box">
                                ${backgroundText ? `<p class="leading-snug">${backgroundText}</p>` : `
                                    <div class="vtm-line-row"></div>
                                    <div class="vtm-line-row"></div>
                                    <div class="vtm-line-row"></div>
                                    <div class="vtm-line-row"></div>
                                `}
                            </div>
                        </div>

                        <!-- RIGHT COLUMN: BLOOD POTENCY + TABLE + XP + BIOGRAPHY -->
                        <div class="vtm-page2-right-col">
                            <!-- Blood Potency Header with 10 dots -->
                            <div class="vtm-bp-header-row">
                                <span class="vtm-section-title-inline">СИЛА КРОВІ</span>
                                <div class="vtm-dots-10">
                                    ${renderSheetDots(bloodPotency, 10)}
                                </div>
                            </div>

                            <!-- Blood Potency Reference Table -->
                            <table class="vtm-bp-table">
                                <tr>
                                    <td><span class="vtm-bp-cell-label">Збурення Крові:</span><span class="vtm-bp-cell-val">${bpTable.bloodSurge}</span></td>
                                    <td><span class="vtm-bp-cell-label">Лікування ушкоджень:</span><span class="vtm-bp-cell-val">${bpTable.damageMended}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="vtm-bp-cell-label">Бонус до Сил:</span><span class="vtm-bp-cell-val">${bpTable.powerBonus}</span></td>
                                    <td><span class="vtm-bp-cell-label">Перекидання Збурення:</span><span class="vtm-bp-cell-val">${bpTable.rouseReroll}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="vtm-bp-cell-label">Штраф годування:</span><span class="vtm-bp-cell-val">${bpTable.feedingPenalty}</span></td>
                                    <td><span class="vtm-bp-cell-label">Суворість Прокляття:</span><span class="vtm-bp-cell-val">${bpTable.baneSeverity}</span></td>
                                </tr>
                            </table>

                            <!-- XP Row -->
                            <div class="vtm-xp-row">
                                <div class="flex items-center gap-1.5"><span class="vtm-xp-label">ДОСВІД (XP) УСЬОГО:</span> <span class="font-bold">0</span></div>
                                <div class="flex items-center gap-1.5"><span class="vtm-xp-label">ВИТРАЧЕНО:</span> <span class="font-bold">0</span></div>
                            </div>

                            <!-- Biography Section -->
                            <div class="vtm-col-title">БІОГРАФІЯ ТА ЗОВНІШНІСТЬ</div>
                            <div class="vtm-bio-grid">
                                <div class="vtm-bio-row"><span class="vtm-bio-label">Справжній вік:</span><div class="vtm-bio-line">${bioTrueAge}</div></div>
                                <div class="vtm-bio-row"><span class="vtm-bio-label">Візуальний вік:</span><div class="vtm-bio-line">${bioApparentAge}</div></div>
                                <div class="vtm-bio-row"><span class="vtm-bio-label">Дата народження:</span><div class="vtm-bio-line">${bioDob}</div></div>
                                <div class="vtm-bio-row"><span class="vtm-bio-label">Дата смерті:</span><div class="vtm-bio-line">${bioDod}</div></div>
                                <div class="vtm-bio-row"><span class="vtm-bio-label">Зовнішність:</span><div class="vtm-bio-line">${bioAppearance}</div></div>
                                <div class="vtm-bio-row"><span class="vtm-bio-label">Виразні риси:</span><div class="vtm-bio-line">${bioDistinguishing}</div></div>
                            </div>
                        </div>
                    </div>
                    <div class="vtm-sheet-footer-note">Сторінка 2 з 2 • Офіційний бланк Vampire: The Masquerade 5th Edition</div>
                </div>
            </div>
        </div>
    `;

    const officialContainer = document.getElementById('vtm-official-sheet');
    if (officialContainer) {
        officialContainer.innerHTML = officialHTML;
    }

    // =========================================================================
    // 2. RENDER INTERACTIVE SUMMARY CARDS (ALTERNATIVE SCREEN VIEW)
    // =========================================================================
    let summaryHTML = '';
    const cats = [{ key: 'physical', label: 'Фізичні' }, { key: 'social', label: 'Соціальні' }, { key: 'mental', label: 'Ментальні' }];

    // СЕКЦІЯ 1: КОНЦЕПТ ТА КЛАН
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">1. Концепт та Кров</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Концепт:</strong> <span class="text-gray-900 font-serif text-base">${shortConcept || 'Не вказано'}</span></p>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Клан:</strong> <span class="text-gray-900 font-serif text-base">${clanName}</span></p>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Історія / Фон:</strong> <span class="text-gray-700 font-serif italic block mt-1">${backgroundText || 'Не вказано'}</span></p>
                </div>
                <div class="space-y-3 bg-white p-4 rounded border border-gray-100">
                    <div><strong class="text-[#8b0000] uppercase text-[10px] tracking-widest block">Клановий примус:</strong> <p class="text-xs text-gray-800 leading-snug">${clanCompulsion}</p></div>
                    <div><strong class="text-red-700 uppercase text-[10px] tracking-widest block">Кланове прокляття:</strong> <p class="text-xs text-gray-800 leading-snug">${clanBane}</p></div>
                </div>
            </div>
        </div>
    `;

    // СЕКЦІЯ 2: ХАРАКТЕРИСТИКИ
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
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

    // СЕКЦІЯ 3: НАВИЧКИ ТА СПЕЦІАЛІЗАЦІЇ
    if (!state.skillSpecs) state.skillSpecs = {};

    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
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

    // СЕКЦІЯ 4: ХИЖАЦЬКІ ЗВИЧКИ
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">4. Хижацькі звички</h3>
            <div class="text-sm space-y-2">
                <p><strong>Обраний тип хижака:</strong> <span class="font-serif font-bold text-lg text-[#8b0000]">${predatorName}</span></p>
                ${predatorDesc ? `<p class="text-gray-600 text-xs italic">${predatorDesc}</p>` : ''}
                ${predator && predator.advantages_text ? `<p class="mt-2 text-xs bg-indigo-50 p-2.5 rounded border border-indigo-100 text-indigo-900"><strong>Бонуси хижака:</strong> ${predator.advantages_text}</p>` : ''}
            </div>
        </div>`;

    // СЕКЦІЯ 5: ДИСЦИПЛІНИ ТА ЗДІБНОСТІ
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">5. Дисципліни та Здібності</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    `;
    
    let hasDisciplines = false;
    availableDisc.forEach(discKey => {
        let totalDots = (state.disciplines[discKey] || 0) + (state.predatorChoices.discipline === discKey ? 1 : 0);
        if (totalDots > 0) {
            hasDisciplines = true;
            const discInfo = getDisciplineInfo(discKey);
            const discName = discInfo.name || discKey;
            const iconSrc = getDisciplineIcon(discKey);
            const iconHtml = iconSrc ? `
                <div class="w-7 h-7 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center p-1 shrink-0">
                    <img src="${iconSrc}" alt="${discName}" class="w-full h-full object-contain">
                </div>
            ` : '';
            
            summaryHTML += `
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-2.5 min-w-0">
                            ${iconHtml}
                            <span class="font-serif font-bold text-base sm:text-lg text-[#8b0000] uppercase tracking-wider">${discName}</span> 
                        </div>
                        <span class="shrink-0">${createSummaryDots(totalDots)}</span>
                    </div>
                    <ul class="space-y-2">
            `;

            for (let i = 1; i <= totalDots; i++) {
                let powerId = state.disciplinePowers[discKey]?.[i];
                if (powerId) {
                    let powerInfo = disciplinesPowersMap[discKey]?.find(p => p.id === powerId);
                    if (powerInfo) {
                        const highlightedPowerDesc = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(powerInfo.desc || '') : powerInfo.desc;
                        const highlightedReq = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(powerInfo.requirement || '') : powerInfo.requirement;
                        summaryHTML += `
                            <li class="text-sm border-t border-gray-100 pt-2">
                                <div class="font-bold text-gray-800 mb-1">Рівень ${i}: ${powerInfo.name}</div>
                                <p class="text-xs text-gray-600 leading-snug text-justify mb-2">${highlightedPowerDesc}</p>
                                <div class="text-[11px] text-gray-500 space-y-0.5">
                                    ${(powerInfo.requirement && String(powerInfo.requirement).trim().toLowerCase() !== 'немає' && String(powerInfo.requirement).trim() !== '') ? `<p><span class="font-bold text-gray-700">Вимога:</span> ${highlightedReq}</p>` : ''}
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

    // СЕКЦІЯ 6: БЛАГА ТА ВАДИ
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">6. Блага та Вади</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;
    
    if (state.selectedAdvantages.length === 0) {
        summaryHTML += `<p class="text-sm text-gray-500 italic col-span-full">Переваги чи недоліки відсутні.</p>`;
    } else {
        state.selectedAdvantages.forEach(adv => {
            let badgeClass = adv.type === 'flaw' ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-800';
            let label = adv.type === 'flaw' ? 'Вада' : 'Благо';
            let predatorBadge = adv.source === 'predator' ? `<span class="ml-2 text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 rounded uppercase tracking-wider">Від хижака</span>` : '';
            
            summaryHTML += `
                <div class="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass}">${label}</span>
                        <span class="font-serif font-bold text-gray-800 ml-2">${adv.name}</span>
                        ${predatorBadge}
                    </div>
                    <span class="font-bold text-sm text-gray-700">${adv.cost} ⬤</span>
                </div>
            `;
        });
    }
    summaryHTML += `</div></div>`;
    
    // Add Health and Willpower Trackers Placeholder to Summary Cards
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

    const summaryContentEl = document.getElementById('summary-content');
    if (summaryContentEl) {
        summaryContentEl.innerHTML = summaryHTML;
    }
    renderHealthWillpower();
}

// Dedicated print trigger functions ensuring clean 2-page print in all browser & iframe contexts
function generatePrintableHTML() {
    finishGen();
    switchSummaryView('official');
    const sheetEl = document.getElementById('vtm-official-sheet');
    const content = sheetEl ? sheetEl.innerHTML : '';
    
    return `<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Бланк персонажа - Vampire: The Masquerade 5e</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --vtm-red: #8b0000;
            --vtm-crimson: #6b0000;
            --vtm-bone: #f5f5f0;
            --vtm-dark: #1a1a1a;
            --vtm-accent: #c8102e;
            --vtm-predator: #4b0082;
            --vtm-sheet-bg: #fcfbfa;
            --vtm-sheet-border: #222222;
        }

        *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        body {
            font-family: 'EB Garamond', Georgia, serif;
            background-color: #141414;
            color: #111111;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }

        h1, h2, h3, .vtm-font {
            font-family: 'Cinzel', 'EB Garamond', serif;
        }

        .cinzel {
            font-family: 'Cinzel', serif;
        }

        .garamond {
            font-family: 'EB Garamond', Georgia, serif;
        }

        /* Screen Preview Top Sticky Control Bar */
        .print-bar {
            position: sticky;
            top: 0;
            width: 100%;
            background: #0f0f0f;
            border-bottom: 2px solid #8b0000;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 25px rgba(0,0,0,0.8);
            z-index: 9999;
        }

        .print-btn {
            background: #8b0000;
            color: #ffffff;
            font-family: 'Cinzel', serif;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.08em;
            padding: 9px 22px;
            border-radius: 6px;
            border: 1px solid #b30000;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 10px rgba(139, 0, 0, 0.5);
        }

        .print-btn:hover {
            background: #b30000;
            transform: translateY(-1px);
        }

        .print-btn:active {
            transform: translateY(0);
        }

        .vtm-official-sheet-wrapper {
            width: 100%;
            margin: 0 auto;
            font-family: 'EB Garamond', Georgia, serif;
            color: #111111;
            padding: 24px 0 60px 0;
        }

        .vtm-sheet-page {
            background-color: #ffffff;
            color: #111111;
            box-sizing: border-box;
            width: 210mm;
            height: 282mm;
            max-height: 282mm;
            min-height: 282mm;
            margin: 0 auto 30px auto;
            padding: 6mm 7mm;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
            border: 1px solid #222222;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
            overflow: hidden;
        }

        .vtm-sheet-page.page-1 {
            page-break-after: always;
            break-after: page;
        }

        .vtm-sheet-page.page-2 {
            page-break-before: always;
            break-before: page;
            page-break-after: avoid;
            break-after: avoid;
        }

        /* Outer and Inner Classic Borders */
        .vtm-sheet-border {
            border: 2.5px solid #1a1a1a;
            padding: 3.5mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
        }

        .vtm-sheet-inner-border {
            border: 1px solid #1a1a1a;
            padding: 3mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            justify-content: space-between;
        }

        /* Title Banner */
        .vtm-title-banner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            margin-bottom: 6px;
            padding: 2px 0 3px 0;
            width: 100%;
        }

        .vtm-title-lines-left,
        .vtm-title-lines-right {
            flex: 1;
            height: 4px;
            border-top: 1.5px solid #1a1a1a;
            border-bottom: 1px solid #8b0000;
        }

        .vtm-main-title {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
        }

        .vtm-title-primary {
            font-family: 'Cinzel', 'EB Garamond', Georgia, serif;
            font-size: 21pt;
            font-weight: 900;
            letter-spacing: 0.26em;
            line-height: 1;
            margin: 0;
            color: #1a1a1a;
            text-transform: uppercase;
        }

        .vtm-title-secondary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            font-family: 'Cinzel', 'EB Garamond', Georgia, serif;
            font-size: 9pt;
            font-weight: 800;
            letter-spacing: 0.45em;
            line-height: 1.2;
            margin: 2px 0 0 0;
            color: #8b0000;
            text-transform: uppercase;
        }

        .vtm-title-secondary::before,
        .vtm-title-secondary::after {
            content: '';
            flex: 1;
            height: 1px;
            background-color: #8b0000;
            min-width: 18px;
        }

        /* 3x3 Profile Info Box */
        .vtm-profile-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border: 1.5px solid #1a1a1a;
            margin-bottom: 6px;
            background-color: #fff;
        }

        .vtm-profile-cell {
            border-right: 1px solid #888;
            border-bottom: 1px solid #888;
            padding: 3px 5px;
            display: flex;
            align-items: baseline;
            gap: 4px;
            min-height: 22px;
            overflow: hidden;
        }

        .vtm-profile-cell:nth-child(3n) {
            border-right: none;
        }

        .vtm-profile-cell:nth-child(n+7) {
            border-bottom: none;
        }

        .vtm-cell-label {
            font-family: 'Cinzel', serif;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #333333;
            white-space: nowrap;
            letter-spacing: 0.05em;
        }

        .vtm-cell-val {
            font-family: 'EB Garamond', Georgia, serif;
            font-size: 9.5pt;
            font-weight: 600;
            color: #111111;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex-grow: 1;
        }

        /* Section Headers */
        .vtm-section-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin: 4px 0 3px 0;
            position: relative;
        }

        .vtm-section-header::before,
        .vtm-section-header::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(to right, transparent, #8b0000, #1a1a1a);
        }

        .vtm-section-header::after {
            background: linear-gradient(to left, transparent, #8b0000, #1a1a1a);
        }

        .vtm-section-title {
            font-family: 'Cinzel', serif;
            font-size: 9.5pt;
            font-weight: 800;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #8b0000;
            padding: 0 4px;
        }

        .vtm-col-title {
            font-family: 'Cinzel', serif;
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            color: #1a1a1a;
            border-bottom: 1.5px solid #1a1a1a;
            padding-bottom: 2px;
            margin-bottom: 3px;
            letter-spacing: 0.1em;
        }

        /* Attributes Grid */
        .vtm-attributes-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 5px;
        }

        .vtm-attr-col {
            display: flex;
            flex-direction: column;
        }

        .vtm-dots-leader {
            flex: 1;
            border-bottom: 1px dotted #888;
            height: 1px;
            margin: 0 4px 2px 4px;
            min-width: 6px;
        }

        .vtm-stat-row {
            display: flex;
            align-items: center;
            font-size: 8.5pt;
            font-family: 'EB Garamond', Georgia, serif;
            padding: 1.5px 0;
            min-height: 17px;
        }

        .vtm-stat-name {
            font-weight: 600;
            color: #222;
            white-space: nowrap;
            flex-shrink: 0;
        }

        /* Circles & Dots for Official Sheet */
        .vtm-dots {
            display: flex;
            gap: 3px;
            align-items: center;
        }

        .vtm-sheet-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            border: 1.2px solid #1a1a1a;
            display: inline-block;
            box-sizing: border-box;
        }

        .vtm-sheet-dot.filled {
            background-color: #1a1a1a;
            border-color: #1a1a1a;
        }

        .vtm-sheet-dot.predator-dot {
            background-color: #4b0082;
            border-color: #4b0082;
        }

        .vtm-sheet-dot.spec-dot {
            background-color: #065f46;
            border-color: #065f46;
        }

        /* Trackers Row (Health & Willpower) */
        .vtm-trackers-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            border: 1px solid #1a1a1a;
            padding: 3px 6px;
            margin-bottom: 6px;
            background-color: #fbfbfb;
        }

        .vtm-tracker-block {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
        }

        .vtm-tracker-name {
            font-family: 'Cinzel', serif;
            font-size: 8pt;
            font-weight: 800;
            letter-spacing: 0.1em;
            color: #1a1a1a;
        }

        .vtm-tracker-boxes {
            display: flex;
            gap: 2.5px;
            align-items: center;
        }

        .vtm-track-box {
            width: 12px;
            height: 12px;
            border: 1.2px solid #1a1a1a;
            display: inline-block;
            box-sizing: border-box;
            background-color: #ffffff;
        }

        .vtm-track-box.inactive {
            border: 1px dashed #aaa;
            background-color: #f0f0f0;
        }

        /* Skills Grid */
        .vtm-skills-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 5px;
        }

        .vtm-skill-col {
            display: flex;
            flex-direction: column;
        }

        .vtm-skill-row {
            display: flex;
            align-items: center;
            font-size: 8pt;
            padding: 1px 0;
            min-height: 17px;
        }

        .vtm-skill-title {
            display: inline-flex;
            align-items: baseline;
            gap: 2px;
            white-space: nowrap;
            font-weight: 500;
            color: #222;
            flex-shrink: 0;
        }

        .vtm-skill-spec {
            font-size: 7pt;
            font-style: italic;
            color: #555555;
            white-space: nowrap;
        }

        /* Disciplines Grid */
        .vtm-disciplines-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 5px;
        }

        .vtm-disc-box {
            border: 1px solid #1a1a1a;
            padding: 3px 4px;
            min-height: 62px;
            display: flex;
            flex-direction: column;
            background-color: #ffffff;
        }

        .vtm-disc-header {
            display: flex;
            align-items: center;
            border-bottom: 1px solid #1a1a1a;
            padding-bottom: 1px;
            margin-bottom: 2px;
        }

        .vtm-disc-name {
            font-family: 'Cinzel', serif;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #8b0000;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .vtm-disc-powers {
            font-size: 7pt;
            color: #222;
            line-height: 1.25;
            flex-grow: 1;
        }

        .vtm-disc-power-item {
            margin-bottom: 1.5px;
            border-bottom: 1px dotted #e5e7eb;
            padding-bottom: 1px;
        }

        .vtm-power-title {
            font-weight: 700;
            color: #111;
        }

        /* Bottom Bar: Resonance, Hunger, Humanity */
        .vtm-bottom-bar {
            display: grid;
            grid-template-columns: 1.2fr 1fr 1.4fr;
            gap: 8px;
            border: 1.5px solid #1a1a1a;
            padding: 4px 6px;
            margin-top: 2px;
            align-items: center;
            background-color: #fbfbfb;
        }

        .vtm-bottom-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .vtm-bottom-label {
            font-family: 'Cinzel', serif;
            font-size: 7.5pt;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: #1a1a1a;
            white-space: nowrap;
        }

        .vtm-resonance-line {
            flex-grow: 1;
            border-bottom: 1px solid #888;
            height: 12px;
            font-size: 8pt;
            padding-left: 2px;
        }

        .vtm-hunger-box {
            width: 12px;
            height: 12px;
            border: 1.5px solid #8b0000;
            display: inline-block;
            box-sizing: border-box;
            background-color: #ffffff;
        }

        .vtm-humanity-box {
            width: 12px;
            height: 12px;
            border: 1.2px solid #1a1a1a;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            background-color: #ffffff;
            font-size: 9px;
            font-weight: bold;
            line-height: 1;
        }

        .vtm-humanity-box.filled {
            background-color: #1a1a1a;
            color: #ffffff;
        }

        .vtm-sheet-footer-note {
            font-size: 6.5pt;
            text-align: right;
            color: #666666;
            font-style: italic;
            margin-top: 2px;
        }

        /* PAGE 2 STYLES */
        .vtm-page2-top-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 6px;
        }

        .vtm-boxed-card {
            border: 1.5px solid #1a1a1a;
            padding: 3px 5px;
            min-height: 60px;
            display: flex;
            flex-direction: column;
            background-color: #ffffff;
        }

        .vtm-card-title {
            font-family: 'Cinzel', serif;
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            color: #8b0000;
            border-bottom: 1px solid #1a1a1a;
            padding-bottom: 1px;
            margin-bottom: 2px;
            letter-spacing: 0.08em;
        }

        .vtm-card-content {
            font-size: 7.5pt;
            line-height: 1.2;
            flex-grow: 1;
        }

        .vtm-page2-main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            flex-grow: 1;
        }

        .vtm-page2-left-col,
        .vtm-page2-right-col {
            display: flex;
            flex-direction: column;
        }

        .vtm-merits-list {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }

        .vtm-merit-row {
            display: flex;
            align-items: center;
            font-size: 7.5pt;
            padding: 1px 0;
            min-height: 15px;
        }

        .vtm-merit-name {
            display: inline-flex;
            align-items: baseline;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .vtm-notes-box {
            border: 1px solid #1a1a1a;
            padding: 4px;
            flex-grow: 1;
            min-height: 90px;
            font-size: 7.5pt;
            line-height: 1.3;
            background-color: #ffffff;
            text-align: justify;
        }

        .vtm-bp-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #1a1a1a;
            padding-bottom: 2px;
            margin-bottom: 4px;
        }

        .vtm-section-title-inline {
            font-family: 'Cinzel', serif;
            font-size: 8.5pt;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #8b0000;
            text-transform: uppercase;
        }

        .vtm-dots-10 {
            display: flex;
            gap: 2.5px;
        }

        .vtm-bp-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            font-size: 7pt;
        }

        .vtm-bp-table td {
            border: 1px solid #1a1a1a;
            padding: 2.5px 3px;
            vertical-align: top;
            width: 50%;
        }

        .vtm-bp-cell-label {
            font-family: 'Cinzel', serif;
            font-size: 6.5pt;
            font-weight: 700;
            color: #333333;
            display: block;
            text-transform: uppercase;
            line-height: 1.1;
        }

        .vtm-bp-cell-val {
            font-size: 7pt;
            font-weight: 600;
            color: #111111;
            display: block;
            line-height: 1.15;
            margin-top: 1px;
        }

        .vtm-xp-row {
            display: flex;
            justify-content: space-between;
            border: 1px solid #1a1a1a;
            padding: 2.5px 5px;
            margin-bottom: 5px;
            font-size: 7.5pt;
            background-color: #fbfbfb;
        }

        .vtm-xp-label {
            font-family: 'Cinzel', serif;
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
        }

        .vtm-bio-grid {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex-grow: 1;
        }

        .vtm-bio-row {
            display: flex;
            align-items: baseline;
            gap: 4px;
            font-size: 7.5pt;
            min-height: 16px;
        }

        .vtm-bio-label {
            font-family: 'Cinzel', serif;
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #333;
            white-space: nowrap;
        }

        .vtm-bio-line {
            flex-grow: 1;
            border-bottom: 1px solid #999;
            height: 12px;
            font-size: 7.5pt;
            padding-left: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .vtm-line-row {
            border-bottom: 1px dotted #aaa;
            height: 14px;
        }

        /* PRINT MEDIA QUERY RULES */
        @media print {
            @page {
                size: A4 portrait;
                margin: 4mm 5mm 4mm 5mm;
            }

            *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: 'EB Garamond', Georgia, serif !important;
                font-size: 8.5pt !important;
                width: 100% !important;
                height: auto !important;
            }

            .print-bar {
                display: none !important;
            }

            .vtm-official-sheet-wrapper {
                display: block !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: transparent !important;
            }

            .vtm-sheet-page {
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 282mm !important;
                max-height: 282mm !important;
                min-height: 282mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                overflow: hidden !important;
            }

            .vtm-sheet-page.page-1 {
                page-break-before: auto !important;
                break-before: auto !important;
                page-break-after: always !important;
                break-after: page !important;
            }

            .vtm-sheet-page.page-2 {
                page-break-before: always !important;
                break-before: page !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
            }

            .vtm-sheet-border {
                border: 2px solid #000000 !important;
                padding: 2.5mm !important;
                height: 100% !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
            }

            .vtm-sheet-inner-border {
                border: 1px solid #000000 !important;
                padding: 2mm !important;
                box-sizing: border-box !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                flex-grow: 1 !important;
            }

            .vtm-sheet-dot.filled {
                background-color: #000000 !important;
                border-color: #000000 !important;
            }

            .vtm-sheet-dot.predator-dot {
                background-color: #4b0082 !important;
                border-color: #4b0082 !important;
            }

            .vtm-sheet-dot.spec-dot {
                background-color: #065f46 !important;
                border-color: #065f46 !important;
            }

            .vtm-title-primary {
                color: #000000 !important;
            }

            .vtm-title-secondary,
            .vtm-section-title,
            .vtm-card-title,
            .vtm-section-title-inline,
            .vtm-disc-name {
                color: #8b0000 !important;
            }
        }
    </style>
</head>
<body>
    <div class="print-bar">
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #8b0000; font-size: 22px;">🦇</span>
            <div>
                <div style="color: #ffffff; font-family: 'Cinzel', serif; font-size: 14px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase;">
                    Vampire: The Masquerade 5e — Офіційний Бланк Персонажа
                </div>
                <div style="color: #aaaaaa; font-size: 12px; font-family: 'EB Garamond', serif;">
                    Формат: 2 сторінки A4 • Усі характеристики, навички, дисципліни та біографія
                </div>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
            <button class="print-btn" onclick="window.print()">
                <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                <span>Роздрукувати / Зберегти як PDF (Ctrl+P)</span>
            </button>
        </div>
    </div>

    <div class="vtm-official-sheet-wrapper">
        ${content}
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                try {
                    window.focus();
                    window.print();
                } catch(err) {
                    console.log('Direct print dialog notice:', err);
                }
            }, 500);
        });
    </script>
</body>
</html>`;
}

function openPrintSheetInNewWindow() {
    finishGen();
    switchSummaryView('official');
    const htmlDoc = generatePrintableHTML();

    let opened = false;
    try {
        const printWin = window.open('', '_blank');
        if (printWin && printWin.document) {
            printWin.document.open();
            printWin.document.write(htmlDoc);
            printWin.document.close();
            opened = true;
        }
    } catch (e) {
        console.warn('Direct document.write into new window failed:', e);
    }

    if (!opened) {
        try {
            const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                a.remove();
                URL.revokeObjectURL(blobUrl);
            }, 30000);
        } catch (err) {
            console.error('Blob URL opening failed:', err);
        }
    }
}

function printCharacterSheet() {
    finishGen();
    switchSummaryView('official');

    // In sandboxed iframes (like AI Studio preview), direct window.print() is blocked by browser security.
    // Opening the standalone styled sheet in a clean tab bypasses sandbox restrictions and launches the print dialog.
    openPrintSheetInNewWindow();

    // In case the app is opened directly in a browser tab outside iframe, also trigger window.print
    try {
        window.focus();
        window.print();
    } catch (e) {
        // Ignored if blocked by sandbox
    }
}

// Automatically re-render sheet on print trigger
window.addEventListener('beforeprint', () => {
    finishGen();
    switchSummaryView('official');
});

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
    
    addDiceHistory(rollName, successes, messyCritical, bestialFailure);
}

let diceHistory = [];
function addDiceHistory(name, successes, isMessyCrit, isBestialFail) {
    const list = document.getElementById('dice-history-list');
    const container = document.getElementById('dice-history-container');
    if (!list || !container) return;
    
    diceHistory.unshift({ name, successes, isMessyCrit, isBestialFail, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
    if (diceHistory.length > 5) diceHistory = diceHistory.slice(0, 5);
    
    container.classList.remove('hidden');
    list.innerHTML = diceHistory.map(item => `
        <li class="bg-gray-800/80 p-2 rounded text-xs flex justify-between items-center border border-gray-700">
            <span class="text-gray-300 font-medium truncate max-w-[150px]">${item.name}</span>
            <div class="flex items-center gap-2">
                ${item.isMessyCrit ? '<span class="text-yellow-500 font-bold" title="Звіриний Розгром">⚡ ЗР</span>' : ''}
                ${item.isBestialFail ? '<span class="text-red-500 font-bold" title="Звіриний Провал">💀 ЗП</span>' : ''}
                <span class="bg-[#8b0000] text-white px-2 py-0.5 rounded font-bold">${item.successes}</span>
            </div>
        </li>
    `).join('');
}

// --- Save / Load Draft ---
function saveDraftToFile() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", (state.name || "vampire") + "_draft.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function loadDraftFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const loadedState = JSON.parse(e.target.result);
            Object.assign(state, loadedState);
            restoreUIFromState();
            alert("Персонаж успішно завантажений!");
        } catch (error) {
            alert("Помилка при завантаженні файлу: " + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input so it can be triggered again with the same file if needed
    event.target.value = '';
}

function restoreUIFromState() {
    // 1. Concept Step Inputs
    document.getElementById('char-name').value = state.name || '';
    document.getElementById('char-concept').value = state.concept || '';
    document.getElementById('char-chronicle').value = state.chronicle || '';
    document.getElementById('char-sire').value = state.sire || '';
    document.getElementById('char-ambition').value = state.ambition || '';
    document.getElementById('char-desire').value = state.desire || '';
    
    if (state.generation) {
        document.getElementById('generation-select').value = state.generation;
    }
    
    // 2. Clan UI
    if (state.clan) {
        const clanData = state.clansData?.find(c => c.id === state.clan);
        if (clanData) {
            document.getElementById('clan-btn-icon').src = `Clan_symbols/${clanData.icon}`;
            document.getElementById('clan-btn-name').textContent = clanData.name;
        }
    }
    
    // 3. Updates all views
    renderAttributes();
    
    const distSelect = document.getElementById('skill-distribution');
    if (distSelect && state.distribution) {
        distSelect.value = state.distribution;
    }
    renderSkills();
    
    if (state.predatorType) {
        renderPredatorTypes();
    }
    
    renderDisciplines();
    renderMerits();
    renderAdvantagesSummary();
    updateSummary();
    
    // Go to step 1
    goToStep(1);
}

function getClanIconPath(clanId) {
    const map = {
        'brujah': 'Clan_symbols/Brujah_symbol.png',
        'gangrel': 'Clan_symbols/Gangrel_symbol.png',
        'malkavian': 'Clan_symbols/Malkavian_symbol.png',
        'nosferatu': 'Clan_symbols/Nosferatu_symbol.png',
        'toreador': 'Clan_symbols/Toreador_symbol.png',
        'tremere': 'Clan_symbols/Tremere_symbol.png',
        'ventrue': 'Clan_symbols/Ventrue_symbol.png',
        'thin-blood': 'Clan_symbols/Thinblood_symbol.png',
        'thin_blood': 'Clan_symbols/Thinblood_symbol.png',
        'banu_haqim': 'Clan_symbols/Banu_Haqim_Symbol.png',
        'hecata': 'Clan_symbols/Hecata_symbol.png',
        'lasombra': 'Clan_symbols/Lasombra_symbol.png',
        'ministry': 'Clan_symbols/Ministry_symbol.png',
        'ravnos': 'Clan_symbols/Ravnos_symbol.png',
        'salubri': 'Clan_symbols/Salubri_symbol.png',
        'tzimisce': 'Clan_symbols/Tzimisce_symbol.png',
        'unknown': 'Clan_symbols/Caitiff_symbol.png',
        'caitiff': 'Clan_symbols/Caitiff_symbol.png'
    };
    return map[clanId] || 'Clan_symbols/Caitiff_symbol.png';
}
window.getClanIconPath = getClanIconPath;
window.getClanIcon = getClanIconPath;

// --- Clan Selection Modal ---
const clanCategories = [
    {
        title: "Правителі та командири",
        clans: ["ventrue", "tzimisce", "lasombra"]
    },
    {
        title: "Бійці та захисники",
        clans: ["brujah", "gangrel", "banu_haqim"]
    },
    {
        title: "Спокусники та обманщики",
        clans: ["toreador", "ravnos", "ministry"]
    },
    {
        title: "Розслідувачі та дослідники",
        clans: ["malkavian", "tremere", "hecata"]
    },
    {
        title: "Тіні та спостерігачі",
        clans: ["nosferatu", "salubri"]
    },
    {
        title: "Відлюдники та вигнанці",
        clans: ["unknown", "thin-blood"]
    }
];

const clanImages = {
    "ventrue": "Ventrue_symbol.png",
    "tzimisce": "Tzimisce_symbol.png",
    "lasombra": "Lasombra_symbol.png",
    "brujah": "Brujah_symbol.png",
    "gangrel": "Gangrel_symbol.png",
    "banu_haqim": "Banu_Haqim_Symbol.png",
    "toreador": "Toreador_symbol.png",
    "ravnos": "Ravnos_symbol.png",
    "ministry": "Ministry_symbol.png",
    "malkavian": "Malkavian_symbol.png",
    "tremere": "Tremere_symbol.png",
    "hecata": "Hecata_symbol.png",
    "nosferatu": "Nosferatu_symbol.png",
    "salubri": "Salubri_symbol.png",
    "unknown": "Caitiff_symbol.png",
    "thin-blood": "Thinblood_symbol.png"
};

function openClanModal() {
    renderClanModal();
    const modal = document.getElementById('clan-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}
window.openClanModal = openClanModal;

function closeClanModal() {
    const modal = document.getElementById('clan-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
window.closeClanModal = closeClanModal;

function selectClanFromModal(clanId) {
    changeClan(clanId);
    
    // Оновлюємо прихований селект для сумісності
    const sel = document.getElementById('clan-select-1');
    if (sel) sel.value = clanId;
    
    closeClanModal();
}
window.selectClanFromModal = selectClanFromModal;

function renderClanModal() {
    const container = document.getElementById('clan-modal-content');
    if (!container) return;
    
    let html = '<div class="space-y-8">';
    
    clanCategories.forEach(cat => {
        html += `
            <div>
                <h3 class="text-xl font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">${cat.title}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        `;
        
        cat.clans.forEach(clanId => {
            const clanData = clansData[clanId];
            if (!clanData) return;
            
            const imgSrc = getClanIconPath(clanId);
            const highlightedDesc = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(clanData.desc || '') : (clanData.desc || '');
            
            html += `
                <button type="button" onclick="selectClanFromModal('${clanId}')" class="flex items-start p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-red-500 rounded-lg transition-all group text-left h-full cursor-pointer">
                    <div class="shrink-0 mr-4 bg-gray-900 rounded p-2 border border-gray-700 group-hover:border-red-500 transition-colors w-16 h-16 flex items-center justify-center">
                        <img src="${imgSrc}" class="w-full h-full object-contain filter invert opacity-70 group-hover:opacity-100 transition-opacity" alt="${clanData.name}">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-serif font-bold text-white group-hover:text-red-400 truncate">${clanData.name}</h4>
                        <p class="text-xs text-gray-400 mt-1 line-clamp-3 leading-tight">${highlightedDesc}</p>
                    </div>
                </button>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}
window.renderClanModal = renderClanModal;

window.openBgModal = function() {
    const modal = document.getElementById('bg-modal');
    const content = document.getElementById('bg-modal-content');
    if (!modal || !content) return;
    
    let html = '';
    const currentClanId = state.clan || 'unknown';
    const currentClan = clansData[currentClanId];

    function renderClanCard(clanId, clan) {
        if (!clan || !clan.backgrounds || clan.backgrounds.length === 0) return '';
        const iconSrc = window.getClanIcon(clanId);
        const highlightedClanDesc = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(clan.desc || '') : (clan.desc || '');
        let clanHtml = `
            <div class="mb-6 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-center gap-4 mb-4 border-b border-gray-100 pb-3">
                    <div class="w-12 h-12 bg-black rounded p-2 flex items-center justify-center shrink-0 border border-gray-800 shadow-sm">
                        <img src="${iconSrc}" class="w-full h-full object-contain filter invert" alt="${clan.name}">
                    </div>
                    <div>
                        <h3 class="text-xl font-serif font-bold text-gray-900">${clan.name}</h3>
                        <p class="text-xs text-gray-500 italic mt-0.5">${highlightedClanDesc}</p>
                    </div>
                </div>
                <div class="space-y-3">
        `;
        
        clan.backgrounds.forEach(bg => {
            let formattedBg = bg;
            const splitMatch = bg.match(/^(.*?)(:|—|-)(.*)$/);
            if (splitMatch) {
                formattedBg = `<strong class="text-gray-900 font-bold">${splitMatch[1].trim()}:</strong> ${splitMatch[3].trim()}`;
            }
            
            const highlightedBg = typeof highlightGlossaryTerms === 'function' ? highlightGlossaryTerms(formattedBg) : formattedBg;
            const safeBg = bg.replace(/'/g, "\'").replace(/"/g, '&quot;');
            
            clanHtml += `
                <div onclick="selectBackground('${safeBg}')" class="p-3.5 rounded-lg border border-gray-200 hover:border-[#8b0000] hover:bg-red-50/60 transition-all cursor-pointer group shadow-xs">
                    <p class="text-sm text-gray-800 leading-relaxed group-hover:text-gray-900">${highlightedBg}</p>
                </div>
            `;
        });
        
        clanHtml += `</div></div>`;
        return clanHtml;
    }

    if (currentClan && currentClan.backgrounds && currentClan.backgrounds.length > 0) {
        // Only show the currently selected clan's backgrounds
        html += renderClanCard(currentClanId, currentClan);
    } else {
        // Caitiff or unlisted clan: can choose any background
        html += `
            <div class="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                <strong>Каїтиф (або вільний вибір):</strong> Для вашого персонажа немає суворих кланових обмежень передісторії. Ви можете обрати будь-яку з наведених нижче історій:
            </div>
        `;
        for (const [clanId, clan] of Object.entries(clansData)) {
            html += renderClanCard(clanId, clan);
        }
    }
    
    content.innerHTML = html;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeBgModal = function() {
    const modal = document.getElementById('bg-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.selectBackground = function(bgText) {
    const bgInput = document.getElementById('concept-bg');
    if (bgInput) {
        bgInput.value = bgText;
        bgInput.dispatchEvent(new Event('input', { bubbles: true }));
        bgInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        bgInput.classList.add('ring-2', 'ring-[#8b0000]', 'border-[#8b0000]');
        setTimeout(() => {
            bgInput.classList.remove('ring-2', 'ring-[#8b0000]', 'border-[#8b0000]');
        }, 350);
    }
    closeBgModal();
};

// ==================== GLOSSARY (СЛОВНИК) ====================
let vtmGlossaryData = [];

// Highlighting rules with Ukrainian inflections and precise glossary mappings
const GLOSSARY_HIGHLIGHT_RULES = [
    { pattern: 'друго(?:ї|ю|і|у|я)?\\s+інквізиці(?:ї|єю|ю|я|ях|ям|ями)?', term: 'ДРУГА ІНКВІЗИЦІЯ' },
    { pattern: 'книг(?:а|и|ою|і|у|ах|ам|ами)?\\s+нода', term: 'КНИГА НОДА (АРХАЇЧНЕ)' },
    { pattern: 'червон(?:ий|ого|ому|им|ім|і|их|ими)\\s+список|червон(?:ого|ому|им|ім)?\\s+списку', term: 'ЧЕРВОНИЙ СПИСОК' },
    { pattern: 'чорн(?:е|ого|ому|им|ім)\\s+сонц(?:е|я|ем|ю|і)', term: 'ЧОРНЕ СОНЦЕ (ЖАРГОН)' },
    { pattern: 'судин(?:а|и|ою|і|у|ах|ам|ами)', term: 'СУДИНА' },
    { pattern: 'камариль(?:я|ї|єю|ю|ях|ям|ями)?', term: 'КАМАРИЛЬЯ' },
    { pattern: 'шабаш(?:у|ем|і|а|ів|ам|ами)?', term: 'ШАБАШ' },
    { pattern: 'анарх(?:и|ів|ам|ами|ах|а|ом|у|е)?', term: 'АНАРХ' },
    { pattern: 'маскарад(?:у|ом|і|а|ів|ам|ами)?', term: 'МАСКАРАД' },
    { pattern: 'кревн(?:і|их|им|ними|ому|ого|ої|ій)', term: 'КРЕВНІ' },
    { pattern: 'діаблер(?:і|у|іст|іста|істи|істом)', term: 'ДІАБЛЕРІ' },
    { pattern: 'гул(?:і|ів|ям|ями|ях|я|ем|ю)', term: 'ГУЛЬ' },
    { pattern: 'сір(?:а|ові|ом|е|и|ів|ам|ами|ах)?', term: 'СIP' },
    { pattern: 'клік(?:а|и|ою|і|у|ах|ам|ами)?', term: 'КЛІКА' },
    { pattern: 'принц(?:а|ем|еві|і|ів|ам|ами|ах)?', term: 'ПРИНЦ' },
    { pattern: 'примоген(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'ПРИМОГЕН' },
    { pattern: 'барон(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'БАРОН' },
    { pattern: 'шериф(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'ШЕРИФ' },
    { pattern: 'сенешал(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'СЕНЕШАЛЬ' },
    { pattern: 'гарпі(?:я|ї|єю|ю|ях|ям|ями)?', term: 'ГАРПІЯ' },
    { pattern: 'бич(?:а|ем|еві|і|ів|ам|ами|ах)?', term: 'БИЧ' },
    { pattern: 'архонт(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'АРХОНТ' },
    { pattern: 'юстиціар(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'ЮСТИЦІАР' },
    { pattern: 'неонат(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'НЕОНАТ' },
    { pattern: 'анцил(?:а|и|ою|і|у|ах|ам|ами|ів)?', term: 'АНЦИЛА' },
    { pattern: 'старійшин(?:а|и|ою|і|у|ах|ам|ами|ів)?', term: 'СТАРІЙШИНА' },
    { pattern: 'дитя(?:ти|тем|ті|та|там|тами|тах)?', term: 'ДИТЯ' },
    { pattern: 'каїтиф(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'КАЇТИФ' },
    { pattern: 'рідкокровн(?:і|их|им|ними|ого|ому|ій|а|ий|им|ім)?|рідкокров(?:ець|ця|цем|цеві|ці|ців|цям|цями|цях)?', term: 'РІДКОКРОВЕЦЬ' },
    { pattern: 'безкланов(?:і|их|им|ними|ого|ому|ій)?', term: 'БЕЗКЛАНОВІ' },
    { pattern: 'вольні(?:ми|х)?|вольн(?:і|их|им|ними|ого|ому)?', term: 'ВОЛЬНІ' },
    { pattern: 'автарк(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'АВТАРКИ (АРХАЇЧНЕ)' },
    { pattern: 'автохтон(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'АВТОХТОНИ (ЖАРГОН)' },
    { pattern: 'парія(?:ми|х|м)?|парі(?:ї|ю|єю)', term: 'ПАРІЯ' },
    { pattern: 'голод(?:у|ом|і|а)?', term: 'ГОЛОД' },
    { pattern: 'звір(?:я|ем|еві|і|ів|ам|ами|ах)?', term: 'ЗВІР' },
    { pattern: 'бестіарі(?:й|ю|єм|ї|їв)?', term: 'БЕСТІАРІЙ' },
    { pattern: 'віте', term: 'ВІТЕ (АРХАЇЧНЕ)' },
    { pattern: 'елізіум(?:у|ом|і|а|ів|ам|ами)?', term: 'ЕЛІЗІУМ' },
    { pattern: 'сховищ(?:е|а|ем|і|у|ах|ам|ами)?', term: 'СХОВИЩЕ' },
    { pattern: 'торпор(?:у|ом|і)?', term: 'ТОРПОР' },
    { pattern: 'ґолконд(?:а|и|ою|і|у)?', term: 'ҐОЛКОНДА' },
    { pattern: 'дисимуляці(?:я|ї|єю|ю|ях|ям)?', term: 'ДИСИМУЛЯЦІЯ' },
    { pattern: 'становленн(?:я|ям|і|ь)?', term: 'СТАНОВЛЕННЯ' },
    { pattern: 'узи\\s+крові', term: 'УЗИ КРОВІ' },
    { pattern: 'кровно\\s+зв\'язан(?:ий|ого|ому|им|ім|і|их|ними|а|ої|ій|у)?', term: 'КРОВНО ЗВ’ЯЗАНИЙ' },
    { pattern: 'поколінн(?:я|ям|і|ь)?', term: 'ПОКОЛІННЯ' },
    { pattern: 'клятв(?:а|и|ою|і|у|ах|ам|ами)?\\s+крові', term: 'КЛЯТВА КРОВІ (АРХАЇЧНЕ)' },
    { pattern: 'маніфест(?:у|ом|і|а|ів|ам|ами)?', term: 'МАНІФЕСТ' },
    { pattern: 'мафусаїл(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'МАФУСАЇЛ' },
    { pattern: 'допотопн(?:і|их|им|ними|ого|ому|ій)?', term: 'ДОПОТОПНІ' },
    { pattern: 'каїніт(?:и|ів|ам|ами|ах|а|ом|у|ові)?', term: 'КАЇНІТИ (АРХАЇЧНЕ)' },
    { pattern: 'фермер(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'ФЕРМЕР' },
    { pattern: 'веган(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'ВЕГАН (ГРУБЕ)' },
    { pattern: 'осирак(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'ОСИРАК (ГРУБЕ)' },
    { pattern: 'пташк(?:а|и|ою|і|у|ах|ам|ами|ів)?', term: 'ПТАШКА (ЖАРГОН)' },
    { pattern: 'п\'явк(?:а|и|ою|і|у|ах|ам|ами|ів)?', term: 'П’ЯВКА (ГРУБЕ)' },
    { pattern: 'головоріз(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'ГОЛОВОPІЗ (ЖАРГОН)' },
    { pattern: 'голуб(?:и|ів|ам|ами|ах|а|ом|у|ем)?', term: 'ГОЛУБ (ЖАРГОН)' },
    { pattern: 'козел|козл(?:а|ом|у|е|и|ів|ам|ами|ах)', term: 'КОЗЕЛ (ЖАРГОН)' },
    { pattern: 'кріп(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'КРІП (ГРУБЕ)' },
    { pattern: 'ляльк(?:а|и|ою|і|у|ах|ам|ами|ів)?', term: 'ЛЯЛЬКА (ЖАРГОН)' },
    { pattern: 'метелик(?:и|ів|ам|ами|ах|а|ом|у)?', term: 'МЕТЕЛИК (ЖАРГОН)' },
    { pattern: 'мішок\\s+соку|мішк(?:а|у|ом|і|ів|ам|ами|ах)\\s+соку', term: 'МІШОК СОКУ (ГРУБЕ)' },
    { pattern: 'вівц(?:я|і|ею|ю|ям|ями|ях)?', term: 'ВІВЦЯ (ЖАРГОН)' },
    { pattern: 'повій(?:ники|ника|нику|ником|ників|никам|никами|никах)?', term: 'ПОВІЙНИК (ЖАРГОН)' },
    { pattern: 'прохолодн(?:і|их|им|ними|ого|ому|ій)?', term: 'ПРОХОЛОДНІ (ЖАРГОН)' },
    { pattern: 'родовід(?:у|ом|і)?', term: 'РОДОВІД' },
    { pattern: 'розум(?:у|ом|і)?\\s+вулика', term: 'РОЗУМ ВУЛИКА' },
    { pattern: 'склеп(?:у|ом|і|а|ів|ам|ами|ах)?', term: 'СКЛЕП (ЖАРГОН)' },
    { pattern: 'слідчи(?:й|го|му|м|і|х|ми)?', term: 'СЛІДЧИЙ' },
    { pattern: 'суспільств(?:о|а|ом|і|у)?\\s+леопольда', term: 'СУСПІЛЬСТВО ЛЕОПОЛЬДА' },
    { pattern: 'чаш(?:а|і|ею|у|ах|ам|ами)?', term: 'ЧАША (АРХАЇЧНЕ)' },
    { pattern: 'чудовиськ(?:о|а|ом|у|ах|ам|ами)?', term: 'ЧУДОВИСЬКО' },
    { pattern: 'амарант(?:у|ом|і)?', term: 'АМАРАНТ (АРХАЇЧНЕ)' },
    { pattern: 'вигнан(?:ець|ця|цем|цеві|ці|ців|цям|цями|цях)', term: 'ВИГНАНЕЦЬ (ЖАРГОН)' },
    { pattern: 'визнан(?:ий|ого|ому|им|ім|і|их|ними|а|ої|ій|у|ня|ням|ні|ь)?', term: 'ВИЗНАННЯ' },
    { pattern: 'вискочен(?:ь|я|ем|еві|і|ів|ям|ями|ях)', term: 'ВИСКОЧЕНЬ (ЖАРГОН)' },
    { pattern: 'вільн(?:ий|ого|ому|им|ім|і|их|ними)\\s+князь|вільн(?:ого|ому|им|ім|і|их|ними)\\s+княз(?:я|ем|еві|і|ів|ям|ями|ях)', term: 'ВІЛЬНИЙ КНЯЗЬ' },
    { pattern: 'геєн(?:а|и|ою|і|у)', term: 'ГЕЄНА (АРХАЇЧНЕ)' },
    { pattern: 'гуля(?:ми|х|м)?', term: 'ГУЛЯ' },
    { pattern: 'декаданс(?:у|ом|і)?', term: 'ДЕКАДАНС (АРХАЇЧНЕ)' },
    { pattern: 'демарш(?:у|ем|і|а|ів|ам|ами|ах)?', term: 'ДЕМАРШ' },
    { pattern: 'договор(?:и|ів|ам|ами|ах|а|ом|у)?\\s+тіролю', term: 'ДОГОВОРИ ТІРОЛЮ' },
    { pattern: 'диха(?:ч|ча|чем|чеві|чі|чів|чам|чами|чах)', term: 'ДИХАЧ (ГРУБЕ)' },
    { pattern: 'журнал(?:и|ів|ам|ами|ах|а|ом|у|і)?', term: 'ЖУРНАЛ' },
    { pattern: 'згра(?:я|ї|єю|ю|ях|ям|ями)', term: 'ЗГРАЯ' }
];

// Single-pass regex builder
const COMBINED_GLOSSARY_REGEX = new RegExp(
    '(?:^|(?<=[^\\p{L}\\p{N}_]))(' +
    GLOSSARY_HIGHLIGHT_RULES.map((r, i) => `(?<g_${i}>${r.pattern})`).join('|') +
    ')(?:$|(?=[^\\p{L}\\p{N}_]))',
    'giu'
);

function replaceTermsInPlainText(text) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(COMBINED_GLOSSARY_REGEX, (match, p1, ...args) => {
        const groups = args[args.length - 1];
        if (!groups) return match;
        for (let i = 0; i < GLOSSARY_HIGHLIGHT_RULES.length; i++) {
            if (groups[`g_${i}`] !== undefined) {
                const termKey = GLOSSARY_HIGHLIGHT_RULES[i].term;
                const safeTermKey = termKey.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                return `<span class="vtm-glossary-term cursor-help text-[#8b0000] hover:text-red-700 underline decoration-dotted decoration-[#8b0000]/60 underline-offset-2 font-medium transition-colors" onmouseenter="showGlossaryTooltip(event, '${safeTermKey}')" onmouseleave="hideGlossaryTooltip(event)" onclick="event.stopPropagation(); toggleGlossaryTooltip(event, '${safeTermKey}')" data-glossary-term="${safeTermKey}">${match}</span>`;
            }
        }
        return match;
    });
}

function highlightGlossaryTerms(html) {
    if (!html || typeof html !== 'string') return html;
    const parts = html.split(/(<[^>]+>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<')) {
            parts[i] = replaceTermsInPlainText(parts[i]);
        }
    }
    return parts.join('');
}
window.highlightGlossaryTerms = highlightGlossaryTerms;

async function loadGlossaryData() {
    if (vtmGlossaryData && vtmGlossaryData.length > 0) return vtmGlossaryData;
    try {
        const res = await fetch('data/vtm_glossary.json');
        if (res.ok) {
            vtmGlossaryData = await res.json();
        }
    } catch (e) {
        console.error('Помилка завантаження словника:', e);
    }
    return vtmGlossaryData;
}

function findTermInGlossary(termKey) {
    if (!termKey || !vtmGlossaryData || vtmGlossaryData.length === 0) return null;
    const cleanKey = termKey.trim().toLowerCase();
    
    // 1. Exact match
    let found = vtmGlossaryData.find(item => item.term && item.term.toLowerCase() === cleanKey);
    if (found) return found;
    
    // 2. Starts with / includes
    found = vtmGlossaryData.find(item => item.term && (item.term.toLowerCase().startsWith(cleanKey) || cleanKey.startsWith(item.term.toLowerCase())));
    if (found) return found;
    
    // 3. Base key without brackets (e.g. "СІР" matches "СIP")
    const baseKey = cleanKey.replace(/\s*\(.*?\)/g, '').trim();
    found = vtmGlossaryData.find(item => {
        if (!item.term) return false;
        const itemBase = item.term.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
        return itemBase === baseKey;
    });
    return found;
}

// ==================== GLOSSARY FLOATING TOOLTIP (ДОВІДКА) ====================
let glossaryTooltipTimer = null;
let isGlossaryTooltipPinned = false;
let currentGlossaryTarget = null;

function ensureGlossaryTooltipElement() {
    let tooltip = document.getElementById('glossary-popover-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'glossary-popover-tooltip';
        tooltip.className = 'fixed z-[9999] max-w-xs sm:max-w-sm w-72 sm:w-80 p-3.5 bg-gray-900 text-white text-xs leading-relaxed rounded-lg shadow-2xl border border-gray-700/90 pointer-events-auto transition-all duration-150 opacity-0 scale-95 hidden select-text';
        tooltip.innerHTML = `
            <div class="flex items-start justify-between gap-2 mb-1.5 border-b border-gray-800 pb-1.5">
                <span id="glossary-popover-term" class="font-serif font-bold text-red-400 uppercase tracking-wider text-xs"></span>
                <button type="button" onclick="hideGlossaryTooltip(null, true)" class="text-gray-400 hover:text-white p-0.5 rounded transition-colors text-xs leading-none" title="Закрити">✕</button>
            </div>
            <div id="glossary-popover-def" class="text-xs text-zinc-200 leading-relaxed text-justify max-h-48 overflow-y-auto custom-scrollbar pr-1"></div>
            <div class="mt-2.5 pt-1.5 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
                <span class="italic text-gray-400 flex items-center gap-1">
                    <svg class="w-3 h-3 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25c-1.354 3.125-6 8.5-6 13.5a6 6 0 0012 0c0-5-4.646-10.375-6-13.5z"/></svg>
                    <span>Словник VTM</span>
                </span>
                <button type="button" id="glossary-popover-open-modal" class="text-red-400 hover:text-red-300 font-medium underline underline-offset-2 flex items-center gap-1">
                    <span>Увесь словник</span>
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>
            </div>
            <div id="glossary-popover-arrow" class="absolute w-2.5 h-2.5 bg-gray-900 rotate-45 pointer-events-none"></div>
        `;
        document.body.appendChild(tooltip);

        tooltip.addEventListener('mouseenter', () => {
            if (glossaryTooltipTimer) {
                clearTimeout(glossaryTooltipTimer);
                glossaryTooltipTimer = null;
            }
        });
        tooltip.addEventListener('mouseleave', () => {
            if (!isGlossaryTooltipPinned) {
                hideGlossaryTooltip();
            }
        });
        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    return tooltip;
}

window.showGlossaryTooltip = function(event, termKey, isClick = false) {
    if (glossaryTooltipTimer) {
        clearTimeout(glossaryTooltipTimer);
        glossaryTooltipTimer = null;
    }
    
    const targetEl = event ? (event.currentTarget || event.target) : null;
    if (!targetEl) return;
    
    if (isClick && isGlossaryTooltipPinned && currentGlossaryTarget === targetEl) {
        hideGlossaryTooltip(null, true);
        return;
    }
    
    if (isClick) {
        isGlossaryTooltipPinned = true;
    }
    currentGlossaryTarget = targetEl;

    const tooltip = ensureGlossaryTooltipElement();
    
    const renderContent = () => {
        const termItem = findTermInGlossary(termKey);
        const termTitle = termItem ? termItem.term : termKey;
        const termDef = termItem ? termItem.definition : 'Завантаження визначення...';

        const termEl = document.getElementById('glossary-popover-term');
        const defEl = document.getElementById('glossary-popover-def');
        const openBtn = document.getElementById('glossary-popover-open-modal');
        const arrowEl = document.getElementById('glossary-popover-arrow');

        if (termEl) termEl.innerText = termTitle;
        if (defEl) defEl.innerText = termDef;
        if (openBtn) {
            openBtn.onclick = (e) => {
                e.stopPropagation();
                hideGlossaryTooltip(null, true);
                openGlossaryModalWithTerm(termTitle);
            };
        }

        tooltip.classList.remove('hidden');
        tooltip.style.display = 'block';

        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        let top = 0;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let isAbove = true;

        if (rect.top >= tooltipRect.height + 14) {
            top = rect.top - tooltipRect.height - 8;
            isAbove = true;
            tooltip.classList.remove('placed-below');
        } else {
            top = rect.bottom + 8;
            isAbove = false;
            tooltip.classList.add('placed-below');
        }

        const margin = 10;
        if (left < margin) left = margin;
        if (left + tooltipRect.width > viewportWidth - margin) {
            left = viewportWidth - tooltipRect.width - margin;
        }

        tooltip.style.top = `${Math.round(top)}px`;
        tooltip.style.left = `${Math.round(left)}px`;

        if (arrowEl) {
            const arrowLeft = Math.max(12, Math.min(tooltipRect.width - 16, (rect.left + rect.width / 2) - left - 5));
            arrowEl.style.left = `${Math.round(arrowLeft)}px`;
            if (isAbove) {
                arrowEl.style.top = 'auto';
                arrowEl.style.bottom = '-5px';
                arrowEl.style.borderTop = 'none';
                arrowEl.style.borderLeft = 'none';
                arrowEl.style.borderRight = '1px solid rgba(55, 65, 81, 0.9)';
                arrowEl.style.borderBottom = '1px solid rgba(55, 65, 81, 0.9)';
            } else {
                arrowEl.style.bottom = 'auto';
                arrowEl.style.top = '-5px';
                arrowEl.style.borderRight = 'none';
                arrowEl.style.borderBottom = 'none';
                arrowEl.style.borderTop = '1px solid rgba(55, 65, 81, 0.9)';
                arrowEl.style.borderLeft = '1px solid rgba(55, 65, 81, 0.9)';
            }
        }

        requestAnimationFrame(() => {
            tooltip.classList.remove('opacity-0', 'scale-95');
            tooltip.classList.add('opacity-100', 'scale-100');
        });
    };

    if (!vtmGlossaryData || vtmGlossaryData.length === 0) {
        loadGlossaryData().then(renderContent);
    } else {
        renderContent();
    }
};

window.toggleGlossaryTooltip = function(event, termKey) {
    window.showGlossaryTooltip(event, termKey, true);
};

window.hideGlossaryTooltip = function(event, immediate = false) {
    if (glossaryTooltipTimer) {
        clearTimeout(glossaryTooltipTimer);
        glossaryTooltipTimer = null;
    }
    
    const tooltip = document.getElementById('glossary-popover-tooltip');
    if (!tooltip) return;

    const performHide = () => {
        tooltip.classList.remove('opacity-100', 'scale-100');
        tooltip.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            if (tooltip && tooltip.classList.contains('opacity-0')) {
                tooltip.style.display = 'none';
                tooltip.classList.add('hidden');
            }
        }, 150);
        isGlossaryTooltipPinned = false;
        currentGlossaryTarget = null;
    };

    if (immediate) {
        performHide();
    } else {
        glossaryTooltipTimer = setTimeout(performHide, 220);
    }
};

// Global click & esc listener for tooltip
document.addEventListener('click', function(e) {
    const tooltip = document.getElementById('glossary-popover-tooltip');
    if (tooltip && !tooltip.classList.contains('hidden') && !tooltip.contains(e.target) && !e.target.closest('.vtm-glossary-term')) {
        hideGlossaryTooltip(null, true);
    }
});

window.openGlossaryModal = async function() {
    hideGlossaryTooltip(null, true);
    const modal = document.getElementById('glossary-modal');
    if (!modal) return;
    
    await loadGlossaryData();
    
    const searchInput = document.getElementById('glossary-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    const clearBtn = document.getElementById('glossary-search-clear');
    if (clearBtn) {
        clearBtn.classList.add('hidden');
    }
    
    renderGlossaryList(vtmGlossaryData);
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (searchInput) {
        setTimeout(() => searchInput.focus(), 80);
    }
};

window.openGlossaryModalWithTerm = async function(termKey) {
    hideGlossaryTooltip(null, true);
    const modal = document.getElementById('glossary-modal');
    if (!modal) return;
    
    await loadGlossaryData();
    
    const searchInput = document.getElementById('glossary-search-input');
    const clearBtn = document.getElementById('glossary-search-clear');
    
    const found = findTermInGlossary(termKey);
    const targetTermName = found ? found.term : termKey;
    
    if (searchInput) {
        searchInput.value = targetTermName;
    }
    
    if (clearBtn) {
        clearBtn.classList.remove('hidden');
    }
    
    // Filter and place matched item at top
    let filtered = vtmGlossaryData.filter(item => {
        return (item.term && item.term.toLowerCase() === targetTermName.toLowerCase()) || 
               (item.term && item.term.toLowerCase().includes(termKey.toLowerCase())) || 
               (item.definition && item.definition.toLowerCase().includes(termKey.toLowerCase()));
    });
    
    if (filtered.length === 0) {
        filtered = vtmGlossaryData;
    } else {
        // Sort exact match first
        filtered.sort((a, b) => {
            if (a.term.toLowerCase() === targetTermName.toLowerCase()) return -1;
            if (b.term.toLowerCase() === targetTermName.toLowerCase()) return 1;
            return 0;
        });
    }
    
    renderGlossaryList(filtered, targetTermName);
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    setTimeout(() => {
        const focusedEl = document.getElementById('glossary-focused-card');
        if (focusedEl) {
            focusedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 120);
};

window.closeGlossaryModal = function() {
    const modal = document.getElementById('glossary-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

function renderGlossaryList(items, focusedTerm = null) {
    const content = document.getElementById('glossary-modal-content');
    const countNum = document.getElementById('glossary-count-num');
    if (!content) return;
    
    if (countNum) {
        countNum.innerText = items ? items.length : 0;
    }
    
    if (!items || items.length === 0) {
        content.innerHTML = `
            <div class="py-12 text-center text-zinc-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm font-semibold">Термінів не знайдено</p>
                <p class="text-xs text-zinc-600 mt-1">Спробуйте змінити пошуковий запит</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">';
    items.forEach(item => {
        const isFocused = focusedTerm && (item.term.toLowerCase() === focusedTerm.toLowerCase());
        const cardId = isFocused ? 'id="glossary-focused-card"' : '';
        const focusedClasses = isFocused 
            ? 'border-red-500/90 bg-gradient-to-br from-zinc-900 via-red-950/30 to-zinc-900 ring-2 ring-red-500/60 shadow-xl shadow-red-950/60' 
            : 'border-zinc-800/80 bg-zinc-900/80 hover:border-red-900/60 hover:bg-zinc-900/95';
        
        html += `
            <div ${cardId} class="${focusedClasses} p-4 rounded-xl border transition-all flex flex-col justify-start shadow-xs group">
                <div class="flex items-start justify-between gap-2">
                    <h4 class="text-sm sm:text-base font-bold text-red-500 font-serif tracking-wide uppercase group-hover:text-red-400 transition-colors">${item.term}</h4>
                    ${isFocused ? '<span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/50 rounded shrink-0">Обраний</span>' : ''}
                </div>
                <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-2">${item.definition}</p>
            </div>
        `;
    });
    html += '</div>';
    content.innerHTML = html;
}

window.filterGlossary = function() {
    const searchInput = document.getElementById('glossary-search-input');
    const clearBtn = document.getElementById('glossary-search-clear');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    if (clearBtn) {
        if (query.length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    
    if (!query) {
        renderGlossaryList(vtmGlossaryData);
        return;
    }
    
    const filtered = vtmGlossaryData.filter(item => {
        return (item.term && item.term.toLowerCase().includes(query)) ||
               (item.definition && item.definition.toLowerCase().includes(query));
    });
    
    renderGlossaryList(filtered);
};

window.clearGlossarySearch = function() {
    const searchInput = document.getElementById('glossary-search-input');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    filterGlossary();
};

// Also close on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideGlossaryTooltip(null, true);
        const glossaryModal = document.getElementById('glossary-modal');
        if (glossaryModal && !glossaryModal.classList.contains('hidden')) {
            closeGlossaryModal();
        }
    }
});
