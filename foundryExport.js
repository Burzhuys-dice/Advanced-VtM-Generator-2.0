/**
 * Foundry VTT (World of Darkness 5e / wod5e) Export Module
 * Перетворює дані створеного персонажа VTM 5e у сумісний JSON-файл для імпорту в Foundry VTT (система wod5e).
 */

(function(global) {
    'use strict';

    // Генератор унікальних 16-значних ID для Foundry VTT
    function generateFoundryId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Мапування дисциплін генератора на системні ключі Foundry VTT (wod5e)
    const DISC_KEY_MAP = {
        'thin_blood_alchemy': 'alchemy',
        'alchemy': 'alchemy',
        'animalism': 'animalism',
        'auspex': 'auspex',
        'blood_sorcery': 'blood_sorcery',
        'celerity': 'celerity',
        'dominate': 'dominate',
        'fortitude': 'fortitude',
        'obfuscate': 'obfuscate',
        'oblivion': 'oblivion',
        'potence': 'potence',
        'presence': 'presence',
        'protean': 'protean',
        'blood_sorcery_rituals': 'rituals',
        'rituals': 'rituals',
        'oblivion_ceremonies': 'ceremonies',
        'ceremonies': 'ceremonies'
    };

    // Всі 27 базових навичок VTM 5e
    const ALL_VTM_SKILLS = [
        'athletics', 'brawl', 'craft', 'drive', 'firearms', 'larceny', 'melee', 'stealth', 'survival',
        'animalken', 'etiquette', 'insight', 'intimidation', 'leadership', 'performance', 'persuasion', 'streetwise', 'subterfuge',
        'academics', 'awareness', 'finance', 'investigation', 'medicine', 'occult', 'politics', 'science', 'technology'
    ];

    // Мапування іконок дисциплін
    const DISC_DEFAULT_ICONS = {
        'alchemy': 'data/Disciplines/Alchemy_symbol.png',
        'animalism': 'data/Disciplines/Animalism_symbol.png',
        'auspex': 'data/Disciplines/Auspex_symbol.png',
        'blood_sorcery': 'data/Disciplines/Blood_Sorcery_symbol.png',
        'celerity': 'data/Disciplines/Celerity_symbol.png',
        'dominate': 'data/Disciplines/Dominate_symbol.png',
        'fortitude': 'data/Disciplines/Fortitude_symbol.png',
        'obfuscate': 'data/Disciplines/Obfuscate_symbol.png',
        'oblivion': 'data/Disciplines/Oblivion_symbol.png',
        'potence': 'data/Disciplines/Potence_symbol.png',
        'presence': 'data/Disciplines/Presence_symbol.png',
        'protean': 'data/Disciplines/Protean_symbol.png',
        'rituals': 'data/Disciplines/Blood_Sorcery_symbol.png',
        'ceremonies': 'data/Disciplines/Oblivion_symbol.png'
    };

    /**
     * Безпечне отримання значень полів з DOM
     */
    function getInputValue(id, fallback = '') {
        const el = document.getElementById(id);
        return el ? (el.value || '').trim() : fallback;
    }

    /**
     * Очищення та форматування HTML-тексту
     */
    function formatHtmlParagraphs(text) {
        if (!text || !text.trim()) return '';
        const lines = text.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
        return lines.map(l => `<p>${l}</p>`).join('');
    }

    /**
     * Парсинг вартості Збурення (Rouse check cost)
     */
    function parseRouseCost(rouseStr) {
        if (!rouseStr) return null;
        const str = String(rouseStr).toLowerCase();
        if (str.includes('дві') || str.includes('2') || str.includes('two')) return 2;
        if (str.includes('одна') || str.includes('1') || str.includes('one') || str.includes('збурення')) return 1;
        if (str.includes('немає') || str.includes('безкоштовно') || str.includes('free') || str.includes('0')) return null;
        return null;
    }

    /**
     * Головна функція генерації об'єкта Foundry VTT Actor (vampire / wod5e)
     */
    function generateFoundryActor() {
        const actorId = generateFoundryId();
        const now = Date.now();

        // 1. Базова інформація
        const charName = getInputValue('character-name', 'Безіменний Кревний');
        const conceptPhrase = getInputValue('concept-phrase', '');
        const historyText = getInputValue('concept-bg', '');

        // 2. Переконання та Опори
        const conv1 = getInputValue('conviction1', '');
        const touch1 = getInputValue('touchstone1', '');
        const conv2 = getInputValue('conviction2', '');
        const touch2 = getInputValue('touchstone2', '');

        let touchstonesHtml = '';
        if (conv1 || touch1) {
            touchstonesHtml += `<p><strong>Переконання 1:</strong> ${conv1 || '—'}<br><strong>Опора 1:</strong> ${touch1 || '—'}</p>`;
        }
        if (conv2 || touch2) {
            touchstonesHtml += `<p><strong>Переконання 2:</strong> ${conv2 || '—'}<br><strong>Опора 2:</strong> ${touch2 || '—'}</p>`;
        }

        // 3. Клан
        const clanKey = state.clan || 'unknown';
        const clanInfo = (typeof clansData !== 'undefined' && clansData[clanKey]) ? clansData[clanKey] : {};
        const clanName = clanInfo.name || 'Невідомо';
        const clanBane = clanInfo.clan_bane || '';
        const clanCompulsion = clanInfo.clan_compultion || '';
        const clanDesc = clanInfo.desc || '';

        const isThinBlood = (typeof isClanThinBlood === 'function') 
            ? isClanThinBlood() 
            : (clanKey === 'thin-blood' || clanKey === 'thin_blood' || clanName.toLowerCase().includes('рідкокров'));

        // 4. Тип хижака
        const predator = (state.selectedPredator && state.predatorData) 
            ? state.predatorData.find(p => p.id === state.selectedPredator) 
            : null;
        const predatorName = predator ? predator.name : '';
        const predatorDesc = predator ? (predator.description || '') : '';
        const predatorAdvText = predator ? (predator.advantages_text || '') : '';

        // 5. Характеристики (Attributes)
        const attrValues = {
            strength: (state.attributes && state.attributes.strength) || 1,
            dexterity: (state.attributes && state.attributes.dexterity) || 1,
            stamina: (state.attributes && state.attributes.stamina) || 1,
            charisma: (state.attributes && state.attributes.charisma) || 1,
            manipulation: (state.attributes && state.attributes.manipulation) || 1,
            composure: (state.attributes && state.attributes.composure) || 1,
            intelligence: (state.attributes && state.attributes.intelligence) || 1,
            wits: (state.attributes && state.attributes.wits) || 1,
            resolve: (state.attributes && state.attributes.resolve) || 1
        };

        const foundryAttributes = {};
        for (const [key, val] of Object.entries(attrValues)) {
            foundryAttributes[key] = {
                value: Number(val) || 1,
                active: false
            };
        }

        // 6. Розрахунок Здоров'я, Сили Волі, Людяності
        const healthMax = attrValues.stamina + 3;
        const willpowerMax = attrValues.resolve + attrValues.composure;

        let currentHumanity = 7;
        if (predator && predator.humanity_modifier) {
            currentHumanity += Number(predator.humanity_modifier);
        }

        // 7. Навички та Спеціалізації (Skills)
        const foundrySkills = {};
        ALL_VTM_SKILLS.forEach(skillKey => {
            let totalDots = 0;
            let displaySpec = '';

            if (typeof getDynamicSkillData === 'function') {
                const dyn = getDynamicSkillData(skillKey);
                totalDots = (dyn.baseDots || 0) + (dyn.bonus || 0) + (dyn.freeSpecDot || 0);
                displaySpec = dyn.displaySpec || '';
            } else {
                let base = (state.skills && (state.skills[skillKey] !== undefined ? state.skills[skillKey] : (state.skills[skillKey === 'animalken' ? 'animalKen' : skillKey] || 0))) || 0;
                let isPred = (state.predatorChoices && state.predatorChoices.skill === skillKey);
                let bonus = (isPred && base === 0) ? 1 : 0;

                let specs = [];
                if (isPred && state.predatorChoices.specName) specs.push(state.predatorChoices.specName);
                let fixedEl = document.getElementById('spec-' + skillKey);
                if (fixedEl && fixedEl.value && fixedEl.value.trim()) specs.push(fixedEl.value.trim());
                let customSkill = document.getElementById('spec-custom-skill')?.value;
                let customName = document.getElementById('spec-custom-name')?.value;
                if (customSkill === skillKey && customName && customName.trim()) specs.push(customName.trim());
                if (state.skillSpecs && state.skillSpecs[skillKey]) specs.push(state.skillSpecs[skillKey]);

                displaySpec = [...new Set(specs)].join(', ');
                let freeSpec = (base === 0 && bonus === 0 && displaySpec) ? 1 : 0;
                totalDots = base + bonus + freeSpec;
            }

            const bonuses = [];
            if (displaySpec && displaySpec.trim()) {
                const specList = displaySpec.split(',').map(s => s.trim()).filter(Boolean);
                specList.forEach(spec => {
                    bonuses.push({
                        source: `Спеціалізація: ${spec}`,
                        value: 1,
                        paths: [`skills.${skillKey}`],
                        displayWhenInactive: true
                    });
                });
            }

            foundrySkills[skillKey] = {
                value: totalDots,
                active: false,
                description: "",
                macroid: "",
                bonuses: bonuses
            };
        });

        // 8. Дисципліни (Disciplines)
        const allFoundryDiscKeys = [
            'alchemy', 'animalism', 'auspex', 'blood_sorcery', 'celerity',
            'dominate', 'fortitude', 'obfuscate', 'oblivion', 'potence',
            'presence', 'protean', 'rituals', 'ceremonies'
        ];

        const foundryDisciplines = {};
        allFoundryDiscKeys.forEach(k => {
            foundryDisciplines[k] = {
                value: 0,
                selected: false,
                visible: false
            };
        });

        // Визначаємо доступні та активні дисципліни
        let availableDisc = [...(clanInfo.disciplines || [])];
        if (state.predatorChoices && state.predatorChoices.discipline && !availableDisc.includes(state.predatorChoices.discipline)) {
            availableDisc.push(state.predatorChoices.discipline);
        }
        if (state.manualDisciplines && Array.isArray(state.manualDisciplines)) {
            state.manualDisciplines.forEach(d => {
                if (!availableDisc.includes(d)) availableDisc.push(d);
            });
        }

        let bsTotalDots = ((state.disciplines && state.disciplines['blood_sorcery']) || 0) + (state.predatorChoices && state.predatorChoices.discipline === 'blood_sorcery' ? 1 : 0);
        if (bsTotalDots > 0 && !availableDisc.includes('blood_sorcery_rituals')) {
            availableDisc.push('blood_sorcery_rituals');
        }

        let obTotalDots = ((state.disciplines && state.disciplines['oblivion']) || 0) + (state.predatorChoices && state.predatorChoices.discipline === 'oblivion' ? 1 : 0);
        if (obTotalDots > 0 && !availableDisc.includes('oblivion_ceremonies')) {
            availableDisc.push('oblivion_ceremonies');
        }

        let firstActiveDiscipline = '';

        availableDisc.forEach(discKey => {
            let baseDots = (state.disciplines && state.disciplines[discKey]) || 0;
            let bonus = (discKey !== 'blood_sorcery_rituals' && discKey !== 'oblivion_ceremonies' && state.predatorChoices && state.predatorChoices.discipline === discKey) ? 1 : 0;
            let total = (discKey === 'blood_sorcery_rituals') ? bsTotalDots : ((discKey === 'oblivion_ceremonies') ? obTotalDots : (baseDots + bonus));

            const fKey = DISC_KEY_MAP[discKey] || discKey;
            if (foundryDisciplines[fKey]) {
                foundryDisciplines[fKey].value = total;
                foundryDisciplines[fKey].visible = total > 0;
                if (total > 0 && !firstActiveDiscipline) {
                    firstActiveDiscipline = fKey;
                    foundryDisciplines[fKey].selected = true;
                }
            }
        });

        // 9. Items: Клан, Тип Хижака, Блага/Вади/Надбання, Здібності Дисциплін
        const items = [];

        // 9.1 Item: Клан
        const clanItemId = generateFoundryId();
        items.push({
            name: clanName,
            type: "clan",
            system: {
                description: formatHtmlParagraphs(clanDesc),
                macroid: "",
                bonuses: [],
                dataItemId: `clan-${clanKey}`,
                source: {
                    book: "Vampire: The Masquerade 5th Edition",
                    page: ""
                },
                bane: formatHtmlParagraphs(clanBane ? `<strong>Кланове прокляття:</strong> ${clanBane}` : '') + 
                      formatHtmlParagraphs(clanCompulsion ? `<strong>Клановий примус:</strong> ${clanCompulsion}` : '')
            },
            flags: {
                wod5e: {
                    dataItemId: `clan-${clanKey}`
                }
            },
            _id: clanItemId,
            img: (typeof clanImages !== 'undefined' && clanImages[clanKey]) 
                ? `Clan_symbols/${clanImages[clanKey]}` 
                : "systems/wod5e/assets/icons/items/item-default.svg",
            effects: [],
            folder: null,
            sort: 0,
            _stats: {
                compendiumSource: null,
                duplicateSource: null,
                exportSource: null,
                coreVersion: "13.351",
                systemId: "wod5e",
                systemVersion: "5.3.14",
                createdTime: now,
                modifiedTime: now,
                lastModifiedBy: actorId
            },
            ownership: { default: 0 }
        });

        // 9.2 Item: Тип хижака
        if (predator) {
            const predItemId = generateFoundryId();
            items.push({
                name: predatorName,
                type: "predatorType",
                img: "systems/wod5e/assets/icons/items/discipline.png",
                system: {
                    description: formatHtmlParagraphs(predatorDesc) + 
                                 (predatorAdvText ? `<p><strong>Бонуси хижака:</strong> ${predatorAdvText}</p>` : ''),
                    bonuses: [],
                    macroid: "",
                    dataItemId: `predator-${predator.id}`,
                    source: {
                        book: "Vampire: The Masquerade 5th Edition",
                        page: ""
                    },
                    dicepool: {}
                },
                effects: [],
                flags: {
                    wod5e: {
                        dataItemId: `predator-${predator.id}`
                    }
                },
                _id: predItemId,
                sort: 0,
                ownership: { default: 0 }
            });
        }

        // 9.3 Items: Блага, Вади та Надбання (Advantages, Flaws, Backgrounds)
        if (state.selectedAdvantages && Array.isArray(state.selectedAdvantages)) {
            state.selectedAdvantages.forEach(sel => {
                const advFull = (state.advantagesData && Array.isArray(state.advantagesData))
                    ? state.advantagesData.find(a => String(a.id) === String(sel.id))
                    : null;

                const advDesc = advFull ? (advFull.desc || advFull.description || '') : '';
                const advCategory = sel.category || (advFull ? advFull.category : '');
                
                let featureType = 'merit';
                if (sel.type === 'flaw') featureType = 'flaw';
                else if (sel.type === 'background' || (advCategory && advCategory.toLowerCase().includes('надбання'))) featureType = 'background';

                const advItemId = generateFoundryId();
                items.push({
                    name: sel.name,
                    type: "feature",
                    img: (advCategory === 'Рідкокровні') 
                        ? "modules/vampire-the-masquerade-5e-compendium/packs/assets/SymbolThinBloodsV5.webp" 
                        : "systems/wod5e/assets/icons/items/discipline.png",
                    system: {
                        description: formatHtmlParagraphs(advDesc) + 
                                     (advCategory ? `<p><em>Категорія: ${advCategory}</em></p>` : ''),
                        bonuses: [],
                        uses: {
                            max: 0,
                            current: 0,
                            enabled: false
                        },
                        featuretype: featureType,
                        points: Number(sel.cost) || 1,
                        macroid: "",
                        dataItemId: `adv-${sel.id}`,
                        source: {
                            book: "Vampire: The Masquerade 5th Edition",
                            page: ""
                        }
                    },
                    effects: [],
                    flags: {},
                    _id: advItemId,
                    sort: 0,
                    ownership: { default: 0 }
                });
            });
        }

        // 9.4 Items: Здібності Дисциплін (Discipline Powers)
        let firstPowerId = '';

        availableDisc.forEach(discKey => {
            let baseDots = (state.disciplines && state.disciplines[discKey]) || 0;
            let bonus = (discKey !== 'blood_sorcery_rituals' && discKey !== 'oblivion_ceremonies' && state.predatorChoices && state.predatorChoices.discipline === discKey) ? 1 : 0;
            let total = (discKey === 'blood_sorcery_rituals') ? bsTotalDots : ((discKey === 'oblivion_ceremonies') ? obTotalDots : (baseDots + bonus));

            if (total > 0) {
                const fKey = DISC_KEY_MAP[discKey] || discKey;

                for (let dotLevel = 1; dotLevel <= total; dotLevel++) {
                    const powerId = state.disciplinePowers && state.disciplinePowers[discKey] && state.disciplinePowers[discKey][dotLevel];
                    if (!powerId) continue;

                    let powerInfo = null;
                    if (typeof disciplinesPowersMap !== 'undefined' && disciplinesPowersMap[discKey]) {
                        powerInfo = disciplinesPowersMap[discKey].find(p => p.id === powerId);
                    }

                    const powerName = powerInfo ? powerInfo.name : powerId;
                    const powerDesc = powerInfo ? powerInfo.desc : '';
                    const powerReq = powerInfo ? powerInfo.requirement : '';
                    const powerRouse = powerInfo ? powerInfo.rouseCost : '';
                    const powerDice = powerInfo ? powerInfo.dicePool : '';
                    const powerResist = powerInfo ? powerInfo.resistance : '';

                    let descHtml = formatHtmlParagraphs(powerDesc);
                    if (powerReq && String(powerReq).trim().toLowerCase() !== 'немає') {
                        descHtml += `<p>■ <strong>Вимога:</strong> ${powerReq}</p>`;
                    }
                    if (powerRouse && String(powerRouse).trim().toLowerCase() !== 'немає') {
                        descHtml += `<p>■ <strong>Вартість активації:</strong> ${powerRouse}</p>`;
                    }
                    if (powerDice && String(powerDice).trim().toLowerCase() !== 'немає') {
                        descHtml += `<p>■ <strong>Пул кісток:</strong> ${powerDice}</p>`;
                    }
                    if (powerResist && String(powerResist).trim().toLowerCase() !== 'немає') {
                        descHtml += `<p>■ <strong>Опір:</strong> ${powerResist}</p>`;
                    }

                    const powerItemId = generateFoundryId();
                    if (!firstPowerId) firstPowerId = powerItemId;

                    const powerIcon = DISC_DEFAULT_ICONS[fKey] || "systems/wod5e/assets/icons/items/discipline.png";

                    items.push({
                        name: powerName,
                        type: "power",
                        img: powerIcon,
                        system: {
                            description: descHtml,
                            bonuses: [],
                            discipline: fKey,
                            level: Number(powerInfo ? powerInfo.level : dotLevel) || dotLevel,
                            dicepool: {},
                            cost: parseRouseCost(powerRouse),
                            macroid: "",
                            dataItemId: `power-${powerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                            source: {
                                book: "Vampire: The Masquerade 5th Edition",
                                page: ""
                            },
                            selected: true
                        },
                        effects: [],
                        flags: {},
                        _id: powerItemId,
                        sort: 0,
                        ownership: { default: 0 }
                    });
                }
            }
        });

        // 10. Побудова фінального документа Foundry Actor (Vampire)
        const actor = {
            name: charName,
            type: "vampire",
            img: (typeof clanImages !== 'undefined' && clanImages[clanKey]) 
                ? `Clan_symbols/${clanImages[clanKey]}` 
                : "systems/wod5e/assets/icons/actors/vampire.webp",
            system: {
                locked: false,
                group: "",
                hasSkillAttributeData: true,
                bio: {
                    age: {
                        trueage: "",
                        apparent: ""
                    },
                    dateof: {
                        birth: "",
                        death: ""
                    },
                    history: formatHtmlParagraphs(historyText)
                },
                headers: {
                    concept: conceptPhrase,
                    chronicle: "Київські Ночі (Kyiv by Night)",
                    ambition: "",
                    desire: "",
                    touchstones: touchstonesHtml,
                    tenets: "",
                    sire: "",
                    generation: isThinBlood ? "14/15" : "12/13",
                    domitor: "",
                    creedfields: "",
                    cellname: ""
                },
                experiences: [],
                exp: {
                    value: 0,
                    max: 0
                },
                derivedXP: {
                    totalXP: 0,
                    remainingXP: 0
                },
                health: {
                    aggravated: 0,
                    superficial: 0,
                    max: healthMax,
                    value: healthMax
                },
                willpower: {
                    aggravated: 0,
                    superficial: 0,
                    max: willpowerMax,
                    value: willpowerMax
                },
                attributes: foundryAttributes,
                skills: foundrySkills,
                settings: {
                    headerbg: "",
                    background: "",
                    limited: {
                        biography: true,
                        appearance: true,
                        touchstones: false,
                        tenets: false
                    },
                    skillAttributeInputs: false,
                    enableGifts: false,
                    enableDisciplines: false,
                    enableEdges: false,
                    generalDifficultyEnabled: true
                },
                description: "",
                notes: "",
                privatenotes: (conv1 || conv2) ? `<p><strong>Переконання та Опори:</strong></p>${touchstonesHtml}` : "",
                biography: "",
                appearance: "",
                equipment: "",
                bonuses: {},
                hunger: {
                    value: 1,
                    max: 5
                },
                humanity: {
                    value: currentHumanity,
                    stains: 0
                },
                blood: {
                    potency: isThinBlood ? 0 : 1,
                    generation: isThinBlood ? "14/15" : "12/13"
                },
                selectedDiscipline: firstActiveDiscipline || "animalism",
                selectedDisciplinePower: firstPowerId,
                disciplines: foundryDisciplines,
                crinosHealth: {
                    aggravated: 0,
                    superficial: 0,
                    max: 4,
                    value: 4
                },
                balance: {
                    hauglosk: { value: 1 },
                    harano: { value: 1 }
                },
                rage: {
                    value: 1,
                    max: 5
                },
                talismans: [],
                frenzyActive: false,
                lostTheWolf: false,
                activeForm: "homid",
                renown: {
                    glory: { value: 1 },
                    honor: { value: 1 },
                    wisdom: { value: 1 }
                },
                forms: {
                    homid: { description: "", token: { img: "" } },
                    glabro: { description: "", token: { img: "" } },
                    crinos: { description: "", token: { img: "" } },
                    hispo: { description: "", token: { img: "" } },
                    lupus: { description: "", token: { img: "" } }
                },
                selectedGift: "",
                selectedGiftPower: "",
                gifts: {},
                despair: { value: 0 },
                desperation: { value: 0 },
                danger: { value: 0, max: 0 },
                selectedEdge: "",
                selectedEdgePerk: "",
                edges: {}
            },
            prototypeToken: {
                name: charName,
                displayName: 0,
                actorLink: true,
                width: 1,
                height: 1,
                texture: {
                    src: (typeof clanImages !== 'undefined' && clanImages[clanKey]) 
                        ? `Clan_symbols/${clanImages[clanKey]}` 
                        : "systems/wod5e/assets/icons/actors/vampire.webp",
                    anchorX: 0.5,
                    anchorY: 0.5,
                    offsetX: 0,
                    offsetY: 0,
                    fit: "contain",
                    scaleX: 1,
                    scaleY: 1,
                    rotation: 0,
                    tint: "#ffffff",
                    alphaThreshold: 0.75
                },
                lockRotation: false,
                rotation: 0,
                alpha: 1,
                disposition: -1,
                displayBars: 0,
                bar1: { attribute: "health" },
                bar2: { attribute: "willpower" },
                light: {
                    negative: false,
                    priority: 0,
                    alpha: 0.5,
                    angle: 360,
                    bright: 0,
                    color: null,
                    coloration: 1,
                    dim: 0,
                    attenuation: 0.5,
                    luminosity: 0.5,
                    saturation: 0,
                    contrast: 0,
                    shadows: 0,
                    animation: {
                        type: null,
                        speed: 5,
                        intensity: 5,
                        reverse: false
                    },
                    darkness: { min: 0, max: 1 }
                },
                sight: {
                    enabled: false,
                    range: 0,
                    angle: 360,
                    visionMode: "basic",
                    color: null,
                    attenuation: 0.1,
                    brightness: 0,
                    saturation: 0,
                    contrast: 0
                },
                detectionModes: [],
                occludable: { radius: 0 },
                ring: {
                    enabled: false,
                    colors: { ring: null, background: null },
                    effects: 1,
                    subject: { scale: 1, texture: null }
                },
                turnMarker: {
                    mode: 1,
                    animation: null,
                    src: null,
                    disposition: false
                },
                movementAction: null,
                flags: {},
                randomImg: false,
                appendNumber: false,
                prependAdjective: false
            },
            items: items,
            effects: [],
            folder: null,
            flags: {
                wod5e: {
                    manualDefaultOwnership: true
                }
            },
            _stats: {
                compendiumSource: null,
                duplicateSource: null,
                exportSource: {
                    worldId: "kyiv-by-night",
                    uuid: `Actor.${actorId}`,
                    coreVersion: "13.351",
                    systemId: "wod5e",
                    systemVersion: "5.3.14"
                },
                coreVersion: "13.351",
                systemId: "wod5e",
                systemVersion: "5.3.14",
                createdTime: now,
                modifiedTime: now,
                lastModifiedBy: actorId
            },
            ownership: {
                default: 0
            }
        };

        return actor;
    }

    /**
     * Завантаження сформованого JSON-файлу користувачеві
     */
    function downloadFoundryJSON() {
        try {
            const actorData = generateFoundryActor();
            const jsonString = JSON.stringify(actorData, null, 2);

            const rawName = actorData.name || 'VTM5e_Character';
            const safeName = rawName.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9_-]/g, '_');
            const fileName = `fvtt-Actor-${safeName}.json`;

            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showExportNotification(actorData.name);
        } catch (error) {
            console.error('Помилка під час експорту у Foundry VTT:', error);
            alert('Сталася помилка під час формування файлу для Foundry VTT: ' + error.message);
        }
    }

    /**
     * Показ гарного спливаючого сповіщення про успішний експорт
     */
    function showExportNotification(charName) {
        let toast = document.getElementById('foundry-export-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'foundry-export-toast';
            toast.className = 'fixed bottom-6 right-6 z-50 bg-stone-900 text-white border-2 border-[#8b0000] p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform duration-300 translate-y-20 opacity-0';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-[#8b0000] flex items-center justify-center text-xl shrink-0">🎲</div>
            <div>
                <h4 class="font-bold font-serif text-amber-400 text-sm">Foundry VTT Експорт готовий!</h4>
                <p class="text-xs text-gray-300">Файл для <strong>${charName || 'персонажа'}</strong> завантажено. В Foundry VTT відкрийте вкладку Акторів та виберіть «Імпорт даних».</p>
            </div>
        `;

        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 5000);
    }

    // Публічний API модуля
    const FoundryVTTExporter = {
        generateActor: generateFoundryActor,
        download: downloadFoundryJSON,
        exportCharacter: downloadFoundryJSON
    };

    global.FoundryVTTExporter = FoundryVTTExporter;
    global.exportToFoundryVTT = downloadFoundryJSON;

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : {})));
