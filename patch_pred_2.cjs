const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const target = "            cardsHtml += `\n" +
"                <div class=\"predator-card flex flex-col bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 hover:shadow transition-all overflow-hidden ${isSelected ? 'selected' : ''}\"\n" +
"                      onclick=\"selectPredator('${predator.id}')\">\n" +
"                    <div class=\"flex items-center justify-between gap-2 mb-2 w-full\">\n" +
"                        <span class=\"text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border max-w-[60%] truncate ${category.badgeStyle}\">${category.icon} ${category.name}</span>\n" +
"                        <span class=\"text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap ${modifierColor}\">${modifierText}</span>\n" +
"                    </div>\n" +
"                    <h3 class=\"font-serif font-bold text-base sm:text-lg text-[#1a1a1a] leading-snug w-full mb-2\">${predator.name}</h3>\n" +
"                    <p class=\"text-xs text-gray-600 mb-3 leading-relaxed text-justify\">${predator.description}</p>\n" +
"                    ${advantagesDisplay}\n" +
"                    ${optionsHtml}\n" +
"                </div>\n" +
"            `;";


const replacement = "            const arrowSvg = isSelected \n" +
"                ? '<svg class=\"w-4 h-4 text-[#4b0082]\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 15l7-7 7 7\"></path></svg>'\n" +
"                : '<svg class=\"w-4 h-4 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 9l-7 7-7-7\"></path></svg>';\n" +
"\n" +
"            cardsHtml += `\n" +
"                <div class=\"predator-card flex flex-col bg-white rounded-xl border ${isSelected ? 'border-[#4b0082] shadow-md ring-1 ring-[#4b0082]' : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow'} cursor-pointer transition-all overflow-hidden\"\n" +
"                      onclick=\"selectPredator('${predator.id}')\">\n" +
"                    <!-- Завжди видимий заголовок -->\n" +
"                    <div class=\"flex items-center justify-between p-4 sm:p-5\">\n" +
"                        <h3 class=\"font-serif font-bold text-base sm:text-lg ${isSelected ? 'text-[#4b0082]' : 'text-[#1a1a1a]'} leading-snug\">${predator.name}</h3>\n" +
"                        ${arrowSvg}\n" +
"                    </div>\n" +
"                    \n" +
"                    <!-- Прихований контент -->\n" +
"                    ${isSelected ? `\n" +
"                    <div class=\"px-4 sm:px-5 pb-4 sm:pb-5 pt-0 animate-[fadeIn_0.2s_ease-in-out]\">\n" +
"                        <div class=\"flex items-center justify-between gap-2 mb-3 w-full border-t border-gray-100 pt-3\">\n" +
"                            <span class=\"text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border max-w-[60%] truncate ${category.badgeStyle}\">${category.icon} ${category.name}</span>\n" +
"                            <span class=\"text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap ${modifierColor}\">${modifierText}</span>\n" +
"                        </div>\n" +
"                        <p class=\"text-xs text-gray-600 mb-4 leading-relaxed text-justify\">${predator.description}</p>\n" +
"                        \n" +
"                        <div class=\"bg-gray-50 border-l-2 border-[#4b0082] p-3 mb-4 rounded-r shadow-sm\">\n" +
"                            <span class=\"block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1\">Рекомендовані перевірки:</span>\n" +
"                            <span class=\"text-xs font-semibold text-gray-800\">${getPredatorChecks(predator.id)}</span>\n" +
"                        </div>\n" +
"                        \n" +
"                        ${advantagesDisplay}\n" +
"                        ${optionsHtml}\n" +
"                    </div>\n" +
"                    ` : ''}\n" +
"                </div>\n" +
"            `;";

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('app.js', code);
    console.log("Success");
} else {
    console.log("Target not found!");
}
