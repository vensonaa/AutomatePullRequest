# 🤖 GitHub PR Automation with Groq AI

A comprehensive solution to automate GitHub Pull Request creation, AI-powered reviews, and approval tracking using Google Sheets.

## 🚀 Features

- **AI-Powered PR Creation**: Automatically create PRs using Groq AI based on commit messages and code changes
- **Smart PR Reviews**: AI-powered code review with intelligent comments and suggestions
- **Approval Tracking**: Track PR approvals and status in Google Sheets
- **Automated Workflows**: Schedule-based automation for continuous PR management
- **Rich CLI Interface**: Beautiful command-line interface with progress tracking

## 🛠️ Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file with your credentials:
```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=owner/repository_name

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key

# Google Sheets Configuration
GOOGLE_SHEETS_CREDENTIALS_FILE=path/to/credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

### 3. Google Sheets Setup
1. Create a new Google Sheet
2. Share it with the service account email from your credentials
3. Note the spreadsheet ID from the URL

## 📖 Usage

### Basic Commands

```bash
# Create a new PR with AI assistance
python main.py create-pr --branch feature/new-feature --title "Add new feature"

# Review existing PRs with AI
python main.py review-prs

# Track approvals in Google Sheets
python main.py track-approvals

# Run automated workflow
python main.py auto-workflow
```

### Advanced Usage

```bash
# Create PR with custom AI prompt
python main.py create-pr --branch feature/ai-enhanced --prompt "Create a PR for implementing user authentication"

# Review specific PR
python main.py review-pr --pr-number 123

# Update tracking sheet
python main.py update-sheet --action sync
```

## 🔧 Configuration

The system uses a configuration file (`config.yaml`) for customization:

```yaml
github:
  base_branch: main
  auto_merge: false
  require_reviews: true

ai:
  model: groq/llama3-8b-8192
  max_tokens: 2048
  temperature: 0.7

sheets:
  worksheet_name: "PR Tracking"
  auto_sync: true
  sync_interval: 300  # seconds
```

## 📊 Google Sheets Structure

The tracking sheet automatically creates these columns:
- PR Number
- Title
- Status
- Created Date
- Review Status
- Approvals
- Comments Count
- Last Updated

## 🤖 AI Features

### PR Creation
- Analyzes commit messages and code changes
- Generates meaningful PR titles and descriptions
- Suggests reviewers based on code patterns
- Creates appropriate labels

### Code Review
- Identifies potential bugs and issues
- Suggests code improvements
- Checks for security vulnerabilities
- Provides performance recommendations
- Generates helpful comments

## 🔄 Automation Workflows

### Scheduled Tasks
- Daily PR review sweep
- Weekly approval status sync
- Monthly performance analytics

### Event-Driven
- New commit triggers PR creation
- PR status changes update tracking
- Review comments trigger AI analysis

## 📈 Benefits

- **Save Hours**: Automate repetitive PR tasks
- **Improve Quality**: AI-powered code review catches issues early
- **Better Tracking**: Centralized approval tracking in Google Sheets
- **Consistent Process**: Standardized PR creation and review workflow
- **Real-time Updates**: Live sync with GitHub and Google Sheets

## 🛡️ Security

- All API keys stored securely in environment variables
- OAuth2 authentication for Google Sheets
- GitHub token with minimal required permissions
- No sensitive data logged or stored

## 📝 License

MIT License - feel free to use and modify for your needs!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions, please open an issue in the repository.
