const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const diceButton = `
                <button onclick="openDiceModal()" class="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-gray-700 text-center shadow-inner transition-colors mr-1 md:mr-2 flex flex-col items-center justify-center">
                    <svg class="w-4 h-4 md:w-5 md:h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <span class="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Кинути</span>
                </button>`;

content = content.replace('<div class="bg-gray-800 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-gray-700 text-center shadow-inner">', diceButton + '\n                <div class="bg-gray-800 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-gray-700 text-center shadow-inner">');

const diceModal = `
    <!-- Dice Roller Modal -->
    <div id="dice-modal" class="fixed inset-0 bg-black bg-opacity-75 z-[100] hidden items-center justify-center p-4 print:hidden">
        <div class="bg-[#1a1a1a] text-white w-full max-w-md rounded-xl shadow-2xl border border-gray-700 overflow-hidden relative">
            <div class="bg-[#8b0000] p-4 flex justify-between items-center">
                <h2 class="text-lg font-bold vtm-font uppercase tracking-widest text-white">Кидок кубиків</h2>
                <button onclick="closeDiceModal()" class="text-white hover:text-gray-300">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <div class="p-4 md:p-6">
                <div class="flex border-b border-gray-700 mb-4">
                    <button id="dice-tab-free" onclick="switchDiceTab('free')" class="flex-1 py-2 text-center border-b-2 border-[#8b0000] text-white text-sm font-bold transition-colors">Вільний</button>
                    <button id="dice-tab-sheet" onclick="switchDiceTab('sheet')" class="flex-1 py-2 text-center border-b-2 border-transparent text-gray-500 text-sm font-bold transition-colors hover:text-gray-300">З аркуша</button>
                </div>
                
                <div id="dice-mode-free" class="space-y-4">
                    <div>
                        <label class="block text-xs uppercase tracking-widest text-gray-400 mb-1">Кількість к10</label>
                        <select id="dice-free-total" class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-[#8b0000]"></select>
                    </div>
                    <div>
                        <label class="block text-xs uppercase tracking-widest text-red-400 mb-1">Кістки голоду (замінюють звичайні)</label>
                        <select id="dice-free-hunger" class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500">
                            <option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                        </select>
                    </div>
                </div>
                
                <div id="dice-mode-sheet" class="space-y-4 hidden">
                    <div class="flex flex-col gap-2">
                        <div>
                            <label class="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Меню 1</label>
                            <select id="dice-sheet-1" class="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white outline-none focus:border-[#8b0000]" onchange="updateSheetDiceTotal()"><option value="">- Оберіть -</option></select>
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Меню 2</label>
                            <select id="dice-sheet-2" class="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white outline-none focus:border-[#8b0000]" onchange="updateSheetDiceTotal()"><option value="">- Оберіть -</option></select>
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Меню 3</label>
                            <select id="dice-sheet-3" class="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white outline-none focus:border-[#8b0000]" onchange="updateSheetDiceTotal()"><option value="">- Оберіть -</option></select>
                        </div>
                    </div>
                    <div class="flex justify-between items-center bg-gray-800 p-2 rounded border border-gray-700">
                        <span class="text-xs text-gray-300 uppercase tracking-widest">Разом крапок (пул):</span>
                        <span id="dice-sheet-total-display" class="text-xl font-bold text-white">0</span>
                    </div>
                    <div>
                        <label class="block text-xs uppercase tracking-widest text-red-400 mb-1">Кістки голоду</label>
                        <select id="dice-sheet-hunger" class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500">
                            <option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                        </select>
                    </div>
                </div>
                
                <button onclick="rollDice()" class="w-full mt-6 bg-[#8b0000] hover:bg-red-800 text-white font-bold py-3 px-4 rounded transition-colors uppercase tracking-widest">Кинути</button>
                
                <div id="dice-results" class="mt-6 hidden">
                    <h3 class="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-1 mb-3">Результат</h3>
                    <div id="dice-container" class="flex flex-wrap gap-2 justify-center"></div>
                </div>
            </div>
        </div>
    </div>
`;

content = content.replace('<!-- Sidebar Overlay -->', diceModal + '\n    <!-- Sidebar Overlay -->');

fs.writeFileSync('index.html', content);
