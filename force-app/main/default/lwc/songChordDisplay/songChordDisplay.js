import { LightningElement, api, wire, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import getSongChordPro from '@salesforce/apex/SongChordController.getSongChordPro';
import CHORDSHEETJS from '@salesforce/resourceUrl/chordsheetjs';
import { NavigationMixin } from 'lightning/navigation';

import { SCROLL, FONT } from './constants';
import * as ScrollUtils from './scrollUtils';
import * as RenderUtils from './renderUtils';
import * as ErrorUtils from './errorUtils';

export default class SongChordDisplay extends NavigationMixin(LightningElement) {
    // Public properties
    @api recordId;
    @api 
    get showChords() {
        return this._showChords;
    }
    set showChords(value) {
        this._showChords = value;
        if (this.isLibraryLoaded) {
            this.refreshDisplay();
        }
    }

    // Private tracked properties
    @track isRecordPage = false;
    @track error;
    @track isLoading = true;
    @track fontSize = FONT.DEFAULT_SIZE;
    @track scrollSpeed = SCROLL.DEFAULT_SPEED;

    // Private properties
    _showChords = true;
    isLibraryLoaded = false;
    chordProContent;
    isAutoScrolling = false;
    scrollAccumulator = 0;
    scrollInterval;

    // Lifecycle hooks
    connectedCallback() {
        this.detectEnvironment();
        console.log('Connected callback - Record ID:', this.recordId);
    }

    renderedCallback() {
        if (this.isLibraryLoaded) return;

        loadScript(this, CHORDSHEETJS)
            .then(() => {
                console.log('ChordSheetJS loaded successfully');
                this.isLibraryLoaded = true;
                if (this.chordProContent) {
                    this.renderChordPro();
                }
                this.setupScrollableContainer();
            })
            .catch(error => {
                const { error: errorMessage } = ErrorUtils.errorHandlers.renderError(error);
                this.error = errorMessage;
            });
    }

    disconnectedCallback() {
        this.stopAutoScroll();
        if (this.scrollCleanup) {
            this.scrollCleanup();
        }
    }

    // Wire service
    @wire(getSongChordPro, { recordId: '$recordId' })
    wiredSong({ error, data }) {
        this.isLoading = true;
        if (data) {
            console.log('Received ChordPro data');
            this.chordProContent = data;
            this.error = undefined;
            if (this.isLibraryLoaded) {
                this.renderChordPro();
            }
        } else if (error) {
            const { error: errorMessage } = ErrorUtils.errorHandlers.renderError(error);
            this.error = errorMessage;
            this.chordProContent = undefined;
        }
        this.isLoading = false;
    }

    // Getters for component state
    get wrapperClass() {
        return `song-display-wrapper ${this.isRecordPage ? 'record-page-wrapper' : 'community-page-wrapper'}`;
    }

    get toggleButtonLabel() {
        return this._showChords ? 'Hide Chords' : 'Show Chords';
    }

    get autoScrollButtonLabel() {
        return this.isAutoScrolling ? 'Stop Scrolling' : 'Auto Scroll';
    }

    get autoScrollButtonVariant() {
        return this.isAutoScrolling ? 'brand' : 'neutral';
    }

    get autoScrollIconName() {
        return this.isAutoScrolling ? 'utility:pause' : 'utility:play';
    }

    get isMinFontSize() {
        return this.fontSize <= FONT.MIN_SIZE;
    }

    get isMaxFontSize() {
        return this.fontSize >= FONT.MAX_SIZE;
    }

    get isMinScrollSpeed() {
        return this.scrollSpeed <= SCROLL.MIN_SPEED;
    }

    get isMaxScrollSpeed() {
        return this.scrollSpeed >= SCROLL.MAX_SPEED;
    }

    get scrollSpeedDisplay() {
        return this.scrollSpeed.toFixed(1);
    }

    // Utility methods
    detectEnvironment() {
        const url = window.location.href;
        this.isRecordPage = url.includes('/lightning/r/');
    }

    scrollCleanup;

    // Modify setupScrollableContainer
    setupScrollableContainer() {
        const cardBody = this.template.querySelector('.card-body');
        const container = this.template.querySelector('.chordpro-container');
        ScrollUtils.setupScrollableContainer(cardBody, container);

        // Remove old scroll listeners if they exist
        if (this.scrollCleanup) {
            this.scrollCleanup();
        }

        // Add new scroll listeners
        if (cardBody) {
            this.scrollCleanup = ScrollUtils.addScrollListener(cardBody, () => {
                // Optional callback if you want to do anything when manual scroll occurs
                console.log('Manual scroll detected');
            });
        }
    }

    // Core rendering method
    renderChordPro() {
        try {
            ErrorUtils.validateInputs(
                this.template.querySelector('.chordpro-container'),
                this.chordProContent,
                'renderChordPro'
            );

            const formattedSong = RenderUtils.parseAndFormatChordPro(
                this.chordProContent,
                ChordSheetJS
            );

            RenderUtils.renderSong(
                this.template.querySelector('.chordpro-container'),
                formattedSong,
                this.fontSize,
                this._showChords
            );

            this.setupScrollableContainer();
        } catch (error) {
            const { error: errorMessage } = ErrorUtils.errorHandlers.renderError(error);
            this.error = errorMessage;
        }
    }

    // Scroll control methods
    @api
    setScrollSpeed(speed) {
        const newSpeed = Math.max(
            SCROLL.MIN_SPEED,
            Math.min(SCROLL.MAX_SPEED, Number(speed) || SCROLL.DEFAULT_SPEED)
        );
        
        console.log(`Setting speed from ${this.scrollSpeed} to ${newSpeed}`);
        
        if (this.scrollSpeed !== newSpeed) {
            this.scrollSpeed = newSpeed;
            
            if (this.isAutoScrolling) {
                console.log('Restarting scroll with new speed');
                this.stopAutoScroll();
                this.startAutoScroll();
            }
        }
    }

    increaseScrollSpeed() {
        if (!this.isMaxScrollSpeed) {
            const newSpeed = Math.min(
                SCROLL.MAX_SPEED,
                this.scrollSpeed + SCROLL.SPEED_STEP
            );
            console.log(`Increasing speed to ${newSpeed}`);
            this.setScrollSpeed(newSpeed);
        }
    }

    decreaseScrollSpeed() {
        if (!this.isMinScrollSpeed) {
            const newSpeed = Math.max(
                SCROLL.MIN_SPEED,
                this.scrollSpeed - SCROLL.SPEED_STEP
            );
            console.log(`Decreasing speed to ${newSpeed}`);
            this.setScrollSpeed(newSpeed);
        }
    }

    startAutoScroll() {
        const container = this.template.querySelector('.card-body');
        if (!container || container.scrollHeight <= container.clientHeight) {
            return;
        }

        console.log(`Starting auto-scroll with speed ${this.scrollSpeed}`);
        this.isAutoScrolling = true;
        this.scrollAccumulator = 0;

        this.scrollInterval = setInterval(() => {
            const container = this.template.querySelector('.card-body');
            if (!container) {
                this.stopAutoScroll();
                return;
            }

            const result = ScrollUtils.handleScroll(
                container,
                this.scrollAccumulator,
                this.scrollSpeed,
                this.isAutoScrolling
            );

            if (result.shouldStop) {
                this.stopAutoScroll();
            } else {
                this.scrollAccumulator = result.newAccumulator;
            }
        }, SCROLL.INTERVAL_MS);
    }
    
    stopAutoScroll() {
        console.log('Stopping auto-scroll');
        this.isAutoScrolling = false;
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
        this.scrollAccumulator = 0;
    }

    handleAutoScroll() {
        if (this.isAutoScrolling) {
            this.stopAutoScroll();
        } else {
            this.startAutoScroll();
        }
    }

    // Font control methods
    handleFontSizeChange(event) {
        this.fontSize = parseInt(event.target.value, 10);
        this.refreshDisplay();
    }

    increaseFontSize() {
        if (!this.isMaxFontSize) {
            this.fontSize = Math.min(FONT.MAX_SIZE, this.fontSize + FONT.SIZE_STEP);
            this.refreshDisplay();
        }
    }

    decreaseFontSize() {
        if (!this.isMinFontSize) {
            this.fontSize = Math.max(FONT.MIN_SIZE, this.fontSize - FONT.SIZE_STEP);
            this.refreshDisplay();
        }
    }

    // Navigation methods
    jumpToTop() {
        const container = this.template.querySelector('.card-body');
        if (container) {
            container.scrollTop = 0;
        }
    }

    // Public API methods
    @api
    toggleChords() {
        this._showChords = !this._showChords;
        this.refreshDisplay();
    }

    @api
    refresh() {
        if (this.isLibraryLoaded && this.chordProContent) {
            this.renderChordPro();
        }
    }

    // Private utility methods
    refreshDisplay() {
        if (this.isLibraryLoaded) {
            RenderUtils.applyAllStyles(
                this.template.querySelector('.chordpro-container'),
                this.fontSize,
                this._showChords
            );
        }
    }
}