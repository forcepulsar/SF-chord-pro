#!/bin/bash

# Print usage if insufficient arguments provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <directory-path> <git-repo-url> <scratch-org-alias>"
    echo "Example: $0 ~/Documents/projects/pulsar_test2 https://github.com/forcepulsar/SF-chord-pro pulsar_test2"
    exit 1
fi

# Store the command line arguments
TARGET_DIR=$1
GIT_REPO_URL=$2
SCRATCH_ORG_ALIAS=$3

# Convert relative path to absolute path
case $TARGET_DIR in
    /*) ;; # Already absolute path
    *) TARGET_DIR="$(pwd)/$TARGET_DIR" ;; # Make it absolute
esac

if [ -z "$SCRATCH_ORG_ALIAS" ]; then
    SCRATCH_ORG_ALIAS=$(basename "$TARGET_DIR")
    echo "No scratch org alias provided, using: $SCRATCH_ORG_ALIAS"
fi

# Print header
echo "===== Starting Pulsar Music App Setup ====="
echo "Target Directory: $TARGET_DIR"
echo "Git Repo: $GIT_REPO_URL"
echo "Target Org: $SCRATCH_ORG_ALIAS"

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 successful"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Check if directory exists and is not empty
if [ -d "$TARGET_DIR" ] && [ "$(ls -A "$TARGET_DIR")" ]; then
    echo "❌ Error: Directory $TARGET_DIR already exists and is not empty"
    exit 1
fi

# Create and navigate to new directory
echo "\n📁 Creating project directory..."
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR" || exit 1
check_status "Directory creation and navigation"

# Clone the repository
echo "\n📥 Cloning Git repository..."
git clone "$GIT_REPO_URL" .
check_status "Git clone"

# Create scratch org
echo "\n📦 Creating scratch org..."
sf org create scratch --definition-file config/project-scratch-def.json --alias "$SCRATCH_ORG_ALIAS" --duration-days 30 --target-dev-hub PulsarMusicDevOrg --no-namespace
check_status "Scratch org creation"

# Deploy metadata
echo "\n📦 Deploying metadata..."
sf project deploy start --manifest manifest/pulsarmusic.xml --target-org "$SCRATCH_ORG_ALIAS"
check_status "Metadata deployment"

# Assign permission set
echo "\n👤 Assigning permission set..."
sf org assign permset --name Pulsar_Music_Admin --target-org "$SCRATCH_ORG_ALIAS"
check_status "Permission set assignment"

# Create data directory if it doesn't exist
mkdir -p data

# Export sample data from dev org
echo "\n📤 Exporting sample data from dev org..."
sf data export tree --query "SELECT Song__c, Artist__c, Language__c, ChordPro_Content__c, Priority__c, My_Level__c, Difficulty__c, ChordPro_Status__c, Editing_Notes__c, Learning_resource__c FROM Song__c" --target-org PulsarMusicDevOrg --output-dir data
check_status "Data export"

# Import data to new scratch org
echo "\n📥 Importing sample data to scratch org..."
sf data import tree --files data/song__c.json --target-org "$SCRATCH_ORG_ALIAS"
check_status "Data import"

# Open the org
echo "\n🌐 Opening scratch org..."
sf org open --target-org "$SCRATCH_ORG_ALIAS"
check_status "Opening org"

# Set up git tracking
echo "\n🔄 Setting up Git tracking..."
git branch --set-upstream-to=origin/main main
check_status "Git tracking setup"

echo "\n✨ Setup complete! Your scratch org is ready."
echo "Directory: $(pwd)"
echo "Scratch Org: $SCRATCH_ORG_ALIAS"