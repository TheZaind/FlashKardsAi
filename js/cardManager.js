class CardManager {
    constructor() {
        this.decks = [];
        this.currentDeck = null;
        this.currentCardIndex = 0;
        this.remainingCards = [];
        this.completedCards = [];
        this.isInStudySession = false;
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            const savedDecks = localStorage.getItem('flashcards_decks');
            if (savedDecks) {
                this.decks = JSON.parse(savedDecks);
            }
        } catch (error) {
            console.error('Fehler beim Initialisieren des Speichers:', error);
        }
    }

    async loadDecksFromStorage() {
        try {
            const savedDecks = localStorage.getItem('flashcards_decks');
            if (savedDecks) {
                this.decks = JSON.parse(savedDecks);
            }
            return this.decks;
        } catch (error) {
            console.error('Fehler beim Laden der Decks:', error);
            throw new Error('Fehler beim Laden der Decks');
        }
    }

    async saveDeck(deck) {
        try {
            const existingIndex = this.decks.findIndex(d => d.id === deck.id);
            if (existingIndex >= 0) {
                this.decks[existingIndex] = deck;
            } else {
                this.decks.push(deck);
            }
            localStorage.setItem('flashcards_decks', JSON.stringify(this.decks));
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern des Decks:', error);
            throw new Error('Fehler beim Speichern des Decks');
        }
    }

    async createDeck(title, cards) {
        const deck = {
            id: Date.now(),
            title: title,
            cards: cards.map(card => ({
                ...card,
                status: 'new',
                attempts: 0,
                correctAttempts: 0
            })),
            createdAt: new Date().toISOString()
        };

        await this.saveDeck(deck);
        return deck;
    }

    async exportDecks() {
        try {
            const decksJson = JSON.stringify(this.decks, null, 2);
            const blob = new Blob([decksJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `flashcards_export_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Fehler beim Exportieren der Decks:', error);
            throw new Error('Fehler beim Exportieren der Decks');
        }
    }

    async importDecks(jsonContent) {
        try {
            const importedDecks = JSON.parse(jsonContent);
            if (!Array.isArray(importedDecks)) {
                throw new Error('Ungültiges Dateiformat');
            }

            // Füge die importierten Decks zu den bestehenden hinzu
            this.decks = [...this.decks, ...importedDecks];
            localStorage.setItem('flashcards_decks', JSON.stringify(this.decks));
            return true;
        } catch (error) {
            console.error('Fehler beim Importieren der Decks:', error);
            throw new Error('Fehler beim Importieren der Decks');
        }
    }

    async loadDecksFromJson(file) {
        try {
            const text = await file.text();
            const importedDecks = JSON.parse(text);
            
            if (!Array.isArray(importedDecks)) {
                throw new Error('Ungültiges Dateiformat');
            }

            // Füge die importierten Decks zu den bestehenden hinzu
            this.decks = [...this.decks, ...importedDecks];
            localStorage.setItem('flashcards_decks', JSON.stringify(this.decks));
            return true;
        } catch (error) {
            console.error('Fehler beim Laden der Decks aus der Datei:', error);
            throw new Error('Fehler beim Laden der Decks aus der Datei');
        }
    }

    async getAllDecks() {
        return this.decks;
    }

    async getDeck(id) {
        return this.decks.find(deck => deck.id === id);
    }

    async deleteDeck(id) {
        this.decks = this.decks.filter(deck => deck.id !== id);
        localStorage.setItem('flashcards_decks', JSON.stringify(this.decks));
    }

    // Study session methods
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

// Create and export a singleton instance
const cardManager = new CardManager();
export default cardManager; 