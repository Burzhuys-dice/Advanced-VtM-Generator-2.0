import re

with open('app.js', 'r') as f:
    content = f.read()

# 1. Remove summaryFlavorEl population
content = re.sub(r"const summaryFlavorEl = document.getElementById\('summary-flavor-text'\);\s*", "", content)
content = re.sub(r"if \(summaryFlavorEl\) summaryFlavorEl\.innerText = generateFlavorText\(state\.clan, state\.selectedPredator\);\s*", "", content)

# 2. Remove generateFlavorText and generateAIFlavorText functions completely
# We'll use regex to chop from function generateFlavorText all the way to the end of generateAIFlavorText
content = re.sub(r"function generateFlavorText\(clanId, predId\) \{.*?\}(?=\n\n|\Z)", "", content, flags=re.DOTALL)
content = re.sub(r"// --- AI Flavor Generation ---.*?\}(?=\n\n|\Z)", "", content, flags=re.DOTALL)
content = re.sub(r"async function generateAIFlavorText\(\).*?\}(?=\n\n|\Z)", "", content, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(content)
