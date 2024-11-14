// Usage, from terminal: node converter.js song.txt output.txt 
// song.txt contains the song to be converted
function convertToChordPro(input) {
    // Split input into lines
    const lines = input.split('\n');
    let output = [];
    let inChorus = false;
    let titleFound = false;
    let artistFound = false;
    
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i].trimEnd();
        
        // Handle title and artist at the beginning
        if (!titleFound && currentLine.trim() !== '') {
            output.push(`{title: ${currentLine}}`);
            titleFound = true;
            continue;
        }
        if (titleFound && !artistFound && currentLine.trim() !== '') {
            output.push(`{st: ${currentLine}}`);
            output.push('');
            artistFound = true;
            continue;
        }
        
        // Skip empty lines but preserve them
        if (currentLine === '') {
            output.push('');
            continue;
        }
        
        // Handle section headers
        if (currentLine.match(/^\[.*\]$/)) {
            const sectionName = currentLine.slice(1, -1); // Remove [ and ]
            
            // Close previous chorus if needed
            if (inChorus && !sectionName.startsWith('Chorus')) {
                output.push('{eoc}');
                output.push('');
                inChorus = false;
            }
            
            // Handle different section types
            if (sectionName === 'Intro') {
                output.push('{c:Intro}');
            } else if (sectionName.startsWith('Chorus')) {
                output.push('{soc}');
                output.push('{c:Chorus}');
                inChorus = true;
            } else if (sectionName === 'Bridge') {
                output.push('{c:Bridge}');
            } else if (sectionName === 'Solo') {
                output.push('{c:Solo}');
            } else {
                output.push(`{c:${sectionName}}`);
            }
            continue;
        }
        
        // Updated regex to handle slash chords
        const isChordLine = /^[\s]*([A-G][#bmMsus24567dim\s]*(?:\/[A-G][#b]?)?|N\.C\.)/.test(currentLine);
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        
        if (isChordLine && nextLine.trim() !== '') {
            // Get the chords and their positions
            const chordPositions = [];
            let pos = 0;
            // Updated regex to properly capture slash chords as a single unit
            const chordRegex = /([A-G][#bmMsus24567dim]*(?:\/[A-G][#b]?)?|N\.C\.)/g;
            let match;
            
            while ((match = chordRegex.exec(currentLine)) !== null) {
                const index = currentLine.indexOf(match[0], pos);
                chordPositions.push({
                    pos: index,
                    chord: match[0]
                });
                pos = index + 1;
            }
            
            // Insert chords into lyrics
            let result = nextLine;
            let offset = 0;
            
            for (const {pos, chord} of chordPositions) {
                const insertPos = pos + offset;
                result = result.slice(0, insertPos) + `[${chord}]` + result.slice(insertPos);
                offset += chord.length + 2;
            }
            
            output.push(result);
            i++; // Skip the lyric line
        } else if (!isChordLine) {
            // If it's just a lyric line without chords
            output.push(currentLine);
        } else {
            // Solo chord line with no lyrics
            output.push(`[${currentLine.trim()}]`);
        }
    }
    
    // Close final chorus if necessary
    if (inChorus) {
        output.push('{eoc}');
    }
    
    return output.join('\n');
}

// If running in Node.js environment
if (typeof require !== 'undefined') {
    const fs = require('fs');
    
    // Example usage
    const testContent = `Rolling In the Deep
Adele

[Verse 1]
Am               Am7/G
He'd like to come and meet us`;

    // Test the converter with a small sample
    console.log('\nTest conversion:');
    console.log(convertToChordPro(testContent));
    
    // Read input file if provided
    if (process.argv.length >= 3) {
        const inputFile = process.argv[2];
        const outputFile = process.argv[3] || 'output.txt';

        try {
            const input = fs.readFileSync(inputFile, 'utf8');
            const converted = convertToChordPro(input);
            fs.writeFileSync(outputFile, converted);
            console.log(`\nConversion complete! Output written to ${outputFile}`);
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}