// errorUtils.js
export class ChordDisplayError extends Error {
    constructor(message, context, originalError = null) {
        super(message);
        this.name = 'ChordDisplayError';
        this.context = context;
        this.originalError = originalError;
    }
}

export function handleError(error, context) {
    const errorMessage = error instanceof ChordDisplayError 
        ? error.message 
        : `Error in ${context}: ${error.message || error}`;

    console.error(`[${context}]`, error);
    
    return {
        error: errorMessage,
        hasError: true
    };
}

export function validateInputs(container, content, context) {
    if (!container) {
        throw new ChordDisplayError(
            'Container element not found',
            context
        );
    }

    if (!content) {
        throw new ChordDisplayError(
            'No content provided for rendering',
            context
        );
    }
}

export function wrapTryCatch(fn, context) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            return handleError(error, context);
        }
    };
}

// Common error handlers for specific operations
export const errorHandlers = {
    renderError: (error) => handleError(
        error,
        'Rendering ChordPro'
    ),
    
    parseError: (error) => handleError(
        error,
        'Parsing ChordPro'
    ),
    
    styleError: (error) => handleError(
        error,
        'Applying styles'
    ),
    
    scrollError: (error) => handleError(
        error,
        'Scroll operation'
    )
};