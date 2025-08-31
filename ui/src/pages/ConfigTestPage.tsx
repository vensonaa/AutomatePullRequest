import { Box, Text, VStack, Badge, Alert, AlertIcon, Button } from '@chakra-ui/react'
import { config, validateConfig } from '../utils/config'

export function ConfigTestPage() {
  const validation = validateConfig()
  
  const testConfig = () => {
    console.log('Config object:', config)
    console.log('Validation:', validation)
    alert(`Configuration loaded! GitHub Repo: ${config.github.repository}`)
  }
  
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">Environment Variables Test Page</Text>
        
        <Button onClick={testConfig} colorScheme="blue">
          Test Configuration in Console
        </Button>
        
        <Alert status={validation.isValid ? "success" : "warning"}>
          <AlertIcon />
          {validation.isValid ? "All required configuration is present" : "Some configuration is missing"}
        </Alert>
        
        <Box>
          <Text fontWeight="bold" mb={2}>GitHub Configuration:</Text>
          <VStack align="start" spacing={1}>
            <Text>Repository: <Badge colorScheme="blue">{config.github.repository || 'Not set'}</Badge></Text>
            <Text>Token: <Badge colorScheme={config.github.token ? "green" : "red"}>{config.github.token ? 'Set' : 'Not set'}</Badge></Text>
            <Text>Base Branch: <Badge colorScheme="blue">{config.github.baseBranch}</Badge></Text>
            <Text>Auto Merge: <Badge colorScheme="blue">{config.github.autoMerge ? 'Yes' : 'No'}</Badge></Text>
            <Text>Require Reviews: <Badge colorScheme="blue">{config.github.requireReviews ? 'Yes' : 'No'}</Badge></Text>
          </VStack>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Groq AI Configuration:</Text>
          <VStack align="start" spacing={1}>
            <Text>API Key: <Badge colorScheme={config.groq.apiKey ? "green" : "red"}>{config.groq.apiKey ? 'Set' : 'Not set'}</Badge></Text>
            <Text>Model: <Badge colorScheme="blue">{config.groq.model}</Badge></Text>
            <Text>Max Tokens: <Badge colorScheme="blue">{config.groq.maxTokens}</Badge></Text>
            <Text>Temperature: <Badge colorScheme="blue">{config.groq.temperature}</Badge></Text>
          </VStack>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Google Sheets Configuration:</Text>
          <VStack align="start" spacing={1}>
            <Text>Credentials File: <Badge colorScheme={config.sheets.credentialsFile ? "green" : "red"}>{config.sheets.credentialsFile ? 'Set' : 'Not set'}</Badge></Text>
            <Text>Spreadsheet ID: <Badge colorScheme={config.sheets.spreadsheetId ? "green" : "red"}>{config.sheets.spreadsheetId ? 'Set' : 'Not set'}</Badge></Text>
            <Text>Worksheet: <Badge colorScheme="blue">{config.sheets.worksheetName}</Badge></Text>
            <Text>Auto Sync: <Badge colorScheme="blue">{config.sheets.autoSync ? 'Yes' : 'No'}</Badge></Text>
            <Text>Sync Interval: <Badge colorScheme="blue">{config.sheets.syncInterval}s</Badge></Text>
          </VStack>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Application Configuration:</Text>
          <VStack align="start" spacing={1}>
            <Text>API Base URL: <Badge colorScheme="blue">{config.api.baseUrl}</Badge></Text>
            <Text>Log Level: <Badge colorScheme="blue">{config.app.logLevel}</Badge></Text>
            <Text>App Title: <Badge colorScheme="blue">{config.app.title}</Badge></Text>
          </VStack>
        </Box>
        
        {!validation.isValid && (
          <Box>
            <Text fontWeight="bold" mb={2} color="red.500">Missing Configuration:</Text>
            <VStack align="start" spacing={1}>
              {validation.missing.map((item, index) => (
                <Text key={index} color="red.500">• {item}</Text>
              ))}
            </VStack>
          </Box>
        )}
        
        <Box>
          <Text fontWeight="bold" mb={2}>Raw Environment Variables:</Text>
          <Box bg="gray.100" p={3} borderRadius="md" fontSize="sm">
            <Text>VITE_GITHUB_REPO: {import.meta.env.VITE_GITHUB_REPO || 'Not set'}</Text>
            <Text>VITE_GROQ_API_KEY: {import.meta.env.VITE_GROQ_API_KEY ? 'Set' : 'Not set'}</Text>
            <Text>VITE_GOOGLE_SHEETS_SPREADSHEET_ID: {import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID || 'Not set'}</Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  )
}
