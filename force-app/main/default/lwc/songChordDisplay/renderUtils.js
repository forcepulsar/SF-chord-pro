// renderUtils.js
import * as StyleUtils from './styleUtils';
import * as ChordUtils from './chordUtils';

/**
 * Escape '#' characters in plain‑text lines so ChordSheetJS
 * does not treat them as comments. We:
 *  - Leave directives ({...}) and comment lines (#...) alone.
 *  - Leave lines containing '[' (ChordPro chords) alone.
 *  - On all other lines, replace '#' with '\#'.
 */
function escapeSharpsInPlainText(chordProContent) {
    if (!chordProContent) {
        return chordProContent;
    }

    return chordProContent
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();

            // ChordPro directive, e.g. {title: ...}
            if (trimmed.startsWith('{')) {
                return line;
            }

            // Explicit ChordPro comment line, e.g. # this is a comment
            if (trimmed.startsWith('#')) {
                return line;
            }

            // Lines containing chord brackets should be left to the parser,
            // since sharps inside [C#7b5] etc. are valid chord syntax.
            if (line.includes('[')) {
                return line;
            }

            // Plain text line: escape all '#' so the parser
            // doesn't treat the remainder as a comment.
            return line.replace(/#/g, '\\#');
        })
        .join('\n');
}

export function parseAndFormatChordPro(chordProContent, ChordSheetJS) {
    const parser = new ChordSheetJS.ChordProParser();

    // Protect plain‑text lines from '#' being interpreted as comments
    const safeContent = escapeSharpsInPlainText(chordProContent);
    
    const song = parser.parse(safeContent);
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

        if (lyric.textContent && lyric.textContent.includes('\\#')) {
            lyric.textContent = lyric.textContent.replace(/\\#/g, '#');
        }
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