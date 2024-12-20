/**
 * Utility functions for managing full-screen mode
 */
export function toggleFullScreen(component) {
    console.log('toggleFullScreen called');
    
    // Validate component and template
    if (!component || !component.template) {
        console.error('Invalid component or missing template');
        return;
    }

    // Get the card element
    const cardElement = component.template.querySelector('.slds-card');
    
    if (!cardElement) {
        console.error('Card element not found');
        return;
    }

    // Explicitly toggle full-screen state
    const newFullScreenState = !component.isFullScreen;
    
    // Use setter to ensure reactivity
    component.isFullScreen = newFullScreenState;
    
    // Apply visual changes
    if (newFullScreenState) {
        console.log('Entering full-screen mode');
        cardElement.classList.add('full-screen-mode');
        document.body.classList.add('no-scroll');
    } else {
        console.log('Exiting full-screen mode');
        cardElement.classList.remove('full-screen-mode');
        document.body.classList.remove('no-scroll');
    }

    // Dispatch custom event
    try {
        component.dispatchEvent(new CustomEvent('fullscreenchange', { 
            detail: { isFullScreen: newFullScreenState },
            bubbles: true,
            composed: true
        }));
    } catch (error) {
        console.error('Error dispatching fullscreen event:', error);
    }

    // Logging for debugging
    console.log('Full-screen state changed:', {
        newState: newFullScreenState,
        cardClassList: Array.from(cardElement.classList),
        bodyClassList: Array.from(document.body.classList)
    });
}

/**
 * CSS styles for full-screen mode
 * Can be imported into CSS file or used dynamically
 */
export const fullScreenStyles = `
.full-screen-mode {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    background: white;
    overflow-y: auto;
}

body.no-scroll {
    overflow: hidden;
}

.full-screen-mode .slds-card__body {
    height: calc(100vh - 100px);
    overflow-y: auto;
}
`;
