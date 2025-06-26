// converter.js
// Usage (terminal): node converter.js <input-file> <output-file>
//
//  Converts a plain-text lyrics-and-chords file into ChordPro format.
//  Robust chord parser handles maj, min, dim, aug, sus, add, extensions,
//  and slash-bass shapes such as C/G or F#m7b5/E.

const fs   = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/*  Robust chord pattern (re-usable in two regexes below)             */
/* ------------------------------------------------------------------ */
const CHORD_PATTERN =
  '(?:' +
    'N\\.C\\.' +                                 // “N.C.”
    '|' +
    '[A-G]' +                                    // root
      '(?:#|b)?' +                               // optional accidental
      '(?:maj|min|m|M|dim|aug|sus|add)?' +        // quality
      '[0-9]*' +                                 // optional extension numbers
      '(?:b5|#5|b9|#9|#11|b13)?' +                // optional alterations
      '(?:/[A-G](?:#|b)?)?' +                     // optional slash-bass
  ')';

/*  Regex that flags a line as “starts with a chord” (for chord-line detection) */
const isChordLine = new RegExp(
  `^[\\s]*${CHORD_PATTERN}(?:\\s+${CHORD_PATTERN})*\\s*$`
);

/*  Regex that finds every chord inside a chord line                  */
const chordRegex  = new RegExp(CHORD_PATTERN, 'g');

/* ------------------------------------------------------------------ */
/*  Main converter                                                    */
/* ------------------------------------------------------------------ */
function convertToChordPro(input) {
  const lines = input.split('\n');
  const output = [];
  let inChorus = false;
  let titleFound = false;
  let artistFound = false;
  let previousLineWasSection = false;

  for (let i = 0; i < lines.length; i++) {
    let currentLine = lines[i].trimEnd();

    /* ------------------ blank line handling ----------------------- */
    if (currentLine === '') {
      if (!previousLineWasSection &&
          output.length > 0 &&
          output[output.length - 1] !== '') {
        output.push('');
      }
      continue;
    }

    /* ------------------ title / artist ---------------------------- */
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

    /* ------------------ section headers --------------------------- */
    if (/^\[.*\]$/.test(currentLine)) {
      const sectionName = currentLine.slice(1, -1);

      // Close chorus automatically when next section is not Chorus
      if (inChorus && !sectionName.toLowerCase().startsWith('chorus')) {
        output.push('{eoc}');
        output.push('');
        inChorus = false;
      }

      if (sectionName === 'Intro') {
        output.push('{c:Intro}');
      } else if (sectionName.toLowerCase().startsWith('chorus')) {
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

    /* ------------------ chord lines & lyrics ---------------------- */
    const isChord = isChordLine.test(currentLine);
    const nextLine = i + 1 < lines.length ? lines[i + 1].trimEnd() : '';

    if (isChord) {
      /*  Case 1: chord line followed by blank → keep whole line in brackets */
      if (nextLine === '') {
        output.push(`[${currentLine.trim()}]`);
      } else {
        /*  Case 2: chord line followed by lyric line → interleave chords */
        const chords = [];
        let match;
        while ((match = chordRegex.exec(currentLine)) !== null) {
          chords.push({ chord: match[0], position: match.index });
        }

        if (chords.length > 0) {
          let lyricLine = nextLine;
          let offset = 0;

          chords.forEach(({ chord, position }) => {
            const insertPos = position + offset;
            if (insertPos <= lyricLine.length) {
              lyricLine =
                lyricLine.slice(0, insertPos) +
                `[${chord}]` +
                lyricLine.slice(insertPos);
            } else {
              lyricLine += `[${chord}]`;
            }
            offset += chord.length + 2; // +2 for []
          });

          output.push(lyricLine);
          i++; // skip lyric line (already processed)
        }
      }
    } else {
      /*  Not a chord line → output as-is                              */
      output.push(currentLine);
    }
  }

  /* ------------------ close any open chorus tag ------------------- */
  if (inChorus) {
    while (output.length > 0 && output[output.length - 1] === '') output.pop();
    output.push('{eoc}');
    output.push('');
  }

  /* ------------------ trim trailing blank lines ------------------- */
  while (output.length > 0 && output[output.length - 1] === '') output.pop();

  return output.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Helper: ensure output directory exists                            */
/* ------------------------------------------------------------------ */
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  fs.mkdirSync(dirname, { recursive: true });
}

/* ------------------------------------------------------------------ */
/*  Command-line interface                                            */
/* ------------------------------------------------------------------ */
if (require.main === module) {
  if (process.argv.length < 4) {
    console.error('Usage: node converter.js <input-file> <output-file>');
    process.exit(1);
  }

  const inputFile  = process.argv[2];
  const outputFile = process.argv[3];

  try {
    if (!fs.existsSync(inputFile)) {
      console.error(`Input file not found: ${inputFile}`);
      process.exit(1);
    }

    ensureDirectoryExists(outputFile);

    const input     = fs.readFileSync(inputFile, 'utf8');
    const converted = convertToChordPro(input);
    fs.writeFileSync(outputFile, converted, { encoding: 'utf8', flag: 'w' });

    console.log(`Conversion complete! Output written to ${outputFile}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Export as module                                                  */
/* ------------------------------------------------------------------ */
module.exports = convertToChordPro;
