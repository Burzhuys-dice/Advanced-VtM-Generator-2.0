import fs from 'fs';
let code = fs.readFileSync('v6Generator.js', 'utf8');

const regex = /\/\/ 3\. Fallback: If no powers were explicitly chosen, but character has dots in disciplines, populate with all powers up to current dots[\s\S]*?if \(selectedPowers\.length === 0\) \{[\s\S]*?Object\.entries\(v6State\.disciplines \|\| \{\}\)\.forEach\(\(\[discId, dots\]\) => \{[\s\S]*?if \(dots > 0\) \{[\s\S]*?const d = allDisciplines\.find\(x => x\.id === discId\);[\s\S]*?if \(d && Array\.isArray\(d\.powers\)\) \{[\s\S]*?d\.powers\.filter\(p => \(p\.rank \|\| p\.level \|\| 1\) <= dots\)\.forEach\(p => \{[\s\S]*?if \(!selectedPowers\.some\(sp => sp\.power\.id === p\.id\)\) \{[\s\S]*?selectedPowers\.push\(\{[\s\S]*?discId: d\.id,[\s\S]*?discName: d\.name,[\s\S]*?power: p[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?let p4Html = '';/m;

const replacement = `    // If no powers were explicitly chosen, generate a placeholder page
    let p4Html = '';
    
    if (selectedPowers.length === 0) {
        p4Html = \`
            <div class="v6-sheet-page v6-details-page bg-white text-black font-sans mx-auto w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] relative box-border overflow-hidden print:w-full print:h-[297mm] print:shadow-none print:max-w-none shadow-2xl p-[8mm] flex flex-col mb-8 print:mb-0">
                <!-- Outer border -->
                <div class="absolute inset-[5mm] border-[2.5px] border-black pointer-events-none print:inset-[4mm]">
                    <div class="absolute -top-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                    <div class="absolute -top-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
                    <div class="absolute -bottom-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                    <div class="absolute -bottom-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
                </div>
                
                <div class="relative z-10 h-full flex flex-col justify-between p-[4mm] overflow-hidden">
                    <div class="shrink-0">
                        <h1 class="font-serif font-bold text-[18px] uppercase tracking-widest text-center mb-1">СИЛИ ТА ЗДАТНОСТІ ДИСЦИПЛІН</h1>
                        <p class="text-center text-zinc-600 mb-2 italic text-[12.5px]">Повний опис та правила використання надприродних здібностей персонажа \${charName}.</p>
                    </div>
                    
                    <div class="flex-1 flex flex-col items-center justify-center p-10">
                        <div class="bg-red-50/50 border-2 border-dashed border-red-200 rounded-3xl p-10 text-center max-w-md w-full mx-auto print:hidden">
                            <div class="text-4xl mb-4">⚠️</div>
                            <h2 class="text-xl font-bold text-red-900 uppercase tracking-widest mb-2 font-serif">Сили не обрані</h2>
                            <p class="text-sm text-red-700 leading-relaxed">
                                Будь ласка, поверніться на <button onclick="goToV6Step(6)" class="underline font-bold hover:text-red-900">Крок 6</button> та оберіть Сили Крові для ваших Дисциплін, щоб вони з'явились на цьому аркуші.
                            </p>
                        </div>
                        <div class="hidden print:block text-center max-w-md w-full mx-auto p-10 border-2 border-dashed border-zinc-300 rounded-3xl">
                            <div class="text-2xl mb-2 text-zinc-400">Сили не обрані</div>
                            <p class="text-xs text-zinc-500">Заповніть цей аркуш власноруч або поверніться в конструктор.</p>
                        </div>
                    </div>
                    
                    <div class="shrink-0 text-center text-[11px] font-bold tracking-widest uppercase pt-1">\${charName}</div>
                </div>
            </div>
        \`;
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('v6Generator.js', code);
console.log("Patched successfully");
