import axios from 'axios'
import { config } from '../utils/config'

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export interface GitHubLabel {
  name: string
  color: string
  description?: string
}

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  type: string
}

class GitHubService {
  private baseUrl = 'https://api.github.com'
  private token: string
  private repo: string

  constructor() {
    this.token = config.github.token
    // Handle different repository URL formats
    let repoUrl = config.github.repository
    if (repoUrl.startsWith('https://github.com/')) {
      this.repo = repoUrl.replace('https://github.com/', '')
    } else if (repoUrl.startsWith('http://github.com/')) {
      this.repo = repoUrl.replace('http://github.com/', '')
    } else if (repoUrl.includes('github.com/')) {
      this.repo = repoUrl.split('github.com/')[1]
    } else {
      this.repo = repoUrl
    }
    
    // Remove trailing slash if present
    this.repo = this.repo.replace(/\/$/, '')
  }

  private getHeaders() {
    return {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    }
  }

  async getBranches(): Promise<GitHubBranch[]> {
    try {
      if (!this.token || !this.repo) {
        console.warn('GitHub token or repository not configured')
        return []
      }

      const response = await axios.get(
        `${this.baseUrl}/repos/${this.repo}/branches`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch branches:', error)
      return []
    }
  }

  async getLabels(): Promise<GitHubLabel[]> {
    try {
      if (!this.token || !this.repo) {
        console.warn('GitHub token or repository not configured')
        return []
      }

      const response = await axios.get(
        `${this.baseUrl}/repos/${this.repo}/labels`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch labels:', error)
      return []
    }
  }

  async getCollaborators(): Promise<GitHubUser[]> {
    try {
      if (!this.token || !this.repo) {
        console.warn('GitHub token or repository not configured')
        return []
      }

      const response = await axios.get(
        `${this.baseUrl}/repos/${this.repo}/collaborators`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch collaborators:', error)
      return []
    }
  }

  async createBranch(baseBranch: string, newBranch: string): Promise<boolean> {
    try {
      if (!this.token || !this.repo) {
        throw new Error('GitHub token or repository not configured')
      }

      // First get the SHA of the base branch
      const baseResponse = await axios.get(
        `${this.baseUrl}/repos/${this.repo}/branches/${baseBranch}`,
        { headers: this.getHeaders() }
      )

      const sha = baseResponse.data.commit.sha

      // Create the new branch
      await axios.post(
        `${this.baseUrl}/repos/${this.repo}/git/refs`,
        {
          ref: `refs/heads/${newBranch}`,
          sha: sha
        },
        { headers: this.getHeaders() }
      )

      return true
    } catch (error) {
      console.error('Failed to create branch:', error)
      return false
    }
  }

  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body: string,
    labels: string[] = [],
    reviewers: string[] = []
  ): Promise<any> {
    try {
      if (!this.token || !this.repo) {
        throw new Error('GitHub token or repository not configured')
      }

      const response = await axios.post(
        `${this.baseUrl}/repos/${this.repo}/pulls`,
        {
          title,
          head,
          base,
          body,
          labels,
          reviewers
        },
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Failed to create pull request:', error)
      throw error
    }
  }

  // Test GitHub connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.token || !this.repo) {
        return false
      }

      const response = await axios.get(
        `${this.baseUrl}/repos/${this.repo}`,
        { headers: this.getHeaders() }
      )

      return response.status === 200
    } catch (error) {
      console.error('GitHub connection test failed:', error)
      return false
    }
  }
}

export const githubService = new GitHubService()
export default githubService
