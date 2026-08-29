import fs from 'fs';
let code = fs.readFileSync('v6Generator.js', 'utf8');

const regexHumanity = /<!-- 7-POINT HUMANITY SCALE VISUALIZER -->[\s\S]*?<!-- NATURES SELECTION GRID -->/;
code = code.replace(regexHumanity, '<!-- NATURES SELECTION GRID -->');

const regexDetails = /<details class="group border-t border-zinc-100 pt-2">[\s\S]*?<\/details>/g;
code = code.replace(regexDetails, `<button onclick="openV6NatureDrawer('\${nat.id}')" class="mt-auto border-t border-zinc-100 pt-2 text-[10px] text-zinc-600 hover:text-[#8b0000] font-medium flex items-center gap-1 transition-colors w-full text-left">
                                        <span>📖</span> Читати повний опис та спалах
                                    </button>`);

fs.writeFileSync('v6Generator.js', code);
console.log("Patched successfully");
