import aiHandler from './api.js';
import fileHandler from './fileHandler.js';
import cardManager from './cardManager.js';

class UI {
    constructor() {
        this.sections = {
            deckOverview: document.getElementById('deckOverview'),
            createDeck: document.getElementById('createDeckSection'),
            study: document.getElementById('studySection')
        };

        // Make sure generate button is initially hidden
        const generateButton = document.getElementById('generateCards');
        if (generateButton) {
            generateButton.style.display = 'none';
        }

        this.bindEvents();
        this.showSection('deckOverview');
        this.loadDecks();
    }

    bindEvents() {
        // Navigation
        document.getElementById('viewDecks').addEventListener('click', () => this.showSection('deckOverview'));
        document.getElementById('createDeck').addEventListener('click', () => this.showSection('createDeck'));
        
        // Export decks
        const exportBtn = document.getElementById('exportDecks');
        exportBtn?.addEventListener('click', async () => {
            try {
                await cardManager.exportDecks();
                this.showToast('Decks wurden erfolgreich exportiert!', 'success');
            } catch (error) {
                this.showToast('Fehler beim Exportieren der Decks: ' + error.message, 'error');
            }
        });

        // File input handling
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        await fileHandler.previewFile(file);
                        const generateButton = document.getElementById('generateCards');
                        if (generateButton) {
                            generateButton.style.display = 'block';
                        }
                    } catch (error) {
                        this.showToast('Fehler beim Vorschau der Datei: ' + error.message, 'error');
                    }
                }
            });
        }

        // Generate Cards
        const generateButton = document.getElementById('generateCards');
        if (generateButton) {
            generateButton.addEventListener('click', async () => {
                const file = document.getElementById('fileInput')?.files[0];
                const deckTitleInput = document.getElementById('deckTitle');
                
                if (!file) {
                    this.showToast('Bitte wählen Sie zuerst eine Datei aus.', 'error');
                    return;
                }

                if (!deckTitleInput?.value.trim()) {
                    this.showToast('Bitte geben Sie einen Titel für das Deck ein.', 'error');
                    return;
                }

                try {
                    generateButton.disabled = true;
                    generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generiere Karten...';
                    
                    const text = await fileHandler.extractText(file);
                    const cards = await aiHandler.generateFlashcards(text);

                    // Verwende den eingegebenen Titel
                    const deckName = deckTitleInput.value.trim();
                    
                    // Prüfe, ob ein Deck mit diesem Namen bereits existiert
                    const existingDecks = await cardManager.getAllDecks();
                    let finalDeckName = deckName;
                    let counter = 1;
                    
                    while (existingDecks.some(deck => deck.name === finalDeckName)) {
                        finalDeckName = `${deckName} (${counter})`;
                        counter++;
                    }
                    
                    await cardManager.createDeck(finalDeckName, cards);
                    
                    this.showToast('Deck erfolgreich erstellt!', 'success');
                    this.showSection('deckOverview');
                    this.loadDecks();

                    // Reset form
                    deckTitleInput.value = '';
                    document.getElementById('fileInput').value = '';
                    document.getElementById('preview').innerHTML = '';
                    generateButton.style.display = 'none';
                } catch (error) {
                    this.showToast('Fehler beim Generieren der Flashcards: ' + error.message, 'error');
                } finally {
                    generateButton.disabled = false;
                    generateButton.innerHTML = '<i class="fas fa-magic"></i> Flashcards generieren';
                }
            });
        }

        // Card interaction
        const showAnswerBtn = document.getElementById('showAnswer');
        showAnswerBtn?.addEventListener('click', () => this.flipCard());

        // Response buttons
        const wrongBtn = document.querySelector('.wrong');
        const correctBtn = document.querySelector('.correct');
        
        wrongBtn?.addEventListener('click', () => this.handleCardGrade(false));
        correctBtn?.addEventListener('click', () => this.handleCardGrade(true));

        // Import decks
        const importBtn = document.getElementById('importDecks');
        const loadDecksInput = document.getElementById('loadDecksInput');
        
        importBtn?.addEventListener('click', () => loadDecksInput?.click());
        loadDecksInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (file) {
                try {
                    await cardManager.loadDecksFromJson(file);
                    this.loadDecks();
                    this.showToast('Decks erfolgreich importiert!', 'success');
                } catch (error) {
                    this.showToast('Fehler beim Importieren: ' + error.message, 'error');
                }
            }
        });
    }

    showSection(sectionId) {
        Object.values(this.sections).forEach(section => {
            if (section) section.classList.remove('active');
        });
        
        const section = this.sections[sectionId];
        if (section) section.classList.add('active');
    }

    async loadDecks() {
        try {
            const deckList = document.querySelector('.deck-list');
            if (!deckList) return;

            const decks = await cardManager.getAllDecks();
            if (!decks || decks.length === 0) {
                deckList.innerHTML = '<div class="empty-state">Keine Decks vorhanden. Erstellen Sie ein neues Deck!</div>';
                return;
            }

            deckList.innerHTML = '';

            decks.forEach(deck => {
                if (!deck) return;
                
                const deckElement = document.createElement('div');
                deckElement.className = 'deck-card';
                deckElement.innerHTML = `
                    <h3>${deck.title || 'Unbenanntes Deck'}</h3>
                    <div class="deck-info">
                        <p>${deck.cards?.length || 0} Karten</p>
                        <p>Erstellt: ${new Date(deck.createdAt).toLocaleDateString()}</p>
                    </div>
                `;
                
                deckElement.addEventListener('click', () => this.startStudySession(deck.id));
                deckList.appendChild(deckElement);
            });
        } catch (error) {
            console.error('Fehler beim Laden der Decks:', error);
            const deckList = document.querySelector('.deck-list');
            if (deckList) {
                deckList.innerHTML = '<div class="error-state">Fehler beim Laden der Decks. Bitte versuchen Sie es später erneut.</div>';
            }
        }
    }

    async startStudySession(deckId) {
        const card = await cardManager.startStudySession(deckId);
        if (card) {
            const deckTitle = document.getElementById('deckTitle');
            if (deckTitle) {
                const deck = await cardManager.getDeck(deckId);
                deckTitle.textContent = deck.name;
            }
            
            this.showSection('study');
            this.displayCard(card);
            this.updateProgress();
        } else {
            this.showToast('Fehler beim Laden des Decks', 'error');
        }
    }

    displayCard(card) {
        const frontContent = document.querySelector('.card-front .card-content');
        const backContent = document.querySelector('.card-back .card-content');
        const cardElement = document.querySelector('.card');
        
        if (frontContent && backContent && cardElement) {
            frontContent.textContent = card.question || card.front;
            backContent.textContent = card.answer || card.back;
            cardElement.classList.remove('flipped');
            
            const responseButtons = document.querySelector('.response-buttons');
            const showAnswerButton = document.getElementById('showAnswer');
            
            if (responseButtons && showAnswerButton) {
                responseButtons.style.display = 'none';
                showAnswerButton.style.display = 'block';
            }
        }
    }

    flipCard() {
        const card = document.querySelector('.card');
        const responseButtons = document.querySelector('.response-buttons');
        const showAnswerButton = document.getElementById('showAnswer');
        
        if (card && responseButtons && showAnswerButton) {
            card.classList.add('flipped');
            responseButtons.style.display = 'flex';
            showAnswerButton.style.display = 'none';
        }
    }

    updateProgress() {
        const progress = cardManager.getProgress();
        if (progress) {
            const progressElement = document.querySelector('.progress-text');
            if (progressElement) {
                progressElement.textContent = `${progress.completed} von ${progress.total} Karten gelernt`;
            }
        }
    }

    async handleCardGrade(isCorrect) {
        const nextCard = await cardManager.gradeCard(isCorrect);
        this.updateProgress();
        
        if (nextCard) {
            this.displayCard(nextCard);
        } else {
            this.showToast('Lernsitzung beendet!', 'success');
            this.showSection('deckOverview');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
    }
}

// Initialize UI
const ui = new UI();
export default ui; 