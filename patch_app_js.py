import sys

with open('app.js', 'r') as f:
    content = f.read()

# I want to append the new clan modal functions to the end of app.js.
new_js = '''
// --- Clan Selection Modal ---

const clanCategories = [
    {
        title: "Правителі та командири",
        clans: ["ventrue", "tzimisce", "lasombra"]
    },
    {
        title: "Бійці та захисники",
        clans: ["brujah", "gangrel", "banu_haqim"]
    },
    {
        title: "Спокусники та обманщики",
        clans: ["toreador", "ravnos", "ministry"]
    },
    {
        title: "Розслідувачі та дослідники",
        clans: ["malkavian", "tremere", "hecata"]
    },
    {
        title: "Тіні та спостерігачі",
        clans: ["nosferatu", "salubri"]
    },
    {
        title: "Відлюдники та вигнанці",
        clans: ["unknown", "thin-blood"]
    }
];

const clanImages = {
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
    "thin-blood": "Thinblood_symbol.png"
};

function openClanModal() {
    renderClanModal();
    document.getElementById('clan-modal').classList.remove('hidden');
    document.getElementById('clan-modal').classList.add('flex');
}

function closeClanModal() {
    document.getElementById('clan-modal').classList.add('hidden');
    document.getElementById('clan-modal').classList.remove('flex');
}

function selectClanFromModal(clanId) {
    changeClan(clanId);
    
    // Оновлюємо прихований селект для сумісності
    const sel = document.getElementById('clan-select-1');
    if (sel) sel.value = clanId;
    
    closeClanModal();
}

function renderClanModal() {
    const container = document.getElementById('clan-modal-content');
    if (!container) return;
    
    let html = '<div class="space-y-8">';
    
    clanCategories.forEach(cat => {
        html += `
            <div>
                <h3 class="text-xl font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">${cat.title}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        `;
        
        cat.clans.forEach(clanId => {
            const clanData = clansData[clanId];
            if (!clanData) return;
            
            const imgSrc = clanImages[clanId] ? `Clan_symbols/${clanImages[clanId]}` : '';
            
            html += `
                <button onclick="selectClanFromModal('${clanId}')" class="flex items-start p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-red-500 rounded-lg transition-all group text-left h-full">
                    <div class="shrink-0 mr-4 bg-gray-900 rounded p-2 border border-gray-700 group-hover:border-red-500 transition-colors w-16 h-16 flex items-center justify-center">
                        <img src="${imgSrc}" class="w-full h-full object-contain filter invert opacity-70 group-hover:opacity-100 transition-opacity" alt="${clanData.name}">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-serif font-bold text-white group-hover:text-red-400 truncate">${clanData.name}</h4>
                        <p class="text-xs text-gray-400 mt-1 line-clamp-3 leading-tight">${clanData.desc || ''}</p>
                    </div>
                </button>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}
'''

with open('app.js', 'a') as f:
    f.write(new_js)

