# SF-chord-pro
A Salesforce application for displaying and editing ChordPro music sheets.  

# Pulsar Music App Setup Guide

This guide explains how to set up the Pulsar Music app in a new scratch org.

## Prerequisites
- Salesforce CLI installed
- DevHub org already authenticated
- GitHub repository access

## 1 · Setup Script
The easiest way to set up the app is to use the provided setup script.
In terminal, run the following command to setup the scratch org:
```bash
./setup_scratch_org.sh ~/Documents/vscode/pulsar_test  https://github.com/forcepulsar/SF-chord-pro pulsar_test 

#./script/setup_scratch_org.sh <directory-path> <git-repo-url> <scratch-org-alias>
```

## 2 · Salesforce scratch‑org setup

1. Create and navigate to a new project directory:
```bash
# Create a new directory for testing and navigate into it
mkdir pulsar_test
cd pulsar_test
```

2. Clone the repository:
```bash
# Clone the repository into current directory
git clone [your-repository-url] .
```

3. Create a scratch org:
```bash
# Create a new scratch org with 30-day duration (-d) and set it as default
sf org create scratch -f config/project-scratch-def.json -a pulsarMusic_test --duration-days 30 -v PulsarMusicDevOrg
```

4. Deploy metadata:
```bash
# Deploy the metadata components specified in the manifest file
sf project deploy start --manifest manifest/pulsarmusic.xml --target-org pulsarMusic_test
```

5. Assign permission set:
```bash
# Assign the required permission set to access the app functionality
sf org assign permset --name Pulsar_Music_Admin --target-org pulsarMusic_test
```

6. Import sample data:
```bash
# Export existing song data from the dev org
sf data export tree --query "SELECT Song__c, Artist__c, Language__c, ChordPro_Content__c, Priority__c, My_Level__c, Difficulty__c, ChordPro_Status__c, Editing_Notes__c, Learning_resource__c FROM Song__c order by Artist__c,Song__c" --target-org PulsarMusicDevOrg --output-dir data

# Import the exported song data into the new scratch org
sf data import tree --files data/song__c.json --target-org pulsarMusic_test
```

7. Open the org:
```bash
# Open the scratch org in default web browser
sf org open --target-org pulsarMusic_test
```

---

## 3 · Generate a song‑book PDF&#x20;

The new **Node 18+** utility lives in `tools/pdf-generator/` and turns the Salesforce export (`data/song__c.json`) into:

- **songs.pdf** — printable book (all songs)
- **songs.html** — quick 5‑song preview for browser layout checks

### 3.1  Install & run

```bash
cd tools/pdf-generator
npm ci                       # installs chordsheetjs + puppeteer

npm start                    # builds songs.pdf and songs.html (first 5 songs)
```

### 3.2  Options

| Environment var | Default | Effect                                 |
| --------------- | ------- | -------------------------------------- |
| `PREVIEW_HTML`  | `true`  | Set `false` to skip songs.html preview |

```bash
PREVIEW_HTML=false npm start   # create PDF only
```

### 3.3  Why keep `package-lock.json`?

Committed lock‑files guarantee every contributor installs the **exact** same dependency tree — no “works on my machine” surprises. If you ever upgrade a lib, commit the updated lock‑file alongside `package.json`.



## Data Model

The app uses a custom object `Song__c` with the following custom fields:

| Field Name | Type | Description |
|------------|------|-------------|
| Song__c | Text(255) | Name of the song (Required) |
| Artist__c | Text(255) | Artist name |
| Language__c | Picklist | Song language (English/Spanish) |
| ChordPro_Content__c | Long Text Area | Song chord progression in ChordPro format |
| Priority__c | Text(255) | Song priority |
| My_Level__c | Picklist | Current learning status |
| Difficulty__c | Picklist | Song difficulty level |
| ChordPro_Status__c | Picklist | Status of chord progression documentation |
| Editing_Notes__c | Text Area | Notes about the song |
| Learning_resource__c | HTML(1000) | Learning resources for the song |
| Web_Player__c | Formula (Text) | Links to song on Spotify, YouTube, and Google |

## Support

For issues or questions, please raise them in the GitHub repository's Issues section.