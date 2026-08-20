// =============================================================================
// VTM 6TH EDITION (ALPHA 1.0 PLAYTEST) MODULE
// Comprehensive Character Creator, Rules Engine, and Interactive Sheet
// =============================================================================

let v6Data = null;

let v6LifepathFilter = 'all'; // 'all', 'mortal', 'vampire'
let v6SireFilter = 'playtest'; // 'playtest', 'custom', 'all'

let v6State = {
    edition: 'v6',
    currentStep: 1,
    tier: 'neonate',
    clan: 'brujah',
    sire: 'caring_sire',
    sireBonusDiscipline: 'fortitude',
    adoptiveSireClan: 'toreador',
    broodmateClan: 'gangrel',
    lifepaths: [],
    lifepathSkillAllocations: {}, // { lifepathId: { skillId: dots } }
    lifepathResourceAllocations: {}, // { lifepathId: { resourceId: dots } }
    attributes: {
        strength: 1,
        dexterity: 1,
        stamina: 1,
        charisma: 1,
        manipulation: 1,
        composure: 1,
        intelligence: 1,
        wits: 1,
        resolve: 1
    },
    attributePriority: ['physical', 'social', 'mental'], // Category order for 7/5/3
    attributeSpent: {
        physical: 3,
        social: 3,
        mental: 3
    },
    skills: {
        athletics: 0,
        awareness: 0,
        craft: 0,
        expression: 0,
        fighting: 0,
        investigation: 0,
        knowledge: 0,
        medicine: 0,
        persuasion: 0,
        sabotage: 0,
        shooting: 0,
        subterfuge: 0,
        survival: 0
    },
    freeSkillPointsSpent: {},
    focuses: {}, // { skillId: ["Focus 1", "Focus 2"] }
    disciplines: {
        fortitude: 1
    },
    selectedPowers: [],
    selectedClanTraits: [],
    selectedMerits: [],
    nature: 'autocrat',
    humanityScale: 0, // -3 (Monstrous 3) to +3 (Mortal 3), 0 is Neutral
    beastTracker: 0, // 0 to 5
    natureTracker: 0, // 0 to 5
    quickening: 0, // 0 to 5
    resources: {
        wealth: 1,
        physical_haven: 1
    },
    selectedWeapons: ['unarmed', 'light_melee'],
    characterDetails: {
        name: '',
        alias: '',
        concept: '',
        apparentAge: '',
        actualAge: '',
        decade: '',
        flaws: '',
        chronicle: '',
        notes: ''
    }
};

async function initV6() {
    try {
        if (!v6Data) {
            const res = await fetch('data/vtm_v6_playtest_data.json');
            v6Data = await res.json();
        }
        setupV6InitialState();
        renderV6UI();
    } catch (e) {
        console.error("Error initializing V6 Playtest module:", e);
    }
}

function setupV6InitialState() {
    const tierData = getV6Tier();
    // Default initial discipline assignments based on Clan
    const clanObj = getV6Clan(v6State.clan);
    v6State.disciplines = {};
    if (clanObj && Array.isArray(clanObj.disciplines)) {
        clanObj.disciplines.forEach((d, idx) => {
            v6State.disciplines[d] = idx === 0 ? 2 : (idx === 1 ? 1 : 0);
        });
    }
    // Add sire bonus
    if (v6State.sireBonusDiscipline) {
        v6State.disciplines[v6State.sireBonusDiscipline] = (v6State.disciplines[v6State.sireBonusDiscipline] || 0) + 1;
    }
    applyV6LifepathBonuses();
}

const FALLBACK_SIRES = [
    // OFFICIAL PLAYTEST SIRES (Alpha 1.0)
    {
        id: 'adoptive_sire',
        category: 'playtest',
        name: 'Прийомний Сір (Adoptive Sire)',
        desc: 'Інший вампір узяв вас під своє крило, навіть якщо він не був тим, хто вас безпосередньо обернув. Стосунки з прийомним сіром формують силу у вашій крові та дають доступ до дисциплін його клану.',
        relationship: 'Опіка іншого клану: оберіть клан вашого Прийомного Сіра — ви отримуєте +1 крапку в будь-якій одній Дисципліні цього клану на вибір.',
        isClanChoice: true,
        clanChoiceType: 'adoptive',
        disciplineOptions: ['presence', 'auspex', 'celerity'],
        bonusText: '+1 крапка (⬤) в будь-якій Дисципліні клану Прийомного Сіра на вибір'
    },
    {
        id: 'brood_child',
        category: 'playtest',
        name: 'Дитя Виводка (Brood Child)',
        desc: 'Вас було обернено у складі групи новонароджених сородичів (виводка/гнізда). Спільне виживання, суперництво та зв\'язок із побратимами дозволили вам перейняти сили іншого клану.',
        relationship: 'Зв\'язок виводка: оберіть клан вашого співвиводця — ви отримуєте +1 крапку в будь-якій одній Дисципліні цього клану на вибір.',
        isClanChoice: true,
        clanChoiceType: 'broodmate',
        disciplineOptions: ['animalism', 'fortitude', 'protean'],
        bonusText: '+1 крапка (⬤) в будь-якій Дисципліні клану співвиводця на вибір'
    },
    {
        id: 'caring_sire',
        category: 'playtest',
        name: 'Турботливий Сір (Caring Sire)',
        desc: 'Ваш Сір дбайливо опікувався вами та терпляче навчав звичаям вампірського суспільства, контролю Звіра й тонкощам нежиття.',
        relationship: 'Підтримка та наставництво: Сір передав вам витривалість, фізичну міць та силу навіювання.',
        disciplineOptions: ['fortitude', 'potence', 'presence'],
        bonusText: '+1 крапка (⬤) на вибір: Стійкість (Fortitude), Могутність (Potence) або Присутність (Presence)'
    },
    {
        id: 'cruel_sire',
        category: 'playtest',
        name: 'Жорстокий Сір (Cruel Sire)',
        desc: 'Ваш Сір був жорстоким, маніпулятивним та безжальним, ставлячись до вас як до пішака чи інструменту у власних підступних схемах. Ви навчилися терпіти біль та виживати за будь-яку ціну.',
        relationship: 'Випробування страхом: Сір навчив вас ламати чужу волю, витримувати нестерпний тиск та ховатися в тінях.',
        disciplineOptions: ['dominate', 'fortitude', 'obfuscate'],
        bonusText: '+1 крапка (⬤) на вибір: Домінування (Dominate), Стійкість (Fortitude) або Затемнення (Obfuscate)'
    },
    {
        id: 'secretive_sire',
        category: 'playtest',
        name: 'Таємничий Сір (Secretive Sire)',
        desc: 'Ваш Сір був загадковим і відлюдькуватим, приховував майже все та давав лише туманні підказки, навчаючи вас залишатися непоміченим і загострювати власні відчуття.',
        relationship: 'Школа тіней: Сір передав вам надприродну пильність, блискавичну реакцію та вміння розчинятися у пітьмі.',
        disciplineOptions: ['auspex', 'celerity', 'obfuscate'],
        bonusText: '+1 крапка (⬤) на вибір: Яснобачення (Auspex), Стрімкість (Celerity) або Затемнення (Obfuscate)'
    },
    {
        id: 'unknown_sire',
        category: 'playtest',
        name: 'Невідомий Сір (Unknown Sire)',
        desc: 'Ви ніколи не знали свого Сіра. Прокинувшись на самоті від пекучої спраги після Обітку, вам довелося покладатися лише на сирі інстинкти та чисте виживання.',
        relationship: 'Сирий інстинкт виживання: відсутність наставника змусила вашу кров проявити фундаментальні фізичні сили виживання.',
        disciplineOptions: ['celerity', 'fortitude', 'potence'],
        bonusText: '+1 крапка (⬤) на вибір: Стрімкість (Celerity), Стійкість (Fortitude) або Могутність (Potence)'
    },
    {
        id: 'vigilant_sire',
        category: 'playtest',
        name: 'Пильний Сір (Vigilant Sire)',
        desc: 'Ваш Сір був надзвичайно вимогливим і пильно стежив за кожним вашим кроком, впроваджуючи сувору дисципліну та безжально караючи за найменшу помилку.',
        relationship: 'Тотальний контроль: Сір навчив вас надзвичайної уважності, командного голосу та непохитної стійкості.',
        disciplineOptions: ['auspex', 'dominate', 'fortitude'],
        bonusText: '+1 крапка (⬤) на вибір: Яснобачення (Auspex), Домінування (Dominate) або Стійкість (Fortitude)'
    },

    // ADDITIONAL EXPANDED ARHETYPES (Custom)
    {
        id: 'blood_scholar',
        category: 'custom',
        name: 'Дослідник Крові / Окультист (Blood Scholar)',
        desc: 'Сір обрав вас за рідкісний резонанс крові, специфічну спадковість або гострий аналітичний розум. Вас зробили асистентом у вивченні найглибших таємниць Каїнітів та магії Віте.',
        relationship: 'Академічна співпраця та ритуальне учнівство; доступ до заборонених гримуарів.',
        disciplineOptions: ['blood_sorcery', 'auspex', 'oblivion'],
        bonusText: '+1 крапка (⬤) на вибір: Чари Крові, Яснобачення або Забуття'
    },
    {
        id: 'puppeteer_conspirator',
        category: 'custom',
        name: 'Ляльковод та Інтриган (Puppeteer / Conspirator)',
        desc: 'Ви були обрані як ключова фігура у складній багатовіковій шаховій партії Двору. Сір навчив вас розкривати чужі секрети, смикати за ниточки та бути непомітним серед еліти.',
        relationship: 'Маніпуляція та секрети; вас використовують, але ви перейняли ці самі методи.',
        disciplineOptions: ['dominate', 'presence', 'obfuscate'],
        bonusText: '+1 крапка (⬤) на вибір: Домінування, Присутність або Затемнення'
    },
    {
        id: 'obsessed_paramour',
        category: 'custom',
        name: 'Одержимий Коханець (Obsessed Paramour)',
        desc: 'Обіток став кульмінацією фатальної пристрасті чи естетичного захоплення. Сір був засліплений вами, повʼязавши себе і вас узами крові та вічної нічної жаги.',
        relationship: 'Токсична пристрасть; ревнощі та постійний контроль, але й готовність захищати ціною нежиття.',
        disciplineOptions: ['presence', 'auspex', 'celerity'],
        bonusText: '+1 крапка (⬤) на вибір: Присутність, Яснобачення або Стрімкість'
    },
    {
        id: 'zealot_prophet',
        category: 'custom',
        name: 'Фанатик та Пророк (Zealot / Crusader)',
        desc: 'Сір свято вірить у виконання давнього пророцтва або священну війну секти. Ваше звернення було "божественним покликанням" для нещадної боротьби з ворогами.',
        relationship: 'Фанатичне братерство; від вас очікують повної відданості ідеології та праведної люті.',
        disciplineOptions: ['potence', 'presence', 'fortitude'],
        bonusText: '+1 крапка (⬤) на вибір: Могутність, Присутність або Стійкість'
    },
    {
        id: 'high_patron',
        category: 'custom',
        name: 'Світський Патрон / Аристократ (High Elysium Patron)',
        desc: 'Впливовий вельможа Елізіуму, який ввів вас у найвищі кола вампірського бомонду. Він очікує бездоганного стилю, збереження репутації та захисту його родинного герба.',
        relationship: 'Світський патронаж; вам відкриті двері найкращих салонів, доки ви тримаєте марку.',
        disciplineOptions: ['dominate', 'presence', 'auspex'],
        bonusText: '+1 крапка (⬤) на вибір: Домінування, Присутність або Яснобачення'
    },
    {
        id: 'apex_stalker',
        category: 'custom',
        name: 'Хижак Нетрів (Apex Predator / Stalker)',
        desc: 'Дикий мисливець міських дахів та підземель, який вибрав вас за бездоганний інстинкт виживання та здатність безжально полювати в камʼяних джунглях.',
        relationship: 'Закони зграї; сильний веде за собою, слабкий стає поживою.',
        disciplineOptions: ['animalism', 'celerity', 'obfuscate'],
        bonusText: '+1 крапка (⬤) на вибір: Анімалізм, Стрімкість або Затемнення'
    },
    {
        id: 'renegade_heretic',
        category: 'custom',
        name: 'Єретик / Відступник (Renegade Heretic)',
        desc: 'Бунтар проти догматів сект і традицій старійшин, який обрав вас як однодумця для створення нового прихованого ордену серед немертвих.',
        relationship: 'Спільна небезпека та конспірація; ви завжди під прицілом інквізиції чи архонтів.',
        disciplineOptions: ['oblivion', 'celerity', 'obfuscate'],
        bonusText: '+1 крапка (⬤) на вибір: Забуття, Стрімкість або Затемнення'
    },
    {
        id: 'bohemian_creator',
        category: 'custom',
        name: 'Богемний Творець (Bohemian Creator)',
        desc: 'Митець, що шукає вічну досконалість у формі, звуці та емоціях. Вас обрали за вашу здатність пробуджувати втрачені людські почуття навіть у холодних серцях сородичів.',
        relationship: 'Творчий симбіоз; муза та майстер, що надихають одне одного у вічній ночі.',
        disciplineOptions: ['presence', 'auspex', 'celerity'],
        bonusText: '+1 крапка (⬤) на вибір: Присутність, Яснобачення або Стрімкість'
    }
];

