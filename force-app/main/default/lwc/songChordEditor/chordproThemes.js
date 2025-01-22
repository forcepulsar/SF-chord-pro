// chordproThemes.js
const themes = {
    light: {
        background: '#ffffff',
        text: '#000000',
        // Directive styles - Green for syntax, Orange for content
        'directive-bracket': '#4CAF50',    // Green for directive brackets {}
        'directive-name': '#4CAF50',       // Green for directive names like 'c' in {c:}
        'directive-colon': '#4CAF50',      // Green for directive colons
        'directive-content': '#FF9800',    // Orange for content like 'Intro' in {Intro}
        // Chord styles
        'chord-bracket': '#F44336',        // Red for chord brackets []
        'chord-text': '#2196F3',          // Blue for chord text
        'chord-bar': '#9C27B0',           // Purple for chord bars |
        // Other elements
        'comment': '#9E9E9E',              // Gray for comments
        'gutter-bg': '#f7f7f7',            // Light gray for gutter background
        'gutter-text': '#999999',          // Gray for line numbers
        'selection': '#d7d4f0'             // Light purple for text selection
    },
    dark: {
        background: '#1e1e1e',
        text: '#d4d4d4',
        // Directive styles - Light Green for syntax, Light Orange for content
        'directive-bracket': '#81C784',    // Light Green
        'directive-name': '#81C784',       // Light Green
        'directive-colon': '#81C784',      // Light Green
        'directive-content': '#FFB74D',    // Light Orange
        // Chord styles
        'chord-bracket': '#E57373',        // Light Red
        'chord-text': '#64B5F6',          // Light Blue
        'chord-bar': '#BA68C8',           // Light Purple
        // Other elements
        'comment': '#E0E0E0',              // Light Gray
        'gutter-bg': '#252526',            // Dark gray for gutter background
        'gutter-text': '#858585',          // Light gray for line numbers
        'selection': '#264f78'             // Blue for text selection
    }
};

const createThemeStyles = (themeName) => {
    const theme = themes[themeName] || themes.light;
    
    return `
        /* Editor Base */
        .CodeMirror {
            background: ${theme.background};
            color: ${theme.text};
        }

        /* Directive Styles */
        .cm-directive-bracket { 
            color: ${theme['directive-bracket']};
            font-weight: bold;
        }
        .cm-directive-name { 
            color: ${theme['directive-name']};
            font-weight: bold;
        }
        .cm-directive-colon { 
            color: ${theme['directive-colon']};
        }
        .cm-directive-content { 
            color: ${theme['directive-content']};
        }

        /* Chord Styles */
        .cm-chord-bracket { 
            color: ${theme['chord-bracket']};
            font-weight: bold;
        }
        .cm-chord-text { 
            color: ${theme['chord-text']};
            font-weight: bold;
        }
        .cm-chord-bar {
            color: ${theme['chord-bar']};
            font-weight: bold;
        }

        /* Comments */
        .cm-comment { 
            color: ${theme.comment}; 
            font-style: italic;
        }

        /* Editor Elements */
        .CodeMirror-gutters {
            background-color: ${theme['gutter-bg']};
            border-right: 1px solid ${theme['gutter-text']};
        }
        .CodeMirror-linenumber {
            color: ${theme['gutter-text']};
        }
        .CodeMirror-selected {
            background: ${theme['selection']} !important;
        }
        .CodeMirror-cursor {
            border-left-color: ${theme.text};
        }
        .CodeMirror-line::selection,
        .CodeMirror-line > span::selection,
        .CodeMirror-line > span > span::selection {
            background: ${theme['selection']};
        }
    `;
};

export { themes, createThemeStyles };