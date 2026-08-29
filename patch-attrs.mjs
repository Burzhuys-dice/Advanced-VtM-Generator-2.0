import fs from 'fs';
let code = fs.readFileSync('v6Generator.js', 'utf8');

const regex = /const ATTRIBUTE_CATEGORIES = \[\s*\{\s*key: 'physical',[\s\S]*?\]\s*\}\s*\];/;
const match = code.match(regex);
if (match) {
    const dataDef = match[0].replace('const ATTRIBUTE_CATEGORIES =', 'const V6_ATTRIBUTE_CATEGORIES_DATA =');
    // Remove spent: socialSpent, physicalSpent, mentalSpent from dataDef
    let cleanDef = dataDef.replace(/\s*spent:\s*[a-zA-Z]+Spent,/g, '');
    
    // Replace the definition inside the function
    const replacement = `    const ATTRIBUTE_CATEGORIES = [
        { ...V6_ATTRIBUTE_CATEGORIES_DATA[0], spent: physicalSpent },
        { ...V6_ATTRIBUTE_CATEGORIES_DATA[1], spent: socialSpent },
        { ...V6_ATTRIBUTE_CATEGORIES_DATA[2], spent: mentalSpent }
    ];`;
    
    code = code.replace(match[0], replacement);
    // Put cleanDef outside the function
    const funcRegex = /function renderV6Step5_AttributesSkills\(\) \{/;
    code = code.replace(funcRegex, cleanDef + '\n\nfunction renderV6Step5_AttributesSkills() {');
    fs.writeFileSync('v6Generator.js', code);
    console.log("Patched successfully");
} else {
    console.log("No match found");
}
