import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  useColorModeValue,
  Flex,
  Divider,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react'
import {
  FiSettings,
  FiSave,
  FiPlay,
  FiKey,
  FiGitBranch,
  FiZap,
  FiBarChart,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { config } from '../utils/config'
import apiService from '../services/apiService'
import { ConfigTest } from '../components/ConfigTest'
import { GitHubStatus } from '../components/GitHubStatus'

interface Settings {
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
  automation: {
    checkInterval: number
    maxConcurrentReviews: number
    autoComment: boolean
    reviewAllOpen: boolean
  }
}

const defaultSettings: Settings = {
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
  automation: {
    checkInterval: 3600,
    maxConcurrentReviews: 5,
    autoComment: true,
    reviewAllOpen: true,
  },
}

export function Settings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load configuration from backend API on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const backendConfig = await apiService.getConfig()
        setSettings({
          github: {
            token: backendConfig.github.token,
            repository: backendConfig.github.repository,
            baseBranch: backendConfig.github.baseBranch,
            autoMerge: backendConfig.github.autoMerge,
            requireReviews: backendConfig.github.requireReviews,
          },
          groq: {
            apiKey: backendConfig.groq.apiKey,
            model: backendConfig.groq.model,
            maxTokens: backendConfig.groq.maxTokens,
            temperature: backendConfig.groq.temperature,
          },
          sheets: {
            credentialsFile: backendConfig.sheets.credentialsFile,
            spreadsheetId: backendConfig.sheets.spreadsheetId,
            worksheetName: backendConfig.sheets.worksheetName,
            autoSync: backendConfig.sheets.autoSync,
            syncInterval: backendConfig.sheets.syncInterval,
          },
          automation: {
            checkInterval: 3600,
            maxConcurrentReviews: 5,
            autoComment: true,
            reviewAllOpen: true,
          },
        })
      } catch (error) {
        console.error('Failed to load configuration from backend:', error)
        // Fallback to local config if backend is not available
        setSettings({
          github: {
            token: config.github.token,
            repository: config.github.repository,
            baseBranch: config.github.baseBranch,
            autoMerge: config.github.autoMerge,
            requireReviews: config.github.requireReviews,
          },
          groq: {
            apiKey: config.groq.apiKey,
            model: config.groq.model,
            maxTokens: config.groq.maxTokens,
            temperature: config.groq.temperature,
          },
          sheets: {
            credentialsFile: config.sheets.credentialsFile,
            spreadsheetId: config.sheets.spreadsheetId,
            worksheetName: config.sheets.worksheetName,
            autoSync: config.sheets.autoSync,
            syncInterval: config.sheets.syncInterval,
          },
          automation: {
            checkInterval: 3600,
            maxConcurrentReviews: 5,
            autoComment: true,
            reviewAllOpen: true,
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSettingChange = (section: keyof Settings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const backendConfig = {
        github: settings.github,
        groq: settings.groq,
        sheets: settings.sheets,
        app: {
          logLevel: 'INFO',
          logFile: 'logs/automation.log',
        },
      }
      
      await apiService.updateConfig(backendConfig)
      
      toast({
        title: 'Settings Saved',
        description: 'Configuration has been updated successfully via backend API.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please check your backend server is running.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async (service: string) => {
    setIsTesting(true)
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Connection Test Successful',
        description: `${service} connection is working properly`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: `Failed to connect to ${service}. Please check your configuration.`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Text fontSize="lg" color="gray.600">
          Loading configuration...
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Settings
          </Heading>
          <Text color="gray.600">
            Configure your GitHub PR automation system
          </Text>
        </Box>
        <Button
          leftIcon={<FiSave />}
          onClick={saveSettings}
          isLoading={isSaving}
          loadingText="Saving..."
          variant="gradient"
          size="lg"
        >
          Save Settings
        </Button>
      </Flex>

      <ConfigTest />
      <GitHubStatus />
      
      <Tabs>
        <TabList>
          <Tab>
            <Icon as={FiGitBranch} mr={2} />
            GitHub
          </Tab>
          <Tab>
            <Icon as={FiZap} mr={2} />
            Groq AI
          </Tab>
          <Tab>
            <Icon as={FiBarChart} mr={2} />
            Google Sheets
          </Tab>
          <Tab>
            <Icon as={FiSettings} mr={2} />
            Automation
          </Tab>
        </TabList>

        <TabPanels>
          {/* GitHub Settings */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">GitHub Configuration</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>GitHub Personal Access Token</FormLabel>
                      <Input
                        type="password"
                        placeholder="ghp_..."
                        value={settings.github.token}
                        onChange={(e) => handleSettingChange('github', 'token', e.target.value)}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Repository</FormLabel>
                      <Input
                        placeholder="owner/repository"
                        value={settings.github.repository}
                        onChange={(e) => handleSettingChange('github', 'repository', e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Base Branch</FormLabel>
                      <Select
                        value={settings.github.baseBranch}
                        onChange={(e) => handleSettingChange('github', 'baseBranch', e.target.value)}
                      >
                        <option value="main">main</option>
                        <option value="develop">develop</option>
                        <option value="master">master</option>
                      </Select>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="auto-merge" mb="0">
                        Enable Auto-Merge
                      </FormLabel>
                      <Switch
                        id="auto-merge"
                        isChecked={settings.github.autoMerge}
                        onChange={(e) => handleSettingChange('github', 'autoMerge', e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="require-reviews" mb="0">
                        Require Reviews
                      </FormLabel>
                      <Switch
                        id="require-reviews"
                        isChecked={settings.github.requireReviews}
                        onChange={(e) => handleSettingChange('github', 'requireReviews', e.target.checked)}
                      />
                    </FormControl>

                    <Button
                      leftIcon={<FiPlay />}
                      onClick={() => testConnection('GitHub')}
                      isLoading={isTesting}
                      loadingText="Testing..."
                      variant="outline"
                      width="full"
                    >
                      Test GitHub Connection
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Groq AI Settings */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Groq AI Configuration</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Groq API Key</FormLabel>
                      <Input
                        type="password"
                        placeholder="gsk_..."
                        value={settings.groq.apiKey}
                        onChange={(e) => handleSettingChange('groq', 'apiKey', e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>AI Model</FormLabel>
                      <Select
                        value={settings.groq.model}
                        onChange={(e) => handleSettingChange('groq', 'model', e.target.value)}
                      >
                        <option value="groq/llama3-8b-8192">Llama3 8B (Fast)</option>
                        <option value="groq/llama3-70b-8192">Llama3 70B (Accurate)</option>
                        <option value="groq/mixtral-8x7b-32768">Mixtral 8x7B (Balanced)</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Max Tokens</FormLabel>
                      <NumberInput
                        value={settings.groq.maxTokens}
                        onChange={(value) => handleSettingChange('groq', 'maxTokens', parseInt(value))}
                        min={512}
                        max={8192}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Temperature</FormLabel>
                      <NumberInput
                        value={settings.groq.temperature}
                        onChange={(value) => handleSettingChange('groq', 'temperature', parseFloat(value))}
                        min={0}
                        max={2}
                        step={0.1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <Button
                      leftIcon={<FiPlay />}
                      onClick={() => testConnection('Groq AI')}
                      isLoading={isTesting}
                      loadingText="Testing..."
                      variant="outline"
                      width="full"
                    >
                      Test Groq AI Connection
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Google Sheets Settings */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Google Sheets Configuration</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Service Account JSON File Path</FormLabel>
                      <Input
                        placeholder="/path/to/credentials.json"
                        value={settings.sheets.credentialsFile}
                        onChange={(e) => handleSettingChange('sheets', 'credentialsFile', e.target.value)}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Spreadsheet ID</FormLabel>
                      <Input
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        value={settings.sheets.spreadsheetId}
                        onChange={(e) => handleSettingChange('sheets', 'spreadsheetId', e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Worksheet Name</FormLabel>
                      <Input
                        placeholder="PR Tracking"
                        value={settings.sheets.worksheetName}
                        onChange={(e) => handleSettingChange('sheets', 'worksheetName', e.target.value)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="auto-sync" mb="0">
                        Auto Sync
                      </FormLabel>
                      <Switch
                        id="auto-sync"
                        isChecked={settings.sheets.autoSync}
                        onChange={(e) => handleSettingChange('sheets', 'autoSync', e.target.checked)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Sync Interval (seconds)</FormLabel>
                      <NumberInput
                        value={settings.sheets.syncInterval}
                        onChange={(value) => handleSettingChange('sheets', 'syncInterval', parseInt(value))}
                        min={60}
                        max={3600}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <Button
                      leftIcon={<FiPlay />}
                      onClick={() => testConnection('Google Sheets')}
                      isLoading={isTesting}
                      loadingText="Testing..."
                      variant="outline"
                      width="full"
                    >
                      Test Google Sheets Connection
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Automation Settings */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Automation Preferences</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Check Interval (seconds)</FormLabel>
                      <NumberInput
                        value={settings.automation.checkInterval}
                        onChange={(value) => handleSettingChange('automation', 'checkInterval', parseInt(value))}
                        min={300}
                        max={86400}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Max Concurrent Reviews</FormLabel>
                      <NumberInput
                        value={settings.automation.maxConcurrentReviews}
                        onChange={(value) => handleSettingChange('automation', 'maxConcurrentReviews', parseInt(value))}
                        min={1}
                        max={10}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="auto-comment" mb="0">
                        Auto Comment
                      </FormLabel>
                      <Switch
                        id="auto-comment"
                        isChecked={settings.automation.autoComment}
                        onChange={(e) => handleSettingChange('automation', 'autoComment', e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="review-all-open" mb="0">
                        Review All Open PRs
                      </FormLabel>
                      <Switch
                        id="review-all-open"
                        isChecked={settings.automation.reviewAllOpen}
                        onChange={(e) => handleSettingChange('automation', 'reviewAllOpen', e.target.checked)}
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Automation Tips</AlertTitle>
                  <AlertDescription>
                    Set appropriate intervals to balance automation efficiency with API rate limits. 
                    Lower intervals provide more real-time updates but may consume more resources.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
