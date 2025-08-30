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
import { useState } from 'react'

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

const mockBranches = [
  'feature/user-auth',
  'feature/payment-integration',
  'bugfix/navigation-issue',
  'hotfix/security-patch',
  'feature/dashboard-redesign',
]

const mockLabels = [
  'enhancement',
  'bug-fix',
  'documentation',
  'security',
  'performance',
  'ui/ux',
  'backend',
  'frontend',
]

const mockReviewers = [
  'john.doe',
  'jane.smith',
  'mike.wilson',
  'sarah.jones',
  'alex.brown',
]

export function PRCreation() {
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
        title: `Add ${formData.branch.split('/')[1] || 'new feature'}`,
        description: `This PR implements ${formData.branch.split('/')[1] || 'new functionality'}.\n\n## Changes\n- Added new feature\n- Updated documentation\n- Fixed related issues\n\n## Testing\n- [x] Unit tests passed\n- [x] Integration tests passed\n- [x] Manual testing completed`,
        labels: ['enhancement', 'feature'],
        reviewers: ['john.doe', 'jane.smith'],
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
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: 'PR Created Successfully',
        description: `PR #123 has been created and is ready for review`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      // Reset form
      setFormData({
        branch: '',
        title: '',
        description: '',
        baseBranch: 'main',
        labels: [],
        reviewers: [],
        autoMerge: false,
        customPrompt: '',
      })
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create PR. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Create Pull Request
          </Heading>
          <Text color="gray.600">
            Create a new PR with AI-powered assistance
          </Text>
        </Box>
        <Button
          leftIcon={<FiZap />}
          onClick={generateWithAI}
          isLoading={isGenerating}
          loadingText="Generating..."
          variant="gradient"
          size="lg"
        >
          Generate with AI
        </Button>
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
                    placeholder="Select branch"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                  >
                    {mockBranches.map(branch => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Base Branch</FormLabel>
                  <Select
                    value={formData.baseBranch}
                    onChange={(e) => handleInputChange('baseBranch', e.target.value)}
                  >
                    <option value="main">main</option>
                    <option value="develop">develop</option>
                    <option value="staging">staging</option>
                  </Select>
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
                      placeholder="Add label"
                      onChange={(e) => {
                        if (e.target.value) {
                          addLabel(e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      {mockLabels.filter(label => !formData.labels.includes(label)).map(label => (
                        <option key={label} value={label}>
                          {label}
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
                      placeholder="Add reviewer"
                      onChange={(e) => {
                        if (e.target.value) {
                          addReviewer(e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      {mockReviewers.filter(reviewer => !formData.reviewers.includes(reviewer)).map(reviewer => (
                        <option key={reviewer} value={reviewer}>
                          {reviewer}
                        </option>
                      ))}
                    </Select>
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
