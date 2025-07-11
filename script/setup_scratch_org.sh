#!/bin/bash
# ----------------------------------------
# Pulsar Music App – one‑shot project setup
# ----------------------------------------

# ---------- argument parsing ----------
if [ $# -lt 2 ]; then
    echo "Usage: $0 <directory-path> <git-repo-url> <scratch-org-alias>"
    echo "Example: $0 ~/Documents/projects/pulsar_test2 https://github.com/forcepulsar/SF-chord-pro pulsar_test2"
    exit 1
fi

TARGET_DIR=$1
GIT_REPO_URL=$2
SCRATCH_ORG_ALIAS=$3

# ---------- path handling ----------
case $TARGET_DIR in
    /*) ;;                       # already absolute
    *) TARGET_DIR="$(pwd)/$TARGET_DIR" ;;
esac

if [ -z "$SCRATCH_ORG_ALIAS" ]; then
    SCRATCH_ORG_ALIAS=$(basename "$TARGET_DIR")
    echo "No scratch org alias provided, using: $SCRATCH_ORG_ALIAS"
fi

echo "===== Starting Pulsar Music App Setup ====="
echo "Target Directory: $TARGET_DIR"
echo "Git Repo:        $GIT_REPO_URL"
echo "Scratch Org:     $SCRATCH_ORG_ALIAS"

check_status () {
    if [ $? -eq 0 ]; then
        echo "✅ $1 successful"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# ---------- create / clone project ----------
if [ -d "$TARGET_DIR" ] && [ "$(ls -A "$TARGET_DIR")" ]; then
    echo "❌ Error: Directory $TARGET_DIR already exists and is not empty"
    exit 1
fi

echo "\n📁 Creating project directory..."
mkdir -p "$TARGET_DIR" && cd "$TARGET_DIR" || exit 1
check_status "Directory creation and navigation"

echo "\n📥 Cloning Git repository..."
git clone "$GIT_REPO_URL" .
check_status "Git clone"

# ---------- scratch org ----------
echo "\n📦 Creating scratch org..."
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias "$SCRATCH_ORG_ALIAS" \
  --duration-days 30 \
  --target-dev-hub PulsarMusicDevOrg \
  --no-namespace
check_status "Scratch org creation"

# ---------- Set scracth org as default in project ----------
echo "\n🔧 Setting project default org (local)..."
sf config set target-org "$SCRATCH_ORG_ALIAS"
check_status "Local org configuration"

# ---------- metadata, perms, data ----------
echo "\n📦 Deploying metadata..."
sf project deploy start --manifest manifest/pulsarmusic.xml --target-org "$SCRATCH_ORG_ALIAS"
check_status "Metadata deployment"

echo "\n👤 Assigning permission set..."
sf org assign permset --name Pulsar_Music_Admin --target-org "$SCRATCH_ORG_ALIAS"
check_status "Permission set assignment"

mkdir -p data
echo "\n📤 Exporting sample data from dev org..."
sf data export tree \
  --query "SELECT Song__c, Artist__c, Language__c, ChordPro_Content__c, Priority__c, My_Level__c, Difficulty__c, ChordPro_Status__c, Editing_Notes__c, Learning_resource__c FROM Song__c" \
  --target-org PulsarMusicDevOrg \
  --output-dir data
check_status "Data export"

echo "\n📥 Importing sample data to scratch org..."
sf data import tree --files data/song__c.json --target-org "$SCRATCH_ORG_ALIAS"
check_status "Data import"

# ---------- open org & git ----------
echo "\n🌐 Opening scratch org..."
sf org open --target-org "$SCRATCH_ORG_ALIAS"
check_status "Opening org"

echo "\n🔄 Setting up Git tracking..."
git branch --set-upstream-to=origin/main main
check_status "Git tracking setup"

# ---------- open in VS Code ----------
echo "\n🖥️ Opening project in VS Code..."
code .

echo "\n✨ Setup complete!"
echo "Directory: $(pwd)"
echo "Scratch Org: $SCRATCH_ORG_ALIAS"
