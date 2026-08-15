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
