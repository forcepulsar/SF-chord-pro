import { loadScript } from 'lightning/platformResourceLoader';
import CHORDSHEETJS from '@salesforce/resourceUrl/chordsheetjs';
import * as ErrorUtils from './errorUtils';
import * as RenderUtils from './renderUtils';
import * as ScrollUtils from './scrollUtils';
import * as WebLinksUtils from './webLinksUtils';

/**
 * Utility functions for component lifecycle management
 */
export function connectedCallback(component) {
    const url = window.location.href;
    component.isRecordPage = url.includes('/lightning/r/');
    console.log('Connected callback - Record ID:', component.recordId);
}

export function renderedCallback(component) {
    if (component.isLibraryLoaded) return;

    loadScript(component, CHORDSHEETJS)
        .then(() => {
            console.log('ChordSheetJS loaded successfully');
            component.isLibraryLoaded = true;
            
            if (component.chordProContent) {
                renderChordPro(component);
            }
            
            setupScrollableContainer(component);
        })
        .catch(error => {
            const { error: errorMessage } = ErrorUtils.errorHandlers.renderError(error);
            component.error = errorMessage;
        });
}

export function disconnectedCallback(component) {
    stopAutoScroll(component);
    
    if (component.scrollCleanup) {
        component.scrollCleanup();
    }
}

export function wiredSong(component, { error, data }) {
    component.isLoading = true;
    
    if (data) {
        console.log('Received ChordPro data');
        component.chordProContent = data.chordProContent;
        component.webLinks = WebLinksUtils.parseWebLinks(data.webPlayerLinks);
        component.error = undefined;
        
        if (component.isLibraryLoaded) {
            renderChordPro(component);
        }
    } else if (error) {
        const { error: errorMessage } = ErrorUtils.errorHandlers.renderError(error);
        component.error = errorMessage;
        component.chordProContent = undefined;
    }
    
    component.isLoading = false;
}

function renderChordPro(component) {
    try {
        ErrorUtils.validateInputs(
            component.template.querySelector('.chordpro-container'),
            component.chordProContent,
            'renderChordPro'
        );

        const formattedSong = RenderUtils.parseAndFormatChordPro(
            component.chordProContent,
            ChordSheetJS
        );

        RenderUtils.renderSong(
            component.template.querySelector('.chordpro-container'),
            formattedSong,
            component.fontSize,
            component._showChords
        );

        setupScrollableContainer(component);
    } catch (error) {
        const { error: errorMessage } = ErrorUtils.errorHandlers.renderError(error);
        component.error = errorMessage;
    }
}

function setupScrollableContainer(component) {
    const cardBody = component.template.querySelector('.card-body');
    const container = component.template.querySelector('.chordpro-container');
    ScrollUtils.setupScrollableContainer(cardBody, container);

    if (component.scrollCleanup) {
        component.scrollCleanup();
    }

    if (cardBody) {
        component.scrollCleanup = ScrollUtils.addScrollListener(cardBody, () => {
            console.log('Manual scroll detected');
        });
    }
}

function stopAutoScroll(component) {
    component.isAutoScrolling = false;
    
    if (component.scrollInterval) {
        clearInterval(component.scrollInterval);
        component.scrollInterval = null;
    }
    
    component.scrollAccumulator = 0;
}

export function refreshDisplay(component) {
    if (component.isLibraryLoaded) {
        RenderUtils.applyAllStyles(
            component.template.querySelector('.chordpro-container'),
            component.fontSize,
            component._showChords
        );
    }
}