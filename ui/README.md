# 🤖 GitHub PR Automation UI

A vibrant, modern React.js web interface for the GitHub PR Automation system with Groq AI integration.

## ✨ Features

- **🎨 Modern Design**: Beautiful, responsive UI built with Chakra UI
- **📊 Real-time Dashboard**: Live statistics and charts for PR monitoring
- **🤖 AI-Powered PR Creation**: Intelligent form with AI assistance
- **🔍 Smart PR Review**: AI-powered code review interface
- **📈 Tracking & Analytics**: Google Sheets integration with data visualization
- **⚙️ Configuration Management**: Comprehensive settings panel
- **📱 Mobile Responsive**: Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend automation system running

### Installation

```bash
# Navigate to UI directory
cd ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Pages & Features

### 📊 Dashboard
- **Statistics Cards**: Total PRs, Open PRs, Approval Rate, etc.
- **Activity Charts**: PR activity over time with Recharts
- **Status Distribution**: Pie chart showing PR status breakdown
- **Recent Activity**: Latest PRs with real-time updates

### 🚀 PR Creation
- **AI-Powered Generation**: One-click PR content generation
- **Branch Selection**: Dropdown with available branches
- **Live Preview**: Real-time preview of PR content
- **Smart Labels**: AI-suggested labels and reviewers
- **Custom Prompts**: Advanced AI customization options

### 🔍 PR Review
- **PR List**: Browse all open pull requests
- **AI Review**: Automated code review with suggestions
- **Review Interface**: Approve, request changes, or comment
- **File Analysis**: Detailed file change analysis
- **Severity Levels**: High, medium, low priority issues

### 📈 Tracking
- **Google Sheets Integration**: Real-time data synchronization
- **Search & Filter**: Advanced filtering capabilities
- **Export Options**: CSV export functionality
- **Approval Tracking**: Visual approval progress indicators

### ⚙️ Settings
- **GitHub Configuration**: Token and repository setup
- **Groq AI Settings**: API key and model configuration
- **Google Sheets Setup**: Credentials and spreadsheet configuration
- **Automation Preferences**: Intervals and behavior settings
- **Connection Testing**: Test all integrations

## 🎨 Design System

### Colors
- **Primary**: Brand blue (#0ea5e9)
- **Secondary**: Purple (#a855f7)
- **Success**: Green (#38a169)
- **Warning**: Orange (#d69e2e)
- **Error**: Red (#e53e3e)

### Components
- **Cards**: Clean, elevated containers
- **Buttons**: Gradient and solid variants
- **Forms**: Comprehensive form controls
- **Charts**: Interactive data visualization
- **Tables**: Sortable and filterable data tables

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the UI directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_SHEETS_INTEGRATION=true
```

### API Integration

The UI connects to the Python backend automation system. Ensure the backend is running and accessible.

## 📱 Responsive Design

The UI is fully responsive and optimized for:
- **Desktop**: Full-featured experience
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Touch-friendly interface

## 🚀 Development

### Project Structure

```
ui/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── theme.ts       # Chakra UI theme configuration
│   ├── App.tsx        # Main app component
│   └── main.tsx       # App entry point
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run start` - Start with custom host/port

### Adding New Features

1. **New Page**: Create component in `src/pages/`
2. **New Component**: Create in `src/components/`
3. **Routing**: Add route in `src/App.tsx`
4. **Styling**: Use Chakra UI components and theme

## 🎯 Integration

### Backend API

The UI integrates with the Python automation backend:

- **REST API**: For CRUD operations
- **WebSocket**: For real-time updates
- **File Upload**: For configuration files

### External Services

- **GitHub API**: PR management and data
- **Groq AI**: AI-powered features
- **Google Sheets**: Data tracking and analytics

## 🛡️ Security

- **Environment Variables**: Sensitive data in .env files
- **API Key Management**: Secure storage and transmission
- **Input Validation**: Client-side validation
- **HTTPS**: Production deployment with SSL

## 📈 Performance

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Optimized Builds**: Vite for fast development and builds
- **Caching**: Efficient caching strategies

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see the main project LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the main project README
- **Issues**: Open an issue in the repository
- **Discussions**: Use GitHub Discussions for questions

## 🎉 Credits

Built with:
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Chakra UI** - Component library
- **Vite** - Build tool
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Framer Motion** - Animations
