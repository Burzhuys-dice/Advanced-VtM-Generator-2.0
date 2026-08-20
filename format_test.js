const fs = require('fs');

const drawDots = (filled, total = 5) => {
    let html = '<div class="flex gap-[2px]">';
    for(let i = 0; i < total; i++) {
        if(i < filled) {
            html += `<svg width="10" height="10" viewBox="0 0 10 10" class="fill-black"><rect x="1" y="1" width="8" height="8" rx="1" /></svg>`;
        } else {
            html += `<svg width="10" height="10" viewBox="0 0 10 10" class="fill-none stroke-black stroke-[1px]"><rect x="1" y="1" width="8" height="8" rx="1" /></svg>`;
        }
    }
    html += '</div>';
    return html;
};
console.log(drawDots(3, 5));
