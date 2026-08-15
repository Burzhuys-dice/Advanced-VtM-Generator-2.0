import sys

with open('index.html', 'r') as f:
    content = f.read()

old_html = '''            <div class=\"grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12\" id=\"attributes-grid\"></div>
            
            <div class=\"mt-10 flex justify-between\">'''

new_html = '''            <div class=\"grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12\" id=\"attributes-grid\"></div>
            
            <!-- Health & Willpower Trackers -->
            <div class=\"mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8\">
                <div>
                    <div class=\"flex justify-between items-center mb-4\">
                        <h3 class=\"text-xl font-bold text-gray-800 uppercase tracking-widest vtm-font\">Здоров'я</h3>
                        <div class=\"text-xs text-gray-500 italic\">Витривалість + 3</div>
                    </div>
                    <div id=\"health-tracker-step2\" class=\"flex flex-wrap gap-2\"></div>
                </div>
                <div>
                    <div class=\"flex justify-between items-center mb-4\">
                        <h3 class=\"text-xl font-bold text-gray-800 uppercase tracking-widest vtm-font\">Сила Волі</h3>
                        <div class=\"text-xs text-gray-500 italic\">Рішучість + Витримка</div>
                    </div>
                    <div id=\"willpower-tracker-step2\" class=\"flex flex-wrap gap-2\"></div>
                </div>
            </div>
            
            <div class=\"mt-10 flex justify-between\">'''

if old_html in content:
    content = content.replace(old_html, new_html)
    with open('index.html', 'w') as f:
        f.write(content)
    print("Patched Step 2 html")
else:
    print("Could not find old_html in Step 2")