const FALLBACK_LIFEPATHS = [
    // MORTAL LIFEPATHS
    {
        id: 'mortal_academic',
        type: 'mortal',
        name: 'Академік та Науковець (Academic & Scholar)',
        desc: 'Роки університетських досліджень, архівних пошуків, написання наукових праць та викладання. Ви володієте феноменальною памʼяттю та навичкою доскіпливого аналізу фактів.',
        skills: ['knowledge', 'investigation'],
        skillsBonusText: '+1 Знання, +1 Розслідування',
        resources: ['social_contacts', 'physical_haven'],
        resourceBonusText: '+1 Контакти в університетах, +1 Сховок'
    },
    {
        id: 'mortal_artist',
        type: 'mortal',
        name: 'Богема та Митець (Artist & Bohemian)',
        desc: 'Арт-галереї, нічні майстерні, перформанси та творчі пошуки. Ви тонко відчуваєте людські емоції, естетику та вмієте привертати увагу публіки.',
        skills: ['expression', 'craft'],
        skillsBonusText: '+1 Експресія, +1 Ремесло',
        resources: ['social_fame', 'social_contacts'],
        resourceBonusText: '+1 Слава, +1 Богемні контакти'
    },
    {
        id: 'mortal_corporate',
        type: 'mortal',
        name: 'Корпоративний Менеджер (Corporate Executive)',
        desc: 'Хмарочоси, фінансові звіти, переговори на мільйони та цинічний розрахунок. Ви вмієте керувати капіталом, вести перемовини та тиснути на опонентів.',
        skills: ['persuasion', 'investigation'],
        skillsBonusText: '+1 Переконання, +1 Розслідування',
        resources: ['wealth', 'social_status'],
        resourceBonusText: '+2 Багатство, +1 Смертний статус'
    },
    {
        id: 'mortal_street_enforcer',
        type: 'mortal',
        name: 'Вуличний Боєць / Здирник (Street Enforcer)',
        desc: 'Кримінальні райони, підпільні бої, вибивання боргів та щоденна боротьба за виживання. Ви звикли вирішувати проблеми силою та швидкою реакцією.',
        skills: ['fighting', 'athletics'],
        skillsBonusText: '+1 Ближній бій, +1 Атлетика',
        resources: ['social_contacts', 'physical_haven'],
        resourceBonusText: '+1 Вуличні звʼязки, +1 Сховок'
    },
    {
        id: 'mortal_military',
        type: 'mortal',
        name: 'Військовий / Ветеран (Military Veteran)',
        desc: 'Тактичні операції, дисципліна поводження зі зброєю, холоднокровність під обстрілом та польова виживаність у екстремальних умовах.',
        skills: ['shooting', 'survival'],
        skillsBonusText: '+1 Стрільба, +1 Виживання',
        resources: ['physical_repository', 'social_ally'],
        resourceBonusText: '+1 Озброєння, +1 Армійський побратим'
    },
    {
        id: 'mortal_occultist',
        type: 'mortal',
        name: 'Окультист / Містик (Occultist & Esotericist)',
        desc: 'Таємні товариства, старовинні гримуари, спіритичні сеанси та пошуки потойбічного. Ви шукали правду про ніч ще до вашого перетворення.',
        skills: ['subterfuge', 'awareness'],
        skillsBonusText: '+1 Хитрощі, +1 Уважність',
        resources: ['physical_haven', 'social_herd'],
        resourceBonusText: '+1 Окультний сховок, +1 Культ / Табун'
    },
    {
        id: 'mortal_medic',
        type: 'mortal',
        name: 'Лікар / Хірург (Surgeon & Doctor)',
        desc: 'Реанімація, нічні зміни, досконале знання людської анатомії, медикаментів та крихкості смертного тіла.',
        skills: ['medicine', 'awareness'],
        skillsBonusText: '+1 Медицина, +1 Уважність',
        resources: ['social_contacts', 'wealth'],
        resourceBonusText: '+1 Доступ до банків крові, +1 Багатство'
    },
    {
        id: 'mortal_hacker',
        type: 'mortal',
        name: 'Хакер / Кіберфахівець (Cyber Hacker & Tech)',
        desc: 'Darknet, злам зашифрованих серверів, стирання цифрових слідів, шпигунське обладнання та технічна диверсія.',
        skills: ['sabotage', 'knowledge'],
        skillsBonusText: '+1 Диверсія, +1 Знання',
        resources: ['physical_repository', 'social_contacts'],
        resourceBonusText: '+1 Спецобладнання, +1 Мережеві звʼязки'
    },
    {
        id: 'mortal_politician',
        type: 'mortal',
        name: 'Політик / Громадський Діяч (Politician & Activist)',
        desc: 'Виборчі кампанії, лобіювання, робота з пресою, маніпулювання натовпом та побудова впливових владних коаліцій.',
        skills: ['persuasion', 'subterfuge'],
        skillsBonusText: '+1 Переконання, +1 Хитрощі',
        resources: ['social_status', 'social_ally'],
        resourceBonusText: '+2 Політичний вплив, +1 Союзник'
    },
    {
        id: 'mortal_detective',
        type: 'mortal',
        name: 'Детектив / Слідчий (Private Investigator)',
        desc: 'Стеження, розкриття злочинів, допит свідків, криміналістика та вміння знаходити сховані докази і таємниці.',
        skills: ['investigation', 'shooting'],
        skillsBonusText: '+1 Розслідування, +1 Стрільба',
        resources: ['social_contacts', 'social_mask'],
        resourceBonusText: '+1 Контакти в поліції, +1 Маска'
    },
    {
        id: 'mortal_drifter',
        type: 'mortal',
        name: 'Волоцюга / Мандрівник (Drifter & Outcast)',
        desc: 'Життя без документів, подорожі автостопом, вміння знаходити безпечний нічліг у будь-яких нетрях та зникати з радарів влади.',
        skills: ['survival', 'athletics'],
        skillsBonusText: '+1 Виживання, +1 Атлетика',
        resources: ['physical_haven', 'social_contacts'],
        resourceBonusText: '+1 Прихований сховок, +1 Мандрівні друзі'
    },
    {
        id: 'mortal_artisan',
        type: 'mortal',
        name: 'Ремісник / Інженер (Artisan & Engineer)',
        desc: 'Точні прилади, механізми, креслення, ремонт транспорту та електроніки. Здатність полагодити чи зламати будь-яку конструкцію.',
        skills: ['craft', 'sabotage'],
        skillsBonusText: '+1 Ремесло, +1 Диверсія',
        resources: ['physical_repository', 'physical_haven'],
        resourceBonusText: '+1 Майстерня з обладнанням, +1 Сховок'
    },

    // VAMPIRE LIFEPATHS
    {
        id: 'vampire_herald',
        type: 'vampire',
        name: 'Емісар Двору / Дипломат (Court Herald & Emissary)',
        desc: 'Офіційний представник Князя або котерії в Елізіумі. Ви оголошуєте едикти, ведете тонкі переговори та захищаєте протокол сородичів.',
        skills: ['persuasion', 'expression'],
        skillsBonusText: '+1 Переконання, +1 Експресія',
        resources: ['social_status', 'social_contacts'],
        resourceBonusText: '+2 Статус у Камарильї, +1 Контакти в Елізіумі'
    },
    {
        id: 'vampire_hound',
        type: 'vampire',
        name: 'Гончак / Каратель Шерифа (Hound & Enforcer)',
        desc: 'Силова рука нічного правосуддя. Ви вистежуєте порушників Маскараду, караєте зрадників та ліквідуєте загрози Князівству.',
        skills: ['fighting', 'survival'],
        skillsBonusText: '+1 Ближній бій, +1 Виживання',
        resources: ['physical_repository', 'social_status'],
        resourceBonusText: '+1 Зброярня, +1 Офіційний статус'
    },
    {
        id: 'vampire_shadow_broker',
        type: 'vampire',
        name: 'Тіньовий Брокер / Шпигун (Shadow Broker & Spy)',
        desc: 'Ви володієте таємницями всіх місцевих котерій, гріхами старійшин та планами Анархів. Інформація — ваша головна зброя і валюта.',
        skills: ['subterfuge', 'sabotage'],
        skillsBonusText: '+1 Хитрощі, +1 Диверсія',
        resources: ['social_contacts', 'social_mask'],
        resourceBonusText: '+2 Таємні контакти, +1 Бездоганна маска'
    },
    {
        id: 'vampire_keeper',
        type: 'vampire',
        name: 'Хранитель Елізіуму (Keeper of Elysium)',
        desc: 'Господар нейтральної території сородичів. Ви гарантуєте безпеку зустрічей, де заборонено насилля та використання Дисциплін.',
        skills: ['awareness', 'knowledge'],
        skillsBonusText: '+1 Уважність, +1 Знання',
        resources: ['social_status', 'physical_haven'],
        resourceBonusText: '+2 Статус Хранителя, +1 Розкішний Елізіум'
    },
    {
        id: 'vampire_anarch_rebel',
        type: 'vampire',
        name: 'Анарх-Партизан (Anarch Guerilla & Rebel)',
        desc: 'Борець за свободу сородичів проти тиранії Камарильї. Ваші методи — швидкі нічні рейди, конспіративні квартири та підрив влади старійшин.',
        skills: ['athletics', 'survival'],
        skillsBonusText: '+1 Атлетика, +1 Виживання',
        resources: ['social_ally', 'physical_haven'],
        resourceBonusText: '+1 Загін Анархів, +1 Конспіративний сховок'
    },
    {
        id: 'vampire_blood_oracle',
        type: 'vampire',
        name: 'Оракул Крові / Тауматург (Blood Oracle & Mystic)',
        desc: 'Ви присвятили нежиття вивченню окультних таємниць Віте, стародавніх ритуалів, пророцтв та містичної топографії міста.',
        skills: ['knowledge', 'investigation'],
        skillsBonusText: '+1 Знання, +1 Розслідування',
        resources: ['physical_haven', 'social_herd'],
        resourceBonusText: '+1 Окультне святилище, +1 Очищений табун'
    },
    {
        id: 'vampire_blood_merchant',
        type: 'vampire',
        name: 'Торговець Кровʼю / Банкір Тіней (Blood Merchant & Banker)',
        desc: 'Ви контролюєте чорні ринки Віте, рідкісні сорти та резонанси крові, позики між кланами та фінансування нічних операцій.',
        skills: ['persuasion', 'subterfuge'],
        skillsBonusText: '+1 Переконання, +1 Хитрощі',
        resources: ['wealth', 'social_herd'],
        resourceBonusText: '+2 Багатство у Віте, +1 Елітний табун'
    },
    {
        id: 'vampire_executioner',
        type: 'vampire',
        name: 'Чистильник / Ліквідатор Тіней (Cleaner & Cleaner)',
        desc: 'Коли потрібно приховати сліди кривавої розправи, вичистити місце злочину від ДНК чи ліквідувати небезпечних свідків Маскараду.',
        skills: ['shooting', 'medicine'],
        skillsBonusText: '+1 Стрільба, +1 Медицина',
        resources: ['social_retainer', 'physical_repository'],
        resourceBonusText: '+1 Бригада помічників, +1 Спецобладнання'
    }
];

function getV6LifepathSkillBonuses() {
    const bonuses = {};
    (v6State.lifepaths || []).forEach(lpId => {
        const allocs = v6State.lifepathSkillAllocations[lpId] || {};
        Object.entries(allocs).forEach(([skId, dots]) => {
            bonuses[skId] = (bonuses[skId] || 0) + dots;
        });
    });
    return bonuses;
}

function getV6LifepathResourceBonuses() {
    const bonuses = {};
    (v6State.lifepaths || []).forEach(lpId => {
        const allocs = v6State.lifepathResourceAllocations[lpId] || {};
        Object.entries(allocs).forEach(([resId, dots]) => {
            let normId = resId;
            if (normId === 'physical_wealth') normId = 'wealth';
            if (normId === 'physical_weaponry' || normId === 'physical_equipment') normId = 'physical_repository';
            bonuses[normId] = (bonuses[normId] || 0) + dots;
        });
    });
    return bonuses;
}

function applyV6LifepathBonuses() {
    const lpSkills = getV6LifepathSkillBonuses();
    Object.entries(lpSkills).forEach(([skId, bonus]) => {
        if (!v6State.skills[skId] || v6State.skills[skId] < bonus) {
            v6State.skills[skId] = bonus;
        }
    });
    const lpRes = getV6LifepathResourceBonuses();
    Object.entries(lpRes).forEach(([resId, bonus]) => {
        if (!v6State.resources[resId] || v6State.resources[resId] < bonus) {
            v6State.resources[resId] = bonus;
        }
    });
}

const GLOBAL_SKILLS_MAP = {
    athletics: "Атлетика", awareness: "Спостережливість", craft: "Ремесло", expression: "Виступ",
    fighting: "Боротьба", investigation: "Розслідування", knowledge: "Знання",
    medicine: "Медицина", persuasion: "Переконування", shooting: "Стрільба",
    sabotage: "Саботаж", subterfuge: "Хитрість", survival: "Виживання"
};

const GLOBAL_RESOURCES_MAP = {
    wealth: "Багатство (Wealth)",
    social_contacts: "Контакти (Contacts)",
    social_ally: "Союзник (Ally)",
    physical_property: "Власність (Property)",
    physical_haven: "Сховище (Haven)",
    social_mask: "Маска (Mask)",
    social_status: "Статус (Status)",
    physical_repository: "Сховище знань/Зброя (Repository)",
    physical_vehicle: "Транспорт (Vehicle)"
};

window.allocateV6LifepathSkill = function(lpId, skillId, dots) {
    if (!v6State.lifepathSkillAllocations) v6State.lifepathSkillAllocations = {};
    if (!v6State.lifepathSkillAllocations[lpId]) v6State.lifepathSkillAllocations[lpId] = {};
    
    const current = v6State.lifepathSkillAllocations[lpId][skillId] || 0;
    if (current === dots) {
        v6State.lifepathSkillAllocations[lpId][skillId] = dots - 1; // Toggle down
    } else {
        const spent = Object.values(v6State.lifepathSkillAllocations[lpId]).reduce((a,b)=>a+b, 0);
        if (dots > current && (spent + (dots - current)) > 5) return; // Exceeds 5 limit
        v6State.lifepathSkillAllocations[lpId][skillId] = dots;
    }
    applyV6LifepathBonuses();
    renderV6UI();
};

window.allocateV6LifepathResource = function(lpId, resId, dots) {
    if (!v6State.lifepathResourceAllocations) v6State.lifepathResourceAllocations = {};
    if (!v6State.lifepathResourceAllocations[lpId]) v6State.lifepathResourceAllocations[lpId] = {};
    
    const current = v6State.lifepathResourceAllocations[lpId][resId] || 0;
    if (current === dots) {
        v6State.lifepathResourceAllocations[lpId][resId] = dots - 1; // Toggle down
    } else {
        const spent = Object.values(v6State.lifepathResourceAllocations[lpId]).reduce((a,b)=>a+b, 0);
        if (dots > current && (spent + (dots - current)) > 3) return; // Exceeds 3 limit
        v6State.lifepathResourceAllocations[lpId][resId] = dots;
    }
    applyV6LifepathBonuses();
    renderV6UI();
};

const FALLBACK_SKILLS = [
    { 
        id: 'athletics', 
        name: 'Атлетика (Athletics)', 
        category: 'physical', 
        desc: 'Атлетика відображає вашу фізичну підготовку та здібності до більшості видів спортивної активності, як-от погоня за кимось, сходження по стіні будинку або ухилення від некерованого автобуса.',
        focuses: ['Лазіння', 'Підіймання ваги', 'Біг', 'Метання']
    },
    { 
        id: 'awareness', 
        name: 'Спостережливість (Awareness)', 
        category: 'mental', 
        desc: 'Спостережливість відображає те, наскільки ви треновані помічати ледь вловні зміни в поведінці людей, відчувати дивні закономірності в довкіллі або навіть наскільки ви чутливі до ознак надприродного.',
        focuses: ['Емпатія', 'Проникливість', 'Інстинкт', 'Надприродне']
    },
    { 
        id: 'craft', 
        name: 'Ремесло (Craft)', 
        category: 'physical', 
        desc: 'Ремесло відображає ваші технічні здібності щодо створення, ремонту та імпровізованого покращення технічного обладнання — від столярства до комп\'ютерів та всього іншого між ними.',
        focuses: ['Столярство', 'Комп\'ютери', 'Двигуни', 'Підробка', 'Імпровізація']
    },
    { 
        id: 'expression', 
        name: 'Виступ (Expression)', 
        category: 'social', 
        desc: 'Виступ відображає те, наскільки добре ви можете виражати себе у різних мистецьких формах — від написання надихаючих листів до гри на музичних інструментах чи акторської гри в ролі іншого.',
        focuses: ['Акторська майстерність', 'Малювання', 'Музика', 'Скульптура', 'Письмо']
    },
    { 
        id: 'fighting', 
        name: 'Боротьба (Fighting)', 
        category: 'physical', 
        desc: 'Боротьба відображає вашу підготовку у фізичному ближньому бою — від кулачних бійок і бойових мистецтв до використання зброї ближнього бою, як-от мечів, ножів і навіть дерев\'яних кілків.',
        focuses: ['Брудна бійка', 'Рукопашний бій', 'Імпровізована зброя', 'Середньовічна зброя']
    },
    { 
        id: 'investigation', 
        name: 'Розслідування (Investigation)', 
        category: 'mental', 
        desc: 'Розслідування відображає вашу здатність приділяти увагу деталям та застосовувати дедуктивне мислення для отримання розрізненої чи прихованої інформації.',
        focuses: ['Місце злочину', 'Цифрові носії', 'Плітки', 'Фізичні носії', 'Вуличний досвід']
    },
    { 
        id: 'knowledge', 
        name: 'Знання (Knowledge)', 
        category: 'mental', 
        desc: 'Знання відображають те, як багато ви знаєте про різні академічні чи наукові теми, як-от окультизм, лінгвістику та стародавню історію.',
        focuses: ['Хімія', 'Історія', 'Право', 'Лінгвістика', 'Окультизм', 'Політика']
    },
    { 
        id: 'medicine', 
        name: 'Медицина (Medicine)', 
        category: 'mental', 
        desc: 'Медицина відображає вашу підготовку в медичних знаннях та практиці — від базової першої допомоги до складніших галузей, як-от хірургія.',
        focuses: ['Тварини', 'Перша допомога', 'Психологія', 'Хірургія', 'Токсикологія']
    },
    { 
        id: 'persuasion', 
        name: 'Переконування (Persuasion)', 
        category: 'social', 
        desc: 'Переконування відображає те, наскільки добре ви треновані в соціальній грі переконання інших робити те, що вам потрібно.',
        focuses: ['Братання', 'Залякування', 'Переговори', 'Зваблення']
    },
    { 
        id: 'sabotage', 
        name: 'Саботаж (Sabotage)', 
        category: 'physical', 
        desc: 'Саботаж відображає вашу здатність долати та скасовувати заходи безпеки, а також ваші навички у використанні руйнівних методів для пошкодження речей.',
        focuses: ['Крадіжка зі зламом', 'Вибухівка', 'Хакінг', 'Системи безпеки']
    },
    { 
        id: 'shooting', 
        name: 'Стрільба (Shooting)', 
        category: 'physical', 
        desc: 'Стрільба відображає вашу підготовку у використанні далекобійної зброї — від середньовічної зброї, як-от луки, до пістолетів, кулеметів і навіть артилерії.',
        focuses: ['Важка вогнепальна зброя', 'Легка вогнепальна зброя', 'Імпровізована зброя', 'Середньовічна зброя']
    },
    { 
        id: 'subterfuge', 
        name: 'Хитрість (Subterfuge)', 
        category: 'social', 
        desc: 'Хитрість відображає вашу здатність бути вправним злодієм чи шахраєм, що передбачає не лише вміння залишатися непоміченим і непочутим, але й брехнею прокладати собі шлях із заплутаних ситуацій.',
        focuses: ['Обман', 'Маскування', 'Нишпорення', 'Спритність рук', 'Прихованість']
    },
    { 
        id: 'survival', 
        name: 'Виживання (Survival)', 
        category: 'physical', 
        desc: 'Виживання відображає вашу практичну винахідливість та здібності до виживання попри складність вашої ситуації, особливо коли йдеться про пошук укриття, взаємодію з тваринами або відстеження слідів.',
        focuses: ['Поводження з тваринами', 'Збиральництво', 'Полювання', 'Укриття', 'Відстеження слідів']
    }
];

