// renderUtils.js
import * as StyleUtils from './styleUtils';
import * as ChordUtils from './chordUtils';

export function parseAndFormatChordPro(chordProContent, ChordSheetJS) {
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(chordProContent);
    const formatter = new ChordSheetJS.HtmlDivFormatter();
    return formatter.format(song);
}

export function renderSong(container, formattedSong, fontSize, showChords) {
    if (!container) return false;

    container.innerHTML = formattedSong;
    applyAllStyles(container, fontSize, showChords);
    return true;
}

export function applyAllStyles(container, fontSize, showChords) {
    const chordSheet = container.querySelector('.chord-sheet');
    
    // Apply base styles
    StyleUtils.applyChordSheetStyles(chordSheet, fontSize);
    StyleUtils.applyHeadingStyles(container, fontSize);
    StyleUtils.applyParagraphStyles(container);
    StyleUtils.applyRowStyles(container);

    // Apply chord-specific styles
    container.querySelectorAll('.column').forEach(col => {
        const chord = col.querySelector('.chord');
        const lyrics = col.querySelector('.lyrics');
        
        if (chord) {
            ChordUtils.fixChordNames(chord);
            ChordUtils.applyChordStyles(chord, fontSize, showChords);
        }
        
        ChordUtils.setupColumnWithChord(col, chord, lyrics, fontSize);
    });

    // Style lyrics
    container.querySelectorAll('.lyrics').forEach(lyric => {
        Object.assign(lyric.style, {
            position: 'relative',
            whiteSpace: 'pre',
            minHeight: '1em',
            fontSize: `${fontSize}px`,
            padding: '0 0.1em'
        });
    });

    // Style comments
    container.querySelectorAll('.comment').forEach(comment => {
        Object.assign(comment.style, {
            color: '#28a745',
            fontStyle: 'italic',
            margin: '0.5em 0',
            width: '100%',
            fontSize: `${fontSize}px`
        });
    });

    // Handle consecutive chords
    container.querySelectorAll('.row').forEach(row => {
        ChordUtils.handleConsecutiveChords(row);
    });
}