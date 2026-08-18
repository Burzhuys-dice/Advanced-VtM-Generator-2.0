import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
// Serve static files from the current directory
app.use(express.static(__dirname));

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/generate-backstory', async (req, res) => {
    try {
        const { name, clan, predator, attributes, skills, merits, flaws } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
        }

        const prompt = `Ти — майстер гри у Vampire: The Masquerade 5e. Напиши коротку, атмосферну та унікальну історію (бексторі/флейвор текст) для персонажа (від другої особи, "Ти..."). 
Історія має бути на 2-3 речення. Враховуй такі параметри:
Ім'я (для визначення статі та стилістики): ${name || 'Невідомо'}
Клан: ${clan || 'Невідомо'}
Тип хижака: ${predator || 'Невідомо'}
Ключові характеристики (високі значення): ${attributes || 'Не вказано'}
Ключові навички: ${skills || 'Не вказано'}
Блага: ${merits || 'Немає'}
Вади: ${flaws || 'Немає'}

Зроби це художньо, темно і в стилістиці World of Darkness. Не перераховуй характеристики сухо, а вплети їх в розповідь про те, як персонаж існує та харчується.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                maxOutputTokens: 250
            }
        });

        res.json({ text: response.text });
    } catch (error) {
        console.error('Error generating backstory:', error);
        res.status(500).json({ error: 'Помилка при генерації історії.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
