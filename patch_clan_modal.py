import sys

with open('index.html', 'r') as f:
    content = f.read()

# Replace the select on step 1 with a button
old_clan_html = '''    <select id="clan-select-1" onchange="changeClan(this.value)" class="custom-input text-xl w-full border border-gray-300 rounded p-2"></select>'''

new_clan_html = '''    <!-- Замість select тепер кнопка відкриття модального вікна -->
    <button type="button" onclick="openClanModal()" id="clan-select-btn" class="w-full flex items-center justify-between border border-gray-300 rounded p-4 bg-white hover:bg-gray-50 transition-colors shadow-sm text-left">
        <div class="flex items-center gap-4">
            <img id="clan-btn-icon" src="Clan_symbols/Caitiff_symbol.png" alt="Icon" class="w-12 h-12 object-contain filter invert" style="display:none;">
            <div>
                <div class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Обраний Клан:</div>
                <div id="clan-btn-name" class="text-2xl font-serif text-gray-900">Невідомо (Каїтиф)</div>
            </div>
        </div>
        <div class="text-[#8b0000]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </button>
    <select id="clan-select-1" class="hidden"></select> <!-- Прихований селект для сумісності з існуючим кодом -->'''

if old_clan_html in content:
    content = content.replace(old_clan_html, new_clan_html)
else:
    print("Could not find old_clan_html in index.html")

# Add the clan modal
old_modal_anchor = '''    <div id="dice-modal"'''
new_modal_anchor = '''    <!-- CLAN SELECTION MODAL -->
    <div id="clan-modal" class="fixed inset-0 bg-black bg-opacity-75 z-[100] hidden items-center justify-center p-4 print:hidden">
        <div class="bg-[#1a1a1a] text-white w-full max-w-5xl max-h-[95vh] flex flex-col rounded-xl shadow-2xl border border-gray-700 overflow-hidden relative">
            <div class="bg-[#8b0000] p-4 flex justify-between items-center shrink-0">
                <h2 class="text-lg font-bold vtm-font uppercase tracking-widest text-white">Вибір Клану</h2>
                <button onclick="closeClanModal()" class="text-white hover:text-gray-300">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar" id="clan-modal-content">
                <!-- Вміст генерується динамічно -->
            </div>
        </div>
    </div>

    <div id="dice-modal"'''

if old_modal_anchor in content:
    content = content.replace(old_modal_anchor, new_modal_anchor)
else:
    print("Could not find old_modal_anchor in index.html")

with open('index.html', 'w') as f:
    f.write(content)

