import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

// Apex Method
import getSongChordPro from '@salesforce/apex/SongChordController.getSongChordPro';

// Utility Imports
import * as LifecycleUtils from './lifecycleUtils';
import * as StateUtils from './stateUtils';
import * as WebLinksUtils from './webLinksUtils';
import { toggleFullScreen } from './fullScreenUtils';
import * as ScrollUtils from './scrollUtils';
import { SCROLL, FONT } from './constants';

export default class SongChordDisplay extends NavigationMixin(LightningElement) {
    // Public Properties
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

    // Tracked Properties
    @track isRecordPage = false;
    @track error;
    @track isLoading = true;
    @track fontSize = FONT.DEFAULT_SIZE;
    @track scrollSpeed = SCROLL.DEFAULT_SPEED;
    @track webLinks = {
        spotify: null,
        youtube: null,
        google: null
    };
    @track isFullScreen = false;

    // Private Properties
    _showChords = true;
    isLibraryLoaded = false;
    chordProContent;
    isAutoScrolling = false;
    scrollAccumulator = 0;
    scrollInterval;

    // Computed Properties from StateUtils
    get wrapperClass() {
        return StateUtils.getters(this).wrapperClass;
    }
    get toggleButtonLabel() {
        return StateUtils.getters(this).toggleButtonLabel;
    }
    get autoScrollButtonLabel() {
        return StateUtils.getters(this).autoScrollButtonLabel;
    }
    get autoScrollButtonVariant() {
        return StateUtils.getters(this).autoScrollButtonVariant;
    }
    get autoScrollIconName() {
        return StateUtils.getters(this).autoScrollIconName;
    }
    get isMinFontSize() {
        return StateUtils.getters(this).isMinFontSize;
    }
    get isMaxFontSize() {
        return StateUtils.getters(this).isMaxFontSize;
    }
    get isMinScrollSpeed() {
        return StateUtils.getters(this).isMinScrollSpeed;
    }
    get isMaxScrollSpeed() {
        return StateUtils.getters(this).isMaxScrollSpeed;
    }
    get scrollSpeedDisplay() {
        return StateUtils.getters(this).scrollSpeedDisplay;
    }
    get chordsIconName() {
        return StateUtils.getters(this).chordsIconName;
    }

    // Lifecycle Hooks
    connectedCallback() {
        LifecycleUtils.connectedCallback(this);
    }

    renderedCallback() {
        LifecycleUtils.renderedCallback(this);
    }

    disconnectedCallback() {
        LifecycleUtils.disconnectedCallback(this);
    }

    // Wire Service
    @wire(getSongChordPro, { recordId: '$recordId' })
    wiredSong(result) {
        LifecycleUtils.wiredSong(this, result);
    }

    // Web Links Handlers
    handleSpotifyClick() {
        WebLinksUtils.handleWebLinkClick('spotify', this.webLinks.spotify);
    }

    handleYoutubeClick() {
        WebLinksUtils.handleWebLinkClick('youtube', this.webLinks.youtube);
    }

    handleGoogleClick() {
        WebLinksUtils.handleWebLinkClick('google', this.webLinks.google);
    }

    // Scroll Control Methods
    @api
    setScrollSpeed(speed) {
        const newState = StateUtils.setScrollSpeed(this, speed);
        this.scrollSpeed = newState.scrollSpeed;
        
        if (this.isAutoScrolling) {
            this.stopAutoScroll();
            this.startAutoScroll();
        }
    }

    increaseScrollSpeed() {
        if (!this.isMaxScrollSpeed) {
            const newSpeed = Math.min(
                SCROLL.MAX_SPEED,
                this.scrollSpeed + SCROLL.SPEED_STEP
            );
            this.setScrollSpeed(newSpeed);
        }
    }

    decreaseScrollSpeed() {
        if (!this.isMinScrollSpeed) {
            const newSpeed = Math.max(
                SCROLL.MIN_SPEED,
                this.scrollSpeed - SCROLL.SPEED_STEP
            );
            this.setScrollSpeed(newSpeed);
        }
    }

    // Auto Scroll Methods
    startAutoScroll() {
        const container = this.template.querySelector('.card-body');
        if (!container || container.scrollHeight <= container.clientHeight) {
            return;
        }

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

    // Font Size Methods
    increaseFontSize() {
        const newState = StateUtils.increaseFontSize(this);
        this.fontSize = newState.fontSize;
        this.refreshDisplay();
    }

    decreaseFontSize() {
        const newState = StateUtils.decreaseFontSize(this);
        this.fontSize = newState.fontSize;
        this.refreshDisplay();
    }

    // Public API Methods
    @api
    toggleChords() {
        const newState = StateUtils.toggleChords(this);
        this._showChords = newState._showChords;
        this.refreshDisplay();
    }

    @api
    refresh() {
        if (this.isLibraryLoaded && this.chordProContent) {
            LifecycleUtils.renderChordPro(this);
        }
    }

    // Full Screen Method
    toggleFullScreen() {
        toggleFullScreen(this);
    }

    // Refresh Display
    refreshDisplay() {
        LifecycleUtils.refreshDisplay(this);
    }
}