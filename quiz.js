// Quiz Module for Vampire: The Masquerade 5e - Clan Discovery
// Handles 15 questions to determine the player's vampire clan

const quizClans = {
    unknown: { 
        id: "unknown",
        name: "Невідомо (Каїтиф)", 
        subtitle: "Безклановий", 
        desc: "Ви не знаєте свого походження або належите до Каїтифів (безкланових). Ваш Звір не має специфічного прокляття, але ви позбавлені кланової підтримки. Ви можете обрати будь-які дисципліни.", 
        clan_compultion: "Відсутнє", 
        clan_bane: "Відсутнє" 
    },
    brujah: { 
        id: "brujah",
        name: "Бруха", 
        subtitle: "Клан філософів та бунтарів", 
        desc: "Клан філософів та бунтарів. Вони палкі, схильні до гніву та борються проти системи, шукаючи утопію або просто хаос. Їхня кров кипить від найменшої провокації.", 
        clan_compultion: "Бунтарство. Кревний підважує статус-кво — свого лідера, погляд якогось потенційного вмістилища або просто завдання, яке наразі стоїть перед ним. Поки Кревний не виступить проти отриманих наказів або очікувань, уявних або реальних, він зазнає штрафу −2 кістки до всіх кидків. Цей примус завершується тоді, коли Кревний вдасться або змінити чиюсь думку (за потреби, силоміць), або вчинити протилежно до очікувань.", 
        clan_bane: "Запальна вдача: Кров Бруха кипить люттю, яку важко контролювати. Вони віднімають кількість кісток, що дорівнює згубності прокляття, від будь-якого кидка на опір шаленству люті." 
    },
    gangrel: { 
        id: "gangrel",
        name: "Гангрел", 
        subtitle: "Клан Звіра", 
        desc: "Близькі до природи мисливці, чий Звір проявляється через звірині риси. Вони відкидають політику міст заради свободи диких територій та первісного інстинкту.", 
        clan_compultion: "Тваринні імпульси. Кревний опускається до рівня тварини: розмовляти стає складно, одяг заважає і дратує, а суперечки вирішують зуби й кігті. Упродовж однієї сцени Кревний зазнає штрафу −3 кістки до всіх кидків на маніпулювання й інтелект.", 
        clan_bane: "Звірині риси: У стані шаленства Ганґрел дедалі більше уподібнюється до тварини. Він отримує фізичну ознаку, запах або поведінковий тик, що відповідає його внутрішньому Звіру, на одну ніч після шаленства." 
    },
    malkavian: { 
        id: "malkavian",
        name: "Малкав", 
        subtitle: "Клан Місяця", 
        desc: "Прокляті божевіллям, але обдаровані надприродним прозрінням. Їхній розум розколотий, проте вони бачать те, що приховано від інших. Вони — оракули Світу Темряви.", 
        clan_compultion: "Омана. Екстрасенсорні здібності Кревного виходять з-під контролю. Він проживає те, що йому здається істинним видінням майбутнього, але що інші вважають лише мареннями, спричиненими Голодом.", 
        clan_bane: "Психічний розлад: Усі діти Малкава вражені ментальною недугою. У разі звірячого провалу або дії примусу розлад Кревного загострюється, накладаючи штрафи на цілу категорію кидків." 
    },
    nosferatu: { 
        id: "nosferatu",
        name: "Носферату", 
        subtitle: "Пацюки", 
        desc: "Потворні ззовні, але неперевершені шпигуни та брокери інформації. Прокляття спотворило їхні тіла, змусивши ховатися в тінях та каналізаціях, де вони збирають таємниці.", 
        clan_compultion: "Криптофілія. Потреба знати пронизує Кревного. Його поглинає бажання розкрити щось, що практично нікому не відомо — жага до таємниць майже така ж сильна, як і до крові.", 
        clan_bane: "Відразливість: Кожен Носферату жахливо спотворений Залученням. Вони автоматично мають ваду Відразливість, і не можуть мати жодних чеснот зовнішності." 
    },
    toreador: { 
        id: "toreador",
        name: "Тореадор", 
        subtitle: "Клан Троянди", 
        desc: "Естети, митці та світські леви. Вони одержимі красою, емоціями та мистецтвом, часто гублячись у своїх захопленнях. Майстри маніпуляцій у високому суспільстві.", 
        clan_compultion: "Одержимість. Кревний стає тимчасово одержимим якоюсь привабливою річчю. Він причарований її красою і не здатний думати ні про що інше.", 
        clan_bane: "Естетична фіксація: Діви настільки одержимі красою, що втрачають контроль у негарному середовищі. Перебуваючи в огидних місцях, вони зазнають штрафу до використання дисциплін." 
    },
    tremere: { 
        id: "tremere",
        name: "Тремі", 
        subtitle: "Узурпатори", 
        desc: "Клан магів крові, які викрали своє безсмертя. Хоча їхня Піраміда розколота, вони залишаються майстрами окультних таємниць та наймогутнішими чаклунами серед Сородичів.", 
        clan_compultion: "Перфекціонізм. Ніщо, крім ідеалу, не задовольнить Кревного. Будь-що гірше за досконалість здається жахливим провалом, через що Кревний виконує різні завдання знову й знову.", 
        clan_bane: "Слабкість Крові: Після падіння Відня Кров Тремі втратила здатність зв'язувати інших Кревних Кровними путами. Вони досі можуть зв'язувати смертних, але це вимагає більшої кількості вживання віте." 
    },
    ventrue: { 
        id: "ventrue",
        name: "Вентру", 
        subtitle: "Клан Королів", 
        desc: "Королі та лідери Сородичів. Вони вимагають покори, контролюють корпорації та політику, але їхнє прокляття обмежує їхнє харчування лише певним типом смертних.", 
        clan_compultion: "Зарозумілість. Усередині Кревного пробуджується потреба керувати. Він не зупиниться ні перед чим, щоб здобути контроль над ситуацією.", 
        clan_bane: "Вишуканий смак: Аристократи Крові мають дуже специфічні вимоги до харчування. Кожен Вентру може втамовувати Голод лише з певного типу смертних, інакше кров виривається назад багряним блювотинням." 
    },
    ministry: { 
        id: "ministry",
        name: "Міністерство", 
        subtitle: "Послідовники Сета", 
        desc: "Клан Віри, що веде свій родовід від давньоєгипетського бога Сета. Міністерство вербує тих, хто здатен використовувати спокусу як зброю, щоб звільнити своїх жертв.", 
        clan_compultion: "Перетин межі. Сет вчить, що розум і дух кожного скуті невидимими ланцюгами власного виробництва. Кров Міністра вимагає розірвати ці пута.", 
        clan_bane: "Огида до світла: Кров Змій ненавидить світло. Коли Кревний перебуває під яскравим штучним або природним освітленням, він зазнає штрафу до всіх кидків." 
    },
    banu_haqim: { 
        id: "banu_haqim",
        name: "Бану Гакім", 
        subtitle: "Судді та воїни", 
        desc: "Клан Суддів та воїнів, що походить з прихованої фортеці Аламут. Бану Гакім вічно розриваються між своєю спадковою жадобою до вампірської крові та прагненням до правосуддя.", 
        clan_compultion: "Правосуддя. Кревний відчуває непереборну потребу покарати будь-кого, хто, на його думку, порушив його особисте кредо.", 
        clan_bane: "Залежність від Крові: Кров каїнітів для Суддів є водночас символом гріха та непереборною спокусою. Під час куштування віте іншого Кревного треба пройти перевірку на шаленство Голоду." 
    },
    hecata: { 
        id: "hecata",
        name: "Геката", 
        subtitle: "Клан Смерті", 
        desc: "Клан Смерті, що виник внаслідок «Сімейної зустрічі», яка об'єднала некромантські лінії крові: Джованні, Провісників попелу, Самеді та вцілілих Каппадокійців.", 
        clan_compultion: "Хворобливість. Кревного поглинає хвороблива цікавість до ознак хвороби, слабкості або наближення смерті в оточуючих.", 
        clan_bane: "Болісний Поцілунок: Поцілунок Кревних цього клану не приносить жертві задоволення, а спричиняє нестерпний біль. Смертні часто впадають у шок і чинять шалений опір." 
    },
    lasombra: { 
        id: "lasombra",
        name: "Ласомбра", 
        subtitle: "Клан Ночі", 
        desc: "Клан Ночі, що цінує успіх і силу понад усе. Ласомбра — природжені ляльководи та прагматики, які вважають, що мета завжди виправдовує засоби.", 
        clan_compultion: "Безжальність. Для Ласомбра невдача неприпустима. Будь-яка перешкода має бути подолана найефективнішим способом.", 
        clan_bane: "Викривлене зображення: Тіні не мають нормального відображення в дзеркалах або сучасних електронних пристроях. Їхнє зображення виглядає розмитим або мерехтливим." 
    },
    tzimisce: { 
        id: "tzimisce",
        name: "Цимісхи", 
        subtitle: "Клан Драконів", 
        desc: "Клан Драконів, чия сутність нерозривно пов'язана з поняттям власності та контролю. Вони вважають свої прихистки та навіть власні тіла глиною для формування ідеалу.", 
        clan_compultion: "Зажерливість. Коли Кров Цимісха збурюється, він відчуває непереборну потребу володіти чимось або кимось у полі зору.", 
        clan_bane: "Прив'язаність до землі: Кожен Цимісх повинен обрати свій «об'єкт прив'язаності» — конкретну територію чи групу людей, оточення якої необхідне під час денного сну." 
    },
    ravnos: { 
        id: "ravnos",
        name: "Равнос", 
        subtitle: "Майстри містифікацій", 
        desc: "Майстри містифікацій та омани. Равнос — це кочівники та шибайголови, які воліють не битися за те, що можна здобути хитрощами та ілюзіями.", 
        clan_compultion: "Спокуса долі. Кревний відчуває непереборне бажання випробувати свою удачу або вчинити небезпечний трюк.", 
        clan_bane: "Кров Равнос Приречена: Якщо вони засинають в одному й тому самому місці більше ніж один раз протягом семи ночей, їхня власна Кров починає випалювати їх зсередини." 
    },
    salubri: { 
        id: "salubri",
        name: "Салюбрі", 
        subtitle: "Клан мудрості", 
        desc: "Клан, що колись славився своєю мудрістю та ерудицією. Салюбрі — рідкісні та переслідувані каїніти з третім оком на чолі, що шукають Голконду.", 
        clan_compultion: "Афективна емпатія. Кревного переповнює співчуття до особистої проблеми, яка гнітить когось із присутніх.", 
        clan_bane: "Прокляття Крові: Коли інший Кревний куштує їхню віте, він мусить пройти перевірку на Голодне шаленство. Крім того, третє око сочиться кров'ю при використанні Дисциплін." 
    },
    "thin-blood": { 
        id: "thin-blood",
        name: "Рідкокровка", 
        subtitle: "Дитя Геєнни", 
        desc: "Ваша вампірська кров настільки слабка, що ви балансуєте на самій межі між смертними та нежиттю. Старі вампіри вас ненавидять, але ви володієте алхімією.", 
        clan_compultion: "Відсутнє", 
        clan_bane: "Відсутнє (або вибір слабкокровних вад)" 
    }
};

