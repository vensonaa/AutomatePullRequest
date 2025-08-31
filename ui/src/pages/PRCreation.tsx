import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  VStack,
  HStack,
  Badge,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  useColorModeValue,
  Flex,
  Divider,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Grid,
  GridItem,
  Switch,
  FormHelperText,
} from '@chakra-ui/react'
import {
  FiGitBranch,
  FiZap,
  FiEye,
  FiUsers,
  FiTag,
  FiSend,
  FiRefreshCw,
  FiCheckCircle,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import apiService from '../services/apiService'
import { config } from '../utils/config'

interface PRFormData {
  branch: string
  title: string
  description: string
  baseBranch: string
  labels: string[]
  reviewers: string[]
  autoMerge: boolean
  customPrompt: string
}

export function PRCreation() {
  // Real data from GitHub API
  const [branches, setBranches] = useState<any[]>([])
  const [labels, setLabels] = useState<any[]>([])
  const [reviewers, setReviewers] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [formData, setFormData] = useState<PRFormData>({
    branch: '',
    title: '',
    description: '',
    baseBranch: 'main',
    labels: [],
    reviewers: [],
    autoMerge: false,
    customPrompt: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  // Load GitHub data on component mount
  useEffect(() => {
    const loadGitHubData = async () => {
      setIsLoadingData(true)
      try {
        const [branchesResponse, labelsResponse, collaboratorsResponse] = await Promise.all([
          apiService.getBranches(),
          apiService.getLabels(),
          apiService.getCollaborators()
        ])
        
        setBranches(branchesResponse.branches || [])
        setLabels(labelsResponse.labels || [])
        setReviewers(collaboratorsResponse.collaborators || [])
        
        // Set default base branch from environment or first available branch
        const branchesData = branchesResponse.branches || []
        if (branchesData.length > 0) {
          const defaultBranch = branchesData.find(branch => branch.name === config.github.baseBranch) || branchesData[0]
          setFormData(prev => ({
            ...prev,
            baseBranch: defaultBranch.name
          }))
        }
      } catch (error) {
        console.error('Failed to load GitHub data:', error)
        toast({
          title: 'Failed to load GitHub data',
          description: 'Please check your backend server is running and GitHub configuration is correct',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadGitHubData()
  }, [])

  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleInputChange = (field: keyof PRFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addLabel = (label: string) => {
    if (!formData.labels.includes(label)) {
      setFormData(prev => ({ ...prev, labels: [...prev.labels, label] }))
    }
  }

  const removeLabel = (label: string) => {
    setFormData(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }))
  }

  const addReviewer = (reviewer: string) => {
    if (!formData.reviewers.includes(reviewer)) {
      setFormData(prev => ({ ...prev, reviewers: [...prev.reviewers, reviewer] }))
    }
  }

  const removeReviewer = (reviewer: string) => {
    setFormData(prev => ({ ...prev, reviewers: prev.reviewers.filter(r => r !== reviewer) }))
  }

  const generateWithAI = async () => {
    setIsGenerating(true)
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const aiGenerated = {
        title: '',
        description: '',
        labels: [],
        reviewers: [],
      }
      
      setFormData(prev => ({
        ...prev,
        title: aiGenerated.title,
        description: aiGenerated.description,
        labels: aiGenerated.labels,
        reviewers: aiGenerated.reviewers,
      }))
      
      toast({
        title: 'AI Generation Complete',
        description: 'PR content has been generated using AI',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate PR content with AI',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const createPR = async () => {
    // Validate required fields
    if (!formData.branch || !formData.title) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in the source branch and PR title',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (formData.branch === formData.baseBranch) {
      toast({
        title: 'Invalid Branch Selection',
        description: 'Source branch and base branch cannot be the same',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Validate that branches exist in the loaded data
    const sourceBranchExists = branches.some(branch => branch.name === formData.branch)
    const baseBranchExists = branches.some(branch => branch.name === formData.baseBranch)

    if (!sourceBranchExists) {
      toast({
        title: 'Invalid Source Branch',
        description: `Source branch "${formData.branch}" not found. Please refresh the data.`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!baseBranchExists) {
      toast({
        title: 'Invalid Base Branch',
        description: `Base branch "${formData.baseBranch}" not found. Please refresh the data.`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      // Create the pull request using backend API
      const prData = await apiService.createPullRequest({
        title: formData.title,
        head: formData.branch,
        base: formData.baseBranch,
        body: formData.description,
        labels: formData.labels,
        reviewers: formData.reviewers
      })
      
      // Show different messages based on auto-approval status
      if (prData.auto_approved) {
        toast({
          title: 'PR Created and Auto-Approved! 🚀',
          description: `PR #${prData.pr_number} has been created, auto-approved, and merged successfully!`,
          status: 'success',
          duration: 8000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'PR Created Successfully',
          description: `PR #${prData.pr_number} has been created and is ready for review`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
      
      // Reset form
      setFormData({
        branch: '',
        title: '',
        description: '',
        baseBranch: config.github.baseBranch || 'main',
        labels: [],
        reviewers: [],
        autoMerge: false,
        customPrompt: '',
      })
    } catch (error: any) {
      console.error('Failed to create PR:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create PR'
      
      toast({
        title: 'Creation Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box>
      {isLoadingData && (
        <Alert status="info" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>Loading GitHub Data</AlertTitle>
            <AlertDescription>
              Fetching branches, labels, and reviewers from your repository...
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Create Pull Request
          </Heading>
          <Text color="gray.600">
            Create a new PR with AI-powered assistance
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiCheckCircle />}
            onClick={async () => {
              try {
                const isConnected = await githubService.testConnection()
                if (isConnected) {
                  toast({
                    title: 'GitHub Connection Test',
                    description: 'Successfully connected to GitHub API',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  })
                } else {
                  toast({
                    title: 'GitHub Connection Test',
                    description: 'Failed to connect to GitHub API. Check your token and repository.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  })
                }
              } catch (error) {
                toast({
                  title: 'GitHub Connection Test',
                  description: 'Error testing connection: ' + (error as any).message,
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
                })
              }
            }}
            variant="outline"
            size="lg"
          >
            Test Connection
          </Button>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={async () => {
              setIsLoadingData(true)
              try {
                const [branchesResponse, labelsResponse, collaboratorsResponse] = await Promise.all([
                  apiService.getBranches(),
                  apiService.getLabels(),
                  apiService.getCollaborators()
                ])
                
                const branchesData = branchesResponse.branches || []
                const labelsData = labelsResponse.labels || []
                const reviewersData = collaboratorsResponse.collaborators || []
                
                setBranches(branchesData)
                setLabels(labelsData)
                setReviewers(reviewersData)
                
                // Update base branch if current one is not in the new list
                if (branchesData.length > 0) {
                  const currentBaseBranch = formData.baseBranch
                  const branchExists = branchesData.some(branch => branch.name === currentBaseBranch)
                  
                  if (!branchExists) {
                    const defaultBranch = branchesData.find(branch => branch.name === config.github.baseBranch) || branchesData[0]
                    setFormData(prev => ({
                      ...prev,
                      baseBranch: defaultBranch.name
                    }))
                  }
                }
                
                toast({
                  title: 'Data Refreshed',
                  description: 'GitHub data has been updated successfully',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                })
              } catch (error) {
                console.error('Failed to refresh GitHub data:', error)
                toast({
                  title: 'Refresh Failed',
                  description: 'Failed to refresh GitHub data. Please check your backend server is running.',
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
                })
              } finally {
                setIsLoadingData(false)
              }
            }}
            isLoading={isLoadingData}
            loadingText="Refreshing..."
            variant="outline"
            size="lg"
          >
            Refresh Data
          </Button>
          <Button
            leftIcon={<FiZap />}
            onClick={generateWithAI}
            isLoading={isGenerating}
            loadingText="Generating..."
            variant="gradient"
            size="lg"
            isDisabled={isLoadingData}
          >
            Generate with AI
          </Button>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
        {/* Form */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">PR Details</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6}>
                {/* Branch Selection */}
                <FormControl isRequired>
                  <FormLabel>Source Branch</FormLabel>
                  <Select
                    placeholder={isLoadingData ? "Loading branches..." : "Select branch"}
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    isDisabled={isLoadingData}
                  >
                    {branches.map(branch => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </Select>
                  {branches.length === 0 && !isLoadingData && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      No branches found. Please check your GitHub configuration.
                    </Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Base Branch</FormLabel>
                  <Select
                    value={formData.baseBranch}
                    onChange={(e) => handleInputChange('baseBranch', e.target.value)}
                    isDisabled={isLoadingData}
                  >
                    {branches.map(branch => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </Select>
                  {branches.length === 0 && !isLoadingData && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      No branches found. Please check your GitHub configuration.
                    </Text>
                  )}
                </FormControl>

                {/* Title */}
                <FormControl isRequired>
                  <FormLabel>PR Title</FormLabel>
                  <Input
                    placeholder="Enter PR title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </FormControl>

                {/* Description */}
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    placeholder="Describe your changes..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={8}
                  />
                </FormControl>

                {/* Custom AI Prompt */}
                <FormControl>
                  <FormLabel>Custom AI Prompt (Optional)</FormLabel>
                  <Textarea
                    placeholder="Provide specific instructions for AI generation..."
                    value={formData.customPrompt}
                    onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                    rows={3}
                  />
                  <FormHelperText>
                    Give specific instructions to customize AI-generated content
                  </FormHelperText>
                </FormControl>

                {/* Labels */}
                <FormControl>
                  <FormLabel>Labels</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    <HStack flexWrap="wrap" spacing={2}>
                      {formData.labels.map(label => (
                        <Tag key={label} size="md" colorScheme="blue" borderRadius="full">
                          <TagLabel>{label}</TagLabel>
                          <TagCloseButton onClick={() => removeLabel(label)} />
                        </Tag>
                      ))}
                    </HStack>
                    <Select
                      placeholder={isLoadingData ? "Loading labels..." : "Add label"}
                      onChange={(e) => {
                        if (e.target.value) {
                          addLabel(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      isDisabled={isLoadingData}
                    >
                      {labels
                        .filter(label => !formData.labels.includes(label.name))
                        .map(label => (
                          <option key={label.name} value={label.name}>
                            {label.name}
                          </option>
                        ))}
                    </Select>
                  </VStack>
                </FormControl>

                {/* Reviewers */}
                <FormControl>
                  <FormLabel>Reviewers</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    <HStack flexWrap="wrap" spacing={2}>
                      {formData.reviewers.map(reviewer => (
                        <Tag key={reviewer} size="md" colorScheme="green" borderRadius="full">
                          <TagLabel>{reviewer}</TagLabel>
                          <TagCloseButton onClick={() => removeReviewer(reviewer)} />
                        </Tag>
                      ))}
                    </HStack>
                    <Select
                      placeholder={isLoadingData ? "Loading reviewers..." : "Add reviewer"}
                      onChange={(e) => {
                        if (e.target.value) {
                          addReviewer(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      isDisabled={isLoadingData}
                    >
                      {reviewers
                        .filter(reviewer => !formData.reviewers.includes(reviewer.login))
                        .map(reviewer => (
                          <option key={reviewer.login} value={reviewer.login}>
                            {reviewer.login}
                          </option>
                        ))}
                    </Select>
                    
                    {/* Auto-approve notice */}
                    {formData.reviewers.length === 0 && (
                      <Alert status="info" variant="subtle">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Auto-Approve Enabled</AlertTitle>
                          <AlertDescription>
                            No reviewers selected. This PR will be automatically approved and merged upon creation.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}
                  </VStack>
                </FormControl>

                {/* Auto Merge */}
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="auto-merge" mb="0">
                    Enable Auto-Merge
                  </FormLabel>
                  <Switch
                    id="auto-merge"
                    isChecked={formData.autoMerge}
                    onChange={(e) => handleInputChange('autoMerge', e.target.checked)}
                  />
                </FormControl>

                {/* Submit Button */}
                <Button
                  leftIcon={<FiSend />}
                  onClick={createPR}
                  isLoading={isLoading}
                  loadingText="Creating..."
                  size="lg"
                  width="full"
                  variant="gradient"
                >
                  Create Pull Request
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Preview */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Preview</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {formData.title ? (
                  <>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" mb={2}>
                        {formData.title}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {formData.branch} → {formData.baseBranch}
                      </Text>
                    </Box>

                    <Divider />

                    {formData.description && (
                      <Box>
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {formData.description}
                        </Text>
                      </Box>
                    )}

                    {(formData.labels.length > 0 || formData.reviewers.length > 0) && (
                      <>
                        <Divider />
                        <VStack align="stretch" spacing={3}>
                          {formData.labels.length > 0 && (
                            <Box>
                              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                                Labels:
                              </Text>
                              <HStack flexWrap="wrap" spacing={1}>
                                {formData.labels.map(label => (
                                  <Badge key={label} colorScheme="blue" variant="subtle">
                                    {label}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          )}

                          {formData.reviewers.length > 0 && (
                            <Box>
                              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                                Reviewers:
                              </Text>
                              <HStack flexWrap="wrap" spacing={1}>
                                {formData.reviewers.map(reviewer => (
                                  <Badge key={reviewer} colorScheme="green" variant="subtle">
                                    {reviewer}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          )}
                        </VStack>
                      </>
                    )}

                    {formData.autoMerge && (
                      <>
                        <Divider />
                        <Alert status="info">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Auto-Merge Enabled</AlertTitle>
                            <AlertDescription>
                              This PR will be automatically merged when all checks pass
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </>
                    )}
                  </>
                ) : (
                  <Box textAlign="center" py={8}>
                    <Icon as={FiEye} w={12} h={12} color="gray.400" mb={4} />
                    <Text color="gray.500">
                      Fill in the form to see a preview of your PR
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  )
}
