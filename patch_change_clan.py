import sys

with open('app.js', 'r') as f:
    content = f.read()

old_func = '''    const select1 = document.getElementById('clan-select-1');
    const select4 = document.getElementById('clan-select-4');
    if (select1) select1.value = clanId;
    if (select4) select4.value = clanId;'''

new_func = '''    const select1 = document.getElementById('clan-select-1');
    const select4 = document.getElementById('clan-select-4');
    if (select1) select1.value = clanId;
    if (select4) select4.value = clanId;
    
    // Оновлення кнопки клану на першому кроці
    const clanBtnName = document.getElementById('clan-btn-name');
    const clanBtnIcon = document.getElementById('clan-btn-icon');
    if (clanBtnName && clanInfo) {
        clanBtnName.innerText = clanInfo.name || 'Невідомо';
    }
    if (clanBtnIcon && typeof clanImages !== 'undefined') {
        if (clanImages[clanId]) {
            clanBtnIcon.src = `Clan_symbols/${clanImages[clanId]}`;
            clanBtnIcon.style.display = 'block';
        } else {
            clanBtnIcon.style.display = 'none';
        }
    }'''

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('app.js', 'w') as f:
        f.write(content)
    print("Patched changeClan")
else:
    print("Could not find old_func in changeClan")
