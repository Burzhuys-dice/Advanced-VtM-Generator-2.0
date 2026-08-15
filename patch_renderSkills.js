const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const dynamicFunc = `
function getDynamicSkillData(skillId) {
    let baseDots = state.skills[skillId] || 0;
    let manualSpec = state.skillSpecs ? (state.skillSpecs[skillId] || "") : "";
    
    let isPredator = (state.predatorChoices && state.predatorChoices.skill === skillId);
    let predSpec = isPredator ? state.predatorChoices.specName : "";
    let bonus = (isPredator && baseDots === 0) ? 1 : 0;
    
    let fixedSpecInput = document.getElementById('spec-' + skillId);
    let fixedSpecValue = fixedSpecInput ? fixedSpecInput.value.trim() : "";
    
    let customSpecSkill = document.getElementById('spec-custom-skill')?.value;
    let customSpecValue = document.getElementById('spec-custom-name')?.value.trim();
    let isCustom = (customSpecSkill === skillId && customSpecValue);

    let displaySpec = manualSpec;
    
    if (isPredator && predSpec) {
        if (!displaySpec) displaySpec = predSpec;
        else if (!displaySpec.toLowerCase().includes(predSpec.toLowerCase())) displaySpec = predSpec + ", " + displaySpec;
    }
    if (fixedSpecValue) {
        if (!displaySpec) displaySpec = fixedSpecValue;
        else if (!displaySpec.toLowerCase().includes(fixedSpecValue.toLowerCase())) displaySpec += ", " + fixedSpecValue;
    }
    if (isCustom) {
        if (!displaySpec) displaySpec = customSpecValue;
        else if (!displaySpec.toLowerCase().includes(customSpecValue.toLowerCase())) displaySpec += ", " + customSpecValue;
    }
    
    let freeSpecDot = 0;
    if (baseDots === 0 && bonus === 0 && displaySpec.trim() !== '') {
        freeSpecDot = 1;
    }
    
    return { baseDots, bonus, freeSpecDot, displaySpec };
}
`;

const renderSkillsNew = `function renderSkills() {
    const grid = document.getElementById('skills-grid');
    grid.innerHTML = '';
    const categories = [
        { key: 'physical', label: 'Фізичні' },
        { key: 'social', label: 'Соціальні' },
        { key: 'mental', label: 'Ментальні' }
    ];

    if (!state.skillSpecs) state.skillSpecs = {};

    categories.forEach(cat => {
        let colHTML = \`<div><h3 class="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wider">\${cat.label}</h3><div class="space-y-4">\`;
        (skillsData[cat.key] || []).forEach(skill => {
            const data = getDynamicSkillData(skill.id);
            
            colHTML += \`
                <div class="flex justify-between items-start group">
                    <div class="flex flex-col pr-4 w-full">
                        <span class="font-serif text-base text-gray-700 group-hover:text-[#8b0000] transition-colors">\${skill.name}</span>
                        \${skill.desc ? \`<span class="text-[11px] text-gray-500 italic mt-0.5 leading-tight">\${skill.desc}</span>\` : ''}
                        <input type="text" placeholder="Спеціалізація..." 
                               value="\${data.displaySpec}" 
                               onchange="updateSkillSpec('\${skill.id}', this.value)"
                               class="mt-1 w-full bg-transparent border-b border-gray-200 px-1 py-0.5 text-[12px] text-gray-600 outline-none focus:border-[#8b0000] transition-colors placeholder:text-gray-300">
                    </div>
                    <div class="shrink-0 mt-0.5">
                        \${createDotsHTML('skill', skill.id, data.baseDots, 5, data.bonus, data.freeSpecDot)}
                    </div>
                </div>
            \`;
        });
        colHTML += \`</div></div>\`;
        grid.innerHTML += colHTML;
    });
}`;

const updateSkillSpecNew = `function updateSkillSpec(skillId, newValue) {
    if (!state.skillSpecs) state.skillSpecs = {};
    state.skillSpecs[skillId] = newValue;
    renderSkills();
}`;

const setupSpecInputsNew = `function setupSpecializationInputs() {
    const inputs = ['spec-academics', 'spec-craft', 'spec-performance', 'spec-science', 'spec-custom-name'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderSkills);
    });
    const selectEl = document.getElementById('spec-custom-skill');
    if (selectEl) selectEl.addEventListener('change', renderSkills);
}`;

// Replace updateSkillSpec
code = code.replace(/function updateSkillSpec\([\s\S]*?\}\nfunction renderSkills\(\) \{/m, updateSkillSpecNew + '\n' + dynamicFunc + '\n' + renderSkillsNew + '\n//');
// Wait, regex might fail.

