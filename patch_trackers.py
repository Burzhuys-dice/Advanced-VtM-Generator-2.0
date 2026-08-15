import sys

with open('app.js', 'a') as f:
    f.write('''

// --- Health & Willpower Trackers ---

function getHealthMax() {
    return (state.attributes['stamina'] || 1) + 3;
}

function getWillpowerMax() {
    return (state.attributes['resolve'] || 1) + (state.attributes['composure'] || 1);
}

function handleDamageClick(type, index) {
    let arr = type === 'health' ? state.healthDamage : state.willpowerDamage;
    let max = type === 'health' ? getHealthMax() : getWillpowerMax();
    
    while(arr.length < max) arr.push(0);
    if(arr.length > max) arr.splice(max);
    
    arr[index] = (arr[index] + 1) % 3;
    
    renderHealthWillpower();
}

function renderHealthWillpower() {
    const healthMax = getHealthMax();
    const wpMax = getWillpowerMax();
    
    if (!state.healthDamage) state.healthDamage = [];
    if (!state.willpowerDamage) state.willpowerDamage = [];
    
    let hArr = state.healthDamage;
    while(hArr.length < healthMax) hArr.push(0);
    if(hArr.length > healthMax) hArr.splice(healthMax);
    
    let wArr = state.willpowerDamage;
    while(wArr.length < wpMax) wArr.push(0);
    if(wArr.length > wpMax) wArr.splice(wpMax);
    
    let hHtml = '';
    for(let i=0; i<healthMax; i++) {
        let content = hArr[i] === 1 ? '/' : (hArr[i] === 2 ? 'X' : '');
        hHtml += `<div class="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-400 bg-gray-50 flex items-center justify-center font-bold text-lg md:text-xl cursor-pointer hover:bg-gray-200 select-none text-red-600 print:border-gray-500" onclick="handleDamageClick('health', ${i})">${content}</div>`;
    }
    
    let wHtml = '';
    for(let i=0; i<wpMax; i++) {
        let content = wArr[i] === 1 ? '/' : (wArr[i] === 2 ? 'X' : '');
        wHtml += `<div class="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-400 bg-gray-50 flex items-center justify-center font-bold text-lg md:text-xl cursor-pointer hover:bg-gray-200 select-none text-red-600 print:border-gray-500" onclick="handleDamageClick('willpower', ${i})">${content}</div>`;
    }
    
    ['health-tracker-step2', 'health-tracker-step7'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = hHtml;
    });
    
    ['willpower-tracker-step2', 'willpower-tracker-step7'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = wHtml;
    });
}
''')
