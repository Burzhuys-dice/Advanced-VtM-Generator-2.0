const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// First, inject the getPredatorChecks function.
const getPredatorChecksFunc = `
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
`;

if (!code.includes('getPredatorChecks')) {
    code = code.replace('function renderPredatorTypes()', getPredatorChecksFunc + '\nfunction renderPredatorTypes()');
}

// Next, let's rewrite the cardHtml in renderPredatorTypes.
// Let's find the card rendering part.
const oldCardHtml = \`            cardsHtml += \\\`
                <div class="predator-card flex flex-col bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 hover:shadow transition-all overflow-hidden \${isSelected ? 'selected' : ''}"
                      onclick="selectPredator('\${predator.id}')">
                    <div class="flex items-center justify-between gap-2 mb-2 w-full">
                        <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border max-w-[60%] truncate \${category.badgeStyle}">\${category.icon} \${category.name}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap \${modifierColor}">\${modifierText}</span>
                    </div>
                    <h3 class="font-serif font-bold text-base sm:text-lg text-[#1a1a1a] leading-snug w-full mb-2">\${predator.name}</h3>
                    <p class="text-xs text-gray-600 mb-3 leading-relaxed text-justify">\${predator.description}</p>
                    \${advantagesDisplay}
                    \${optionsHtml}
                </div>
            \`;\`;

const newCardHtml = \`            const arrowSvg = isSelected 
                ? '<svg class="w-4 h-4 text-[#4b0082]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>'
                : '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';

            cardsHtml += \\\`
                <div class="predator-card flex flex-col bg-white rounded-xl border \${isSelected ? 'border-[#4b0082] shadow-md ring-1 ring-[#4b0082]' : 'border-gray-200 shadow-sm hover:border-gray-300'} cursor-pointer transition-all overflow-hidden"
                      onclick="selectPredator('\${predator.id}')">
                    <!-- Завжди видимий заголовок -->
                    <div class="flex items-center justify-between p-4 sm:p-5">
                        <h3 class="font-serif font-bold text-base sm:text-lg \${isSelected ? 'text-[#4b0082]' : 'text-[#1a1a1a]'} leading-snug">\${predator.name}</h3>
                        \${arrowSvg}
                    </div>
                    
                    <!-- Прихований контент -->
                    \${isSelected ? \\\`
                    <div class="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 animate-[fadeIn_0.2s_ease-in-out]">
                        <div class="flex items-center justify-between gap-2 mb-3 w-full border-t border-gray-100 pt-3">
                            <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border max-w-[60%] truncate \${category.badgeStyle}">\${category.icon} \${category.name}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap \${modifierColor}">\${modifierText}</span>
                        </div>
                        <p class="text-xs text-gray-600 mb-4 leading-relaxed text-justify">\${predator.description}</p>
                        
                        <div class="bg-gray-50 border-l-2 border-gray-300 p-3 mb-4 rounded-r">
                            <span class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Рекомендовані перевірки:</span>
                            <span class="text-xs text-gray-800">\${getPredatorChecks(predator.id)}</span>
                        </div>
                        
                        \${advantagesDisplay}
                        \${optionsHtml}
                    </div>
                    \\\` : ''}
                </div>
            \`;\`;

if (code.includes('cardsHtml +=')) {
    code = code.replace(oldCardHtml, newCardHtml);
} else {
    console.log("Could not find the target code to replace.");
}

fs.writeFileSync('app.js', code);