const quizQuestions = [
    {
        text: "Який ваш головний метод вирішення конфліктів та проблем?",
        options: [
            { text: "Відкрита сила, агресія та пряме протистояння.", scores: { brujah: 2, gangrel: 1, banu_haqim: 1 } },
            { text: "Маніпуляція, політика та використання чужих слабкостей.", scores: { ventrue: 2, lasombra: 2, ministry: 1 } },
            { text: "Містичні знання, складна магія та ретельний розрахунок.", scores: { tremere: 2, hecata: 1 } },
            { text: "Зникнути з поля зору, зібрати інформацію і діяти непомітно.", scores: { nosferatu: 2, ravnos: 2, "thin-blood": 1 } },
            { text: "Покластися на химерну інтуїцію, хаос або непередбачуваність.", scores: { malkavian: 2, unknown: 1 } }
        ]
    },
    {
        text: "Що ви вважаєте своїм найбільшим недоліком або вразливістю?",
        options: [
            { text: "Відчуження від людяності, абсолютна холодність і монструозність.", scores: { tzimisce: 3, nosferatu: 1 } },
            { text: "Хвороблива одержимість ідеалами, красою або знаннями.", scores: { toreador: 2, tremere: 1, salubri: 2 } },
            { text: "Нестримний гнів, який я ледве контролюю.", scores: { brujah: 3 } },
            { text: "Зарозумілість, гординя і жага тотального контролю над іншими.", scores: { ventrue: 2, lasombra: 2 } },
            { text: "Схильність до пороків, залежностей або жага чужих секретів.", scores: { ministry: 2, hecata: 2 } },
            { text: "Відчуття власної слабкості та неповноцінності у цьому жорстокому світі.", scores: { "thin-blood": 3, unknown: 2 } }
        ]
    },
    {
        text: "В якому середовищі ви почуваєтеся найкомфортніше?",
        options: [
            { text: "У розкішному пентхаусі, елітному клубі або на світському прийомі.", scores: { ventrue: 2, toreador: 2 } },
            { text: "У стародавній бібліотеці, лабораторії або фамільному склепі.", scores: { tremere: 2, hecata: 2 } },
            { text: "У темних провулках, закинутих заводах або серед гучних протестів.", scores: { brujah: 2, ministry: 1 } },
            { text: "У міській каналізації, підземеллях, подалі від світла і сторонніх очей.", scores: { nosferatu: 3 } },
            { text: "У постійній дорозі, темному лісі або таборі просто неба.", scores: { gangrel: 2, ravnos: 2 } },
            { text: "У звичайній квартирі, намагаючись зберегти залишки свого людського життя.", scores: { "thin-blood": 3, unknown: 2 } }
        ]
    },
    {
        text: "Ваше ставлення до «Маскараду» (закону, що приховує вампірів від людей)?",
        options: [
            { text: "Це єдиний спосіб вижити. Правила існують, щоб їх беззаперечно виконувати.", scores: { ventrue: 2, tremere: 2 } },
            { text: "Це система гноблення елітами. Потрібно зруйнувати статус-кво!", scores: { brujah: 3, ministry: 1 } },
            { text: "Які правила? Слабкі ховаються, сильні правлять. Ми вищі за людей.", scores: { lasombra: 2, tzimisce: 3 } },
            { text: "Елітам начхати на мене, Маскарад захищає їх, а мене за нього можуть вбити.", scores: { "thin-blood": 2, unknown: 3 } },
            { text: "Маскарад корисний, хоч і лицемірний. В тінях легше працювати.", scores: { toreador: 1, nosferatu: 2, ravnos: 1 } },
            { text: "Маскарад заважає вершити справжнє правосуддя над грішниками.", scores: { banu_haqim: 2, salubri: 2 } }
        ]
    },
    {
        text: "Як ви зазвичай втамовуєте свій кривавий Голод?",
        options: [
            { text: "Спокушаю жертву, перетворюючи живлення на мистецтво та спільне задоволення.", scores: { toreador: 3, ministry: 2 } },
            { text: "Беру силою або залякуванням в темному провулку, коли ніхто не бачить.", scores: { brujah: 2, lasombra: 1 } },
            { text: "Харчуюся тваринами, безхатьками або тими, кого суспільство не шукатиме.", scores: { gangrel: 2, nosferatu: 2 } },
            { text: "Проникаю до тих, хто спить, забираючи кров непомітно, наче сон.", scores: { malkavian: 3, ravnos: 1 } },
            { text: "Купую кров у клініках, п'ю з пакетів або беру її у трупів.", scores: { hecata: 2, "thin-blood": 3, tremere: 1 } },
            { text: "Полюю на злочинців чи інших вампірів, забираючи їхню кров як кару.", scores: { banu_haqim: 3, salubri: 1 } }
        ]
    },
    {
        text: "Смертний випадково дізнався вашу таємницю. Якими будуть ваші дії?",
        options: [
            { text: "Вбити без вагань. Ніхто не повинен знати правду.", scores: { lasombra: 2, banu_haqim: 2, tzimisce: 2 } },
            { text: "Зробити його своїм гулем (слугою). Нехай його життя приносить мені користь.", scores: { ventrue: 3, toreador: 1 } },
            { text: "Використати здібності, щоб стерти, сплутати або переписати його пам'ять.", scores: { tremere: 3, malkavian: 2 } },
            { text: "Залякати його настільки, щоб він мовчав до кінця своїх днів.", scores: { nosferatu: 2, brujah: 1 } },
            { text: "Втертися в довіру, обманути і змусити добровільно працювати на себе.", scores: { ministry: 2, ravnos: 2 } },
            { text: "Запанікувати, спробувати домовитися як людина з людиною або втекти.", scores: { "thin-blood": 2, unknown: 2 } }
        ]
    },
    {
        text: "Що у цьому світі ви вважаєте справжньою владою?",
        options: [
            { text: "Гроші, корпорації, зв'язки та вплив на суспільство.", scores: { ventrue: 2, hecata: 2 } },
            { text: "Страх, темрява і фізичний/ментальний контроль над іншими.", scores: { lasombra: 2, tzimisce: 3 } },
            { text: "Магія, таємні знання і глибоке розуміння природи речей.", scores: { tremere: 2, salubri: 2 } },
            { text: "Свобода від усіх правил, кордонів і диктаторів.", scores: { brujah: 2, gangrel: 2, unknown: 1 } },
            { text: "Віра, релігія і здатність формувати людські душі та бажання.", scores: { ministry: 3, malkavian: 1 } },
            { text: "Вміння злитися з натовпом, бути непомітним і вижити за будь-яких умов.", scores: { nosferatu: 2, "thin-blood": 2, ravnos: 1 } }
        ]
    },
    {
        text: "Який стиль чи естетика найкраще вас описує?",
        options: [
            { text: "Висока мода, мистецтво, бездоганний і вишуканий стиль.", scores: { toreador: 3, ventrue: 1 } },
            { text: "Шкіряні куртки, панк, гранж або практичний вуличний/похідний одяг.", scores: { brujah: 2, gangrel: 2 } },
            { text: "Модифікації тіла, боді-горор або моторошна краса потойбіччя.", scores: { tzimisce: 3, hecata: 1 } },
            { text: "Класичні строгі костюми, окультні символи, антикваріат.", scores: { tremere: 2, lasombra: 2 } },
            { text: "Лахміття, химерні маски або повна відсутність турботи про вигляд.", scores: { nosferatu: 3, malkavian: 1 } },
            { text: "Звичайний, непомітний кежуал, аби не виділятися з натовпу.", scores: { "thin-blood": 3, unknown: 2, ravnos: 1 } }
        ]
    },
    {
        text: "Які у вас стосунки з вашим Сіром (вампіром, що вас створив)?",
        options: [
            { text: "Глибока повага, підпорядкування традиціям і суворій ієрархії.", scores: { ventrue: 2, tremere: 2, hecata: 1 } },
            { text: "Це мій суддя і суворий наставник у філософії чи темному мистецтві.", scores: { banu_haqim: 2, ministry: 2, lasombra: 1 } },
            { text: "Ми скоріше друзі, коханці або творчі партнери.", scores: { toreador: 2, brujah: 1 } },
            { text: "Мій сір кинув мене напризволяще відразу після перетворення.", scores: { gangrel: 2, unknown: 3 } },
            { text: "Я навіть не знаю, хто мій сір, мене взагалі вважають прикрою помилкою.", scores: { "thin-blood": 3, unknown: 2 } },
            { text: "Мій сір змусив мене знищити його, або ж сам став жертвою жорстокого полювання.", scores: { lasombra: 2, salubri: 3 } }
        ]
    },
    {
        text: "Яка надприродна здібність (Дисципліна) приваблює вас найбільше?",
        options: [
            { text: "Домінування, контроль розуму та накази, яким неможливо протистояти.", scores: { ventrue: 2, lasombra: 1, tremere: 1 } },
            { text: "Перетворення на тварин, єднання з природою або маніпуляція своєю плоттю.", scores: { gangrel: 2, tzimisce: 2 } },
            { text: "Надлюдська швидкість, неймовірна сила або зачаровуюча присутність.", scores: { brujah: 2, toreador: 2 } },
            { text: "Невидимість, створення реалістичних ілюзій і обман почуттів.", scores: { nosferatu: 2, ravnos: 3 } },
            { text: "Магія крові, некромантія та стародавні містичні ритуали.", scores: { tremere: 2, hecata: 2, banu_haqim: 1 } },
            { text: "Вміння зцілювати душі, варити алхімію з крові, або просто можливість бачити сонце.", scores: { salubri: 2, "thin-blood": 3 } }
        ]
    },
    {
        text: "Яке ваше ставлення до смертних (людей)?",
        options: [
            { text: "Вони — ресурс, стадо, яким потрібно керувати або використовувати.", scores: { ventrue: 2, tzimisce: 2, lasombra: 2 } },
            { text: "Вони — мої музи, коханці або іграшки, з якими так приємно бавитися.", scores: { toreador: 3, ministry: 2 } },
            { text: "Вони небезпечні. Краще триматися від них подалі та залишатися в тіні.", scores: { nosferatu: 2, ravnos: 2 } },
            { text: "Це моє минуле. Я все ще відчуваю зв'язок з ними або навіть намагаюся жити серед них.", scores: { brujah: 1, unknown: 2, "thin-blood": 3 } },
            { text: "Вони — загублені душі, яких треба направляти, судити або захищати.", scores: { banu_haqim: 2, salubri: 3, malkavian: 1 } },
            { text: "Мене цікавлять лише їхні трупи, душі або гроші, які вони залишають після себе.", scores: { hecata: 3, tremere: 1 } }
        ]
    },
    {
        text: "Хтось із ваших союзників жорстоко вас зрадив. Ваша реакція?",
        options: [
            { text: "Систематичне знищення їхнього життя, фінансів, репутації та всіх, кого вони люблять.", scores: { ventrue: 2, tremere: 2 } },
            { text: "Негайна та дуже жорстока фізична розправа.", scores: { brujah: 3, gangrel: 2 } },
            { text: "Повільні, неприродні тортури, від яких не врятує навіть смерть.", scores: { tzimisce: 3, hecata: 2 } },
            { text: "Я змушу їх страждати через провину, ілюзії або абсолютну параною.", scores: { malkavian: 3, ravnos: 2, ministry: 1 } },
            { text: "Швидка кара відповідно до законів крові та справедливості.", scores: { banu_haqim: 3, lasombra: 2 } },
            { text: "Я звик до зрад. Я просто розчинюся в ночі та зміню своє оточення.", scores: { nosferatu: 2, unknown: 2, "thin-blood": 1, salubri: 1 } }
        ]
    },
    {
        text: "Як виглядає ваш ідеальний Сховок (Haven)?",
        options: [
            { text: "Старовинний замок, розкішний маєток або закритий приватний клуб.", scores: { ventrue: 2, lasombra: 2, toreador: 2 } },
            { text: "Добре захищена лабораторія, окультна бібліотека або лігво з пастками.", scores: { tremere: 3, tzimisce: 2 } },
            { text: "Мавзолей, цвинтар, морг або місце, просякнуте смертю.", scores: { hecata: 3, nosferatu: 1 } },
            { text: "Щось мобільне або просто неба: фургон, ліс або вулиці міста.", scores: { gangrel: 3, ravnos: 2, brujah: 1 } },
            { text: "Глибокі катакомби, закинуте метро або місце, куди не проникає жоден промінь світла.", scores: { nosferatu: 3, malkavian: 1 } },
            { text: "Дешевий мотель, звичайна квартира або навіть диван у смертного друга.", scores: { "thin-blood": 3, unknown: 2, ministry: 1 } }
        ]
    },
    {
        text: "Які у вас стосунки з релігією, вірою або містицизмом?",
        options: [
            { text: "Я використовую релігію як інструмент для контролю над масами.", scores: { lasombra: 3, ventrue: 1 } },
            { text: "Я дотримуюся суворого стародавнього кодексу або віри своїх предків.", scores: { banu_haqim: 3, salubri: 2, hecata: 1 } },
            { text: "Я прагну руйнувати табу і звільняти душі через спокусу та гріх.", scores: { ministry: 3, ravnos: 1 } },
            { text: "Я досліджую це клінічно, щоб отримати абсолютну владу над реальністю.", scores: { tremere: 3, tzimisce: 2 } },
            { text: "Я чую шепіт всесвіту; віра — це і безумство, і єдина істина.", scores: { malkavian: 3, brujah: 1 } },
            { text: "Мене не хвилюють стародавні міфи, я просто намагаюся вижити цієї ночі.", scores: { gangrel: 1, nosferatu: 1, unknown: 2, "thin-blood": 2 } }
        ]
    },
    {
        text: "Якби ви могли досягти однієї абсолютної мети, що б це було?",
        options: [
            { text: "Тотальна влада і панування над цілим містом або сектою.", scores: { ventrue: 3, lasombra: 2 } },
            { text: "Трансцендувати це прокляте тіло в щось вище, досконале і могутнє.", scores: { tzimisce: 3, tremere: 2 } },
            { text: "Знайти Голконду (духовне спасіння) або принести абсолютну справедливість.", scores: { salubri: 3, banu_haqim: 2 } },
            { text: "Зруйнувати корумповану систему і побудувати вільне суспільство.", scores: { brujah: 3, ministry: 1 } },
            { text: "Накопичити неймовірні багатства, секрети і захистити свою «сім'ю».", scores: { hecata: 3, nosferatu: 2, toreador: 1 } },
            { text: "Щоб мене просто залишили в спокої, мати можливість подорожувати або знову стати людиною.", scores: { gangrel: 2, ravnos: 2, unknown: 2, "thin-blood": 3 } }
        ]
    }
];

