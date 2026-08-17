const state = {
    clan: 'unknown',
    disciplines: {}, 
    disciplinePowers: {}, 
    attributes: {}, 
    skills: {},     
    distribution: 'balanced',
    advantagesData: [],
    selectedAdvantages: [],
    predatorData: [],
    selectedPredator: null,
    predatorChoices: { discipline: null, skill: null, specName: null },
    humanity: 7,
    healthDamage: [],
    willpowerDamage: [] 
};

const attrTarget = { 4: 1, 3: 3, 2: 4, 1: 1 };
const skillTargets = {
    jack: { 3: 1, 2: 8, 1: 10, 4: 0 },
    balanced: { 3: 3, 2: 5, 1: 7, 4: 0 },
    specialist: { 4: 1, 3: 3, 2: 3, 1: 3 }
};

const CLAN_ICON_MAP = {
    'caitiff': 'Clan_symbols/Caitiff_symbol.png',
    'unknown': 'Clan_symbols/Caitiff_symbol.png',
    'brujah': 'Clan_symbols/Brujah_symbol.png',
    'gangrel': 'Clan_symbols/Gangrel_symbol.png',
    'malkavian': 'Clan_symbols/Malkavian_symbol.png',
    'nosferatu': 'Clan_symbols/Nosferatu_symbol.png',
    'toreador': 'Clan_symbols/Toreador_symbol.png',
    'tremere': 'Clan_symbols/Tremere_symbol.png',
    'ventrue': 'Clan_symbols/Ventrue_symbol.png',
    'ministry': 'Clan_symbols/Ministry_symbol.png',
    'banu_haqim': 'Clan_symbols/Banu_Haqim_Symbol.png',
    'banu-haqim': 'Clan_symbols/Banu_Haqim_Symbol.png',
    'hecata': 'Clan_symbols/Hecata_symbol.png',
    'lasombra': 'Clan_symbols/Lasombra_symbol.png',
    'tzimisce': 'Clan_symbols/Tzimisce_symbol.png',
    'ravnos': 'Clan_symbols/Ravnos_symbol.png',
    'salubri': 'Clan_symbols/Salubri_symbol.png',
    'thin-blood': 'Clan_symbols/Thinblood_symbol.png',
    'thin_blood': 'Clan_symbols/Thinblood_symbol.png'
};

function getClanIconPath(clanId) {
    if (!clanId) return 'Clan_symbols/Caitiff_symbol.png';
    const normalized = String(clanId).toLowerCase().trim();
    if (CLAN_ICON_MAP[normalized]) return CLAN_ICON_MAP[normalized];
    if (typeof clansData === 'object' && clansData[clanId] && clansData[clanId].image) {
        return clansData[clanId].image.startsWith('Clan_symbols/') ? clansData[clanId].image : `Clan_symbols/${clansData[clanId].image}`;
    }
    return 'Clan_symbols/Caitiff_symbol.png';
}

