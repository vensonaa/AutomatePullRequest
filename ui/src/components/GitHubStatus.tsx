import { Box, Text, VStack, Badge, Alert, AlertIcon, Button } from '@chakra-ui/react'
import { config } from '../utils/config'
import apiService from '../services/apiService'
import { useState } from 'react'

export function GitHubStatus() {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  const testGitHubConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    setErrorDetails(null)
    
    try {
      console.log('Testing GitHub connection...')
      console.log('Repository:', config.github.repository)
      console.log('Token configured:', !!config.github.token)
      
      const result = await apiService.testGitHubConnection()
      
      if (result.success) {
        setTestResult('success')
        console.log('✅ GitHub connection successful')
      } else {
        setTestResult('failed')
        console.log('❌ GitHub connection failed')
      }
    } catch (error: any) {
      setTestResult('error')
      setErrorDetails(error.message || 'Unknown error')
      console.error('GitHub connection error:', error)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">GitHub Connection Status</Text>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Configuration:</Text>
          <VStack align="start" spacing={1}>
            <Text>Repository: <Badge colorScheme="blue">{config.github.repository || 'Not set'}</Badge></Text>
            <Text>Token: <Badge colorScheme={config.github.token ? "green" : "red"}>{config.github.token ? 'Configured' : 'Not configured'}</Badge></Text>
          </VStack>
        </Box>

        <Button
          onClick={testGitHubConnection}
          isLoading={isTesting}
          loadingText="Testing..."
          colorScheme="blue"
          size="sm"
        >
          Test GitHub Connection
        </Button>

        {testResult === 'success' && (
          <Alert status="success">
            <AlertIcon />
            <Text>✅ GitHub connection successful! Your token has the correct permissions.</Text>
          </Alert>
        )}

        {testResult === 'failed' && (
          <Alert status="error">
            <AlertIcon />
            <Text>❌ GitHub connection failed. Check your token permissions.</Text>
          </Alert>
        )}

        {testResult === 'error' && (
          <Alert status="error">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text>❌ GitHub connection error:</Text>
              <Text fontSize="sm">{errorDetails}</Text>
            </VStack>
          </Alert>
        )}

        {testResult === 'error' && errorDetails?.includes('Resource not accessible') && (
          <Box p={3} bg="yellow.50" border="1px" borderColor="yellow.200" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color="yellow.800">Token Permission Issue:</Text>
            <Text fontSize="sm" color="yellow.700" mt={1}>
              Your GitHub token doesn't have the required permissions. You need:
            </Text>
            <VStack align="start" spacing={1} mt={2}>
              <Text fontSize="sm" color="yellow.700">• <strong>repo</strong> - Full control of private repositories</Text>
              <Text fontSize="sm" color="yellow.700">• <strong>read:user</strong> - Read access to user profile</Text>
              <Text fontSize="sm" color="yellow.700">• <strong>user:email</strong> - Read access to email addresses</Text>
            </VStack>
            <Text fontSize="sm" color="yellow.700" mt={2}>
              Create a new token at: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>https://github.com/settings/tokens</a>
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
