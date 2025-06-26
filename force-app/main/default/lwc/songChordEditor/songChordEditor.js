// songChordEditor.js
import { LightningElement, api, track, wire } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import CODEMIRROR from '@salesforce/resourceUrl/codemirror';
import { defineChordProMode } from './chordproMode';
import { createThemeStyles } from './chordproThemes';
import getChordProContent from '@salesforce/apex/SongChordEditor.getChordProContent';
import saveChordProContent from '@salesforce/apex/SongChordEditor.saveChordProContent';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import SONG_CHORD_REFRESH from '@salesforce/messageChannel/SongChordRefresh__c';

export default class SongChordEditor extends LightningElement {
    @api recordId;
    @api theme = 'light';
    @track isLoading = true;
    @track isSaving = false;
    editor;
    isScriptLoaded = false;
    pendingContent;
    // In your class
    @wire(MessageContext)
    messageContext;

    async renderedCallback() {
        if (this.isScriptLoaded) return;
        
        try {
            await Promise.all([
                loadStyle(this, CODEMIRROR + '/codemirror.min.css'),
                loadScript(this, CODEMIRROR + '/codemirror.min.js')
            ]);

            // Initialize ChordPro mode
            const themeTokens = defineChordProMode(CodeMirror);
            
            // Apply theme styles
            const styleElement = document.createElement('style');
            styleElement.textContent = createThemeStyles(this.theme);
            this.template.querySelector('.editor-wrapper').appendChild(styleElement);

            await this.initializeEditor();
            this.isScriptLoaded = true;
            this.isLoading = false;
            
            // Load content if available
            if (this.recordId) {
                await this.loadContent();
            }
        } catch (error) {
            this.isLoading = false;
            this.showToast('Error', 'Error loading editor: ' + error.message, 'error');
            console.error('Error loading CodeMirror:', error);
        }
    }

    async loadContent() {
        try {
            const content = await getChordProContent({ recordId: this.recordId });
            if (this.editor) {
                this.editor.setValue(content || '');
            } else {
                this.pendingContent = content;
            }
        } catch (error) {
            this.showToast('Error', 'Error loading song content: ' + error.message, 'error');
        }
    }

    initializeEditor() {
        const editorContainer = this.template.querySelector('.editor-container');
        if (!editorContainer) return;

        this.editor = CodeMirror(editorContainer, {       
            value: this.pendingContent || '',
            mode: 'chordpro',
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2
        });

        this.editor.setSize('100%', '100%');
        this.pendingContent = null;
    }

    async handleSave() {
        if (!this.editor || !this.recordId) return;

        const content = this.editor.getValue();
        this.isSaving = true;

        try {
            await saveChordProContent({ 
                recordId: this.recordId, 
                content: content 
            });
            this.showToast('Success', 'Changes saved successfully', 'success');
            console.log('Publishing refresh message', this.recordId);
            publish(this.messageContext, SONG_CHORD_REFRESH, { recordId: this.recordId });
        } catch (error) {
            this.showToast('Error', 'Error saving changes: ' + error.message, 'error');
            console.error('Save error:', error);
        } finally {
            this.isSaving = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    @api
    getContent() {
        return this.editor ? this.editor.getValue() : '';
    }

    @api
    setContent(content) {
        if (this.editor) {
            this.editor.setValue(content || '');
        }
    }
}