import config from './config.js';

class AIHandler {
    constructor() {
        console.log('Config beim Laden:', config);
        this.API_KEY = config.GOOGLE_API_KEY;
        console.log('GOOGLE_API_KEY direkt nach Zuweisung:', this.API_KEY);
        
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        
        // Debug-Logging
        if (!this.API_KEY || this.API_KEY.trim() === '') {
            console.error('GOOGLE_API_KEY ist nicht gesetzt oder leer');
            console.log('Config-Objekt:', JSON.stringify(config));
        } else {
            console.log('GOOGLE_API_KEY wurde erfolgreich geladen');
        }
    }

    async generateFlashcards(text) {
        if (!this.API_KEY || this.API_KEY.trim() === '') {
            throw new Error('API-Key ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.');
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Kein Text zum Verarbeiten vorhanden');
        }

        const prompt = `
        Erstelle 5-20 Lernkarten aus dem folgenden Text. Formatiere jede Karte als JSON-Objekt mit "question" und "answer" Feldern.
        Die Fragen sollten das Verständnis des Textes testen und die Antworten sollten klar und präzise sein.
        Gib NUR das JSON-Array zurück, nichts anderes. Beispielformat:
        [
            {"question": "Was ist...?", "answer": "Es ist..."},
            {"question": "Wie funktioniert...?", "answer": "Es funktioniert..."}
        ]
        
        Text zum Verarbeiten:
        ${text}
        `;

        try {
            console.log('Sende Anfrage an API mit Key-Länge:', this.API_KEY.length);
            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 16,
                        topP: 0.1,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [{
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_ONLY_HIGH"
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Fehler:', errorData);
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Ungültige Antwort vom AI-Service');
            }

            const responseText = data.candidates[0].content.parts[0].text;
            
            try {
                // Clean the response text to ensure it's valid JSON
                const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
                const parsedCards = JSON.parse(cleanedText);

                if (!Array.isArray(parsedCards) || parsedCards.length === 0) {
                    throw new Error('Keine gültigen Karten generiert');
                }

                return parsedCards;
            } catch (e) {
                console.error('Failed to parse AI response:', e);
                throw new Error('KI-Antwort konnte nicht verarbeitet werden');
            }
        } catch (error) {
            console.error('AI generation failed:', error);
            throw new Error('Fehler bei der Generierung der Lernkarten: ' + 
                (error.message.includes('Failed to fetch') ? 
                    'Verbindung zum AI-Service konnte nicht hergestellt werden' : 
                    error.message)
            );
        }
    }
}

// Create and export a singleton instance
const aiHandler = new AIHandler();
export default aiHandler; 