const quizClanImages = {
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
    "thin-blood": "Thinblood_symbol.png",
    "thin_blood": "Thinblood_symbol.png"
};

let quizCurrentQuestionIndex = 0;
let quizUserScores = {};
let quizTopClanKey = null;
let quizRunnerUpKey = null;

function initQuizScores() {
    quizUserScores = {};
    for (let clan in quizClans) {
        quizUserScores[clan] = 0;
    }
}

function openQuizModal() {
    const modal = document.getElementById('quiz-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Показуємо стартовий екран
    document.getElementById('quiz-intro-screen').classList.remove('hidden');
    document.getElementById('quiz-question-screen').classList.add('hidden');
    document.getElementById('quiz-result-screen').classList.add('hidden');
}

function closeQuizModal() {
    const modal = document.getElementById('quiz-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function startQuiz() {
    initQuizScores();
    quizCurrentQuestionIndex = 0;
    quizTopClanKey = null;
    quizRunnerUpKey = null;
    
    document.getElementById('quiz-intro-screen').classList.add('hidden');
    document.getElementById('quiz-question-screen').classList.remove('hidden');
    document.getElementById('quiz-result-screen').classList.add('hidden');
    
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const q = quizQuestions[quizCurrentQuestionIndex];
    if (!q) return;
    
    document.getElementById('quiz-current-q-num').innerText = quizCurrentQuestionIndex + 1;
    const progress = Math.round(((quizCurrentQuestionIndex) / quizQuestions.length) * 100);
    document.getElementById('quiz-progress-bar').style.width = `${progress}%`;
    document.getElementById('quiz-progress-text').innerText = `${progress}%`;
    
    const qText = document.getElementById('quiz-question-text');
    qText.innerText = q.text;
    
    const optionsContainer = document.getElementById('quiz-options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'text-left p-3.5 sm:p-4 rounded-xl bg-zinc-800/80 hover:bg-[#8b0000] border border-zinc-700 hover:border-red-600 text-zinc-200 hover:text-white text-sm sm:text-base font-medium transition-all transform hover:translate-x-1 duration-150 w-full shadow-sm';
        btn.innerText = opt.text;
        btn.onclick = () => selectQuizOption(opt.scores);
        optionsContainer.appendChild(btn);
    });
}

function selectQuizOption(scores) {
    for (let clan in scores) {
        if (quizUserScores[clan] !== undefined) {
            quizUserScores[clan] += scores[clan];
        } else {
            quizUserScores[clan] = scores[clan];
        }
    }
    
    quizCurrentQuestionIndex++;
    
    if (quizCurrentQuestionIndex < quizQuestions.length) {
        renderQuizQuestion();
    } else {
        showQuizResult();
    }
}

function showQuizResult() {
    document.getElementById('quiz-question-screen').classList.add('hidden');
    document.getElementById('quiz-progress-bar').style.width = `100%`;
    document.getElementById('quiz-progress-text').innerText = `100%`;
    
    let sortedClans = Object.keys(quizUserScores).sort((a, b) => quizUserScores[b] - quizUserScores[a]);
    quizTopClanKey = sortedClans[0];
    quizRunnerUpKey = sortedClans[1];

    if (!quizTopClanKey || quizUserScores[quizTopClanKey] === 0) {
        quizTopClanKey = 'unknown';
        quizRunnerUpKey = 'thin-blood';
    }

    const topClan = quizClans[quizTopClanKey] || {};
    const runnerUp = quizClans[quizRunnerUpKey] || {};

    // Оновлення полів результату
    document.getElementById('quiz-result-clan').innerText = topClan.name || '';
    document.getElementById('quiz-result-subtitle').innerText = topClan.subtitle || '';
    document.getElementById('quiz-result-desc').innerText = topClan.desc || '';
    document.getElementById('quiz-result-compulsion').innerText = topClan.clan_compultion || 'Відсутнє';
    document.getElementById('quiz-result-bane').innerText = topClan.clan_bane || 'Відсутнє';
    
    const runnerUpEl = document.getElementById('quiz-runner-up');
    if (runnerUpEl && runnerUp.name) {
        runnerUpEl.innerText = `${runnerUp.name} (${runnerUp.subtitle || ''})`;
    }

    // Іконка переможця
    const iconEl = document.getElementById('quiz-result-icon');
    if (iconEl) {
        const imgName = quizClanImages[quizTopClanKey] || (typeof clanImages !== 'undefined' && clanImages[quizTopClanKey]) || 'Caitiff_symbol.png';
        iconEl.src = `Clan_symbols/${imgName}`;
    }

    // Оновлення кнопок вибору
    const selectTopBtn = document.getElementById('quiz-select-top-btn');
    if (selectTopBtn) {
        selectTopBtn.innerText = `🩸 Обрати клан: ${topClan.name}`;
    }
    
    const selectRunnerBtn = document.getElementById('quiz-select-runner-btn');
    if (selectRunnerBtn) {
        if (runnerUp && runnerUp.name) {
            selectRunnerBtn.innerText = `Обрати другий варіант: ${runnerUp.name}`;
            selectRunnerBtn.classList.remove('hidden');
        } else {
            selectRunnerBtn.classList.add('hidden');
        }
    }
    
    const resultScreen = document.getElementById('quiz-result-screen');
    resultScreen.classList.remove('hidden');
}

function applyQuizClan(isRunnerUp = false) {
    const clanKey = isRunnerUp ? quizRunnerUpKey : quizTopClanKey;
    if (!clanKey) return;
    
    if (typeof changeClan === 'function') {
        changeClan(clanKey);
    }
    
    closeQuizModal();
}

function restartQuiz() {
    startQuiz();
}
