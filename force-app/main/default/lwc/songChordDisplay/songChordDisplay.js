import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, MessageContext } from 'lightning/messageService';
import SONG_CHORD_REFRESH from '@salesforce/messageChannel/SongChordRefresh__c';
import { refreshApex } from '@salesforce/apex';
import customIcons from '@salesforce/resourceUrl/customIcons';

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

    // LMS
    subscription;
    @wire(MessageContext)
    messageContext;
    wiredSongResult;

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

    spotifyIconPng = `${customIcons}/spotify.png`;
    youtubeIconPng = `${customIcons}/youtube.png`;
    googleIconPng  = `${customIcons}/google.png`;

    // Lifecycle Hooks
    connectedCallback() {

        LifecycleUtils.connectedCallback(this);
    
        // Subscribe to LMS for refresh
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                SONG_CHORD_REFRESH,
                (message) => this.handleRefreshMessage(message)
            );
        }

        // Add keydown listener for 'f', 'g', and 'y' keys
        this._handleKeyDown = (event) => {
            const key = event.key.toLowerCase();

            /*  ▸ If the component is *not* in full-screen mode, ignore the
                shortcut unless Shift is being held.                 */
            if (!this.isFullScreen && !event.shiftKey) {
                return;         // nothing happens until Shift + <key>
            }

            /*  ▸ Once we’re here the keystroke is valid:
                – in full-screen  ➜  Shift optional
                – not full-screen ➜  Shift required                   */
            switch (key) {
                case 'f':                     // full-screen toggle
                    this.toggleFullScreen();
                    break;
                case 'g':                     // Google search
                    this.handleGoogleClick();
                    break;
                case 'y':                     // YouTube
                    this.handleYoutubeClick();
                    break;
                case 'u':                     // font size ↑
                    this.increaseFontSize();
                    break;
                case 'i':                     // font size ↓
                    this.decreaseFontSize();
                    break;
                default:
                    // leave other keys untouched
            }
        };

        window.addEventListener('keydown', this._handleKeyDown);
    }


    disconnectedCallback() {
        LifecycleUtils.disconnectedCallback(this);
        // Remove keydown listener
        if (this._handleKeyDown) {
            window.removeEventListener('keydown', this._handleKeyDown);
        }
    }
    renderedCallback() {
        LifecycleUtils.renderedCallback(this);
    }

    // LMS Handler
    handleRefreshMessage(message) {
        console.log('Received refresh message', message);
        if (message && message.recordId === this.recordId) {
            this.refreshDisplay();
        }
    }

    // Wire Service
    @wire(getSongChordPro, { recordId: '$recordId' })
    wiredSong(result) {
        this.wiredSongResult = result;
        if (result.data) {
            this.chordProContent = result.data.chordProContent;
            try {
                this.webLinks = result.data.webPlayerLinks
                    ? JSON.parse(result.data.webPlayerLinks)
                    : { spotify: null, youtube: null, google: null };
            } catch (e) {
                this.webLinks = { spotify: null, youtube: null, google: null };
            }
            // Only change: set fontSize and scrollSpeed from Apex, fallback to constants
            this.fontSize =
                typeof result.data.defaultFontSize === 'number'
                    ? result.data.defaultFontSize
                    : FONT.DEFAULT_SIZE || 30;
            this.scrollSpeed =
                typeof result.data.defaultScrollSpeed === 'number'
                    ? result.data.defaultScrollSpeed
                    : SCROLL.DEFAULT_SPEED || 0.2;
            // Optionally update the constants for use elsewhere
            FONT.DEFAULT_SIZE = this.fontSize;
            SCROLL.DEFAULT_SPEED = this.scrollSpeed;
            this.isLoading = false;
            this.error = undefined;
        } else if (result.error) {
            this.error = 'Failed to load song data';
            this.isLoading = false;
        }
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
        if (this.wiredSongResult) {
            refreshApex(this.wiredSongResult);
        }
        LifecycleUtils.refreshDisplay(this);
        console.log('Refreshing display');
    }
}