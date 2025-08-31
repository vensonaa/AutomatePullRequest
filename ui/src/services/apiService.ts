import axios from 'axios'
import { config } from '../utils/config'

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = config.api.baseUrl || 'http://localhost:8000'
  }

  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      const response = await axios({
        url: `${this.baseUrl}${endpoint}`,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      return response.data
    } catch (error: any) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // GitHub operations
  async getBranches() {
    return this.request('/api/github/branches')
  }

  async getLabels() {
    return this.request('/api/github/labels')
  }

  async getCollaborators() {
    return this.request('/api/github/collaborators')
  }

  async createPullRequest(prData: {
    title: string
    head: string
    base: string
    body: string
    labels: string[]
    reviewers: string[]
  }) {
    return this.request('/api/github/pull-requests', {
      method: 'POST',
      data: prData,
    })
  }

  async testGitHubConnection() {
    return this.request('/api/github/test-connection')
  }

  // Configuration operations
  async getConfig() {
    return this.request('/api/config')
  }

  async updateConfig(configData: any) {
    return this.request('/api/config', {
      method: 'PUT',
      data: configData,
    })
  }

  // Statistics and data
  async getStats() {
    return this.request('/api/stats')
  }

  async getPullRequests() {
    return this.request('/api/prs')
  }

  async submitPRReview(prNumber: number, reviewData: {
    state: string
    body: string
    event: string
  }) {
    return this.request(`/api/github/pull-requests/${prNumber}/reviews`, {
      method: 'POST',
      data: reviewData,
    })
  }

  async getPRFiles(prNumber: number) {
    return this.request(`/api/github/pull-requests/${prNumber}/files`)
  }

  async performAIReview(prNumber: number) {
    return this.request(`/api/github/pull-requests/${prNumber}/ai-review`, {
      method: 'POST',
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health')
  }
}

export const apiService = new ApiService()
export default apiService
