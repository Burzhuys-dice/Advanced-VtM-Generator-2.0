const fs = require('fs');
const path = './data/vtm_v6_playtest_data.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.merits = [
  { "id": "bond_famulus", "name": "Зв'язаний Фамільяр (Bond Famulus)", "prereq": "Слабокровний або вампір. Анімалізм •+", "shortDesc": "Перетворює тварину-гуля на могутнього зв'язаного фамільяра.", "desc": "Очікує повного тексту..." },
  { "id": "bond_resistant", "name": "Опір Узам (Bond Resistant)", "prereq": "Немає", "shortDesc": "Ви краще чините опір Узам Крові та їхнім ефектам.", "desc": "Очікує повного тексту..." },
  { "id": "chain_the_psyche", "name": "Кайдани Розуму (Chain the Psyche)", "prereq": "Домінування ••+", "shortDesc": "Ті, хто перебуває під вашим контролем, відчувають біль при непокорі.", "desc": "Очікує повного тексту..." },
  { "id": "code_of_honor", "name": "Кодекс Честі (Code of Honor)", "prereq": "Немає", "shortDesc": "Ваш особистий кодекс допомагає зберігати спокій та стверджувати свої переконання.", "desc": "Очікує повного тексту..." },
  { "id": "enchanting_presence", "name": "Чарівна Присутність (Enchanting Presence)", "prereq": "Слабокровний або вампір. Присутність ••+", "shortDesc": "Істоти отримують штраф на опір вашим силам Присутності.", "desc": "Очікує повного тексту..." },
  { "id": "fleetness", "name": "Прудкість (Fleetness)", "prereq": "Стрімкість •+", "shortDesc": "Ви отримуєте бонус до небойових перевірок Спритності (Dexterity).", "desc": "Очікує повного тексту..." },
  { "id": "flexible_limbs", "name": "Гнучкі Кінцівки (Flexible Limbs)", "prereq": "Немає", "shortDesc": "Ви дуже гнучкі та отримуєте бонус до спроб звільнитися від пут.", "desc": "Очікує повного тексту..." },
  { "id": "forgettable_face", "name": "Непримітне Обличчя (Forgettable Face)", "prereq": "Немає", "shortDesc": "Ваше обличчя легко забувається, що дає бонус до перевірок Хитрощів (Subterfuge).", "desc": "Очікує повного тексту..." },
  { "id": "friends_in_high_places", "name": "Високі Зв'язки (Friends in High Places)", "prereq": "Немає", "shortDesc": "Ви знаєте людей у вищому суспільстві і отримуєте бонус при взаємодії з ними.", "desc": "Очікує повного тексту..." },
  { "id": "hunger_strength", "name": "Сила Голоду (Hunger Strength)", "prereq": "Слабокровний або вампір.", "shortDesc": "Коли ви голодні, ви отримуєте бонус до перевірок Сили (Strength).", "desc": "Очікує повного тексту..." },
  { "id": "intimidating_presence", "name": "Лякаюча Присутність (Intimidating Presence)", "prereq": "Немає", "shortDesc": "Ви отримуєте бонус, коли залякуєте або лякаєте інших.", "desc": "Очікує повного тексту..." },
  { "id": "might", "name": "Міць (Might)", "prereq": "Могутність •+", "shortDesc": "Ви отримуєте бонус до небойових перевірок Сили (Strength).", "desc": "Очікує повного тексту..." },
  { "id": "prestigious_sire", "name": "Престижний Сір (Prestigious Sire)", "prereq": "Немає", "shortDesc": "Репутація вашого сіра дає бонус або штраф до соціальних перевірок залежно від секти чи клану цілі.", "desc": "Очікує повного тексту..." },
  { "id": "subdued_hunger", "name": "Приборканий Голод (Subdued Hunger)", "prereq": "Слабокровний або вампір.", "shortDesc": "Ви маєте певний контроль над своїм голодом і отримуєте бонус на опір шаленству голоду.", "desc": "Очікує повного тексту..." },
  { "id": "tough_skin", "name": "Міцна Шкіра (Tough Skin)", "prereq": "Модифікатор покоління. Витривалість 5.", "shortDesc": "Отримувана вами шкода зменшується на 1 більше, ніж зазвичай.", "desc": "Очікує повного тексту..." },
  { "id": "wrecker", "name": "Руйнівник (Wrecker)", "prereq": "Могутність ••+", "shortDesc": "Ви отримуєте бонус до перевірок, пов'язаних із розбиванням предметів.", "desc": "Очікує повного тексту..." }
];

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Added merits");
