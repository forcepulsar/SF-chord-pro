// chordUtils.js
import { CHORD_FIXES } from './constants';

export function fixChordNames(chord) {
    if (!chord) return;
    
    const chordText = chord.textContent;
    if (CHORD_FIXES[chordText]) {
        chord.textContent = CHORD_FIXES[chordText];
    }
}

export function applyChordStyles(chord, fontSize, showChords) {
    if (!chord) return;
    
    Object.assign(chord.style, {
        color: '#dc3545',
        fontWeight: 'bold',
        position: 'absolute',
        top: '0',
        left: '0',
        height: `${fontSize * 1.2}px`,
        whiteSpace: 'pre',
        minWidth: `${Math.max(chord.textContent.length * 0.8, 1.5)}em`,
        display: showChords ? 'block' : 'none',
        fontSize: `${fontSize}px`,
        textAlign: 'center'
    });
}

export function handleConsecutiveChords(row) {
    const columns = Array.from(row.querySelectorAll('.column'));
    const lastColumns = columns.slice(-3);
    
    lastColumns.forEach((col) => {
        const chord = col.querySelector('.chord');
        const lyrics = col.querySelector('.lyrics');
        
        if (chord && lyrics && lyrics.textContent.trim() === '') {
            lyrics.style.minWidth = `${Math.max(chord.textContent.length * 0.8, 1.5)}em`;
            col.style.marginRight = '0.2em';
        }
    });
}

export function setupColumnWithChord(col, chord, lyrics, fontSize) {
    const minWidth = `${Math.max((chord?.textContent?.length || 0) * 0.8, 1.5)}em`;

    Object.assign(col.style, {
        display: 'inline-block',
        position: 'relative',
        padding: `${fontSize * 1.2}px 0 0`,
        margin: '0',
        minHeight: '1.5em',
        minWidth
    });

    if (lyrics) {
        if (lyrics.textContent.trim() === '') {
            if (chord && chord.textContent.trim()) {
                lyrics.innerHTML = '&nbsp;';
                lyrics.style.minWidth = minWidth;
            } else {
                lyrics.style.minWidth = '0.5em';
            }
        }
    }
}