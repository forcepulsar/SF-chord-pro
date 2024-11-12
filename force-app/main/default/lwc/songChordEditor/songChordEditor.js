import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { EditorState, EditorView } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { defaultKeymap, snippetKeymap } from "@codemirror/commands";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import getSongChordPro from '@salesforce/apex/SongChordController.getSongChordPro';
import updateSongChordPro from '@salesforce/apex/SongChordController.updateSongChordPro';

// Define custom language for ChordPro
const chordProHighlighting = HighlightStyle.define([
    { tag: tags.heading, color: "#164B93" },         // For titles, e.g., {title:}
    { tag: tags.literal, color: "#C41E3A" },         // For chords in []
    { tag: tags.comment, color: "#838383" },         // For comments
    { tag: tags.keyword, color: "#0066cc" },         // For directives like {start_of_chorus}
    { tag: tags.string, color: "#000000" },          // For regular text
    { tag: tags.meta, color: "#FF6B00" }             // For meta info like capo
]);

// Define snippets
const chordProSnippets = {
    "t": "{title: $0}",
    "st": "{subtitle: $0}",
    "c": "{c: $0}",
    "soc": "{start_of_chorus}\n$0\n{end_of_chorus}",
    "sov": "{start_of_verse}\n$0\n{end_of_verse}",
    "sob": "{start_of_bridge}\n$0\n{end_of_bridge}"
};

export default class SongChordEditor extends LightningElement {
    @api recordId;
    @track error;
    @track isLoading = true;
    editorView;

    async connectedCallback() {
        try {
            await this.initializeEditor();
        } catch (error) {
            console.error('Error in setup:', error);
            this.handleError(error);
        }
    }

    async initializeEditor() {
        try {
            const container = this.template.querySelector('.editor-container');
            if (!container) {
                throw new Error('Editor container not found');
            }

            // Create snippet completions
            const snippetCompletions = Object.entries(chordProSnippets).map(([trigger, template]) => ({
                label: trigger,
                detail: template,
                apply: (view, completion, from, to) => {
                    const content = template.replace('$0', '');
                    view.dispatch({
                        changes: { from, to, insert: content },
                        selection: { anchor: from + content.indexOf('$0') }
                    });
                }
            }));

            // Create editor state
            const startState = EditorState.create({
                doc: '',
                extensions: [
                    EditorView.theme({
                        "&": {
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            fontSize: "14px",
                            fontFamily: "Monaco, Menlo, 'Ubuntu Mono', Consolas, monospace"
                        },
                        ".cm-line": {
                            padding: "0 4px"
                        },
                        ".cm-matchingBracket": {
                            backgroundColor: "#e3e3e3"
                        }
                    }),
                    syntaxHighlighting(chordProHighlighting),
                    keymap.of([
                        ...defaultKeymap,
                        ...snippetKeymap
                    ]),
                    EditorView.lineWrapping,
                    EditorState.tabSize.of(4)
                ]
            });

            // Create editor view
            this.editorView = new EditorView({
                state: startState,
                parent: container
            });

            // Load content if recordId exists
            if (this.recordId) {
                await this.loadContent();
            }

            this.isLoading = false;
        } catch (error) {
            console.error('Error initializing editor:', error);
            this.handleError(error);
        }
    }

    async loadContent() {
        try {
            const content = await getSongChordPro({ recordId: this.recordId });
            if (this.editorView) {
                this.editorView.dispatch({
                    changes: {
                        from: 0,
                        to: this.editorView.state.doc.length,
                        insert: content || ''
                    }
                });
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    // Method to insert a chord
    insertChord(chord) {
        if (!this.editorView) return;
        
        const pos = this.editorView.state.selection.main.head;
        this.editorView.dispatch({
            changes: {
                from: pos,
                insert: `[${chord}]`
            }
        });
    }

    handleKeydown(event) {
        // Handle tab completion
        if (event.key === 'Tab') {
            const pos = this.editorView.state.selection.main.head;
            const line = this.editorView.state.doc.lineAt(pos);
            const beforeCursor = line.text.slice(0, pos - line.from);
            
            for (const [trigger, template] of Object.entries(chordProSnippets)) {
                if (beforeCursor.endsWith(trigger)) {
                    event.preventDefault();
                    const from = pos - trigger.length;
                    const content = template.replace('$0', '');
                    this.editorView.dispatch({
                        changes: { from, to: pos, insert: content },
                        selection: { anchor: from + template.indexOf('$0') }
                    });
                    return;
                }
            }
        }
    }

    async handleSave() {
        try {
            const content = this.editor.getValue();
            await updateSongChordPro({ 
                recordId: this.recordId, 
                chordProContent: content 
            });
            this.showToast('Success', 'Content saved successfully', 'success');
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        const message = (error.body && error.body.message) || error.message || String(error);
        this.error = message;
        this.showToast('Error', message, 'error');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }

    disconnectedCallback() {
        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }
    }
}