const FALLBACK_MERITS = [
    { id: 'm_allies_1', name: 'Союзники • (Allies)', category: 'advantages', desc: 'Вірний смертний друг або інформатор.' },
    { id: 'm_contacts_2', name: 'Контакти •• (Contacts)', category: 'advantages', desc: 'Широка мережа інформаторів у місті.' },
    { id: 'm_influence_1', name: 'Вплив • (Influence)', category: 'advantages', desc: 'Певний важелі тиску на місцеві органи.' },
    { id: 'fl_enemy_1', name: 'Ворог • (Enemy)', category: 'flaws', desc: 'Мисливець на вампірів або суперник полювання.' }
];

const FALLBACK_NATURES = [
    { id: 'autocrat', name: 'Автократ (Autocrat)', desc: 'Прагнення контролювати все і всіх навколо.' },
    { id: 'architect', name: 'Архітектор (Architect)', desc: 'Будівництво планів, організацій та систем на майбутнє.' },
    { id: 'bon_vivant', name: 'Гедоніст (Bon Vivant)', desc: 'Насолода земними та нічними задоволеннями.' },
    { id: 'caretaker', name: 'Опікун (Caretaker)', desc: 'Захист слабких та турбота про близьких.' },
    { id: 'rebel', name: 'Бунтар (Rebel)', desc: 'Боротьба проти встановленого порядку та влади старійшин.' },
    { id: 'survivor', name: 'Виживальник (Survivor)', desc: 'Головне — вижити за будь-яку ціну.' }
];

function getV6Tiers() { return (v6Data && v6Data.tiers) || [{ id: 'neonate', name: 'Неонат (Neonate)', generations: '11-13-те покоління', generationModifier: 1, maxDots: 5, attributeDots: [7, 5, 3], disciplineDots: '3 + 1', description: 'Молодий вампір' }]; }
function getV6Clans() { return (v6Data && v6Data.clans) || [{ id: 'brujah', name: 'Бруха (Brujah)', desc: 'Бунтарі та революціонери', disciplines: ['celerity', 'potence', 'presence'], beast: 'Анти-Авторитет', curse: 'Кипляча Пристрасть', traits: [] }]; }
function getV6Sires() { return (v6Data && v6Data.sires) || FALLBACK_SIRES; }
function getV6Lifepaths() { return (v6Data && v6Data.lifepaths) || FALLBACK_LIFEPATHS; }
function getV6Skills() { return (v6Data && v6Data.skills) || FALLBACK_SKILLS; }
function getV6Disciplines() { return (v6Data && v6Data.disciplines) || [{ id: 'celerity', name: 'Стрімкість (Celerity)', powers: [{ id: 'cat_grace', name: 'Котяча Грація', level: 1, cost: '0', desc: 'Захист' }] }]; }
function getV6Merits() { return (v6Data && v6Data.merits) || FALLBACK_MERITS; }
function getV6Natures() { return (v6Data && v6Data.natures) || FALLBACK_NATURES; }
function getV6Resources() { return (v6Data && v6Data.resources) || [{ id: 'wealth', name: 'Багатство (Wealth)', max: 5 }]; }
function getV6Weapons() { return (v6Data && v6Data.weapons) || [{ id: 'unarmed', name: 'Кулаки / Зуби (Unarmed)', damage: '2' }]; }

function getV6Tier(tierId = v6State.tier) {
    const tiers = getV6Tiers();
    return tiers.find(t => t.id === tierId) || tiers[0];
}

function getV6Clan(clanId = v6State.clan) {
    const clans = getV6Clans();
    return clans.find(c => c.id === clanId) || clans[0];
}

function getV6Nature(natureId = v6State.nature) {
    const natures = getV6Natures();
    return natures.find(n => n.id === natureId) || natures[0];
}

function calculateV6Vitae() {
    const stamina = v6State.attributes.stamina || 1;
    return 10 + stamina;
}

function calculateV6Willpower() {
    const comp = v6State.attributes.composure || 1;
    const res = v6State.attributes.resolve || 1;
    return 5 + comp + res;
}

// -----------------------------------------------------------------------------
// V6 STEP RENDERING ENGINE
// -----------------------------------------------------------------------------

function renderV6UI() {
    const container = document.getElementById('v6-generator-app');
    if (!container) return;

    container.innerHTML = `
        <!-- V6 Step Navigation Tabs -->
        <nav class="bg-[#141416] p-3 rounded-2xl border border-red-950 mb-6 shadow-xl sticky top-20 z-30">
            <div class="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar pb-1">
                ${[
                    { step: 1, title: "1. Тір гри", icon: "👑" },
                    { step: 2, title: "2. Клан", icon: "🩸" },
                    { step: 3, title: "3. Сір", icon: "🦇" },
                    { step: 4, title: "4. Життєві Шляхи", icon: "📜" },
                    { step: 5, title: "5. Атрибути й Навички", icon: "⚡" },
                    { step: 6, title: "6. Дисципліни й Риси", icon: "🔮" },
                    { step: 7, title: "7. Людяність і Натура", icon: "⚖️" },
                    { step: 8, title: "8. Ресурси і Зброя", icon: "🗡️" },
                    { step: 9, title: "9. Підсумок і Бланк", icon: "📄" }
                ].map(item => `
                    <button onclick="goToV6Step(${item.step})" class="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        v6State.currentStep === item.step 
                            ? 'bg-[#8b0000] text-white shadow-lg shadow-red-950 scale-105' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                    }">
                        <span>${item.icon}</span>
                        <span>${item.title}</span>
                    </button>
                `).join('')}
            </div>
        </nav>

        <!-- Main Step Content Container -->
        <main class="transition-all duration-300">
            ${renderCurrentV6StepContent()}
        </main>
    `;
}

