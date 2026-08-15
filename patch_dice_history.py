import sys

with open('app.js', 'r') as f:
    content = f.read()

old_func = '''    container.innerHTML = `<div class="flex flex-wrap gap-2 justify-center w-full">${diceHtml}</div>${summaryHtml}`;
    
    document.getElementById('dice-results')?.classList.remove('hidden');
}'''

new_func = '''    container.innerHTML = `<div class="flex flex-wrap gap-2 justify-center w-full">${diceHtml}</div>${summaryHtml}`;
    
    document.getElementById('dice-results')?.classList.remove('hidden');
    
    // Add to history
    let rollName = '';
    if (diceMode === 'free') {
        rollName = 'Вільний кидок';
    } else {
        let parts = [];
        ['dice-sheet-1', 'dice-sheet-2', 'dice-sheet-3'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value) {
                parts.push(el.options[el.selectedIndex].text);
            }
        });
        
        let bonus = parseInt(document.getElementById('dice-sheet-bonus')?.value) || 0;
        if (bonus > 0) parts.push(`+${bonus}`);
        else if (bonus < 0) parts.push(`${bonus}`);
        
        rollName = parts.length > 0 ? parts.join(' + ') : 'Кидок з аркуша';
    }
    
    if (typeof diceHistory === 'undefined') {
        window.diceHistory = [];
    }
    
    window.diceHistory.unshift({ name: rollName, successes: successes, messy: messyCritical, bestial: bestialFailure });
    if (window.diceHistory.length > 5) window.diceHistory.pop();
    
    renderDiceHistory();
}

function renderDiceHistory() {
    const container = document.getElementById('dice-history-container');
    const list = document.getElementById('dice-history-list');
    if (!container || !list) return;

    if (!window.diceHistory || window.diceHistory.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    list.innerHTML = '';
    window.diceHistory.forEach(roll => {
        let alerts = [];
        if (roll.messy) alerts.push('<span class="text-yellow-500 text-[10px] ml-1 font-bold uppercase" title="Звіриний Розгром">!Розгром!</span>');
        if (roll.bestial) alerts.push('<span class="text-red-500 text-[10px] ml-1 font-bold uppercase" title="Звіриний Провал">!Провал!</span>');
        
        list.innerHTML += `
            <li class="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center">
                <span class="text-xs text-gray-300 truncate max-w-[200px]" title="${roll.name}">${roll.name}</span>
                <span class="text-sm font-bold text-white flex items-center">Успіхи: <span class="text-[#8b0000] ml-1 mr-1">${roll.successes}</span> ${alerts.join('')}</span>
            </li>
        `;
    });
}
'''

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('app.js', 'w') as f:
        f.write(content)
    print("Patched app.js with dice history")
else:
    print("Could not find old_func in app.js")

