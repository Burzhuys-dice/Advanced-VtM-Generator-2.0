const fs = require('fs');

const file = 'data/vtm_merits_data.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let changes = 0;
data.forEach(item => {
    if (item.cost && typeof item.cost === 'string') {
        const oldCost = item.cost;
        item.cost = item.cost.replace(/[()]/g, '').trim();
        if (oldCost !== item.cost) {
            changes++;
        }
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log(`Updated ${changes} items in ${file}`);
