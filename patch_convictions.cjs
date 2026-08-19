const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newPair = `
    <!-- Пара 3 -->
    <div>
        <div class="flex items-center gap-2 mb-1">
            <label for="conviction3" class="block text-sm font-medium text-gray-700">Переконання 3</label>
            <div class="relative flex items-center group z-20">
                <button type="button" class="text-gray-400 hover:text-[#8b0000] transition-colors cursor-help">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>
                <div class="absolute bottom-full left-0 mb-2 w-64 p-2.5 bg-gray-900 text-white text-xs leading-relaxed rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
                    Третє фундаментальне правило вашого персонажа, що допомагає чіплятися за залишки Людяності.
                    <div class="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
        </div>
        <textarea id="conviction3" name="conviction3" rows="2" class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border resize-y" placeholder="Третє переконання..."></textarea>
    </div>
    <div>
        <label for="touchstone3" class="block text-sm font-medium text-gray-700 mb-1">Опора 3</label>
        <textarea id="touchstone3" name="touchstone3" rows="2" class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border resize-y" placeholder="Опора для третього переконання..."></textarea>
    </div>
</div>
`;

html = html.replace('    </div>\n</div>', '    </div>\n' + newPair);

const newButtons = `    <button type="button" id="btn-random-conviction3" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300">
        Випадкове Переконання 3
    </button>
</div>`;

html = html.replace('    </button>\n</div>', '    </button>\n' + newButtons);

fs.writeFileSync('index.html', html);
console.log("Success HTML");
