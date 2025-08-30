#!/bin/bash

# GitHub PR Automation Setup Script
# This script helps you set up the automation system

set -e

echo "🤖 GitHub PR Automation Setup"
echo "=============================="

# Check if Python 3.8+ is installed
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Error: Python 3.8 or higher is required. Found: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p credentials

# Copy example files
echo "📋 Setting up configuration files..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env with your actual credentials"
else
    echo "ℹ️  .env file already exists"
fi

if [ ! -f config.yaml ]; then
    echo "✅ Using default config.yaml"
else
    echo "ℹ️  config.yaml already exists"
fi

# Create logs directory
echo "📝 Setting up logging..."
touch logs/automation.log

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials:"
echo "   - GITHUB_TOKEN: Your GitHub personal access token"
echo "   - GROQ_API_KEY: Your Groq API key"
echo "   - GOOGLE_SHEETS_CREDENTIALS_FILE: Path to your Google service account JSON"
echo "   - GOOGLE_SHEETS_SPREADSHEET_ID: Your Google Sheets ID"
echo ""
echo "2. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "3. Test the setup:"
echo "   python main.py status"
echo ""
echo "4. Run your first automation:"
echo "   python main.py create-pr --branch feature/test --title 'Test PR'"
echo ""
echo "For more information, see README.md"
