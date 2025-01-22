// chordproMode.js
const defineChordProMode = (CodeMirror) => {
    // Regular expressions matching ChordPro syntax
    const patterns = {
        directiveStart: /^{/,
        directiveEnd: /}/,
        directiveContent: /^[^}]+?(?=})/,
        directiveName: /^[a-zA-Z_][a-zA-Z0-9_]*(?=:)/,
        simpleDirective: /^[a-zA-Z_][a-zA-Z0-9_]*(?!:)/,
        chordBar: /\|/,
        chordBarContent: /[A-G][b#]?(?:m|maj|dim|aug|sus[24])?[0-9]*(?:\/[A-G][b#]?)?(?:\s+[A-G][b#]?(?:m|maj|dim|aug|sus[24])?[0-9]*(?:\/[A-G][b#]?)?)*\s*/,
        chord: /\[/,
        chordContent: /[A-G][b#]?(?:m|maj|dim|aug|sus[24])?[0-9]*(?:\/[A-G][b#]?)?/,
        chordEnd: /\]/,
        comment: /^#.*$/
    };

    CodeMirror.defineMode("chordpro", function() {
        return {
            startState: function() {
                return {
                    inDirective: false,
                    inChord: false,
                    inChordBar: false
                };
            },
            
            token: function(stream, state) {
                // Handle start of line directives
                if (stream.sol()) {
                    state.inDirective = false;
                    state.inChord = false;
                    state.inChordBar = false;

                    // Comments
                    if (stream.match(patterns.comment)) {
                        return "comment";
                    }
                }

                // Handle directive start
                if (stream.match(patterns.directiveStart)) {
                    state.inDirective = true;
                    return "directive-bracket";
                }

                // Handle directive content
                if (state.inDirective) {
                    if (stream.match(patterns.directiveName)) {
                        return "directive-name";
                    }
                    if (stream.match(/:/)) {
                        return "directive-colon";
                    }
                    if (stream.match(patterns.directiveEnd)) {
                        state.inDirective = false;
                        return "directive-bracket";
                    }
                    if (stream.match(patterns.directiveContent)) {
                        return "directive-content";
                    }
                }

                // Handle chord bars
                if (stream.match(patterns.chordBar)) {
                    state.inChordBar = !state.inChordBar;
                    return "chord-bar";
                }

                if (state.inChordBar) {
                    if (stream.match(patterns.chordBarContent)) {
                        return "chord-text";
                    }
                }

                // Handle individual chords
                if (stream.match(patterns.chord)) {
                    state.inChord = true;
                    return "chord-bracket";
                }

                if (state.inChord) {
                    if (stream.match(patterns.chordContent)) {
                        return "chord-text";
                    }
                    if (stream.match(patterns.chordEnd)) {
                        state.inChord = false;
                        return "chord-bracket";
                    }
                }

                // Skip other characters
                stream.next();
                return null;
            }
        };
    });
};

export { defineChordProMode };