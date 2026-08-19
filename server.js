import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// На Render порт задається автоматично (Render передає змінну середовища RENDER=true)
const PORT = process.env.RENDER ? process.env.PORT : 3000;

app.use(express.json());
// Serve static files from the current directory
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
