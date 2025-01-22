// Usage, from terminal: node converter.js song.txt output.txt 
// song.txt contains the song to be converted
// converter.js
// converter.js
const fs = require('fs');
const path = require('path');

function convertToChordPro(input) {
    const lines = input.split('\n');
    let output = [];
    let inChorus = false;
    let titleFound = false;
    let artistFound = false;
    let previousLineWasSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        let currentLine = lines[i].trimEnd();
        
        if (currentLine === '') {
            if (!previousLineWasSection && output.length > 0 && output[output.length - 1] !== '') {
                output.push('');
            }
            continue;
        }

        // Handle title and artist
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

        // Handle section headers
        if (currentLine.match(/^\[.*\]$/)) {
            const sectionName = currentLine.slice(1, -1);
            
            // Close previous chorus if needed
            if (inChorus && !sectionName.startsWith('Chorus')) {
                output.push('{eoc}');
                output.push(''); // Add line break after chorus ends
                inChorus = false;
            }

            if (sectionName === 'Intro') {
                output.push('{c:Intro}');
            } else if (sectionName.startsWith('Chorus')) {
                output.push('{soc}');
                output.push('{c:Chorus}');
                inChorus = true;
            } else {
                output.push(`{c:${sectionName}}`);
            }
            previousLineWasSection = true;
            continue;
        }

        previousLineWasSection = false;

        // Handle chord lines and lyrics
        const isChordLine = /^[\s]*([A-G][#bmMsus24567dim\s]*(?:\/[A-G][#b]?)?|N\.C\.)/.test(currentLine);
        const nextLine = i + 1 < lines.length ? lines[i + 1].trimEnd() : '';

        if (isChordLine) {
            if (nextLine === '') {
                output.push(`[${currentLine.trim()}]`);
            } else {
                const chords = [];
                const chordRegex = /([A-G][#bmMsus24567dim]*(?:\/[A-G][#b]?)?|N\.C\.)/g;
                let match;
                
                while ((match = chordRegex.exec(currentLine)) !== null) {
                    chords.push({
                        chord: match[0],
                        position: match.index
                    });
                }

                if (chords.length > 0) {
                    let lyricLine = nextLine;
                    let offset = 0;

                    chords.forEach(({chord, position}) => {
                        const insertPos = position + offset;
                        if (insertPos <= lyricLine.length) {
                            lyricLine = lyricLine.slice(0, insertPos) + `[${chord}]` + lyricLine.slice(insertPos);
                        } else {
                            lyricLine += `[${chord}]`;
                        }
                        offset += chord.length + 2;
                    });
                    
                    output.push(lyricLine);
                    i++;
                }
            }
        } else {
            output.push(currentLine);
        }
    }

    // Handle final chorus if needed
    if (inChorus) {
        // Remove any trailing empty line before eoc
        while (output[output.length - 1] === '') {
            output.pop();
        }
        output.push('{eoc}');
        output.push(''); // Add line break after chorus ends
    }

    // Clean up multiple consecutive empty lines at the end
    while (output.length > 0 && output[output.length - 1] === '') {
        output.pop();
    }
    
    return output.join('\n');
}

// Ensure directory exists
function ensureDirectoryExists(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
}

// Main execution
if (require.main === module) {
    if (process.argv.length < 4) {
        console.error('Usage: node converter.js <input-file> <output-file>');
        process.exit(1);
    }

    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    try {
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            console.error(`Input file not found: ${inputFile}`);
            process.exit(1);
        }

        // Ensure output directory exists
        ensureDirectoryExists(outputFile);

        // Read input file
        const input = fs.readFileSync(inputFile, 'utf8');
        
        // Convert the content
        const converted = convertToChordPro(input);
        
        // Write to output file
        fs.writeFileSync(outputFile, converted, { encoding: 'utf8', flag: 'w' });
        
        console.log(`Conversion complete! Output written to ${outputFile}`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = convertToChordPro;