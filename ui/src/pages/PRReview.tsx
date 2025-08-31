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
  Badge,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Code,
  Textarea,
  Select,
} from '@chakra-ui/react'
import {
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
  FiZap,
  FiGitBranch,
  FiClock,
  FiUsers,
  FiAlertTriangle,
  FiThumbsUp,
  FiThumbsDown,
  FiSend,
  FiRefreshCw,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import apiService from '../services/apiService'

interface PRReview {
  id: number
  title: string
  author: string
  status: 'open' | 'approved' | 'changes_requested' | 'pending'
  branch: string
  baseBranch: string
  description: string
  createdAt: string
  updatedAt: string
  reviewers: string[]
  labels: string[]
  aiScore: number
  aiSuggestions: string[]
  aiComments: Array<{
    id: string
    body: string
    path: string
    line: number
    severity: 'low' | 'medium' | 'high'
  }>
  filesChanged: Array<{
    filename: string
    additions: number
    deletions: number
    changes: number
  }>
}

// TODO: Replace with real API calls
const mockPRs: PRReview[] = []

export function PRReview() {
  const [prs, setPRs] = useState<PRReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPR, setSelectedPR] = useState<PRReview | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewAction, setReviewAction] = useState<'approve' | 'request_changes' | 'comment'>('comment')
  const [selectedPRFiles, setSelectedPRFiles] = useState<Array<{
    filename: string
    additions: number
    deletions: number
    changes: number
  }>>([])
  const [aiReviewResult, setAiReviewResult] = useState<{
    summary: string
    score: number
    comments: Array<{
      body: string
      path?: string
      line?: number
    }>
    suggestions: string[]
    issues: string[]
  } | null>(null)

  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Fetch PRs from API
  useEffect(() => {
    const fetchPRs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiService.getPullRequests()
        const apiPRs = response.prs || []
        
        // Convert API data to component format
        const convertedPRs: PRReview[] = apiPRs.map((pr: any) => ({
          id: pr.number,
          title: pr.title,
          author: pr.author,
          status: pr.state === 'open' ? 'open' : 'approved',
          branch: pr.head_branch,
          baseBranch: pr.base_branch,
          description: pr.body || '',
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          reviewers: pr.reviewers || [],
          labels: pr.labels || [],
          aiScore: 85, // Placeholder
          aiSuggestions: [], // Placeholder
          aiComments: [], // Placeholder
          filesChanged: [] // Placeholder
        }))
        
        setPRs(convertedPRs)
      } catch (err: any) {
        console.error('Failed to fetch PRs:', err)
        setError(err.message || 'Failed to load pull requests')
        toast({
          title: 'Error',
          description: 'Failed to load pull requests',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPRs()
  }, [toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'blue'
      case 'approved':
        return 'green'
      case 'changes_requested':
        return 'red'
      case 'pending':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const fetchPRFiles = async (prNumber: number) => {
    try {
      const response = await apiService.getPRFiles(prNumber)
      const files = response.files || []
      setSelectedPRFiles(files.map((file: any) => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes
      })))
    } catch (error) {
      console.error('Failed to fetch PR files:', error)
      setSelectedPRFiles([])
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const startAIReview = async (pr: PRReview) => {
    setIsReviewing(true)
    setAiReviewResult(null)
    
    try {
      // Perform real AI review
      const response = await apiService.performAIReview(pr.id)
      
      if (response.success && response.review) {
        setAiReviewResult(response.review)
        
        toast({
          title: 'AI Review Complete',
          description: `AI has reviewed PR #${pr.id} with a score of ${response.review.score}/10`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      } else {
        throw new Error('AI review failed')
      }
    } catch (error: any) {
      console.error('AI review error:', error)
      
      let errorMessage = 'Failed to complete AI review'
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: 'AI Review Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsReviewing(false)
    }
  }

  const submitReview = async () => {
    if (!selectedPR) return

    try {
      // Map frontend review action to GitHub API event
      let event = 'COMMENT'
      
      if (reviewAction === 'approve') {
        event = 'APPROVE'
      } else if (reviewAction === 'request_changes') {
        event = 'REQUEST_CHANGES'
      }
      
      // Ensure approval and request_changes have a body
      let reviewBody = reviewComment
      if ((event === 'APPROVE' || event === 'REQUEST_CHANGES') && !reviewComment.trim()) {
        reviewBody = event === 'APPROVE' ? 'Approved' : 'Changes requested'
      }
      
      // Submit review via API
      await apiService.submitPRReview(selectedPR.id, {
        state: event, // Use event as state for API service
        body: reviewBody,
        event: event
      })
      
      toast({
        title: 'Review Submitted',
        description: `Your review for PR #${selectedPR.id} has been submitted successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      setReviewComment('')
      setReviewAction('comment')
    } catch (error: any) {
      console.error('Review submission error:', error)
      
      let errorMessage = 'Failed to submit review'
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Check if it's a permission issue
      if (errorMessage.includes('403') || errorMessage.includes('permission')) {
        errorMessage = 'Permission denied. Your GitHub token may not have the required permissions to submit reviews. Please check your token has the "repo" scope.'
      } else if (errorMessage.includes('own pull request') || errorMessage.includes('Can not approve')) {
        errorMessage = 'You cannot approve your own pull request. This is a GitHub security feature. Please ask another team member to review and approve the PR.'
      }
      
      toast({
        title: 'Review Failed',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      })
    }
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            PR Review
          </Heading>
          <Text color="gray.600">
            Review pull requests with AI assistance
          </Text>
        </Box>
        <Button
          leftIcon={<FiRefreshCw />}
          variant="outline"
        >
          Refresh
        </Button>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
        {/* PR List */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Pull Requests</Heading>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <Flex justify="center" align="center" py={8}>
                  <Spinner size="lg" />
                </Flex>
              ) : error ? (
                <Alert status="error">
                  <AlertIcon />
                  <AlertTitle>Error loading PRs!</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : prs.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>No pull requests found</AlertTitle>
                  <AlertDescription>There are no pull requests to review at this time.</AlertDescription>
                </Alert>
              ) : (
                <VStack spacing={4} align="stretch">
                  {prs.map((pr) => (
                  <Box
                    key={pr.id}
                    p={4}
                    border="1px"
                    borderColor={selectedPR?.id === pr.id ? 'brand.400' : borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                    onClick={() => {
                      setSelectedPR(pr)
                      fetchPRFiles(pr.id)
                    }}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="semibold" fontSize="sm">
                        #{pr.id} {pr.title}
                      </Text>
                      <Badge colorScheme={getStatusColor(pr.status)}>
                        {pr.status}
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="xs" color="gray.600" mb={2}>
                      by {pr.author} • {pr.branch} → {pr.baseBranch}
                    </Text>
                    
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="xs" color="gray.600">
                        Click to view files
                      </Text>
                      <HStack spacing={1}>
                        <Text fontSize="xs" color="gray.500">View details</Text>
                      </HStack>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        {pr.labels.map(label => (
                          <Badge key={label} size="sm" variant="subtle">
                            {label}
                          </Badge>
                        ))}
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={FiUsers} w={3} h={3} color="gray.500" />
                        <Text fontSize="xs" color="gray.600">
                          {pr.reviewers.length} reviewers
                        </Text>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* PR Details */}
        <GridItem>
          {selectedPR ? (
            <VStack spacing={6} align="stretch">
              {/* PR Header */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Box>
                      <Heading size="md">#{selectedPR.id} {selectedPR.title}</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        by {selectedPR.author} • {selectedPR.branch} → {selectedPR.baseBranch}
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<FiZap />}
                      onClick={() => startAIReview(selectedPR)}
                      isLoading={isReviewing}
                      loadingText="Reviewing..."
                      variant="gradient"
                    >
                      AI Review
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Text mb={4}>{selectedPR.description}</Text>
                  
                  <HStack spacing={4} mb={4}>
                    <Badge colorScheme={getStatusColor(selectedPR.status)}>
                      {selectedPR.status}
                    </Badge>
                    {selectedPR.labels.map(label => (
                      <Badge key={label} variant="subtle">
                        {label}
                      </Badge>
                    ))}
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Created {new Date(selectedPR.createdAt).toLocaleDateString()}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      AI Score: {selectedPR.aiScore}/10
                    </Text>
                  </HStack>
                </CardBody>
              </Card>

              {/* AI Review Results */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">AI Review Results</Heading>
                </CardHeader>
                <CardBody>
                  <Tabs>
                    <TabList>
                      <Tab>AI Review</Tab>
                      <Tab>Suggestions</Tab>
                      <Tab>Comments</Tab>
                      <Tab>Files</Tab>
                    </TabList>
                    
                    <TabPanels>
                      <TabPanel>
                        <VStack align="stretch" spacing={4}>
                          {aiReviewResult ? (
                            <>
                              <Box p={4} bg="blue.50" borderRadius="md">
                                <Text fontWeight="semibold" mb={2}>AI Review Summary</Text>
                                <Text fontSize="sm" mb={3}>{aiReviewResult.summary}</Text>
                                <HStack>
                                  <Badge colorScheme="blue">Score: {aiReviewResult.score}/10</Badge>
                                  <Badge colorScheme="green">{aiReviewResult.suggestions.length} Suggestions</Badge>
                                  <Badge colorScheme="red">{aiReviewResult.issues.length} Issues</Badge>
                                </HStack>
                              </Box>
                              
                              {aiReviewResult.suggestions.length > 0 && (
                                <Box>
                                  <Text fontWeight="semibold" mb={2}>Suggestions</Text>
                                  <VStack align="stretch" spacing={2}>
                                    {aiReviewResult.suggestions.map((suggestion, index) => (
                                      <Alert key={index} status="info" variant="subtle">
                                        <AlertIcon />
                                        <Text fontSize="sm">{suggestion}</Text>
                                      </Alert>
                                    ))}
                                  </VStack>
                                </Box>
                              )}
                              
                              {aiReviewResult.issues.length > 0 && (
                                <Box>
                                  <Text fontWeight="semibold" mb={2}>Issues</Text>
                                  <VStack align="stretch" spacing={2}>
                                    {aiReviewResult.issues.map((issue, index) => (
                                      <Alert key={index} status="warning" variant="subtle">
                                        <AlertIcon />
                                        <Text fontSize="sm">{issue}</Text>
                                      </Alert>
                                    ))}
                                  </VStack>
                                </Box>
                              )}
                              
                              {aiReviewResult.comments.length > 0 && (
                                <Box>
                                  <Text fontWeight="semibold" mb={2}>Code Comments</Text>
                                  <VStack align="stretch" spacing={2}>
                                    {aiReviewResult.comments.map((comment, index) => (
                                      <Box
                                        key={index}
                                        p={3}
                                        border="1px"
                                        borderColor={borderColor}
                                        borderRadius="md"
                                      >
                                        <HStack justify="space-between" mb={2}>
                                          <Text fontSize="sm" fontWeight="semibold">
                                            {comment.path || 'General'}:{comment.line || 'N/A'}
                                          </Text>
                                        </HStack>
                                        <Text fontSize="sm">{comment.body}</Text>
                                      </Box>
                                    ))}
                                  </VStack>
                                </Box>
                              )}
                            </>
                          ) : (
                            <Box textAlign="center" py={8}>
                              <Text color="gray.500" mb={4}>
                                No AI review performed yet. Click "Start AI Review" to analyze this PR.
                              </Text>
                              <Button
                                colorScheme="blue"
                                onClick={() => startAIReview(selectedPR)}
                                isLoading={isReviewing}
                                loadingText="Analyzing..."
                              >
                                Start AI Review
                              </Button>
                            </Box>
                          )}
                        </VStack>
                      </TabPanel>
                      
                      <TabPanel>
                        <VStack align="stretch" spacing={3}>
                          {selectedPR.aiSuggestions.map((suggestion, index) => (
                            <Alert key={index} status="info">
                              <AlertIcon />
                              <Text fontSize="sm">{suggestion}</Text>
                            </Alert>
                          ))}
                        </VStack>
                      </TabPanel>
                      
                      <TabPanel>
                        <VStack align="stretch" spacing={3}>
                          {selectedPR.aiComments.map((comment) => (
                            <Box
                              key={comment.id}
                              p={3}
                              border="1px"
                              borderColor={borderColor}
                              borderRadius="md"
                            >
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" fontWeight="semibold">
                                  {comment.path}:{comment.line}
                                </Text>
                                <Badge colorScheme={getSeverityColor(comment.severity)} size="sm">
                                  {comment.severity}
                                </Badge>
                              </HStack>
                              <Text fontSize="sm">{comment.body}</Text>
                            </Box>
                          ))}
                        </VStack>
                      </TabPanel>
                      
                      <TabPanel>
                        <VStack align="stretch" spacing={2}>
                          {selectedPRFiles.map((file, index) => (
                            <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                              <Text fontSize="sm" fontFamily="mono">
                                {file.filename}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="xs" color="green.600">+{file.additions}</Text>
                                <Text fontSize="xs" color="red.600">-{file.deletions}</Text>
                              </HStack>
                            </HStack>
                          ))}
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </CardBody>
              </Card>

              {/* Review Form */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Submit Review</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <Alert status="info" variant="subtle">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Review Limitation</AlertTitle>
                        <AlertDescription>
                          You cannot approve your own pull request. This is a GitHub security feature. 
                          You can still add comments and request changes.
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <Select
                      value={reviewAction}
                      onChange={(e) => setReviewAction(e.target.value as any)}
                    >
                      <option value="comment">Comment</option>
                      <option value="approve">Approve</option>
                      <option value="request_changes">Request Changes</option>
                    </Select>
                    
                    <Textarea
                      placeholder="Add your review comment..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                    />
                    
                    <HStack spacing={3}>
                      <Button
                        leftIcon={<FiThumbsUp />}
                        colorScheme="green"
                        variant={reviewAction === 'approve' ? 'solid' : 'outline'}
                        onClick={() => setReviewAction('approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        leftIcon={<FiThumbsDown />}
                        colorScheme="red"
                        variant={reviewAction === 'request_changes' ? 'solid' : 'outline'}
                        onClick={() => setReviewAction('request_changes')}
                      >
                        Request Changes
                      </Button>
                      <Button
                        leftIcon={<FiSend />}
                        onClick={submitReview}
                        variant="gradient"
                        ml="auto"
                      >
                        Submit Review
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          ) : (
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody textAlign="center" py={12}>
                <Icon as={FiEye} w={12} h={12} color="gray.400" mb={4} />
                <Text color="gray.500">
                  Select a pull request to review
                </Text>
              </CardBody>
            </Card>
          )}
        </GridItem>
      </Grid>
    </Box>
  )
}
