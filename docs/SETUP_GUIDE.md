# 🚀 Complete Setup Guide

This guide will walk you through setting up the GitHub PR Automation system step by step.

## Prerequisites

- Python 3.8 or higher
- Git
- A GitHub account with repository access
- A Groq API account
- A Google account for Google Sheets

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd AutomatePullRequest

# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

## Step 2: GitHub Setup

### 2.1 Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Give it a name like "PR Automation"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Copy the token (you won't see it again!)

### 2.2 Update Configuration

Edit your `.env` file:
```bash
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=yourusername/your-repo-name
```

## Step 3: Groq AI Setup

### 3.1 Get Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key

### 3.2 Update Configuration

Edit your `.env` file:
```bash
GROQ_API_KEY=gsk_your_groq_key_here
```

## Step 4: Google Sheets Setup

### 4.1 Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API:
   - Go to APIs & Services → Library
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create Service Account:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "Service Account"
   - Fill in details and create

5. Generate JSON Key:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Download the file

### 4.2 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Note the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
4. Share the spreadsheet with your service account email (found in the JSON file)

### 4.3 Update Configuration

1. Move the downloaded JSON file to `credentials/` directory
2. Edit your `.env` file:
```bash
GOOGLE_SHEETS_CREDENTIALS_FILE=credentials/your-service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

## Step 5: Test Your Setup

### 5.1 Activate Virtual Environment

```bash
source venv/bin/activate
```

### 5.2 Test Configuration

```bash
python main.py status
```

You should see:
```
┌─ Status ──────────────────────────────────────┐
│ 📊 System Status                              │
│                                               │
│ GitHub Repo: yourusername/your-repo-name     │
│ Open PRs: 0                                  │
│ Pending Reviews: 0                            │
│ Sheets Connected: ✅                          │
│ AI Model: groq/llama3-8b-8192                │
│ Last Sync: 2024-01-01T12:00:00               │
└───────────────────────────────────────────────┘
```

### 5.3 Test Google Sheets Setup

```bash
python main.py update-sheet --action setup
```

This will create the tracking worksheet with headers.

## Step 6: Create Your First PR

### 6.1 Create a Test Branch

```bash
# In your repository
git checkout -b feature/test-automation
echo "# Test automation" >> README.md
git add README.md
git commit -m "Test automation setup"
git push origin feature/test-automation
```

### 6.2 Create PR with AI

```bash
python main.py create-pr --branch feature/test-automation --title "Test AI PR Creation"
```

### 6.3 Review PR with AI

```bash
# Get the PR number from the output above, then:
python main.py review-prs --pr-number 1
```

## Step 7: Automation Workflows

### 7.1 Single Workflow

```bash
python main.py auto-workflow
```

This will:
- Review all open PRs
- Track approvals
- Update Google Sheets

### 7.2 Continuous Automation

```bash
python main.py auto-workflow --continuous --interval 1800
```

This runs every 30 minutes continuously.

## Troubleshooting

### Common Issues

1. **GitHub Token Error**
   - Ensure token has correct permissions
   - Check if token is expired
   - Verify repository access

2. **Groq API Error**
   - Check API key format
   - Verify account has credits
   - Check rate limits

3. **Google Sheets Error**
   - Verify service account JSON file path
   - Check spreadsheet sharing permissions
   - Ensure Google Sheets API is enabled

4. **Import Errors**
   - Activate virtual environment: `source venv/bin/activate`
   - Reinstall dependencies: `pip install -r requirements.txt`

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
python main.py status
```

### Check Logs

```bash
tail -f logs/automation.log
```

## Next Steps

1. **Customize AI Prompts**: Edit the prompts in `src/services/groq_service.py`
2. **Add Team Members**: Configure reviewer suggestions
3. **Set Up CI/CD**: Integrate with GitHub Actions
4. **Monitor Performance**: Check Google Sheets for analytics

## Support

- Check the logs in `logs/automation.log`
- Review the README.md for more details
- Open an issue in the repository for bugs

## Security Notes

- Never commit your `.env` file
- Keep your API keys secure
- Regularly rotate your tokens
- Use minimal required permissions