function goToV6Step(stepNum) {
    v6State.currentStep = Math.max(1, Math.min(9, stepNum));
    renderV6UI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentV6StepContent() {
    switch (v6State.currentStep) {
        case 1: return renderV6Step1_Tier();
        case 2: return renderV6Step2_Clan();
        case 3: return renderV6Step3_Sire();
        case 4: return renderV6Step4_Lifepaths();
        case 5: return renderV6Step5_AttributesSkills();
        case 6: return renderV6Step6_DisciplinesTraits();
        case 7: return renderV6Step7_HumanityNature();
        case 8: return renderV6Step8_ResourcesWeapons();
        case 9: return renderV6Step9_SummarySheet();
        default: return renderV6Step1_Tier();
    }
}

// -----------------------------------------------------------------------------
// STEP 1: TIER & GENERATION
// -----------------------------------------------------------------------------
function renderV6Step1_Tier() {
    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 1 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">Хто ви? (Тір гри та Покоління)</h2>
                </div>
                <div class="text-xs text-zinc-500 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200">
                    Рівень сили визначає ліміти характеристик, кількість шляхів та модифікатор покоління.
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                ${getV6Tiers().map(t => {
                    const isSel = v6State.tier === t.id;
                    return `
                        <div onclick="selectV6Tier('${t.id}')" class="cursor-pointer rounded-2xl p-6 transition-all border-2 relative flex flex-col justify-between ${
                            isSel 
                                ? 'border-[#8b0000] bg-red-50/40 shadow-md ring-2 ring-red-900/20' 
                                : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white'
                        }">
                            ${isSel ? '<div class="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#8b0000]"></div>' : ''}
                            <div>
                                <h3 class="text-lg font-bold text-zinc-900 vtm-font uppercase mb-1">${t.name}</h3>
                                <div class="text-xs font-semibold text-[#8b0000] mb-3">${t.generations} • Модифікатор: +${t.generationModifier}</div>
                                <p class="text-xs text-zinc-600 leading-relaxed mb-4">${t.description}</p>
                            </div>
                            <div class="pt-4 border-t border-zinc-200/80 space-y-1.5 text-[11px] text-zinc-700">
                                <div class="flex justify-between"><span>Макс. крапок:</span> <strong class="text-zinc-900">${t.maxDots} ⬤</strong></div>
                                <div class="flex justify-between"><span>Атрибути:</span> <strong class="text-zinc-900">${t.attributeDots ? t.attributeDots.join('/') : '7/5/3'}</strong></div>
                                <div class="flex justify-between"><span>Дисципліни:</span> <strong class="text-zinc-900">${t.disciplineDots}</strong></div>
                                <div class="flex justify-between"><span>Життєві шляхи:</span> <strong class="text-zinc-900">${t.lifepathsCount}</strong></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="flex justify-end pt-4 border-t border-zinc-100">
                <button onclick="goToV6Step(2)" class="px-8 py-3 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Вибір Клану ➔
                </button>
            </div>
        </div>
    `;
}

function selectV6Tier(tierId) {
    v6State.tier = tierId;
    if (tierId === 'neonate') {
        const clanObj = getV6Clan();
        if (clanObj && clanObj.traits) {
            v6State.selectedClanTraits = v6State.selectedClanTraits.filter(tId => {
                const tr = clanObj.traits.find(t => t.id === tId);
                return tr && tr.tier !== 'ancilla';
            });
        }
    }
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 2: CLAN SELECTION
// -----------------------------------------------------------------------------
function renderV6Step2_Clan() {
    const currentClan = getV6Clan();
    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 2 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">Ваш Клан (14 Кланів)</h2>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <button type="button" onclick="if(typeof openQuizModal === 'function') openQuizModal();" class="shrink-0 px-4 py-2 bg-[#8b0000] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors shadow flex items-center gap-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25c-1.354 3.125-6 8.5-6 13.5a6 6 0 0012 0c0-5-4.646-10.375-6-13.5z"/></svg>
                        Дізнатися свій клан
                    </button>
                    <div class="text-[10px] text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 text-right max-w-[250px]">
                        Клан визначає ваш родовід, Кланового Звіра, Прокляття, Шаленство та доступні Дисципліни.
                    </div>
                </div>
            </div>

            <!-- Selected Clan Highlight Card -->
            ${currentClan ? `
                <div class="bg-gradient-to-r from-red-950/90 to-zinc-900 text-white rounded-2xl p-6 mb-8 border border-red-900 shadow-xl">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-full bg-red-900/50 border-2 border-red-700 flex items-center justify-center text-2xl font-bold vtm-font text-white shadow-inner">
                                🩸
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold vtm-font uppercase text-white tracking-wider">${currentClan.name} ${currentClan.playtestStatus !== 'released' ? '<span class="text-[10px] bg-amber-600/80 text-white px-2 py-0.5 rounded-md ml-2 align-middle">В розробці</span>' : ''}</h3>
                                <p class="text-xs text-red-200 italic mt-0.5">${currentClan.desc}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            ${(currentClan.disciplines || []).map(d => {
                                const discObj = getV6Disciplines().find(item => item.id === d);
                                return `<span class="px-3 py-1 bg-red-900/80 border border-red-700/60 rounded-lg text-xs font-bold uppercase tracking-wider text-red-100">${discObj ? discObj.name.split(' (')[0] : d}</span>`;
                            }).join('')}
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-red-900/60 text-xs">
                        <div class="bg-black/30 p-4 rounded-xl border border-red-900/30">
                            <span class="text-red-400 font-bold uppercase tracking-wider block mb-1">🐾 Клановий Звір: <span class="text-zinc-200 ml-1 font-normal capitalize">${currentClan.beast}</span></span>
                            <p class="text-zinc-400 mt-2 text-[11px] leading-relaxed">${currentClan.beastDesc || ''}</p>
                        </div>
                        <div class="bg-black/30 p-4 rounded-xl border border-red-900/30">
                            <span class="text-red-400 font-bold uppercase tracking-wider block mb-1">⚡ Прокляття: <span class="text-zinc-200 ml-1 font-normal capitalize">${currentClan.curse}</span></span>
                            <p class="text-zinc-400 mt-2 text-[11px] leading-relaxed">${currentClan.curseDesc || ''}</p>
                        </div>
                        <div class="bg-black/30 p-4 rounded-xl border border-red-900/30">
                            <span class="text-red-400 font-bold uppercase tracking-wider block mb-1">🔥 Шаленство: <span class="text-zinc-200 ml-1 font-normal capitalize">${currentClan.frenzy || 'Специфічне'}</span></span>
                            <p class="text-zinc-400 mt-2 text-[11px] leading-relaxed">${currentClan.frenzyDesc || ''}</p>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Clans Grid - Playtest -->
            <h3 class="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-700"></span> Доступні в Плейтесті
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                ${getV6Clans().filter(c => c.playtestStatus === 'released').map(c => {
                    const isSel = v6State.clan === c.id;
                    return `
                        <button onclick="selectV6Clan('${c.id}')" class="text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                            isSel 
                                ? 'border-[#8b0000] bg-red-50 text-zinc-900 font-bold shadow-md ring-2 ring-red-900/20' 
                                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800'
                        }">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-serif text-sm font-bold truncate">${c.name.split(' (')[0]}</span>
                                ${isSel ? '<span class="text-xs text-[#8b0000]">●</span>' : ''}
                            </div>
                            <span class="text-[10px] text-zinc-500 italic line-clamp-2">${c.desc}</span>
                        </button>
                    `;
                }).join('')}
            </div>

            <!-- Clans Grid - In Development -->
            <h3 class="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 border-t border-zinc-200 pt-6">
                <span class="w-2 h-2 rounded-full bg-zinc-400"></span> В розробці (Неофіційні дані)
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                ${getV6Clans().filter(c => c.playtestStatus !== 'released').map(c => {
                    const isSel = v6State.clan === c.id;
                    return `
                        <button onclick="selectV6Clan('${c.id}')" class="text-left p-4 rounded-xl border transition-all flex flex-col justify-between opacity-80 ${
                            isSel 
                                ? 'border-[#8b0000] bg-red-50 text-zinc-900 font-bold shadow-md ring-2 ring-red-900/20 opacity-100' 
                                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800'
                        }">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-serif text-sm font-bold truncate">${c.name.split(' (')[0]}</span>
                                ${isSel ? '<span class="text-xs text-[#8b0000]">●</span>' : ''}
                            </div>
                            <span class="text-[10px] text-zinc-500 italic line-clamp-2">${c.desc}</span>
                        </button>
                    `;
                }).join('')}
            </div>

            <div class="flex justify-between pt-4 border-t border-zinc-100">
                <button onclick="goToV6Step(1)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад
                </button>
                <button onclick="goToV6Step(3)" class="px-8 py-2.5 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Вибір Сіра ➔
                </button>
            </div>
        </div>
    `;
}

function selectV6Clan(clanId) {
    v6State.clan = clanId;
    v6State.selectedClanTraits = [];
    recalculateV6Disciplines();
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 3: SIRE & GENERATION
// -----------------------------------------------------------------------------
function getV6SireDisciplineOptions(sireObj) {
    if (!sireObj) return [];
    if (sireObj.id === 'adoptive_sire') {
        const clan = getV6Clan(v6State.adoptiveSireClan || 'toreador');
        return clan && Array.isArray(clan.disciplines) ? clan.disciplines : ['presence', 'auspex', 'celerity'];
    }
    if (sireObj.id === 'brood_child') {
        const clan = getV6Clan(v6State.broodmateClan || 'gangrel');
        return clan && Array.isArray(clan.disciplines) ? clan.disciplines : ['animalism', 'fortitude', 'protean'];
    }
    return sireObj.disciplineOptions || [];
}

function setV6SireCategoryFilter(filter) {
    v6SireFilter = filter;
    renderV6UI();
}

function setV6AdoptiveSireClan(clanId) {
    v6State.adoptiveSireClan = clanId;
    const clan = getV6Clan(clanId);
    if (clan && Array.isArray(clan.disciplines) && clan.disciplines.length > 0) {
        if (!clan.disciplines.includes(v6State.sireBonusDiscipline)) {
            v6State.sireBonusDiscipline = clan.disciplines[0];
        }
    }
    recalculateV6Disciplines();
    renderV6UI();
}

function setV6BroodmateClan(clanId) {
    v6State.broodmateClan = clanId;
    const clan = getV6Clan(clanId);
    if (clan && Array.isArray(clan.disciplines) && clan.disciplines.length > 0) {
        if (!clan.disciplines.includes(v6State.sireBonusDiscipline)) {
            v6State.sireBonusDiscipline = clan.disciplines[0];
        }
    }
    recalculateV6Disciplines();
    renderV6UI();
}

function recalculateV6Disciplines() {
    const clanObj = getV6Clan(v6State.clan);
    v6State.disciplines = {};
    if (clanObj && Array.isArray(clanObj.disciplines)) {
        clanObj.disciplines.forEach((d) => {
            v6State.disciplines[d] = 0;
        });
    }
    if (v6State.sireBonusDiscipline) {
        v6State.disciplines[v6State.sireBonusDiscipline] = (v6State.disciplines[v6State.sireBonusDiscipline] || 0) + 1;
    }
}

function renderV6Step3_Sire() {
    const allSires = getV6Sires();
    const currentSire = allSires.find(s => s.id === v6State.sire) || allSires[0];
    const disciplineOptions = getV6SireDisciplineOptions(currentSire);
    const clans = getV6Clans();

    const filteredSires = allSires.filter(s => {
        if (v6SireFilter === 'playtest') return s.category === 'playtest';
        if (v6SireFilter === 'custom') return s.category === 'custom';
        return true;
    });

    const playtestCount = allSires.filter(s => s.category === 'playtest').length;
    const customCount = allSires.filter(s => s.category === 'custom').length;

    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 3 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">Ваш Сір (Офіційні та Додаткові Архетипи)</h2>
                </div>
                <div class="text-xs text-zinc-500 bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-200 max-w-md">
                    Архетип вашого Сіра визначає стосунки та надає <strong class="text-purple-700 font-bold">+1 бонусну крапку</strong> в обраній Дисципліні (виділяється <span class="text-purple-700 font-bold">фіолетовим кольором</span> у всіх вкладках).
                </div>
            </div>

            <!-- Active Sire Summary Card -->
            ${currentSire ? `
                <div class="bg-gradient-to-r from-purple-950 via-zinc-900 to-zinc-900 text-white rounded-2xl p-6 mb-8 border border-purple-900 shadow-xl">
                    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-[10px] ${currentSire.category === 'playtest' ? 'bg-purple-800 text-white border border-purple-600' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'} px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    ${currentSire.category === 'playtest' ? '⭐ Офіційний Плейтест' : '✨ Додатковий Архетип'}
                                </span>
                                <h3 class="text-2xl font-bold vtm-font uppercase text-white">${currentSire.name}</h3>
                            </div>
                            <p class="text-xs text-purple-200/90 italic mt-2 leading-relaxed max-w-3xl">${currentSire.desc}</p>
                            ${currentSire.relationship ? `
                                <div class="mt-2 text-xs text-purple-300/90 bg-purple-950/40 p-2 rounded-lg border border-purple-900/60 inline-block">
                                    <span class="font-bold text-purple-200 uppercase text-[10px]">Стосунки:</span> ${currentSire.relationship}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Special Clan Selector for Adoptive Sire -->
                    ${currentSire.id === 'adoptive_sire' ? `
                        <div class="pt-4 mt-3 border-t border-purple-900/60">
                            <label class="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                                🏰 Оберіть Клан вашого Прийомного Сіра:
                            </label>
                            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1 bg-purple-950/30 rounded-xl border border-purple-900/40">
                                ${clans.map(c => {
                                    const isClanSel = (v6State.adoptiveSireClan || 'toreador') === c.id;
                                    return `
                                        <button onclick="setV6AdoptiveSireClan('${c.id}')" class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                            isClanSel 
                                                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400 font-bold' 
                                                : 'bg-zinc-800/80 text-zinc-300 hover:bg-purple-900/60 hover:text-white border border-zinc-700/50'
                                        }">
                                            ${c.name.split(' (')[0]}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Special Clan Selector for Brood Child -->
                    ${currentSire.id === 'brood_child' ? `
                        <div class="pt-4 mt-3 border-t border-purple-900/60">
                            <label class="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                                🦇 Оберіть Клан вашого співвиводця (Broodmate):
                            </label>
                            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1 bg-purple-950/30 rounded-xl border border-purple-900/40">
                                ${clans.map(c => {
                                    const isClanSel = (v6State.broodmateClan || 'gangrel') === c.id;
                                    return `
                                        <button onclick="setV6BroodmateClan('${c.id}')" class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                            isClanSel 
                                                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400 font-bold' 
                                                : 'bg-zinc-800/80 text-zinc-300 hover:bg-purple-900/60 hover:text-white border border-zinc-700/50'
                                        }">
                                            ${c.name.split(' (')[0]}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Bonus Discipline Picker (Purple Themed) -->
                    ${disciplineOptions && disciplineOptions.length > 0 ? `
                        <div class="pt-4 mt-3 border-t border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                <span>🔮</span> Оберіть бонусну Дисципліну від Сіра (+1 ⬤):
                            </span>
                            <div class="flex flex-wrap gap-2">
                                ${disciplineOptions.map(discId => {
                                    const discObj = getV6Disciplines().find(d => d.id === discId);
                                    const isChosen = v6State.sireBonusDiscipline === discId;
                                    return `
                                        <button onclick="setV6SireBonusDiscipline('${discId}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                                            isChosen 
                                                ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-300 scale-105' 
                                                : 'bg-purple-950/50 text-purple-200 border border-purple-800/60 hover:bg-purple-900/60 hover:text-white'
                                        }">
                                            <span>${discObj ? discObj.name.split(' (')[0] : discId}</span>
                                            <span class="text-[10px] ${isChosen ? 'text-purple-100' : 'text-purple-300'}">+1 ⬤</span>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <!-- Category Filter Tabs -->
            <div class="flex flex-wrap items-center gap-2 mb-6 border-b border-zinc-200 pb-3">
                <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">Категорія Сіра:</span>
                <button onclick="setV6SireCategoryFilter('playtest')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    v6SireFilter === 'playtest' 
                        ? 'bg-purple-700 text-white shadow-sm' 
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }">
                    <span>⭐ Офіційні з плейтесту</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded-full ${v6SireFilter === 'playtest' ? 'bg-purple-900 text-purple-200' : 'bg-zinc-200 text-zinc-600'}">${playtestCount}</span>
                </button>
                <button onclick="setV6SireCategoryFilter('custom')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    v6SireFilter === 'custom' 
                        ? 'bg-purple-700 text-white shadow-sm' 
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }">
                    <span>✨ Додаткові архетипи</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded-full ${v6SireFilter === 'custom' ? 'bg-purple-900 text-purple-200' : 'bg-zinc-200 text-zinc-600'}">${customCount}</span>
                </button>
                <button onclick="setV6SireCategoryFilter('all')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    v6SireFilter === 'all' 
                        ? 'bg-purple-700 text-white shadow-sm' 
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }">
                    <span>Усі варіанти</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded-full ${v6SireFilter === 'all' ? 'bg-purple-900 text-purple-200' : 'bg-zinc-200 text-zinc-600'}">${allSires.length}</span>
                </button>
            </div>

            <!-- Sire Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                ${filteredSires.map(s => {
                    const isSel = v6State.sire === s.id;
                    const isPlaytest = s.category === 'playtest';
                    const sOptions = getV6SireDisciplineOptions(s);
                    return `
                        <div onclick="selectV6Sire('${s.id}')" class="cursor-pointer rounded-2xl p-5 transition-all border-2 flex flex-col justify-between ${
                            isSel 
                                ? 'border-purple-800 bg-purple-50/40 shadow-md ring-2 ring-purple-800/20' 
                                : 'border-zinc-200 bg-zinc-50/50 hover:border-purple-300 hover:bg-white'
                        }">
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <h3 class="text-sm font-bold text-zinc-900 vtm-font uppercase">${s.name}</h3>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${isPlaytest ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-zinc-200 text-zinc-700'}">
                                            ${isPlaytest ? '⭐ Плейтест' : '✨ Додатковий'}
                                        </span>
                                        ${isSel ? '<span class="text-xs font-bold text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded">Обрано</span>' : ''}
                                    </div>
                                </div>
                                <p class="text-xs text-zinc-600 leading-relaxed mb-3">${s.desc}</p>
                                ${s.relationship ? `
                                    <p class="text-[11px] text-zinc-500 italic mb-3 bg-white p-2 rounded-lg border border-zinc-100">
                                        <strong class="text-zinc-700">Стосунки:</strong> ${s.relationship}
                                    </p>
                                ` : ''}
                            </div>
                            <div class="pt-3 border-t border-zinc-200">
                                <div class="text-[11px] font-bold text-purple-900 mb-1 flex items-center gap-1">
                                    <span>🔮</span> ${s.isClanChoice ? 'Дисципліни обраного клану:' : 'Дисципліни на вибір:'}
                                </div>
                                <div class="flex flex-wrap gap-1">
                                    ${(sOptions || []).map(d => {
                                        const discObj = getV6Disciplines().find(item => item.id === d);
                                        return `<span class="text-[10px] bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-semibold">${discObj ? discObj.name.split(' (')[0] : d}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="flex justify-between pt-4 border-t border-zinc-100">
                <button onclick="goToV6Step(2)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад
                </button>
                <button onclick="goToV6Step(4)" class="px-8 py-2.5 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Життєві Шляхи ➔
                </button>
            </div>
        </div>
    `;
}

function selectV6Sire(sireId) {
    v6State.sire = sireId;
    const sObj = getV6Sires().find(s => s.id === sireId);
    const options = getV6SireDisciplineOptions(sObj);
    if (options && options.length > 0) {
        if (!v6State.sireBonusDiscipline || !options.includes(v6State.sireBonusDiscipline)) {
            v6State.sireBonusDiscipline = options[0];
        }
    }
    recalculateV6Disciplines();
    renderV6UI();
}

function setV6SireBonusDiscipline(discId) {
    v6State.sireBonusDiscipline = discId;
    recalculateV6Disciplines();
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 4: LIFEPATHS (Mortal vs Vampire Categorization)
// -----------------------------------------------------------------------------
function renderLifepathDots(currentDots, maxDots, lpId, targetId, isSkill) {
    const fnName = isSkill ? 'allocateV6LifepathSkill' : 'allocateV6LifepathResource';
    let html = '<div class="flex gap-1 items-center">';
    for (let i = 1; i <= maxDots; i++) {
        const isFilled = i <= currentDots;
        html += `<button type="button" onclick="event.stopPropagation(); ${fnName}('${lpId}', '${targetId}', ${i});" class="w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
            isFilled ? 'bg-[#8b0000] ring-1 ring-red-900 shadow-xs' : 'bg-zinc-200 hover:bg-zinc-300 border border-zinc-300'
        }" title="${i}"></button>`;
    }
    html += '</div>';
    return html;
}

function renderLifepathCard(lp, maxPaths) {
    const isSel = (v6State.lifepaths || []).includes(lp.id);
    const isVampire = lp.type === 'vampire' || lp.type === 'neonate' || lp.type === 'ancilla';
    
    let contentHtml = '';
    if (!isSel) {
        const skillsList = Array.isArray(lp.skills) ? lp.skills.map(s => GLOBAL_SKILLS_MAP[s] || s).join(', ') : 'Бонус навичок';
        const resList = Array.isArray(lp.resources) ? lp.resources.map(r => GLOBAL_RESOURCES_MAP[r] || r).join(', ') : 'Бонус ресурсів';
        contentHtml = `
            <div class="flex items-start gap-1">
                <span class="font-bold text-zinc-900 shrink-0">🎯 Навички:</span>
                <span class="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">${lp.skillsBonusText || skillsList}</span>
            </div>
            <div class="flex items-start gap-1">
                <span class="font-bold text-zinc-900 shrink-0">🏰 Ресурси:</span>
                <span class="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">${lp.resourcesBonusText || resList}</span>
            </div>
        `;
    } else {
        const lpSkillAllocs = (v6State.lifepathSkillAllocations && v6State.lifepathSkillAllocations[lp.id]) || {};
        const spentSkills = Object.values(lpSkillAllocs).reduce((a, b) => a + b, 0);
        const lpResAllocs = (v6State.lifepathResourceAllocations && v6State.lifepathResourceAllocations[lp.id]) || {};
        const spentRes = Object.values(lpResAllocs).reduce((a, b) => a + b, 0);

        const skillsRows = (Array.isArray(lp.skills) ? lp.skills : []).map(sk => {
            const dots = lpSkillAllocs[sk] || 0;
            return `
                <div class="flex justify-between items-center text-[11px] py-0.5">
                    <span class="text-zinc-800 font-medium">${GLOBAL_SKILLS_MAP[sk] || sk}</span>
                    ${renderLifepathDots(dots, 3, lp.id, sk, true)}
                </div>
            `;
        }).join('');

        const resRows = (Array.isArray(lp.resources) ? lp.resources : []).map(res => {
            const dots = lpResAllocs[res] || 0;
            return `
                <div class="flex justify-between items-center text-[11px] py-0.5">
                    <span class="truncate pr-1 text-zinc-800 font-medium">${GLOBAL_RESOURCES_MAP[res] || res}</span>
                    ${renderLifepathDots(dots, 3, lp.id, res, false)}
                </div>
            `;
        }).join('');

        contentHtml = `
            <div class="border-b border-zinc-200 pb-2 mb-2">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-zinc-900 text-xs">🎯 Навички (5 очок)</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${spentSkills === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${spentSkills} / 5</span>
                </div>
                <div class="space-y-0.5 pl-2 border-l-2 border-emerald-300">
                    ${skillsRows}
                </div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-zinc-900 text-xs">🏰 Ресурси (3 очки)</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${spentRes === 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${spentRes} / 3</span>
                </div>
                <div class="space-y-0.5 pl-2 border-l-2 border-emerald-300">
                    ${resRows}
                </div>
            </div>
        `;
    }

    const typeBadge = isVampire ? '🦇 Шлях Вампіра' : '🏛️ Шлях Смертного';
    const badgeClass = isVampire ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-amber-100 text-amber-900 border-amber-200';

    return `
        <div onclick="toggleV6Lifepath('${lp.id}', ${maxPaths})" class="cursor-pointer rounded-2xl p-5 transition-all border-2 flex flex-col justify-between ${
            isSel 
                ? 'border-[#8b0000] bg-red-50/40 shadow-md ring-2 ring-red-900/20' 
                : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white'
        }">
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}">
                        ${typeBadge}
                    </span>
                    <input type="checkbox" ${isSel ? 'checked' : ''} class="rounded text-[#8b0000] pointer-events-none">
                </div>
                <h3 class="text-base font-bold text-zinc-900 vtm-font uppercase mb-1">${lp.name}</h3>
                <p class="text-xs text-zinc-600 leading-relaxed mb-3">${lp.desc}</p>
            </div>
            <div class="pt-3 border-t border-zinc-200 space-y-1.5 text-[11px] text-zinc-700 bg-white/80 p-2.5 rounded-xl border border-zinc-200/70">
                ${contentHtml}
            </div>
        </div>
    `;
}

function renderV6Step4_Lifepaths() {
    const tierObj = getV6Tier();
    const maxPaths = tierObj ? tierObj.lifepathsCount : 2;
    const allPaths = getV6Lifepaths();
    const currentFilter = v6State.lifepathFilter || 'all';

    const mortalPaths = allPaths.filter(p => p.type === 'mortal');
    const vampirePaths = allPaths.filter(p => p.type === 'vampire' || p.type === 'neonate' || p.type === 'ancilla');
    
    let displayedPaths = allPaths;
    if (currentFilter === 'mortal') displayedPaths = mortalPaths;
    else if (currentFilter === 'vampire') displayedPaths = vampirePaths;

    const selectedMortalCount = v6State.lifepaths.filter(id => {
        const p = allPaths.find(x => x.id === id);
        return p && p.type === 'mortal';
    }).length;

    const selectedVampireCount = v6State.lifepaths.filter(id => {
        const p = allPaths.find(x => x.id === id);
        return p && (p.type === 'vampire' || p.type === 'neonate' || p.type === 'ancilla');
    }).length;

    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 4 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">Життєві Шляхи (Lifepaths)</h2>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-xs font-bold px-4 py-2 rounded-xl border ${
                        v6State.lifepaths.length === maxPaths ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }">
                        Обрано: ${v6State.lifepaths.length} / ${maxPaths} шляхів
                    </div>
                </div>
            </div>

            <p class="text-xs text-zinc-600 mb-6 leading-relaxed">
                Життєві шляхи діляться на <strong class="text-zinc-900 font-bold">Шляхи Смертного (Mortal)</strong> — минуле життя до Обернення, та <strong class="text-zinc-900 font-bold">Шляхи Вампіра (Vampire)</strong> — ваша діяльність і роль у спільноті сородичів. Бонусні навички та ресурси від обраних шляхів <strong class="text-emerald-700 font-bold">автоматично виділяються зеленим кольором</strong> у наступних вкладках.
            </p>

            <!-- Categorization Filter Tabs -->
            <div class="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-200">
                <div class="flex flex-wrap gap-2">
                    <button onclick="setV6LifepathFilter('all')" class="px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        currentFilter === 'all' 
                            ? 'bg-[#8b0000] text-white shadow' 
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }">
                        🌐 Усі шляхи (${allPaths.length})
                    </button>
                    <button onclick="setV6LifepathFilter('mortal')" class="px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                        currentFilter === 'mortal' 
                            ? 'bg-[#8b0000] text-white shadow' 
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }">
                        <span>🏛️ Шляхи Смертного (${mortalPaths.length})</span>
                        ${selectedMortalCount > 0 ? `<span class="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">${selectedMortalCount}</span>` : ''}
                    </button>
                    <button onclick="setV6LifepathFilter('vampire')" class="px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                        currentFilter === 'vampire' 
                            ? 'bg-[#8b0000] text-white shadow' 
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }">
                        <span>🦇 Шляхи Вампіра (${vampirePaths.length})</span>
                        ${selectedVampireCount > 0 ? `<span class="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">${selectedVampireCount}</span>` : ''}
                    </button>
                </div>
                <div class="text-xs text-zinc-500">
                    Смертних обрано: <strong class="text-zinc-900">${selectedMortalCount}</strong> • Вампірських: <strong class="text-zinc-900">${selectedVampireCount}</strong>
                </div>
            </div>

            <!-- Lifepaths Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                ${displayedPaths.map(lp => renderLifepathCard(lp, maxPaths)).join('')}
            </div>

            <div class="flex justify-between pt-4 border-t border-zinc-100">
                <button onclick="goToV6Step(3)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад
                </button>
                <button onclick="goToV6Step(5)" class="px-8 py-2.5 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Атрибути й Навички ➔
                </button>
            </div>
        </div>
    `;
}

function setV6LifepathFilter(filter) {
    v6State.lifepathFilter = filter;
    renderV6UI();
}

function toggleV6Lifepath(lpId, maxCount) {
    const idx = v6State.lifepaths.indexOf(lpId);
    if (idx >= 0) {
        v6State.lifepaths.splice(idx, 1);
        if (v6State.lifepathSkillAllocations) delete v6State.lifepathSkillAllocations[lpId];
        if (v6State.lifepathResourceAllocations) delete v6State.lifepathResourceAllocations[lpId];
    } else {
        if (v6State.lifepaths.length < maxCount) {
            v6State.lifepaths.push(lpId);
        } else {
            const removed = v6State.lifepaths.shift();
            if (removed) {
                if (v6State.lifepathSkillAllocations) delete v6State.lifepathSkillAllocations[removed];
                if (v6State.lifepathResourceAllocations) delete v6State.lifepathResourceAllocations[removed];
            }
            v6State.lifepaths.push(lpId);
        }
    }
    applyV6LifepathBonuses();
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 5: ATTRIBUTES (5e KEYS) & CONDENSED SKILLS (13 SKILLS + FOCUSES)
// -----------------------------------------------------------------------------
function renderV6Step5_AttributesSkills() {
    const tierObj = getV6Tier();
    const attrDots = tierObj ? tierObj.attributeDots : [7, 5, 3];
    const freeSkillDotsAllowed = tierObj ? tierObj.freeSkillDots : 8;

    const lpSkillBonuses = getV6LifepathSkillBonuses();

    if (!v6State.attributePriority) v6State.attributePriority = ['physical', 'social', 'mental'];
    const attrLimits = {
        [v6State.attributePriority[0]]: attrDots[0],
        [v6State.attributePriority[1]]: attrDots[1],
        [v6State.attributePriority[2]]: attrDots[2]
    };

    const physicalSpent = (v6State.attributes.strength - 1) + (v6State.attributes.dexterity - 1) + (v6State.attributes.stamina - 1);
    const socialSpent = (v6State.attributes.charisma - 1) + (v6State.attributes.manipulation - 1) + (v6State.attributes.composure - 1);
    const mentalSpent = (v6State.attributes.intelligence - 1) + (v6State.attributes.wits - 1) + (v6State.attributes.resolve - 1);
    
    const freeSkillDotsSpent = Object.keys(v6State.skills).reduce((acc, key) => {
        const lpBonus = lpSkillBonuses[key] || 0;
        const current = v6State.skills[key] || 0;
        return acc + Math.max(0, current - lpBonus);
    }, 0);

    const ATTR_DOT_DESCS = {
        1: "Погано (Poor) — Слабкий, нижче середнього.",
        2: "Середньо (Average) — Звичайний рівень для більшості людей.",
        3: "Добре (Good) — Вище середнього, тренований.",
        4: "Видатно (Exceptional) — Високий професіоналізм, експерт.",
        5: "Винятково (Outstanding) — Світовий клас, пік людських можливостей."
    };

    const getLimitColor = (spent, limit) => {
        if (spent === limit) return 'text-emerald-700';
        if (spent > limit) return 'text-red-600 font-bold';
        return 'text-[#8b0000]';
    };

    // Official 5e / V6 playtest Ukrainian attribute definitions
    const ATTRIBUTE_CATEGORIES = [
        {
            key: 'physical',
            label: 'Фізичні Атрибути',
            icon: '💪',
            spent: physicalSpent,
            attrs: [
                { 
                    id: 'strength', 
                    name: 'Міць (Strength)', 
                    desc: "Фізична вправність, груба сила та те, яку вагу ви можете підняти. Впливає на те, скільки ушкоджень ви можете завдати в ближньому бою, на силу вашого хвату та на те, скільки Віте ви можете випити з жертви за один хід.",
                    dots: {
                        1: "•: Ви кволі й насилу переносите важкі предмети. Ви можете підняти до 20 кг.",
                        2: "••: Ви маєте середню статуру й можете якийсь час переносити важкі предмети, перш ніж вам знадобиться відпочинок. Ви можете підняти до 50 кг.",
                        3: "•••: Ви сильні й, імовірно, можете вибити дерев'яні двері без особливих зусиль. Ви можете підняти до 100 кг.",
                        4: "••••: Ви надзвичайно сильні й можете гнути труби та інші міцні предмети. Ви можете підняти до 200 кг.",
                        5: "•••••: Ви один із найсильніших людей у світі й могли б вибити укріплені залізні двері. Ви можете підняти до 300 кг."
                    }
                },
                { 
                    id: 'dexterity', 
                    name: 'Спритність (Dexterity)', 
                    desc: "Визначає вашу рухливість і граційність. Як швидко ви можете ухилитися від кілка в серце та який у вас контроль над дрібною моторикою, коли ви поспішаєте.",
                    dots: {
                        1: "•: Ви вмієте бігати, але вам складно тримати рівновагу чи ухилятися.",
                        2: "••: Ви здатні швидко бігати й іноді здаєтеся граційними.",
                        3: "•••: Ваша жвавість вражає. Ваша координація — як у будь-кого натренованого аматора.",
                        4: "••••: Вам варто зайнятися акробатикою: мало хто з людей може рухатися так, як ви.",
                        5: "•••••: Ваші рухи плавні й гіпнотичні — майже надлюдські."
                    }
                },
                { 
                    id: 'stamina', 
                    name: 'Витривалість (Stamina)', 
                    desc: "Це ваша фізична стійкість. Витривалість дає змогу витримувати фізичну шкоду (байдуже, від кулі чи від клинка мисливця), вистоювати інші небезпеки й докладати важких зусиль. Ваше здоров'я дорівнює значенню витривалості + 3.",
                    dots: {
                        1: "•: Навіть невеликі зусилля виснажують вас.",
                        2: "••: Ви можете витримати кілька ударів, але краще завчасно поступитися.",
                        3: "•••: Кілька днів важкого походу з рюкзаком для вас не проблема.",
                        4: "••••: Ви можете перемогти в марафоні або витримати неймовірний біль, принаймні фізичний.",
                        5: "•••••: Навіть якби ви були смертними, вам би ніколи не довелося пітніти."
                    }
                }
            ]
        },
        {
            key: 'social',
            label: 'Соціальні Атрибути',
            icon: '🗣️',
            spent: socialSpent,
            attrs: [
                { 
                    id: 'charisma', 
                    name: 'Харизма (Charisma)', 
                    desc: "Визначає природну чарівність, витонченість і сексуальну привабливість. Якщо вона у вас є, то ви притягуєте до себе людей, що дуже спрощує полювання й харчування. Харизма не залежить від привабливої зовнішності.",
                    dots: {
                        1: "•: Ви здатні чітко говорити, але мало хто буде вас слухати.",
                        2: "••: Ви загалом приємні, попри свою немертву природу. У вас навіть можуть бути друзі.",
                        3: "•••: Люди беззастережно вам довіряють, і ви легко заводите друзів.",
                        4: "••••: Ви маєте внутрішній магнетизм, і прихильники липнуть до вас, як бджоли до меду.",
                        5: "•••••: Ви могли б очолити повстання в місті, якби захотіли."
                    }
                },
                { 
                    id: 'manipulation', 
                    name: 'Маніпулювання (Manipulation)', 
                    desc: "Це вміння схиляти інших до своїх поглядів і переконливо брехати так, що ніхто навіть не підозрюватиме про обман.",
                    dots: {
                        1: "•: Поки ви залишаєтеся чесними, ви можете переконувати інших робити те, що потрібно вам.",
                        2: "••: Ваше вміння обманювати легко схиляє слабовольних і наївних.",
                        3: "•••: Ви ніколи не платите повну ціну за товари чи послуги.",
                        4: "••••: Ви могли б стати лідером секти або політиком.",
                        5: "•••••: Ви здатні переконати Принца інвестувати в нерухомість посеред пустелі або навіть відкликати кровне полювання на себе."
                    }
                },
                { 
                    id: 'composure', 
                    name: 'Витримка (Composure)', 
                    desc: "Дає змогу залишатися спокійним, керувати своїми емоціями та вгамовувати інших. Вона також відповідає за вміння залишатися холоднокровним у будь-яких ситуаціях — від перестрілки до інтимних взаємодій. Витримка + рішучість разом складають Силу волі.",
                    dots: {
                        1: "•: Найменша образа чи конфлікт можуть довести вас до шаленства.",
                        2: "••: Ви можете приглушити свої хижацькі інстинкти в більшості неконфліктних ситуацій.",
                        3: "•••: Інші шукають вашої поради, коли ситуація виходить з-під контролю.",
                        4: "••••: Ви без зусиль блефуєте в картярських іграх і маєте трохи контролю над своїм Звіром.",
                        5: "•••••: Внутрішній Звір — ваша домашня тваринка."
                    }
                }
            ]
        },
        {
            key: 'mental',
            label: 'Ментальні Атрибути',
            icon: '🧠',
            spent: mentalSpent,
            attrs: [
                { 
                    id: 'intelligence', 
                    name: 'Інтелект (Intelligence)', 
                    desc: "Визначає ваше вміння міркувати, аналізувати й застосовувати логіку. Ви можете згадувати й обдумувати інформацію, отриману з книг чи власних відчуттів. Жодна загадка чи таємниця не встоїть перед справжнім інтелектуалом.",
                    dots: {
                        1: "•: Ви вмієте впевнено читати й писати, хоча деякі терміни спантеличують вас.",
                        2: "••: Ви достатньо розумні, щоб усвідомлювати власні обмеження.",
                        3: "•••: Ваш світлий розум здатен без проблем тлумачити підказки, щоб упоратися із загадкою.",
                        4: "••••: Члени клану Тремі, імовірно, консультуються з вами через вашу мудрість.",
                        5: "•••••: Слово «геній» не охоплює всю глибину й розмах ваших розумових здібностей."
                    }
                },
                { 
                    id: 'wits', 
                    name: 'Кмітливість (Wits)', 
                    desc: "Означає здатність думати швидко й правильно реагувати, маючи обмаль інформації. «Ви почули звук» — це кмітливість. «Ви чуєте, як наближаються двоє охоронців» — це інтелект. Кмітливість дає вам змогу відчути запах ворога в засідці або миттю вигадати відповідь гарпії при дворі, не чекаючи наступної ночі.",
                    dots: {
                        1: "•: Ви все розумієте, але не відразу.",
                        2: "••: Ви здатні зробити правильну ставку в покері або вчасно смикнути аварійні гальма. Зазвичай.",
                        3: "•••: Ви вмієте проаналізувати ситуацію та швидко прокласти найкращий шлях відступу.",
                        4: "••••: Вас неможливо застати зненацька, і ви завжди вигадуєте кмітливий випад у відповідь.",
                        5: "•••••: Ви думаєте й реагуєте швидше, ніж більшість людей здатна збагнути."
                    }
                },
                { 
                    id: 'resolve', 
                    name: 'Рішучість (Resolve)', 
                    desc: "Визначає зосередженість і цілеспрямованість, а також концентрацію та ментальну стійкість. Рішучість дає сили для вартування впродовж усієї ночі та не дає відволікатися. Витримка + рішучість разом складають Силу волі.",
                    dots: {
                        1: "•: Вам важко тримати увагу на чомусь, крім найнагальніших справ.",
                        2: "••: Ви здатні налаштуватися на тривалу й нудну роботу, якщо вона не занадто тривала.",
                        3: "•••: Щоби відволікти вас, потрібно більше зусиль, ніж більшість готова витратити.",
                        4: "••••: Завдяки зусиллю волі ви можете знайти шлях до розв'язання задачі, попри будь-які перешкоди.",
                        5: "•••••: Ви здатні розмірковувати під час стрілянини або стежити за дверима під час кривавої оргії, після чого акуратно прибрати кожну гільзу чи пролиту краплину."
                    }
                }
            ]
        }
    ];

    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 5 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">9 Характеристик та 13 Навичок</h2>
                </div>
            </div>

            <!-- Sticky Attribute Counter -->
            <div class="sticky top-0 z-10 bg-white/95 backdrop-blur py-3 border-b border-zinc-200 mb-6 shadow-sm rounded-b-xl px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <span class="text-zinc-500">Витрачено:</span>
                    <span class="${getLimitColor(physicalSpent, attrLimits['physical'])}">Фіз: ${physicalSpent}/${attrLimits['physical']}</span>
                    <span class="${getLimitColor(socialSpent, attrLimits['social'])}">Соц: ${socialSpent}/${attrLimits['social']}</span>
                    <span class="${getLimitColor(mentalSpent, attrLimits['mental'])}">Мен: ${mentalSpent}/${attrLimits['mental']}</span>
                </div>
            </div>

            <!-- ATTRIBUTES SECTION (5e Names) -->
            <div class="mb-10">
                <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                    <span>⚡</span> 9 Характеристик (Attributes — 5e Keys)
                </h3>

                <!-- Priority Selection -->
                <div class="mb-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${[0, 1, 2].map(index => {
                            const priorities = ['physical', 'social', 'mental'];
                            const labels = {
                                physical: 'Фізичні (Physical)',
                                social: 'Соціальні (Social)',
                                mental: 'Ментальні (Mental)'
                            };
                            const descriptions = [
                                `Оберіть одну категорію як головний фокус; вона отримує найбільше крапок (${attrDots[0]} крапок).`,
                                `Оберіть другу категорію як вторинну; вона отримує другу за величиною кількість крапок (${attrDots[1]} крапок).`,
                                `Третя категорія отримує найменше крапок (${attrDots[2]} крапки).`
                            ];
                            const titles = ['Головний фокус (Primary)', 'Вторинна (Secondary)', 'Третинна (Tertiary)'];
                            
                            return `
                                <div>
                                    <label class="block text-xs font-bold text-zinc-900 uppercase tracking-widest mb-1">
                                        ${titles[index]}
                                    </label>
                                    <select onchange="setV6AttributePriority(${index}, this.value)" class="w-full p-2 text-sm border border-zinc-300 rounded outline-none focus:border-[#8b0000] mb-2 font-bold bg-white text-zinc-900">
                                        ${priorities.map(p => `
                                            <option value="${p}" ${v6State.attributePriority[index] === p ? 'selected' : ''}>${labels[p]}</option>
                                        `).join('')}
                                    </select>
                                    <p class="text-[10px] text-zinc-500 leading-relaxed italic">${descriptions[index]}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${ATTRIBUTE_CATEGORIES.map(cat => `
                        <div class="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 flex flex-col justify-between">
                            <div>
                                <h4 class="font-bold text-zinc-900 uppercase text-sm mb-4 border-b border-zinc-200 pb-2 flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2"><span>${cat.icon}</span> ${cat.label}</div>
                                    <span class="text-xs ${cat.spent > 0 ? 'bg-[#8b0000] text-white' : 'bg-zinc-200 text-zinc-600'} px-2 py-0.5 rounded-full">${cat.spent}</span>
                                </h4>
                                <div class="space-y-4">
                                    ${cat.attrs.map(attr => `
                                        <div class="mb-3">
                                            <div class="flex items-center justify-between mb-1.5">
                                                <span class="text-xs font-serif text-zinc-900 font-bold">${attr.name}</span>
                                                <div class="flex gap-1">
                                                    ${[1, 2, 3, 4, 5].map(dot => `
                                                        <button onclick="setV6Attribute('${attr.id}', ${dot})" title="${(attr.dots[dot] || '').replace(/"/g, '&quot;')}" class="w-5 h-5 rounded-full border border-zinc-400 transition-all ${
                                                            dot <= v6State.attributes[attr.id] ? 'bg-[#8b0000] border-[#8b0000]' : 'bg-white hover:bg-zinc-200'
                                                        }"></button>
                                                    `).join('')}
                                                </div>
                                            </div>
                                            <div class="space-y-1">
                                                <p class="text-[10px] text-zinc-500 leading-snug">${attr.desc}</p>
                                                <p class="text-[10px] text-[#8b0000] font-bold italic leading-snug bg-red-50 p-1.5 rounded border border-red-100">${attr.dots[v6State.attributes[attr.id]] || ''}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Sticky Skill Counter -->
            <div class="sticky top-0 z-10 bg-white/95 backdrop-blur py-3 border-b border-zinc-200 mb-6 shadow-sm rounded-b-xl px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-10">
                <div class="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <span class="text-zinc-500">Вільні Навички:</span>
                    <span class="${freeSkillDotsSpent === freeSkillDotsAllowed ? 'text-emerald-700' : (freeSkillDotsSpent > freeSkillDotsAllowed ? 'text-red-600' : 'text-[#8b0000]')}">
                        Витрачено: ${freeSkillDotsSpent} / ${freeSkillDotsAllowed}
                    </span>
                </div>
                <span class="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-1 rounded border border-zinc-200">Фокус (+1 кубик) обирається на 1, 3 та 5 крапках</span>
            </div>

            <!-- CONDENSED SKILLS SECTION (13 SKILLS) -->
            <div>
                <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                    <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase flex items-center gap-2">
                        <span>🎯</span> 13 Сфокусованих Навичок (Condensed Skills & Focuses)
                    </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    ${(() => {
                        return getV6Skills().map(skill => {
                            const currentDots = v6State.skills[skill.id] || 0;
                            const hasFocus1 = currentDots >= 1;
                            const skillFocuses = v6State.focuses[skill.id] || [];
                            const lpBonus = lpSkillBonuses[skill.id] || 0;
                            const hasLpBonus = lpBonus > 0;

                            return `
                                <div class="p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                    hasLpBonus 
                                        ? 'bg-emerald-50/40 border-emerald-300 shadow-sm ring-1 ring-emerald-900/10' 
                                        : 'bg-zinc-50 border-zinc-200'
                                }">
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="font-serif text-sm font-bold text-zinc-900">${skill.name}</span>
                                                ${hasLpBonus ? `
                                                    <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                                        🌱 +${lpBonus} Шлях
                                                    </span>
                                                ` : ''}
                                            </div>
                                            <div class="flex gap-1">
                                                ${[1, 2, 3, 4, 5].map(dot => {
                                                    const isFilled = dot <= currentDots;
                                                    const isLpDot = isFilled && dot <= lpBonus;
                                                    let dotClass = 'bg-white hover:bg-zinc-200 border-zinc-400';
                                                    if (isLpDot) {
                                                        dotClass = 'bg-emerald-600 border-emerald-600 shadow-sm shadow-emerald-200';
                                                    } else if (isFilled) {
                                                        dotClass = 'bg-[#8b0000] border-[#8b0000]';
                                                    }
                                                    return `
                                                        <button onclick="setV6Skill('${skill.id}', ${dot})" class="w-4 h-4 rounded-full border transition-all ${dotClass}"></button>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                        <p class="text-[11px] text-zinc-500 leading-tight mb-3">${skill.desc || 'Навичка'}</p>
                                    </div>

                                    <!-- Focus selection input -->
                                    <div class="pt-2 border-t border-zinc-200/80 space-y-2 mt-2">
                                        ${[1, 3, 5].map(level => {
                                            if (currentDots < level) return '';
                                            
                                            if (v6State.focuses[skill.id] && Array.isArray(v6State.focuses[skill.id])) {
                                                const oldArr = v6State.focuses[skill.id];
                                                v6State.focuses[skill.id] = {};
                                                if (oldArr[0]) v6State.focuses[skill.id][1] = oldArr[0];
                                                if (oldArr[1]) v6State.focuses[skill.id][3] = oldArr[1];
                                                if (oldArr[2]) v6State.focuses[skill.id][5] = oldArr[2];
                                            }
                                            
                                            const savedVal = (v6State.focuses[skill.id] || {})[level] || '';
                                            const predefined = skill.focuses || [];
                                            const isCustomFlag = v6State.customFocusFlags && v6State.customFocusFlags[skill.id] && v6State.customFocusFlags[skill.id][level];
                                            const isCustom = isCustomFlag || (savedVal !== '' && !predefined.includes(savedVal));
                                            const selectVal = isCustom ? 'custom' : savedVal;

                                            return `
                                                <div>
                                                    <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                                        Фокус навички (${level} крапк${level === 1 ? 'а' : (level === 5 ? 'ок' : 'и')}):
                                                    </label>
                                                    <select onchange="setV6SkillFocusLevel('${skill.id}', ${level}, this.value)" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-[11px] text-zinc-800 outline-none focus:border-[#8b0000] mb-1">
                                                        <option value="">-- Оберіть спеціалізацію --</option>
                                                        ${predefined.map(f => `
                                                            <option value="${f}" ${selectVal === f ? 'selected' : ''}>${f}</option>
                                                        `).join('')}
                                                        <option value="custom" ${isCustom ? 'selected' : ''}>Своя спеціалізація...</option>
                                                    </select>
                                                    ${isCustom ? `
                                                        <input type="text" placeholder="Введіть свою спеціалізацію..." 
                                                            value="${savedVal.replace(/"/g, '&quot;')}" 
                                                            onchange="setV6SkillFocusLevelCustom('${skill.id}', ${level}, this.value)"
                                                            class="w-full bg-white border border-[#8b0000]/50 rounded px-2 py-1 text-[11px] text-zinc-800 outline-none focus:border-[#8b0000]">
                                                    ` : ''}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('');
                    })()}
                </div>
            </div>

            <div class="flex justify-between pt-4 border-t border-zinc-100">
                <button onclick="goToV6Step(4)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад
                </button>
                <button onclick="goToV6Step(6)" class="px-8 py-2.5 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Дисципліни та Риси ➔
                </button>
            </div>
        </div>
    `;
}

function setV6AttributePriority(levelIndex, newCategory) {
    if (!v6State.attributePriority) v6State.attributePriority = ['physical', 'social', 'mental'];
    const oldCategory = v6State.attributePriority[levelIndex];
    if (oldCategory === newCategory) return;
    
    const conflictIndex = v6State.attributePriority.indexOf(newCategory);
    if (conflictIndex !== -1) {
        v6State.attributePriority[conflictIndex] = oldCategory;
    }
    v6State.attributePriority[levelIndex] = newCategory;
    
    renderV6UI();
}

function setV6Attribute(attrKey, dots) {
    if (v6State.attributes[attrKey] === dots && dots > 1) {
        v6State.attributes[attrKey] = dots - 1;
    } else {
        v6State.attributes[attrKey] = Math.max(1, dots);
    }
    renderV6UI();
}

function setV6Skill(skillId, dots) {
    const lpSkillBonuses = getV6LifepathSkillBonuses();
    const minDots = lpSkillBonuses[skillId] || 0;
    if (v6State.skills[skillId] === dots && dots > minDots) {
        v6State.skills[skillId] = dots - 1;
    } else {
        v6State.skills[skillId] = Math.max(minDots, dots);
    }
    renderV6UI();
}

function setV6SkillFocusLevel(skillId, level, value) {
    if (!v6State.focuses) v6State.focuses = {};
    if (!v6State.focuses[skillId]) v6State.focuses[skillId] = {};
    if (!v6State.customFocusFlags) v6State.customFocusFlags = {};
    if (!v6State.customFocusFlags[skillId]) v6State.customFocusFlags[skillId] = {};
    
    if (value === 'custom') {
        v6State.customFocusFlags[skillId][level] = true;
        v6State.focuses[skillId][level] = ''; // clear out to let user type
    } else {
        v6State.customFocusFlags[skillId][level] = false;
        v6State.focuses[skillId][level] = value;
    }
    renderV6UI();
}

function setV6SkillFocusLevelCustom(skillId, level, value) {
    if (!v6State.focuses) v6State.focuses = {};
    if (!v6State.focuses[skillId]) v6State.focuses[skillId] = {};
    v6State.focuses[skillId][level] = value;
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 6: DISCIPLINES, MATURING POWERS, CLAN TRAITS & MERITS
// -----------------------------------------------------------------------------
function renderV6Step6_DisciplinesTraits() {
    const currentClan = getV6Clan();
    const tierObj = getV6Tier();
    
    // Check how many dots in disciplineDots (e.g. "3 + 1 від Сіра")
    let allowedDisciplineDots = 3;
    if (tierObj && tierObj.disciplineDots) {
        const match = tierObj.disciplineDots.match(/^(\d+)/);
        if (match) allowedDisciplineDots = parseInt(match[1]);
    }
    
    // Calculate spent dots (subtract 1 if it's the sire discipline)
    const spentDisciplineDots = Object.keys(v6State.disciplines).reduce((acc, discId) => {
        const isSireBonus = discId === v6State.sireBonusDiscipline;
        const count = v6State.disciplines[discId] || 0;
        return acc + Math.max(0, isSireBonus ? count - 1 : count);
    }, 0);

    const DISCIPLINE_ICONS = {
        animalism: 'data/Disciplines/Animalism_symbol.png',
        auspex: 'data/Disciplines/Auspex_symbol.png',
        blood_sorcery: 'data/Disciplines/Blood_Sorcery_symbol.png',
        celerity: 'data/Disciplines/Celerity_symbol.png',
        dominate: 'data/Disciplines/Dominate_symbol.png',
        fortitude: 'data/Disciplines/Fortitude_symbol.png',
        obfuscate: 'data/Disciplines/Obfuscate_symbol.png',
        oblivion: 'data/Disciplines/Oblivion_symbol.png',
        potence: 'data/Disciplines/Potence_symbol.png',
        presence: 'data/Disciplines/Presence_symbol.png',
        protean: 'data/Disciplines/Protean_symbol.png',
        thin_blood_alchemy: 'data/Disciplines/Alchemy_symbol.png',
        vicissitude: 'data/Disciplines/Protean_symbol.png',
        necromancy: 'data/Disciplines/Oblivion_symbol.png',
        corruption: 'data/Disciplines/Oblivion_symbol.png',
        tellurgy: 'data/Disciplines/Auspex_symbol.png'
    };

    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 6 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">Дисципліни, Сили [Maturing], Риси та Переваги</h2>
                </div>
            </div>

            <!-- Sticky Discipline Counter -->
            <div class="sticky top-0 z-10 bg-white/95 backdrop-blur py-3 border-b border-zinc-200 mb-6 shadow-sm rounded-b-xl px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <span class="text-zinc-500">Витрачені Крапки Дисциплін (без Сіра):</span>
                    <span class="${spentDisciplineDots === allowedDisciplineDots ? 'text-emerald-700' : (spentDisciplineDots > allowedDisciplineDots ? 'text-red-600' : 'text-[#8b0000]')}">
                        ${spentDisciplineDots} / ${allowedDisciplineDots}
                    </span>
                </div>
                <div class="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-1 rounded font-bold border border-zinc-200">
                    Доступно сил: ${v6State.selectedPowers ? v6State.selectedPowers.length : 0} / ${tierObj ? tierObj.disciplinePowers : 4}
                </div>
            </div>

            <!-- DISCIPLINES & POWERS -->
            <div class="mb-10">
                <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                    <span>🔮</span> Дисципліни та Сили Крові
                </h3>
                <div class="space-y-6">
                    ${getV6Disciplines().map(disc => {
                        const currentDots = v6State.disciplines[disc.id] || 0;
                        const isSireBonus = disc.id === v6State.sireBonusDiscipline;
                        const isClanDisc = currentClan && Array.isArray(currentClan.disciplines) && currentClan.disciplines.includes(disc.id);
                        const discIcon = DISCIPLINE_ICONS[disc.id]; // Path to PNG

                        if (currentDots === 0 && !isClanDisc && !isSireBonus) return '';

                        return `
                            <div class="p-6 rounded-2xl border transition-all ${
                                isSireBonus 
                                    ? 'bg-purple-50/30 border-purple-300 shadow-sm ring-1 ring-purple-900/10' 
                                    : 'bg-zinc-50 border-zinc-200'
                            }">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                    <div>
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <h4 class="font-bold text-lg text-zinc-900 vtm-font uppercase flex items-center gap-2">
                                                ${discIcon ? `<img src="${discIcon}" alt="${disc.name}" class="w-6 h-6 object-contain opacity-80" />` : `<span>🔮</span>`} 
                                                ${disc.name}
                                            </h4>
                                            ${isSireBonus ? `
                                                <span class="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                                    🔮 Від Сіра (+1 ⬤)
                                                </span>
                                            ` : ''}
                                            ${isClanDisc ? `
                                                <span class="bg-red-100 text-[#8b0000] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    🩸 Кланова
                                                </span>
                                            ` : ''}
                                        </div>
                                        <p class="text-xs text-zinc-500 mt-0.5">${disc.desc || 'Дисципліна сородичів'}</p>
                                    </div>
                                    <div class="flex gap-1 items-center">
                                        <span class="text-xs text-zinc-400 mr-2 font-bold uppercase">Крапки:</span>
                                        ${[1, 2, 3, 4, 5].map(dot => {
                                            const isFilled = dot <= currentDots;
                                            let dotClass = 'bg-white hover:bg-zinc-200 border-zinc-400';
                                            if (isFilled) {
                                                if (isSireBonus && dot === currentDots) {
                                                    dotClass = 'bg-purple-700 border-purple-700 shadow-sm shadow-purple-200';
                                                } else {
                                                    dotClass = 'bg-[#8b0000] border-[#8b0000]';
                                                }
                                            }
                                            return `
                                                <button onclick="setV6DisciplineDots('${disc.id}', ${dot})" class="w-5 h-5 rounded-full border transition-all ${dotClass}"></button>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>

                                <!-- Powers of this discipline -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-200">
                                    ${(disc.powers || []).map(power => {
                                        const isLearned = v6State.selectedPowers.includes(power.id);
                                        const canLearn = currentDots >= power.rank;
                                        return `
                                            <div onclick="${canLearn ? `toggleV6Power('${power.id}')` : ''}" class="p-4 rounded-xl border transition-all ${
                                                isLearned 
                                                    ? 'border-[#8b0000] bg-red-50/50 shadow-sm ring-1 ring-red-900/20' 
                                                    : (canLearn ? 'border-zinc-200 bg-white hover:border-zinc-300 cursor-pointer' : 'border-zinc-100 bg-zinc-100/50 opacity-50 cursor-not-allowed')
                                            }">
                                                <div class="flex items-center justify-between mb-1">
                                                    <span class="font-bold text-xs text-zinc-900">${power.name}</span>
                                                    <span class="text-[10px] font-bold text-[#8b0000] bg-red-100 px-2 py-0.5 rounded">${power.cost || '0'}</span>
                                                </div>
                                                <div class="text-[10px] text-zinc-400 font-semibold mb-2">Ранг: ${power.rank || 1} ⬤ • Тип: ${power.type || 'Пасивна'}</div>
                                                <p class="text-xs text-zinc-600 leading-relaxed mb-2">${power.desc || ''}</p>
                                                ${power.maturing ? `
                                                    <div class="text-[11px] text-red-900 bg-red-100/50 p-2 rounded-lg border border-red-200/50 mt-2">
                                                        <strong class="font-bold uppercase tracking-wider block text-[9px] text-red-950">📈 Розширення [Maturing]:</strong>
                                                        ${power.maturing}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- CLAN TRAITS -->
            ${currentClan && currentClan.traits && currentClan.traits.length > 0 ? `
                <div class="mb-10">
                    <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                        <span>🩸</span> Кланові Риси (${currentClan.name.split(' (')[0]})
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${currentClan.traits.map(trait => {
                            const isLocked = tierObj && tierObj.id === 'neonate' && trait.tier === 'ancilla';
                            const isSel = v6State.selectedClanTraits.includes(trait.id);
                            
                            return `
                                <div ${!isLocked ? `onclick="toggleV6ClanTrait('${trait.id}')"` : ''} class="p-4 rounded-xl border-2 transition-all ${
                                    isLocked ? 'border-zinc-200 bg-zinc-100 opacity-50 cursor-not-allowed' :
                                    (isSel ? 'border-[#8b0000] bg-red-50/40 shadow-sm ring-1 ring-red-900/20 cursor-pointer' : 'border-zinc-200 bg-zinc-50/50 hover:bg-white cursor-pointer')
                                }">
                                    <div class="flex items-center justify-between mb-1">
                                        <h4 class="font-bold text-sm text-zinc-900 flex items-center gap-2">
                                            ${isLocked ? '🔒 ' : ''}${trait.name}
                                        </h4>
                                        <span class="text-[10px] font-bold ${isLocked ? 'text-zinc-500' : 'text-[#8b0000]'} uppercase">${trait.tier || 'неонат'}</span>
                                    </div>
                                    <div class="text-[10px] text-zinc-400 mb-2">Вимога: ${trait.prereq || 'немає'}</div>
                                    <p class="text-xs ${isLocked ? 'text-zinc-500' : 'text-zinc-600'} leading-relaxed">${trait.desc || ''}</p>
                                    ${isLocked ? `<div class="mt-2 text-[10px] font-bold text-red-600 uppercase">Недоступно для Неоната</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- MERITS -->
            <div>
                <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                    <span>✨</span> Переваги (Merits)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${getV6Merits().map(merit => {
                        const isSel = v6State.selectedMerits.includes(merit.id);
                        return `
                            <div onclick="toggleV6Merit('${merit.id}')" class="p-4 rounded-xl border cursor-pointer transition-all ${
                                isSel ? 'border-[#8b0000] bg-red-50/40 shadow-sm ring-1 ring-red-900/20' : 'border-zinc-200 bg-white hover:bg-zinc-50'
                            }">
                                <div class="flex items-center justify-between mb-1">
                                    <h4 class="font-bold text-xs text-zinc-900">${merit.name}</h4>
                                    <input type="checkbox" ${isSel ? 'checked' : ''} class="rounded text-[#8b0000] pointer-events-none">
                                </div>
                                <div class="text-[10px] text-zinc-400 mb-2">Вимога: ${merit.prereq || 'немає'}</div>
                                <p class="text-[11px] text-zinc-600 leading-relaxed">${merit.desc || ''}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="flex justify-between pt-6 mt-8 border-t border-zinc-100">
                <button onclick="goToV6Step(5)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад
                </button>
                <button onclick="goToV6Step(7)" class="px-8 py-2.5 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Людяність і Натура ➔
                </button>
            </div>
        </div>
    `;
}

function setV6DisciplineDots(discId, dots) {
    const minDots = v6State.sireBonusDiscipline === discId ? 1 : 0;
    if (v6State.disciplines[discId] === dots && dots > minDots) {
        v6State.disciplines[discId] = dots - 1;
    } else {
        v6State.disciplines[discId] = Math.max(minDots, dots);
    }
    renderV6UI();
}

function toggleV6Power(powerId) {
    const idx = v6State.selectedPowers.indexOf(powerId);
    if (idx >= 0) v6State.selectedPowers.splice(idx, 1);
    else v6State.selectedPowers.push(powerId);
    renderV6UI();
}

function toggleV6ClanTrait(traitId) {
    const idx = v6State.selectedClanTraits.indexOf(traitId);
    if (idx >= 0) v6State.selectedClanTraits.splice(idx, 1);
    else v6State.selectedClanTraits.push(traitId);
    renderV6UI();
}

function toggleV6Merit(meritId) {
    const idx = v6State.selectedMerits.indexOf(meritId);
    if (idx >= 0) v6State.selectedMerits.splice(idx, 1);
    else v6State.selectedMerits.push(meritId);
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 7: HUMANITY SCALE & NATURE (DUALITY SYSTEM)
// -----------------------------------------------------------------------------
function renderV6Step7_HumanityNature() {
    const currentNature = getV6Nature();
    const currentClan = getV6Clan();

    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 7 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">Шкала Людяності та Ваша Натура</h2>
                </div>
                <div class="text-xs text-zinc-500 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200">
                    Вічна дуальність між Монструозним Звіром та Смертною Натурою.
                </div>
            </div>

            <!-- 7-POINT HUMANITY SCALE VISUALIZER -->
            <div class="bg-gradient-to-r from-red-950/20 via-zinc-50 to-emerald-950/20 p-6 rounded-2xl border border-zinc-200 mb-8">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-red-900 uppercase tracking-wider">🐺 Монструозне (Monstrous)</span>
                    <span class="text-xs font-bold text-zinc-700 uppercase tracking-widest">Нейтральний стан (Баланс)</span>
                    <span class="text-xs font-bold text-emerald-900 uppercase tracking-wider">🕊️ Смертне (Mortal)</span>
                </div>
                <div class="flex items-center justify-between gap-2 max-w-xl mx-auto py-2">
                    ${[-3, -2, -1, 0, 1, 2, 3].map(val => {
                        const isCurrent = v6State.humanityScale === val;
                        const label = val < 0 ? `М${Math.abs(val)}` : (val === 0 ? '0' : `С${val}`);
                        return `
                            <button onclick="setV6HumanityScale(${val})" class="w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-bold text-xs transition-all ${
                                isCurrent 
                                    ? (val < 0 ? 'bg-red-900 text-white scale-110 shadow-lg' : (val === 0 ? 'bg-zinc-800 text-white scale-110 shadow-lg' : 'bg-emerald-800 text-white scale-110 shadow-lg'))
                                    : 'bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                            }">
                                <span>${label}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- DUALITY TRACKERS (BEAST & NATURE) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- BEAST TRACKER -->
                <div class="bg-red-50/50 p-6 rounded-2xl border border-red-200">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-red-950 vtm-font uppercase">Трекер Звіра (Beast Tracker)</h4>
                        <span class="text-xs font-bold text-red-800">${v6State.beastTracker} / 5 заповнено</span>
                    </div>
                    <p class="text-xs text-red-900/80 mb-4">Звір клану: <strong class="text-red-950 font-bold">${currentClan ? currentClan.beast : 'Anti-Authority'}</strong>. 5 заповнених комірок провокують шаленство Звіра.</p>
                    <div class="flex gap-3">
                        ${[1, 2, 3, 4, 5].map(idx => `
                            <button onclick="setV6BeastTracker(${idx})" class="w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-xs ${
                                idx <= v6State.beastTracker ? 'border-red-800 bg-red-900 text-white shadow-sm' : 'border-red-300 bg-white text-red-900 hover:bg-red-50'
                            }">
                                ${idx}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- NATURE TRACKER -->
                <div class="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-200">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-emerald-950 vtm-font uppercase">Трекер Натури (Nature Tracker)</h4>
                        <span class="text-xs font-bold text-emerald-800">${v6State.natureTracker} / 5 заповнено</span>
                    </div>
                    <p class="text-xs text-emerald-900/80 mb-4">Натура: <strong class="text-emerald-950 font-bold">${currentNature ? currentNature.name : 'Автократ'}</strong>. 5 заповнених комірок викликають спалах (Outburst).</p>
                    <div class="flex gap-3">
                        ${[1, 2, 3, 4, 5].map(idx => `
                            <button onclick="setV6NatureTracker(${idx})" class="w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-xs ${
                                idx <= v6State.natureTracker ? 'border-emerald-800 bg-emerald-900 text-white shadow-sm' : 'border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50'
                            }">
                                ${idx}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- NATURES SELECTION GRID -->
            <div class="mb-8">
                <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                    <span>🎭</span> Оберіть вашу Натуру (Nature)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${getV6Natures().map(nat => {
                        const isSel = v6State.nature === nat.id;
                        return `
                            <div onclick="selectV6Nature('${nat.id}')" class="p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                isSel 
                                    ? 'border-[#8b0000] bg-red-50/40 shadow-md ring-2 ring-red-900/20' 
                                    : 'border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300'
                            }">
                                <div>
                                    <h4 class="font-bold text-sm text-zinc-900 vtm-font uppercase mb-1">${nat.name}</h4>
                                    <p class="text-xs text-zinc-600 leading-relaxed mb-3">${nat.desc || ''}</p>
                                </div>
                                <div class="pt-2 border-t border-zinc-200/80 text-[10px] space-y-1">
                                    <div class="text-emerald-800 font-semibold">💖 <span class="text-zinc-600">Розрада:</span> ${nat.indulging || 'спокій'}</div>
                                    <div class="text-red-800 font-semibold">💥 <span class="text-zinc-600">Зрив:</span> ${nat.outburstName || 'спалах'}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="flex justify-between pt-4 border-t border-zinc-100">
                <button onclick="goToV6Step(6)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад
                </button>
                <button onclick="goToV6Step(8)" class="px-8 py-2.5 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Ресурси та Зброя ➔
                </button>
            </div>
        </div>
    `;
}

function setV6HumanityScale(val) {
    v6State.humanityScale = val;
    renderV6UI();
}

function setV6BeastTracker(count) {
    v6State.beastTracker = v6State.beastTracker === count ? count - 1 : count;
    renderV6UI();
}

function setV6NatureTracker(count) {
    v6State.natureTracker = v6State.natureTracker === count ? count - 1 : count;
    renderV6UI();
}

function selectV6Nature(natureId) {
    v6State.nature = natureId;
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 8: RESOURCES & WEAPONS
// -----------------------------------------------------------------------------
function renderV6Step8_ResourcesWeapons() {
    return `
        <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-zinc-200 animate-[fadeIn_0.3s_ease]">
            <div class="border-b border-zinc-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-[#8b0000] uppercase tracking-widest">Крок 8 із 9 • Alpha 1.0</span>
                    <h2 class="text-3xl font-bold text-zinc-900 vtm-font uppercase mt-1">Ресурси, Активи та Зброя</h2>
                </div>
            </div>

            <!-- RESOURCES GRID -->
            <div class="mb-10">
                <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                    <span>🏰</span> Ресурси та Активи (Resources)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${(() => {
                        const lpResourceBonuses = getV6LifepathResourceBonuses();
                        return getV6Resources().map(res => {
                            const currentDots = v6State.resources[res.id] || 0;
                            const lpBonus = lpResourceBonuses[res.id] || 0;
                            const hasLpBonus = lpBonus > 0;

                            return `
                                <div class="p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                    hasLpBonus 
                                        ? 'bg-emerald-50/40 border-emerald-300 shadow-sm ring-1 ring-emerald-900/10' 
                                        : 'bg-zinc-50 border-zinc-200'
                                }">
                                    <div>
                                        <div class="flex items-center justify-between mb-1">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="font-serif text-sm font-bold text-zinc-900">${res.name}</span>
                                                ${hasLpBonus ? `
                                                    <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                                        🌱 +${lpBonus} Шлях
                                                    </span>
                                                ` : ''}
                                            </div>
                                            <div class="flex gap-1">
                                                ${[1, 2, 3, 4, 5].map(dot => {
                                                    const isFilled = dot <= currentDots;
                                                    const isLpDot = isFilled && dot <= lpBonus;
                                                    let dotClass = 'bg-white hover:bg-zinc-200 border-zinc-400';
                                                    if (isLpDot) {
                                                        dotClass = 'bg-emerald-600 border-emerald-600 shadow-sm shadow-emerald-200';
                                                    } else if (isFilled) {
                                                        dotClass = 'bg-[#8b0000] border-[#8b0000]';
                                                    }
                                                    return `
                                                        <button onclick="setV6ResourceDots('${res.id}', ${dot})" class="w-4 h-4 rounded-full border transition-all ${dotClass}"></button>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                        <span class="text-[10px] font-bold uppercase text-zinc-400 block mb-1">${res.type || 'Актив'}</span>
                                        <p class="text-xs text-zinc-500">${res.desc || ''}</p>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    })()}
                </div>
            </div>

            <!-- WEAPONS SELECTION -->
            <div class="mb-8">
                <h3 class="text-xl font-bold text-zinc-900 vtm-font uppercase mb-4 flex items-center gap-2">
                    <span>🗡️</span> Зброя (Weapons)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${getV6Weapons().map(w => {
                        const isSel = v6State.selectedWeapons.includes(w.id);
                        return `
                            <div onclick="toggleV6Weapon('${w.id}')" class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                isSel ? 'border-[#8b0000] bg-red-50/40 shadow-sm ring-1 ring-red-900/20' : 'border-zinc-200 bg-white hover:bg-zinc-50'
                            }">
                                <div>
                                    <h4 class="font-bold text-sm text-zinc-900">${w.name}</h4>
                                    <div class="text-xs text-zinc-500 mt-0.5">Шкода: <strong class="text-red-900">${w.damage || '2'}</strong> • Дистанція: ${w.distance || 'Ближній бій'} • ${w.note || ''}</div>
                                </div>
                                <input type="checkbox" ${isSel ? 'checked' : ''} class="rounded text-[#8b0000] pointer-events-none">
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="flex justify-between pt-4 border-t border-zinc-100">
                <button onclick="goToV6Step(7)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад
                </button>
                <button onclick="goToV6Step(9)" class="px-8 py-2.5 bg-[#1a1a1a] hover:bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                    Далі: Бланк Персонажа ➔
                </button>
            </div>
        </div>
    `;
}

function setV6ResourceDots(resId, dots) {
    if (v6State.resources[resId] === dots) {
        v6State.resources[resId] = dots - 1;
    } else {
        v6State.resources[resId] = dots;
    }
    renderV6UI();
}

function toggleV6Weapon(wId) {
    const idx = v6State.selectedWeapons.indexOf(wId);
    if (idx >= 0) v6State.selectedWeapons.splice(idx, 1);
    else v6State.selectedWeapons.push(wId);
    renderV6UI();
}

// -----------------------------------------------------------------------------
// STEP 9: FINISHING TOUCHES & OFFICIAL V6 CHARACTER SHEET
// -----------------------------------------------------------------------------
function renderV6Step9_SummarySheet() {
    const clanObj = getV6Clan();
    const tierObj = getV6Tier();
    const natureObj = getV6Nature();
    const sireObj = getV6Sires().find(s => s.id === v6State.sire);
    const vitaeMax = calculateV6Vitae();
    const willpowerMax = calculateV6Willpower();

    const drawDots = (filled, total = 5) => {
        let html = '<div class="flex gap-[3px] items-center">';
        for (let i = 0; i < total; i++) {
            if (i < filled) {
                html += '<svg width="9" height="9" viewBox="0 0 10 10" class="fill-black"><rect x="1" y="1" width="8" height="8" /><circle cx="5" cy="5" r="2.5" class="fill-white"/></svg>';
            } else {
                html += '<svg width="9" height="9" viewBox="0 0 10 10" class="fill-none stroke-black stroke-[1.2px]"><rect x="1" y="1" width="8" height="8" /></svg>';
            }
        }
        html += '</div>';
        return html;
    };

    const drawHumanity = () => {
        let html = '<div class="flex items-center gap-[4px] px-2">';
        for (let i = 0; i < 10; i++) {
            if (i >= 3 && i <= 6) {
               html += '<svg width="12" height="12" viewBox="0 0 12 12" class="fill-none stroke-zinc-400 stroke-[1px]"><circle cx="6" cy="6" r="5" /><circle cx="6" cy="6" r="2" class="fill-zinc-400"/></svg>';
            } else {
               html += '<svg width="12" height="12" viewBox="0 0 12 12" class="fill-none stroke-black stroke-[1.5px]"><circle cx="6" cy="6" r="5" /><circle cx="6" cy="6" r="2" class="fill-black"/></svg>';
            }
        }
        html += '</div>';
        return html;
    };

    const renderHeaderField = (label, value) => `
        <div class="flex items-end border-b border-black pb-[1px] mb-1.5 w-full">
            <span class="uppercase text-[6px] sm:text-[7px] font-bold tracking-widest text-zinc-600 mr-2 shrink-0">${label}</span>
            <span class="flex-1 font-serif text-[10px] text-black whitespace-nowrap overflow-hidden">${value || '&nbsp;'}</span>
        </div>
    `;

    const SKILLS_MAP = {
        athletics: "Атлетика", awareness: "Спостережливість", craft: "Ремесло", expression: "Виступ",
        fighting: "Боротьба", investigation: "Розслідування", knowledge: "Знання",
        medicine: "Медицина", persuasion: "Переконування", shooting: "Стрільба",
        sabotage: "Саботаж", subterfuge: "Хитрість", survival: "Виживання"
    };

    const skillsHtml = Object.keys(SKILLS_MAP).map(skId => {
        const dots = v6State.skills[skId] || 0;
        let focusesStr = '';
        if (v6State.focuses && v6State.focuses[skId]) {
            if (Array.isArray(v6State.focuses[skId])) {
                focusesStr = v6State.focuses[skId].join(', ');
            } else {
                focusesStr = Object.values(v6State.focuses[skId]).filter(Boolean).join(', ');
            }
        }
        return `
            <div class="flex justify-between items-center text-[9px] mb-[2px] border-b border-zinc-100 pb-[1px]">
                <span class="truncate pr-1">${SKILLS_MAP[skId]}${focusesStr ? ` <span class="text-[7px] italic text-zinc-500 font-sans">(${focusesStr})</span>` : ''}</span>
                ${drawDots(dots, 5)}
            </div>
        `;
    }).join('');

    const resList = Object.entries(v6State.resources).filter(([_, d]) => d > 0);
    let resourcesHtml = '';
    for(let i=0; i<8; i++) {
        if(i < resList.length) {
            const [resId, dots] = resList[i];
            const res = getV6Resources().find(r => r.id === resId);
            const name = res ? res.name.split(' (')[0] : resId;
            resourcesHtml += `
                <div class="flex justify-between items-center text-[9px] mb-[3px] border-b border-zinc-100 pb-[1px]">
                    <span class="truncate pr-1">${name}</span>
                    ${drawDots(dots, 5)}
                </div>
            `;
        } else {
            resourcesHtml += `
                <div class="flex justify-between items-center text-[9px] mb-[3px] border-b border-zinc-100 pb-[1px]">
                    <span class="text-transparent">Empty</span>
                    ${drawDots(0, 5)}
                </div>
            `;
        }
    }

    const activeDiscs = Object.entries(v6State.disciplines).filter(([_, val]) => val > 0);
    let discHtml = '';
    for(let i=0; i<4; i++) {
        if(i < activeDiscs.length) {
            const [discId, dots] = activeDiscs[i];
            const disc = getV6Disciplines().find(d => d.id === discId);
            const name = disc ? disc.name.split(' (')[0] : discId;
            discHtml += `
                <div class="mb-4">
                    <div class="flex justify-between items-end border-b border-zinc-400 pb-0.5 mb-1.5">
                        <span class="text-[10px] font-bold uppercase tracking-wider">${name}</span>
                        ${drawDots(dots, 5)}
                    </div>
                    <div class="border-b border-zinc-200 h-4 mb-1"></div>
                    <div class="border-b border-zinc-200 h-4"></div>
                </div>
            `;
        } else {
            discHtml += `
                <div class="mb-4">
                    <div class="flex justify-between items-end border-b border-zinc-400 pb-0.5 mb-1.5">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-transparent">Empty</span>
                        ${drawDots(0, 5)}
                    </div>
                    <div class="border-b border-zinc-200 h-4 mb-1"></div>
                    <div class="border-b border-zinc-200 h-4"></div>
                </div>
            `;
        }
    }

    return `
        <div class="space-y-6 animate-[fadeIn_0.3s_ease]">
            <!-- Action Toolbar -->
            <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 class="text-xl font-bold text-zinc-900 vtm-font uppercase">Бланк Персонажа (А4)</h2>
                    <p class="text-xs text-zinc-500 mt-0.5">Відформатовано за шаблоном 6-ї редакції</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button onclick="printV6CharacterSheet()" class="px-4 py-2 bg-[#8b0000] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        <span>Друкувати бланк</span>
                    </button>
                    <button onclick="saveV6DraftToFile()" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        <span>Зберегти JSON</span>
                    </button>
                </div>
            </div>

            <!-- DETAILS INPUTS (Hidden on print) -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 print:hidden">
                <h3 class="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-200 pb-2">Особисті дані персонажа</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Ім'я персонажа</label>
                        <input type="text" placeholder="Ім'я..." value="${v6State.characterDetails.name || ''}" oninput="v6State.characterDetails.name = this.value; updateV6Header(); renderV6UI();" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs outline-none focus:border-[#8b0000]">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Вік на вигляд</label>
                        <input type="text" placeholder="Напр: 25 років..." value="${v6State.characterDetails.apparentAge || ''}" oninput="v6State.characterDetails.apparentAge = this.value; renderV6UI();" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs outline-none focus:border-[#8b0000]">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Справжній вік</label>
                        <input type="text" placeholder="Напр: 120 років..." value="${v6State.characterDetails.actualAge || ''}" oninput="v6State.characterDetails.actualAge = this.value; renderV6UI();" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs outline-none focus:border-[#8b0000]">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Дата Обернення</label>
                        <input type="text" placeholder="Напр: 1904..." value="${v6State.characterDetails.embraceDate || ''}" oninput="v6State.characterDetails.embraceDate = this.value; renderV6UI();" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs outline-none focus:border-[#8b0000]">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Ностальгічна декада</label>
                        <input type="text" placeholder="Напр: 1980-ті..." value="${v6State.characterDetails.decade || ''}" oninput="v6State.characterDetails.decade = this.value; renderV6UI();" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs outline-none focus:border-[#8b0000]">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Вади (Flaws)</label>
                        <input type="text" placeholder="Опишіть вади..." value="${v6State.characterDetails.flaws || ''}" oninput="v6State.characterDetails.flaws = this.value; renderV6UI();" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs outline-none focus:border-[#8b0000]">
                    </div>
                </div>
            </div>

            <!-- OFFICIAL V6 PRINTABLE CHARACTER SHEET CONTAINER -->
            <div id="v6-official-sheet" class="bg-white p-[8mm] text-black font-sans mx-auto w-[210mm] min-h-[297mm] shadow-2xl relative box-border overflow-hidden print:w-full print:h-full print:p-0 print:shadow-none print:max-w-none">
                <!-- Outer decorative border -->
                <div class="absolute inset-[6mm] border-[3px] border-black pointer-events-none print:inset-[4mm]">
                    <div class="absolute -top-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                    <div class="absolute -top-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
                    <div class="absolute -bottom-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                    <div class="absolute -bottom-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
                </div>
                
                <div class="relative z-10 p-[4mm] pt-[12mm] h-full flex flex-col">
                    <!-- HEADER SECTION -->
                    <div class="flex justify-between items-start mb-6">
                        <div class="w-[42%] flex flex-col justify-end mt-2">
                            ${renderHeaderField("Ім'я", v6State.characterDetails.name)}
                            ${renderHeaderField("Вік на вигляд", v6State.characterDetails.apparentAge)}
                            ${renderHeaderField("Справжній вік", v6State.characterDetails.actualAge)}
                            ${renderHeaderField("Дата Обернення", v6State.characterDetails.embraceDate)}
                            ${renderHeaderField("Ностальгічна Декада", v6State.characterDetails.decade)}
                        </div>
                        
                        <div class="flex flex-col items-center justify-start flex-1 px-4 -mt-6">
                            <svg width="40" height="65" viewBox="0 0 24 34" fill="none" stroke="black" stroke-width="2">
                                <circle cx="12" cy="7" r="4.5"/>
                                <path d="M12 11.5v20"/>
                                <path d="M6 16.5h12"/>
                            </svg>
                        </div>

                        <div class="w-[42%] flex flex-col justify-end mt-2">
                            ${renderHeaderField("Клан", clanObj ? clanObj.name.split(' (')[0] : '')}
                            ${renderHeaderField("Прокляття", clanObj ? clanObj.curse : '')}
                            ${renderHeaderField("Покоління (Мод.)", tierObj ? (tierObj.generations + ' (' + tierObj.generationModifier + ')') : '')}
                            ${renderHeaderField("Рівень (Архетип)", tierObj ? tierObj.name.split(' (')[0] : '')}
                            ${renderHeaderField("Сір", sireObj ? `${sireObj.name}${v6State.sireBonusDiscipline ? ` (+1 ${getV6Disciplines().find(d => d.id === v6State.sireBonusDiscipline)?.name.split(' (')[0] || v6State.sireBonusDiscipline})` : ''}` : '')}
                        </div>
                    </div>

                    <!-- ATTRIBUTES SECTION -->
                    <div class="border-[1.5px] border-black mb-4">
                        <div class="text-center font-serif font-bold uppercase tracking-[0.3em] text-xs py-1 border-b-[1.5px] border-black">Атрибути (5e)</div>
                        <div class="grid grid-cols-3">
                            <div class="border-r-[1.5px] border-black">
                                <div class="bg-black text-white text-center font-bold uppercase text-[9px] py-1 tracking-[0.2em]">Фізичні</div>
                                <div class="grid grid-cols-3 divide-x divide-black">
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.strength || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Міць</div>
                                    </div>
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.dexterity || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Спритність</div>
                                    </div>
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.stamina || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Витривалість</div>
                                    </div>
                                </div>
                            </div>
                            <div class="border-r-[1.5px] border-black">
                                <div class="bg-black text-white text-center font-bold uppercase text-[9px] py-1 tracking-[0.2em]">Соціальні</div>
                                <div class="grid grid-cols-3 divide-x divide-black">
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.charisma || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Харизма</div>
                                    </div>
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.manipulation || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Маніпуляція</div>
                                    </div>
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.composure || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Витримка</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div class="bg-black text-white text-center font-bold uppercase text-[9px] py-1 tracking-[0.2em]">Ментальні</div>
                                <div class="grid grid-cols-3 divide-x divide-black">
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.intelligence || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Інтелект</div>
                                    </div>
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.wits || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Кмітливість</div>
                                    </div>
                                    <div class="flex flex-col items-center py-2 px-1">
                                        <div class="text-xl font-serif leading-none mb-1">${v6State.attributes.resolve || 1}</div>
                                        <div class="text-[6.5px] font-bold uppercase tracking-wider">Рішучість</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TRACKERS SECTION -->
                    <div class="flex justify-between items-end border-b-[1.5px] border-black pb-2 mb-4 px-2">
                        <div class="flex items-center gap-2">
                            <span class="uppercase font-bold text-[9px] tracking-widest">Віте (${vitaeMax})</span>
                            <div class="flex gap-1">${drawDots(3, 11)}</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="uppercase font-bold text-[9px] tracking-widest">Сила Волі (${willpowerMax})</span>
                            <div class="flex gap-1">${drawDots(willpowerMax, 10)}</div>
                        </div>
                    </div>

                    <div class="border-[1.5px] border-black pt-5 pb-3 px-2 mb-6 text-center relative mt-4">
                        <div class="text-[10px] uppercase font-bold tracking-[0.2em] absolute -top-[9px] left-1/2 transform -translate-x-1/2 bg-white px-2">Шкала Людяності</div>
                        <div class="flex justify-between items-center px-4">
                            <div class="flex flex-col items-center relative -left-4">
                                <div class="flex gap-1 mb-1">${drawDots(2, 5)}</div>
                                <span class="text-[7.5px] font-bold uppercase tracking-wider">Звір</span>
                            </div>
                            <div class="flex-1 flex justify-center items-center gap-2 text-[9px] font-bold uppercase text-zinc-500">
                                <span>Чудовисько</span>
                                ${drawHumanity()}
                                <span>Смертний</span>
                            </div>
                            <div class="flex flex-col items-center relative -right-4">
                                <div class="flex gap-1 mb-1">${drawDots(1, 5)}</div>
                                <span class="text-[7.5px] font-bold uppercase tracking-wider">Натура</span>
                            </div>
                        </div>
                    </div>

                    <!-- BOTTOM GRID -->
                    <div class="flex gap-6 flex-1">
                        <!-- Col 1: Skills & Resources -->
                        <div class="w-[30%] flex flex-col">
                            <div class="mb-5">
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Навички</span>
                                    <div class="absolute -left-1 -top-1 w-2 h-2 border-l border-t border-black"></div>
                                </h3>
                                <div>
                                    ${skillsHtml}
                                </div>
                            </div>
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Ресурси</span>
                                    <div class="absolute -left-1 -top-1 w-2 h-2 border-l border-t border-black"></div>
                                </h3>
                                <div>
                                    ${resourcesHtml}
                                </div>
                            </div>
                        </div>

                        <!-- Col 2: Blank box & Items & Disciplines -->
                        <div class="w-[35%] flex flex-col">
                            <div class="border-[1.5px] border-black h-[180px] mb-5"></div>
                            
                            <div class="mb-5">
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Предмети</span>
                                    <div class="absolute -left-1 -top-1 w-2 h-2 border-l border-t border-black"></div>
                                </h3>
                                <div class="h-20 text-[9px]">
                                    ${v6State.selectedWeapons.map(wId => {
                                        const w = getV6Weapons().find(item => item.id === wId);
                                        return w ? `<div class="border-b border-zinc-200 py-0.5">${w.name} (Шкода: ${w.damage || 2})</div>` : '';
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div class="flex-1">
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Дисципліни</span>
                                    <div class="absolute -left-1 -top-1 w-2 h-2 border-l border-t border-black"></div>
                                </h3>
                                <div>
                                    ${discHtml}
                                </div>
                            </div>
                        </div>

                        <!-- Col 3: Lifepaths, Clan Traits, Merits, Flaw, Nature, Beast -->
                        <div class="w-[35%] flex flex-col space-y-4">
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Життєві Шляхи</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>
                                <div class="text-[9px] min-h-[45px] space-y-0.5">
                                    ${v6State.lifepaths.map(lpId => {
                                        const lp = getV6Lifepaths().find(p => p.id === lpId);
                                        return lp ? `<div class="border-b border-zinc-100 pb-0.5 flex justify-between items-center"><span class="truncate pr-1">• ${lp.name}</span><span class="text-[7px] text-zinc-500 shrink-0 uppercase font-sans">[${lp.type === 'vampire' ? 'Вампір' : 'Смертний'}]</span></div>` : '';
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Кланові Риси</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>
                                <div class="text-[9px] min-h-[45px] space-y-0.5">
                                    ${v6State.selectedClanTraits.map(tId => {
                                        const trait = (clanObj ? clanObj.traits : []).find(t => t.id === tId);
                                        return trait ? `<div class="border-b border-zinc-100 pb-0.5">• ${trait.name}</div>` : '';
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Переваги</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>
                                <div class="text-[9px] min-h-[45px] space-y-0.5">
                                    ${v6State.selectedMerits.map(mId => {
                                        const merit = getV6Merits().find(m => m.id === mId);
                                        return merit ? `<div class="border-b border-zinc-100 pb-0.5">• ${merit.name}</div>` : '';
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-2 relative">
                                    <span class="bg-white pr-2">Вади</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>
                                <div class="text-[9px] min-h-[45px]">
                                    ${v6State.characterDetails.flaws ? `<p class="leading-tight">${v6State.characterDetails.flaws}</p>` : '<p class="text-zinc-400 italic">Відсутні</p>'}
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-1 relative">
                                    <span class="bg-white pr-2">Натура</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>
                                <div class="text-[9px] min-h-[45px]">
                                    <strong class="uppercase text-[9px]">${natureObj ? natureObj.name : ''}</strong>
                                    <p class="text-zinc-600 mt-0.5 leading-tight line-clamp-3">${natureObj ? natureObj.desc : ''}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="font-bold uppercase tracking-[0.1em] border-b-[1.5px] border-black text-[11px] mb-1 relative">
                                    <span class="bg-white pr-2">Звір</span>
                                    <div class="absolute -right-1 -top-1 w-2 h-2 border-r border-t border-black"></div>
                                </h3>
                                <div class="text-[9px]">
                                    <strong class="uppercase text-[9px]">${clanObj ? clanObj.beast : ''}</strong>
                                    <p class="text-zinc-600 mt-0.5 leading-tight line-clamp-3">${clanObj ? clanObj.beastDesc : ''}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-start pt-4 border-t border-zinc-100 print:hidden">
                <button onclick="goToV6Step(8)" class="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    ⬅ Назад до Ресурсів
                </button>
            </div>
        </div>
    `;
}

function updateV6Header() {
    const nameEl = document.getElementById('header-char-name');
    if (nameEl) nameEl.innerText = v6State.characterDetails.name || 'Безіменний';
}

function printV6CharacterSheet() {
    window.print();
}

function saveV6DraftToFile() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(v6State, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `vtm_v6_character_${(v6State.characterDetails.name || 'sheet').toLowerCase().replace(/\s+/g, '_')}.json`);
    dlAnchorElem.click();
}

// -----------------------------------------------------------------------------
// V6 DICE ROLLER IMPLEMENTATION
// -----------------------------------------------------------------------------
function rollV6Dice(attributeValue, skillValue, difficulty = 0, quickeningSpent = 0) {
    const rawPool = Math.max(0, attributeValue + skillValue - difficulty + quickeningSpent);
    const rolls = [];
    let successes = 0;
    let tensCount = 0;
    let onesCount = 0;

    for (let i = 0; i < rawPool; i++) {
        const val = Math.floor(Math.random() * 10) + 1;
        rolls.push(val);
        if (val >= 8) successes++;
        if (val === 10) tensCount++;
        if (val === 1) onesCount++;
    }

    const isSuccess = successes > 0;
    const isPainfulFailure = !isSuccess && onesCount > 0;
    const isStandardFailure = !isSuccess && onesCount === 0;
    const gainedQuickening = tensCount;

    return {
        rolls,
        pool: rawPool,
        successes,
        extraSuccesses: Math.max(0, successes - 1),
        isSuccess,
        isPainfulFailure,
        isStandardFailure,
        gainedQuickening
    };
}

window.initV6 = initV6;
window.goToV6Step = goToV6Step;
window.selectV6Tier = selectV6Tier;
window.selectV6Clan = selectV6Clan;
window.selectV6Sire = selectV6Sire;
window.setV6SireBonusDiscipline = setV6SireBonusDiscipline;
window.toggleV6Lifepath = toggleV6Lifepath;
window.setV6Attribute = setV6Attribute;
window.setV6Skill = setV6Skill;
window.setV6SkillFocusLevel = setV6SkillFocusLevel;
window.setV6SkillFocusLevelCustom = setV6SkillFocusLevelCustom;
window.setV6DisciplineDots = setV6DisciplineDots;
window.toggleV6Power = toggleV6Power;
window.toggleV6ClanTrait = toggleV6ClanTrait;
window.toggleV6Merit = toggleV6Merit;
window.setV6HumanityScale = setV6HumanityScale;
window.setV6BeastTracker = setV6BeastTracker;
window.setV6NatureTracker = setV6NatureTracker;
window.selectV6Nature = selectV6Nature;
window.setV6ResourceDots = setV6ResourceDots;
window.toggleV6Weapon = toggleV6Weapon;
window.printV6CharacterSheet = printV6CharacterSheet;
window.saveV6DraftToFile = saveV6DraftToFile;
window.rollV6Dice = rollV6Dice;
window.v6State = v6State;
