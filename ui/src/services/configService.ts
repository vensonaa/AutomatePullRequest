import axios from 'axios'

export interface BackendConfig {
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
  app: {
    logLevel: string
    logFile: string
  }
}

class ConfigService {
  private baseUrl: string
  private config: BackendConfig | null = null

  constructor() {
    // Use environment variable or default to localhost:8000
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  }

  async getConfig(): Promise<BackendConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/config`)
      this.config = response.data
      return this.config
    } catch (error) {
      console.error('Failed to fetch configuration:', error)
      // Return default config if API is not available
      return this.getDefaultConfig()
    }
  }

  async updateConfig(updates: Partial<BackendConfig>): Promise<BackendConfig> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/config`, updates)
      this.config = response.data
      return this.config
    } catch (error) {
      console.error('Failed to update configuration:', error)
      throw error
    }
  }

  private getDefaultConfig(): BackendConfig {
    return {
      github: {
        token: '',
        repository: '',
        baseBranch: 'main',
        autoMerge: false,
        requireReviews: true,
      },
      groq: {
        apiKey: '',
        model: 'groq/llama3-8b-8192',
        maxTokens: 2048,
        temperature: 0.7,
      },
      sheets: {
        credentialsFile: '',
        spreadsheetId: '',
        worksheetName: 'PR Tracking',
        autoSync: true,
        syncInterval: 300,
      },
      app: {
        logLevel: 'INFO',
        logFile: 'logs/automation.log',
      },
    }
  }

  // Helper methods to get specific config sections
  async getGitHubConfig() {
    const config = await this.getConfig()
    return config.github
  }

  async getGroqConfig() {
    const config = await this.getConfig()
    return config.groq
  }

  async getSheetsConfig() {
    const config = await this.getConfig()
    return config.sheets
  }

  async getAppConfig() {
    const config = await this.getConfig()
    return config.app
  }

  // Validate configuration
  validateConfig(config: BackendConfig): { isValid: boolean; missing: string[] } {
    const missing: string[] = []
    
    if (!config.github.token) missing.push('GitHub Token')
    if (!config.github.repository) missing.push('GitHub Repository')
    if (!config.groq.apiKey) missing.push('Groq API Key')
    if (!config.sheets.credentialsFile) missing.push('Google Sheets Credentials File')
    if (!config.sheets.spreadsheetId) missing.push('Google Sheets Spreadsheet ID')
    
    return {
      isValid: missing.length === 0,
      missing
    }
  }
}

export const configService = new ConfigService()
export default configService
