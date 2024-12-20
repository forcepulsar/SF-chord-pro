import { SCROLL, FONT } from './constants';

/**
 * Utility functions for managing component state
 */
export function initializeState() {
    return {
        isRecordPage: false,
        error: null,
        isLoading: true,
        fontSize: FONT.DEFAULT_SIZE,
        scrollSpeed: SCROLL.DEFAULT_SPEED,
        webLinks: {
            spotify: null,
            youtube: null,
            google: null
        },
        isFullScreen: false,
        _showChords: true,
        isLibraryLoaded: false,
        chordProContent: null,
        isAutoScrolling: false,
        scrollAccumulator: 0,
        scrollInterval: null
    };
}

export function setScrollSpeed(state, speed) {
    const newSpeed = Math.max(
        SCROLL.MIN_SPEED,
        Math.min(SCROLL.MAX_SPEED, Number(speed) || SCROLL.DEFAULT_SPEED)
    );
    
    return {
        ...state,
        scrollSpeed: newSpeed
    };
}

export function toggleChords(state) {
    return {
        ...state,
        _showChords: !state._showChords
    };
}

export function increaseFontSize(state) {
    if (state.fontSize >= FONT.MAX_SIZE) return state;
    
    return {
        ...state,
        fontSize: Math.min(FONT.MAX_SIZE, state.fontSize + FONT.SIZE_STEP)
    };
}

export function decreaseFontSize(state) {
    if (state.fontSize <= FONT.MIN_SIZE) return state;
    
    return {
        ...state,
        fontSize: Math.max(FONT.MIN_SIZE, state.fontSize - FONT.SIZE_STEP)
    };
}

export function detectEnvironment(url) {
    return url.includes('/lightning/r/');
}

export function getters(state) {
    return {
        wrapperClass: `song-display-wrapper ${state.isRecordPage ? 'record-page-wrapper' : 'community-page-wrapper'}`,
        toggleButtonLabel: state._showChords ? 'Hide Chords' : 'Show Chords',
        autoScrollButtonLabel: state.isAutoScrolling ? 'Stop Scrolling' : 'Auto Scroll',
        autoScrollButtonVariant: state.isAutoScrolling ? 'brand' : 'neutral',
        autoScrollIconName: state.isAutoScrolling ? 'utility:pause' : 'utility:play',
        isMinFontSize: state.fontSize <= FONT.MIN_SIZE,
        isMaxFontSize: state.fontSize >= FONT.MAX_SIZE,
        isMinScrollSpeed: state.scrollSpeed <= SCROLL.MIN_SPEED,
        isMaxScrollSpeed: state.scrollSpeed >= SCROLL.MAX_SPEED,
        scrollSpeedDisplay: state.scrollSpeed.toFixed(1),
        chordsIconName: state._showChords ? 'utility:hide' : 'utility:preview'
    };
}
