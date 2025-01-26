class FileHandler {
    constructor() {
        this.pdfjsLib = window['pdfjs-dist/build/pdf'];
        this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Set standard font data URL
        this.pdfjsLib.GlobalWorkerOptions.standardFontDataUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/';
    }

    async extractText(file) {
        const fileType = file.type;
        
        try {
            if (fileType.includes('pdf')) {
                return await this.extractPdfText(file);
            } else if (fileType.includes('image')) {
                return await this.extractImageText(file);
            } else if (fileType.includes('text')) {
                return await this.extractTxtText(file);
            } else {
                throw new Error('Nicht unterstütztes Dateiformat');
            }
        } catch (error) {
            console.error('Text extraction failed:', error);
            throw error;
        }
    }

    async extractPdfText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = this.pdfjsLib.getDocument({
                data: arrayBuffer,
                standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
            });
            
            const pdf = await loadingTask.promise;
            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + '\n';
            }

            return text.trim();
        } catch (error) {
            console.error('PDF extraction failed:', error);
            throw new Error('Fehler beim Lesen der PDF-Datei: ' + error.message);
        }
    }

    async extractImageText(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            // Note: In a real implementation, you would need to set up an OCR service
            throw new Error('Bildtext-Extraktion erfordert einen OCR-Service');
        } catch (error) {
            console.error('Image extraction failed:', error);
            throw error;
        }
    }

    async extractTxtText(file) {
        try {
            return await file.text();
        } catch (error) {
            console.error('Text file extraction failed:', error);
            throw new Error('Fehler beim Lesen der Textdatei: ' + error.message);
        }
    }

    async previewFile(file) {
        const preview = document.getElementById('preview');
        if (!preview) return;
        
        preview.innerHTML = '';

        try {
            if (file.type.includes('image')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.maxWidth = '100%';
                preview.appendChild(img);
            } else {
                const text = await this.extractText(file);
                const pre = document.createElement('pre');
                pre.textContent = text.substring(0, 500) + (text.length > 500 ? '...' : '');
                preview.appendChild(pre);
            }
        } catch (error) {
            console.error('Preview failed:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Vorschau konnte nicht geladen werden: ' + error.message;
            preview.appendChild(errorDiv);
        }
    }
}

// Export a singleton instance
const fileHandler = new FileHandler();
export default fileHandler; 