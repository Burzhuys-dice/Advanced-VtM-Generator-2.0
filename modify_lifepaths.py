import json

with open('data/vtm_v6_playtest_data.json', 'r') as f:
    data = json.load(f)

data['lifepaths'] = [
    {
      "id": "mortal_artist",
      "type": "mortal",
      "name": "Митець (Artist)",
      "desc": "Ви письменник, актор, художник, дизайнер, скульптор чи інший творець.",
      "skills": ["awareness", "craft", "expression", "knowledge", "persuasion"],
      "resources": ["wealth", "social_contacts", "social_ally"]
    },
    {
      "id": "mortal_corporate",
      "type": "mortal",
      "name": "Корпоративний керівник (Corporate Executive)",
      "desc": "Ваше улюблене поле бою — це корпоративні наради, де ви використовуєте гострий розум та кмітливість, маніпулюючи тими, хто стоїть на вашому шляху.",
      "skills": ["awareness", "investigation", "knowledge", "persuasion", "subterfuge"],
      "resources": ["wealth", "physical_property", "physical_haven"]
    },
    {
      "id": "mortal_criminal",
      "type": "mortal",
      "name": "Злочинець (Criminal)",
      "desc": "Ви заробляли на життя порушенням закону, відбираючи бажане силою або хитрістю.",
      "skills": ["athletics", "awareness", "fighting", "sabotage", "subterfuge"],
      "resources": ["social_contacts", "wealth", "social_mask"]
    },
    {
      "id": "mortal_holy",
      "type": "mortal",
      "name": "Священнослужитель (Holy Person)",
      "desc": "Ви присвятили частину свого життя вивченню та поширенню релігійної віри.",
      "skills": ["awareness", "expression", "knowledge", "medicine", "persuasion"],
      "resources": ["social_contacts", "social_status", "wealth"]
    },
    {
      "id": "mortal_hunter",
      "type": "mortal",
      "name": "Мисливець (Hunter)",
      "desc": "Ви знаєте, як вистежувати здобич, ставити пастки та виживати в дикій природі.",
      "skills": ["awareness", "craft", "fighting", "shooting", "survival"],
      "resources": ["physical_haven", "social_ally", "physical_repository"]
    },
    {
      "id": "mortal_military",
      "type": "mortal",
      "name": "Військовий (Military)",
      "desc": "Ви служили в збройних силах своєї країни та пройшли підготовку з військового мистецтва та виживання.",
      "skills": ["athletics", "fighting", "medicine", "shooting", "survival"],
      "resources": ["physical_repository", "social_contacts", "social_ally"]
    },
    {
      "id": "mortal_politician",
      "type": "mortal",
      "name": "Політик (Politician)",
      "desc": "Ви працювали в політичній сфері, створюючи закони, укладаючи угоди та змагаючись за увагу публіки.",
      "skills": ["awareness", "investigation", "knowledge", "persuasion", "subterfuge"],
      "resources": ["wealth", "social_status", "physical_haven"]
    },
    {
      "id": "mortal_technician",
      "type": "mortal",
      "name": "Технік (Technician)",
      "desc": "Ви навчилися працювати руками й розв'язувати технічні проблеми навіть без глибоких теоретичних знань.",
      "skills": ["athletics", "craft", "fighting", "sabotage", "subterfuge"],
      "resources": ["physical_vehicle", "physical_repository", "physical_haven"]
    },
    {
      "id": "neonate_blood_deliverer",
      "type": "neonate",
      "name": "Постачальник крові (Blood Deliverer)",
      "desc": "Ви займалися пошуком, придбанням та безпечною доставкою крові для інших вампірів.",
      "skills": ["athletics", "awareness", "persuasion", "sabotage", "subterfuge"],
      "resources": ["physical_vehicle", "wealth", "social_contacts"]
    },
    {
      "id": "neonate_cleanup",
      "type": "neonate",
      "name": "Команда зачистки (Clean Up Crew)",
      "desc": "Вас кликали, коли справи ставали занадто брудними, щоб змусити проблеми вампірів зникнути та зберегти Маскарад.",
      "skills": ["athletics", "fighting", "investigation", "sabotage", "subterfuge"],
      "resources": ["social_contacts", "physical_vehicle", "physical_repository"]
    },
    {
      "id": "neonate_hound",
      "type": "neonate",
      "name": "Гончак (Hound)",
      "desc": "Ви були силовою підтримкою для місцевої вампірської влади, використовуючи бойові навички для захисту домену.",
      "skills": ["fighting", "investigation", "shooting", "subterfuge", "survival"],
      "resources": ["social_status", "physical_repository", "social_contacts"]
    },
    {
      "id": "ancilla_diplomat",
      "type": "ancilla",
      "name": "Дипломат (Diplomat)",
      "desc": "Вас обрали за вашу харизму та вміння говорити, щоб ви представляли свою секту при інших дворах та вели переговори.",
      "skills": ["awareness", "expression", "investigation", "persuasion", "subterfuge"],
      "resources": ["physical_haven", "social_status", "social_mask"]
    },
    {
      "id": "ancilla_harpy",
      "type": "ancilla",
      "name": "Гарпія (Harpy)",
      "desc": "Ви формували правила та смаки вампірського суспільства, вели облік боргових Послуг та могли зруйнувати чи піднести чиюсь репутацію.",
      "skills": ["awareness", "expression", "knowledge", "persuasion", "subterfuge"],
      "resources": ["physical_haven", "social_status", "social_ally"]
    },
    {
      "id": "ancilla_sheriff",
      "type": "ancilla",
      "name": "Шериф (Sheriff)",
      "desc": "Ви стежили за виконанням законів вампірського суспільства та карали тих, хто їх порушував.",
      "skills": ["awareness", "investigation", "knowledge", "persuasion", "survival"],
      "resources": ["social_status", "physical_haven", "social_ally"]
    }
]

with open('data/vtm_v6_playtest_data.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
