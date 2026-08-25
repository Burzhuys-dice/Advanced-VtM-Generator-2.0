const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

// Replace the disciplines grid with CSS columns
code = code.replace(
    /\/\/ Split disciplines roughly into 2 columns[\s\S]*?<div class="flex gap-8 flex-1">[\s\S]*?<\/div>[\s\S]*?<\/div>/,
    `// Using CSS columns for disciplines
        p4Html = \\\`
        <div class="bg-white text-black font-sans mx-auto w-[210mm] min-h-[297mm] relative box-border overflow-visible print:w-full print:h-full print:p-[10mm] print:shadow-none print:max-w-none break-before-page page-break-before-always mt-8 print:mt-0 shadow-2xl p-[10mm] flex flex-col">
            <!-- Outer border -->
            <div class="absolute inset-[6mm] border-[3px] border-black pointer-events-none print:inset-[4mm]">
                <div class="absolute -top-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                <div class="absolute -top-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
                <div class="absolute -bottom-[1.5px] -left-[1.5px] w-2 h-2 bg-black"></div>
                <div class="absolute -bottom-[1.5px] -right-[1.5px] w-2 h-2 bg-black"></div>
            </div>
            
            <div class="relative z-10 h-full flex flex-col overflow-visible">
                <div class="mb-8 mt-4">
                    <h1 class="font-bold text-2xl uppercase tracking-widest mb-1">Сили Дисциплін</h1>
                    <p class="text-sm text-zinc-600">Дисципліни \\\${charName}, які дають доступ до унікальних здібностей.</p>
                </div>
                
                <div class="columns-1 md:columns-2 gap-8 flex-1 w-full" style="column-fill: auto;">
                    \\\${currentDiscHtmls.join('')}
                </div>
                <div class="mt-8 text-center text-xs font-bold tracking-widest uppercase">\\\${charName}</div>
            </div>
        </div>\\\`;`
);
fs.writeFileSync('v6Generator.js', code);
