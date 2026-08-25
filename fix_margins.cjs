const fs = require('fs');
let code = fs.readFileSync('v6Generator.js', 'utf8');

// Replace margins in the printable sheet HTML string
code = code.replace(/<div class="flex justify-between items-start mb-6">/, '<div class="flex justify-between items-start mb-3">');
code = code.replace(/<!-- ATTRIBUTES SECTION -->\s*<div class="border-\[1.5px\] border-black mb-4">/, '<!-- ATTRIBUTES SECTION -->\n                    <div class="border-[1.5px] border-black mb-2">');
code = code.replace(/<div class="flex justify-between items-end border-b-\[1.5px\] border-black pb-2 mb-4 px-2">/, '<div class="flex justify-between items-end border-b-[1.5px] border-black pb-1 mb-2 px-2">');
code = code.replace(/<div class="border-\[1.5px\] border-black pt-5 pb-3 px-2 mb-6 text-center relative mt-4">/, '<div class="border-[1.5px] border-black pt-4 pb-2 px-2 mb-3 text-center relative mt-2">');

// Bottom grid
code = code.replace(/<div class="w-\[65%\] flex flex-col gap-6">/, '<div class="w-[65%] flex flex-col gap-4">');
code = code.replace(/<div class="flex gap-6">/, '<div class="flex gap-4">');
code = code.replace(/<div class="mb-5">/g, '<div class="mb-3">'); // 3 occurrences
code = code.replace(/<div class="border-\[1.5px\] border-black h-40 mb-5 relative flex items-center justify-center overflow-hidden bg-zinc-100">/, '<div class="border-[1.5px] border-black h-32 mb-3 relative flex items-center justify-center overflow-hidden bg-zinc-100">');
code = code.replace(/<div class="border-\[1.5px\] border-black h-40 mb-3 relative flex items-center justify-center overflow-hidden bg-zinc-100">/, '<div class="border-[1.5px] border-black h-32 mb-3 relative flex items-center justify-center overflow-hidden bg-zinc-100">'); // In case it replaced mb-5 to mb-3 already

code = code.replace(/<div class="w-\[35%\] flex flex-col space-y-4 border-l-\[1.5px\] border-black pl-6">/, '<div class="w-[35%] flex flex-col space-y-3 border-l-[1.5px] border-black pl-5">');

fs.writeFileSync('v6Generator.js', code);
