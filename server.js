import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Middleware zum Injizieren der Konfiguration
app.get('/js/config.js', (req, res) => {
    const config = `
        const config = {
            API_KEY: "${process.env.GOOGLE_API_KEY}"
        };
        export default config;
    `.trim();
    res.type('application/javascript').send(config);
});

// Serve static files
app.use(express.static('.'));

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
}); 