let clansData = { "unknown": { name: "Невідомо (Каїтиф)", image: "Caitiff_symbol.png", desc: "Ви не знаєте свого походження...", disciplines: ["animalism", "auspex", "blood_sorcery", "celerity", "dominate", "fortitude", "obfuscate", "potence", "presence", "protean"] } };
let disciplinesData = {
    "animalism": { "name": "Анімалізм (Animalism)", "image": "Animalism_symbol.png", "desc": "Дарує надприродний зв’язок із тваринами та внутрішнім Звіром. Кревний може закликати звірів, спілкуватися з ними, використовувати їх як шпигунів або навіть вгамовувати шаленство інших." },
    "auspex": { "name": "Ауспекс (Auspex)", "image": "Auspex_symbol.png", "desc": "Загострює відчуття Кревного до надприродного рівня. Ця дисципліна дає змогу бачити крізь ілюзії, відчувати аури, читати думки та розрізняти відбитки подій на предметах" },
    "blood_sorcery": { "name": "Чари Крові (Blood Sorcery)", "image": "Blood_Sorcery_symbol.png", "desc": "Темне мистецтво використання крові для магічних маніпуляцій і ритуалів. Вони дають змогу перетворювати кров на отруту, викрадати її на відстані та здійснювати складні чародійні обряди" },
    "celerity": { "name": "Стрімкість (Celerity)", "image": "Celerity_symbol.png", "desc": "Забезпечує надприродну швидкість і рефлекси. Кревний може ухилятися від куль, атакувати швидше за блискавку або виконувати складні дії за лічені миті" },
    "dominate": { "name": "Домінування (Dominate)", "image": "Dominate_symbol.png", "desc": "Дає змогу контролювати розум і дії інших через зоровий контакт. Майстри цієї сили можуть віддавати миттєві накази, змінювати спогади та пригнічувати чужу свободу волі" },
    "fortitude": { "name": "Стійкість (Fortitude)", "image": "Fortitude_symbol.png", "desc": "Надає Кревному монструозну витривалість до фізичних і ментальних атак. Вона дозволяє ігнорувати біль, витримувати вогонь і сонячне світло, а також зміцнювати свій розум" },
    "obfuscate": { "name": "Затьмарення (Obfuscate)", "image": "Obfuscate_symbol.png", "desc": "Мистецтво ставати невидимим, впливаючи на розум спостерігачів. Кревний може зливатися з тінями, змінювати вигляд або зникати з-під погляду, поки не видасть себе агресією" },
    "potence": { "name": "Могутність (Potence)", "image": "Potence_symbol.png", "desc": "Дарує фізичну силу, що значно перевищує людські та вампірські межі. Носій може здійснювати великі стрибки, розривати сталь і завдавати нищівних ударів голіруч." },
    "presence": { "name": "Присутність (Presence)", "image": "Presence_symbol.png", "desc": "Маніпулює емоційним станом тих, хто знаходиться поруч із Кревним. Вона дає змогу вселяти жах, викликати захоплення або змушувати натовп підкорятися величі каїніта" },
    "protean": { "name": "Перетворення (Protean)", "image": "Protean_symbol.png", "desc": "Дає змогу фізично змінювати форму власного немертвого тіла. Кревний може відрощувати кігті, перетворюватися на звірів, розчинятися в землі або набувати форми туману." },
    "oblivion": { "name": "Забуття (Oblivion)", "image": "Oblivion_symbol.png", "desc": "Забуття — це дисципліна, яка дозволяє використовувати дещо абсолютно надприродне; викликати надприродну темряву з Безодні та поневолювати привидів з Підземного світу."},
    "thin_blood_alchemy": { "name": "Алхімія рідкокровців (Thin-Blood Alchemy)", "image": "Alchemy_symbol.png", "desc": "Здатність рідкокровців змішувати віте з різними речовинами та емоціями для створення унікальних еліксирів і ефектів." },
    "blood_sorcery_rituals": {"name" : "Ритуали Чарів Крові (Blood Sorcery Rituals)", "desc": "Розгалужена система магічних ритуалів, за допомогою якої чарокровці досягають довготривалих чи недоступних іншим чином ефектів. Ритуали потребують більше часу, а також можуть вимагати рідкісних інгрідієнтів" },
    "oblivion_ceremonies" : {"name" : "Церемонії Забуття (Oblivion Ceremonies)", "desc": "Містичні аналоги ритуалів Чарів Крові. Дають змогу маніпулювати пітьмою Безодні та світом мертвих."} 
};
var attributesData = { physical: [], social: [], mental: [] };
var skillsData = { physical: [], social: [], mental: [] };
var disciplinesPowersMap = {};

// Ensure global properties on window
if (typeof window !== 'undefined') {
    window.state = state;
    window.attrTarget = attrTarget;
    window.skillTargets = skillTargets;
    window.CLAN_ICON_MAP = CLAN_ICON_MAP;
    window.getClanIconPath = getClanIconPath;
    window.clansData = clansData;
    window.disciplinesData = disciplinesData;
    window.attributesData = attributesData;
    window.skillsData = skillsData;
    window.disciplinesPowersMap = disciplinesPowersMap;
}
