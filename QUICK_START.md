# ⚡ Quick Start Guide

Get up and running with GitHub PR Automation in 5 minutes!

## 🚀 Super Quick Setup

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd AutomatePullRequest
./scripts/setup.sh
```

### 2. Configure Credentials
Edit `.env` file with your credentials:
```bash
# GitHub
GITHUB_TOKEN=your_github_token
GITHUB_REPO=yourusername/your-repo

# Groq AI
GROQ_API_KEY=your_groq_key

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_FILE=credentials/service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_sheet_id
```

### 3. Test It
```bash
source venv/bin/activate
python main.py status
```

### 4. Create Your First AI PR
```bash
python main.py create-pr --branch feature/test --title "My First AI PR"
```

## 🎯 What You Can Do

### Create PRs with AI
```bash
# Basic PR creation
python main.py create-pr --branch feature/new-feature

# With custom AI prompt
python main.py create-pr --branch feature/ai-enhanced --prompt "Create a PR for user authentication"

# With auto-merge
python main.py create-pr --branch feature/auto-merge --auto-merge
```

### Review PRs with AI
```bash
# Review specific PR
python main.py review-prs --pr-number 123

# Review all open PRs
python main.py review-prs --all
```

### Track Approvals
```bash
# Track and sync with Google Sheets
python main.py track-approvals

# Update Google Sheets
python main.py update-sheet --action sync
```

### Run Automation
```bash
# Single workflow
python main.py auto-workflow

# Continuous automation (every 30 minutes)
python main.py auto-workflow --continuous --interval 1800
```

## 🎮 Interactive Demo

Run the interactive demo to see all features:
```bash
python demo.py
```

## 📊 Google Sheets Dashboard

Your Google Sheet will automatically track:
- PR Number and Title
- Status (Open/Closed)
- Review Status
- Approval Count
- Comments Count
- Last Updated

## 🔧 Configuration

### Environment Variables
- `GITHUB_TOKEN`: Your GitHub personal access token
- `GITHUB_REPO`: Repository in format `owner/repo`
- `GROQ_API_KEY`: Your Groq API key
- `GOOGLE_SHEETS_CREDENTIALS_FILE`: Path to service account JSON
- `GOOGLE_SHEETS_SPREADSHEET_ID`: Your spreadsheet ID

### Configuration File
Edit `config.yaml` for advanced settings:
```yaml
github:
  base_branch: main
  auto_merge: false
  require_reviews: true

groq:
  model: groq/llama3-8b-8192
  max_tokens: 2048
  temperature: 0.7

sheets:
  worksheet_name: "PR Tracking"
  auto_sync: true
  sync_interval: 300
```

## 🚨 Troubleshooting

### Common Issues

1. **"Configuration validation failed"**
   - Check your `.env` file
   - Ensure all required variables are set

2. **"GitHub API error"**
   - Verify your GitHub token has correct permissions
   - Check if repository exists and is accessible

3. **"Groq API error"**
   - Verify your Groq API key
   - Check if you have credits in your Groq account

4. **"Google Sheets error"**
   - Verify service account JSON file path
   - Check if spreadsheet is shared with service account email

### Debug Mode
```bash
export LOG_LEVEL=DEBUG
python main.py status
```

### Check Logs
```bash
tail -f logs/automation.log
```

## 📈 Next Steps

1. **Customize AI Prompts**: Edit prompts in `src/services/groq_service.py`
2. **Add Team Members**: Configure reviewer suggestions
3. **Set Up CI/CD**: Use the provided GitHub Actions workflow
4. **Monitor Performance**: Check Google Sheets for analytics

## 🆘 Need Help?

- 📖 Read the full [Setup Guide](docs/SETUP_GUIDE.md)
- 🎮 Run the interactive demo: `python demo.py`
- 📋 Check the [README](README.md) for detailed documentation
- 🐛 Open an issue for bugs or questions

## 🎉 You're Ready!

Your GitHub PR automation system is now set up and ready to save you hours of manual work!
