// Configuration utility for reading environment variables
// Note: In Vite, environment variables must be prefixed with VITE_ to be accessible in the browser

export interface AppConfig {
  github: {
    token: string
    repository: string
    baseBranch: string
    autoMerge: boolean
    requireReviews: boolean
  }
  groq: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
  }
  sheets: {
    credentialsFile: string
    spreadsheetId: string
    worksheetName: string
    autoSync: boolean
    syncInterval: number
  }
  api: {
    baseUrl: string
    timeout: number
  }
  app: {
    title: string
    logLevel: string
  }
}

// Helper function to get environment variable with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Try VITE_ prefixed first (for Vite), then try without prefix (for direct env access)
  return import.meta.env[`VITE_${key}`] || import.meta.env[key] || fallback
}

// Helper function to get boolean environment variable
const getEnvBool = (key: string, fallback: boolean = false): boolean => {
  const value = getEnvVar(key)
  return value ? value.toLowerCase() === 'true' : fallback
}

// Helper function to get number environment variable
const getEnvNumber = (key: string, fallback: number = 0): number => {
  const value = getEnvVar(key)
  return value ? parseInt(value, 10) : fallback
}

// Configuration object
export const config: AppConfig = {
  github: {
    token: getEnvVar('GITHUB_TOKEN'),
    repository: getEnvVar('GITHUB_REPO'),
    baseBranch: getEnvVar('GITHUB_BASE_BRANCH', 'main'),
    autoMerge: getEnvBool('GITHUB_AUTO_MERGE', false),
    requireReviews: getEnvBool('GITHUB_REQUIRE_REVIEWS', true),
  },
  groq: {
    apiKey: getEnvVar('GROQ_API_KEY'),
    model: getEnvVar('GROQ_MODEL', 'groq/llama3-8b-8192'),
    maxTokens: getEnvNumber('GROQ_MAX_TOKENS', 2048),
    temperature: parseFloat(getEnvVar('GROQ_TEMPERATURE', '0.7')),
  },
  sheets: {
    credentialsFile: getEnvVar('GOOGLE_SHEETS_CREDENTIALS_FILE'),
    spreadsheetId: getEnvVar('GOOGLE_SHEETS_SPREADSHEET_ID'),
    worksheetName: getEnvVar('GOOGLE_SHEETS_WORKSHEET_NAME', 'PR Tracking'),
    autoSync: getEnvBool('GOOGLE_SHEETS_AUTO_SYNC', true),
    syncInterval: getEnvNumber('GOOGLE_SHEETS_SYNC_INTERVAL', 300),
  },
  api: {
    baseUrl: getEnvVar('API_BASE_URL', 'http://localhost:8000'),
    timeout: getEnvNumber('API_TIMEOUT', 30000),
  },
  app: {
    title: getEnvVar('APP_TITLE', 'GitHub PR Automation'),
    logLevel: getEnvVar('LOG_LEVEL', 'INFO'),
  },
}

// Export individual config sections for convenience
export const githubConfig = config.github
export const groqConfig = config.groq
export const sheetsConfig = config.sheets
export const apiConfig = config.api
export const appConfig = config.app

// Utility function to check if required config is present
export const validateConfig = (): { isValid: boolean; missing: string[] } => {
  const missing: string[] = []
  
  if (!config.github.token) missing.push('GITHUB_TOKEN')
  if (!config.github.repository) missing.push('GITHUB_REPO')
  if (!config.groq.apiKey) missing.push('GROQ_API_KEY')
  if (!config.sheets.credentialsFile) missing.push('GOOGLE_SHEETS_CREDENTIALS_FILE')
  if (!config.sheets.spreadsheetId) missing.push('GOOGLE_SHEETS_SPREADSHEET_ID')
  
  return {
    isValid: missing.length === 0,
    missing
  }
}
