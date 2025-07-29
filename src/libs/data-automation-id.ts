
export default class DataAutomationId {
    processedElements = new WeakSet(); 
    
    highlight(isHighlightingEnabled: boolean) {
        if (!isHighlightingEnabled) return;
    
        const elements = document.querySelectorAll('[data-automation-id]');
        elements.forEach((element: any) => {
            if (this.processedElements.has(element)) return; // Evita reprocesar elementos
    
            const computedStyle = window.getComputedStyle(element);
            const positionValue = computedStyle.position;
    
            if (positionValue !== 'absolute' && positionValue !== 'fixed' && positionValue !== 'relative') {
                element.style.position = 'relative';
            }
    
            const shadowContainer = document.createElement('div');
            shadowContainer.classList.add('qa-popup-container');
            shadowContainer.style.position = 'absolute';
            shadowContainer.style.pointerEvents = 'none'; // No bloquea clics
            shadowContainer.style.width = '98%';
            shadowContainer.style.height = '90%';
            shadowContainer.style.inset = '0';
            shadowContainer.style.margin = 'auto';
            shadowContainer.style.zIndex = '1000';
            shadowContainer.style.border = '2px dashed #e74c3c';
    
            const shadowRoot = shadowContainer.attachShadow({ mode: 'open' });
    
            const popup = document.createElement('div');
            popup.textContent = element.getAttribute('data-automation-id');
            popup.style.position = 'absolute';
            popup.style.display = 'none';
            popup.style.backgroundColor = '#e74c3c';
            popup.style.color = '#FFFFFF';
            popup.style.padding = '0.3rem 0.6rem';
            popup.style.border = 'none';
            popup.style.borderRadius = '3px';
            popup.style.fontSize = '10px';
            popup.style.fontWeight = '500';
            popup.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            popup.style.zIndex = '1000';
            popup.style.top = '4px';
            popup.style.right = '3px';
            popup.style.pointerEvents = 'none';
            popup.style.whiteSpace = 'nowrap';
            popup.classList.add('qa-popup');
    
            shadowRoot.appendChild(popup);
            element.appendChild(shadowContainer);
    
            element.addEventListener('mouseover', () => {
                popup.style.display = 'block';  
            });
    
            element.addEventListener('mouseout', () => {
                popup.style.display = 'none'; // Oculta el popup cuando el puntero sale
            });
    
            this.processedElements.add(element);
        });
    }
    
    removeHighlights() {
        const popups = document.querySelectorAll('.qa-popup-container');
        popups.forEach((popup) => popup.remove());
        this.processedElements = new WeakSet();
    }
}
