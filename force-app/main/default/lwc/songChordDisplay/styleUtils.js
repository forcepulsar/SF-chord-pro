// styleUtils.js
export function applyChordSheetStyles(chordSheet, fontSize) {
    if (!chordSheet) return;
    
    Object.assign(chordSheet.style, {
        fontFamily: 'monospace',
        fontSize: `${fontSize}px`,
        lineHeight: '1.5',
        paddingBottom: '2rem'
    });
}

export function applyHeadingStyles(container, fontSize) {
    container.querySelectorAll('h1').forEach(h1 => {
        Object.assign(h1.style, {
            fontSize: `${fontSize * 1.5}px`,
            fontWeight: 'bold',
            marginBottom: '0.5rem'
        });
    });

    container.querySelectorAll('h2').forEach(h2 => {
        Object.assign(h2.style, {
            fontSize: `${fontSize * 1.125}px`,
            fontWeight: 'normal',
            marginBottom: '1.5rem',
            color: '#666'
        });
    });
}

export function applyParagraphStyles(container) {
    container.querySelectorAll('.paragraph').forEach(para => {
        para.style.marginBottom = '1.5rem';
        
        if (para.classList.contains('chorus')) {
            Object.assign(para.style, {
                background: '#f3f6fc',
                padding: '1rem',
                borderRadius: '4px',
                marginLeft: '0'
            });
        }
    });
}

export function applyRowStyles(container) {
    container.querySelectorAll('.row').forEach(row => {
        Object.assign(row.style, {
            position: 'relative',
            margin: '0',
            padding: '0',
            minHeight: '1.5em',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            width: '100%'
        });
    });
}

export function calculateMinWidth(chord) {
    if (!chord || !chord.textContent) return '1.5em';
    return `${Math.max(chord.textContent.length * 0.8, 1.5)}em`;
}