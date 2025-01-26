class CardManager {
    constructor() {
        this.currentDeck = null;
        this.currentCardIndex = 0;
        this.remainingCards = [];
        this.completedCards = [];
        this.isInStudySession = false;
        this.backupPath = 'decks/'; // Ordner für Deck-Backups
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            // Stelle sicher, dass der Backup-Ordner existiert
            const response = await fetch('/api/ensureBackupDir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path: this.backupPath })
            });
            
            if (!response.ok) {
                console.error('Fehler beim Erstellen des Backup-Ordners');
            }
            
            // Lade alle gespeicherten Decks beim Start
            await this.loadDecksFromStorage();
        } catch (error) {
            console.error('Fehler beim Initialisieren des Speichers:', error);
        }
    }

    async loadDecksFromStorage() {
        try {
            const response = await fetch('/api/loadDecks');
            if (response.ok) {
                const decks = await response.json();
                localStorage.setItem('flashcards_decks', JSON.stringify(decks));
            }
        } catch (error) {
            console.error('Fehler beim Laden der Decks:', error);
        }
    }

    async createDeck(name, cards) {
        // Generiere eine zufällige UUID
        const uuid = crypto.randomUUID();
        
        const deck = {
            id: uuid,
            name: name.trim(), // Entferne Leerzeichen am Anfang und Ende
            cards: cards.map(card => ({
                ...card,
                status: 'new',
                attempts: 0,
                correctAttempts: 0
            })),
            created: Date.now(),
            lastReview: null
        };

        await this.saveDeck(deck);
        return deck;
    }

    async saveDeck(deck) {
        const decks = await this.getAllDecks();
        const existingIndex = decks.findIndex(d => d.id === deck.id);
        
        if (existingIndex >= 0) {
            decks[existingIndex] = deck;
        } else {
            decks.push(deck);
        }

        localStorage.setItem('flashcards_decks', JSON.stringify(decks));
        
        // Speichere das Deck auch als separate Datei
        try {
            const response = await fetch('/api/saveDeck', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deck,
                    filename: `${this.backupPath}${deck.id}.json`
                })
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Speichern des Decks');
            }
        } catch (error) {
            console.error('Fehler beim Speichern des Decks:', error);
            throw error;
        }
    }

    async exportAllDecks() {
        try {
            const decks = await this.getAllDecks();
            const response = await fetch('/api/exportDecks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    decks,
                    filename: `${this.backupPath}all_decks_${Date.now()}.json`
                })
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Exportieren der Decks');
            }
            
            return `${this.backupPath}all_decks_${Date.now()}.json`;
        } catch (error) {
            console.error('Fehler beim Exportieren der Decks:', error);
            throw error;
        }
    }

    async loadDecksFromJson(file) {
        try {
            const text = await file.text();
            const decks = JSON.parse(text);
            
            // Speichere jedes Deck einzeln
            for (const deck of decks) {
                await this.saveDeck(deck);
            }
            
            return decks;
        } catch (error) {
            console.error('Fehler beim Laden der Decks aus der Datei:', error);
            throw new Error('Fehler beim Laden der Decks aus der Datei');
        }
    }

    async getAllDecks() {
        const decksJson = localStorage.getItem('flashcards_decks');
        return decksJson ? JSON.parse(decksJson) : [];
    }

    async getDeck(id) {
        const decks = await this.getAllDecks();
        return decks.find(deck => deck.id === id);
    }

    async deleteDeck(id) {
        const decks = await this.getAllDecks();
        const filteredDecks = decks.filter(deck => deck.id !== id);
        localStorage.setItem('flashcards_decks', JSON.stringify(filteredDecks));
    }

    async startStudySession(deckId) {
        const deck = await this.getDeck(deckId);
        if (!deck) return null;

        this.currentDeck = JSON.parse(JSON.stringify(deck)); // Create a deep copy
        this.isInStudySession = true;
        
        // Reset session state
        this.remainingCards = [...this.currentDeck.cards];
        this.completedCards = [];
        this.shuffleCards(this.remainingCards);
        
        return this.getNextCard();
    }

    shuffleCards(cards) {
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
    }

    getNextCard() {
        if (this.remainingCards.length === 0) {
            this.isInStudySession = false;
            return null;
        }
        return this.remainingCards[0];
    }

    gradeCard(isCorrect) {
        if (!this.isInStudySession || this.remainingCards.length === 0) return null;

        const currentCard = this.remainingCards[0];
        currentCard.attempts++;
        
        if (isCorrect) {
            currentCard.correctAttempts++;
            if (Math.random() < 0.8) {
                // 80% chance to remove card
                this.completedCards.push(this.remainingCards.shift());
            } else {
                // 20% chance to keep card
                const card = this.remainingCards.shift();
                const randomPosition = Math.floor(Math.random() * this.remainingCards.length);
                this.remainingCards.splice(randomPosition, 0, card);
            }
        } else {
            // Move card to a random position in the remaining cards
            const card = this.remainingCards.shift();
            const randomPosition = Math.floor(Math.random() * this.remainingCards.length);
            this.remainingCards.splice(randomPosition, 0, card);
        }

        return this.getNextCard();
    }

    getProgress() {
        if (!this.isInStudySession) return null;
        
        return {
            total: this.completedCards.length + this.remainingCards.length,
            completed: this.completedCards.length,
            remaining: this.remainingCards.length
        };
    }
}

// Export a singleton instance
const cardManager = new CardManager();
export default cardManager; 