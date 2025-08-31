import { Box, Text, VStack, Badge, Alert, AlertIcon } from '@chakra-ui/react'
import { config, validateConfig } from '../utils/config'

export function ConfigTest() {
  const validation = validateConfig()
  
  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">Environment Variables Test</Text>
        
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
          </VStack>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Groq AI Configuration:</Text>
          <VStack align="start" spacing={1}>
            <Text>API Key: <Badge colorScheme={config.groq.apiKey ? "green" : "red"}>{config.groq.apiKey ? 'Set' : 'Not set'}</Badge></Text>
            <Text>Model: <Badge colorScheme="blue">{config.groq.model}</Badge></Text>
            <Text>Max Tokens: <Badge colorScheme="blue">{config.groq.maxTokens}</Badge></Text>
          </VStack>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Google Sheets Configuration:</Text>
          <VStack align="start" spacing={1}>
            <Text>Credentials File: <Badge colorScheme={config.sheets.credentialsFile ? "green" : "red"}>{config.sheets.credentialsFile ? 'Set' : 'Not set'}</Badge></Text>
            <Text>Spreadsheet ID: <Badge colorScheme={config.sheets.spreadsheetId ? "green" : "red"}>{config.sheets.spreadsheetId ? 'Set' : 'Not set'}</Badge></Text>
            <Text>Worksheet: <Badge colorScheme="blue">{config.sheets.worksheetName}</Badge></Text>
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
      </VStack>
    </Box>
  )
}
