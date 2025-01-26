import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

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

app.use(express.static(__dirname));

// Stelle sicher, dass der Decks-Ordner existiert
const DECKS_DIR = join(__dirname, 'decks');

// API Endpunkte
app.post('/api/ensureBackupDir', async (req, res) => {
    try {
        await fs.mkdir(DECKS_DIR, { recursive: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Erstellen des Backup-Ordners:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen des Backup-Ordners' });
    }
});

app.get('/api/loadDecks', async (req, res) => {
    try {
        const files = await fs.readdir(DECKS_DIR);
        const decks = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(join(DECKS_DIR, file), 'utf-8');
                const deck = JSON.parse(content);
                decks.push(deck);
            }
        }
        
        res.json(decks);
    } catch (error) {
        console.error('Fehler beim Laden der Decks:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Decks' });
    }
});

app.post('/api/saveDeck', async (req, res) => {
    try {
        const { deck, filename } = req.body;
        const filePath = join(__dirname, filename);
        
        await fs.writeFile(filePath, JSON.stringify(deck, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Speichern des Decks:', error);
        res.status(500).json({ error: 'Fehler beim Speichern des Decks' });
    }
});

app.post('/api/exportDecks', async (req, res) => {
    try {
        const { decks, filename } = req.body;
        const filePath = join(__dirname, filename);
        
        await fs.writeFile(filePath, JSON.stringify(decks, null, 2));
        res.json({ success: true, filename });
    } catch (error) {
        console.error('Fehler beim Exportieren der Decks:', error);
        res.status(500).json({ error: 'Fehler beim Exportieren der Decks' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
}); 