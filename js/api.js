class AIHandler {
    constructor() {
        this.API_KEY = 'AIzaSyCzktw9jq_yQ0s4kvjT7HQh0SR5to_3E_I';
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async generateFlashcards(text) {
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