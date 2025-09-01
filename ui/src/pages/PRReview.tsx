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
  IconButton,
  Checkbox,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  FiTrash2,
  FiDatabase,
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
  const [prReviews, setPrReviews] = useState<Array<{
    id: number
    user: string
    body: string
    state: string
    submitted_at: string
  }>>([])
  const [selectedReviews, setSelectedReviews] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteType, setDeleteType] = useState<'selected' | 'all' | 'single' | null>(null)
  const [singleReviewId, setSingleReviewId] = useState<number | null>(null)
  const [persistedAIReviews, setPersistedAIReviews] = useState<Set<number>>(new Set())
  const [isPRApproved, setIsPRApproved] = useState(false)

  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Check for persisted AI reviews
  const checkPersistedAIReviews = async (prNumbers: number[]) => {
    try {
      const persistedReviews = new Set<number>()
      for (const prNumber of prNumbers) {
        try {
          await apiService.getAIReview(prNumber)
          persistedReviews.add(prNumber)
        } catch (error) {
          // AI review doesn't exist for this PR
        }
      }
      setPersistedAIReviews(persistedReviews)
    } catch (error) {
      console.error('Error checking persisted AI reviews:', error)
    }
  }

  const checkPRApprovalStatus = (pr: PRReview) => {
    // Check if PR status is approved
    if (pr.status === 'approved') {
      return true
    }
    
    // Check if any existing reviews are approvals
    const hasApprovalReview = prReviews.some(review => 
      review.state === 'APPROVED' || review.state === 'approved'
    )
    
    return hasApprovalReview
  }

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
        
        // Check for persisted AI reviews
        await checkPersistedAIReviews(convertedPRs.map(pr => pr.id))
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

  const fetchPRReviews = async (prNumber: number) => {
    try {
      const response = await apiService.getPRReviews(prNumber)
      const reviews = response.reviews || []
      setPrReviews(reviews)
      
      // Update approval status after fetching reviews
      if (selectedPR) {
        const isApproved = checkPRApprovalStatus(selectedPR)
        setIsPRApproved(isApproved)
      }
    } catch (error) {
      console.error('Failed to fetch PR reviews:', error)
      setPrReviews([])
    }
  }

  const confirmDeleteReview = (reviewId: number) => {
    setDeleteType('single')
    setSingleReviewId(reviewId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteSelected = () => {
    setDeleteType('selected')
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAll = () => {
    setDeleteType('all')
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    if (!selectedPR) return

    setIsDeleting(true)
    try {
      if (deleteType === 'single' && singleReviewId) {
        await apiService.deletePRReview(selectedPR.id, singleReviewId)
        toast({
          title: 'Review Deleted',
          description: 'The review has been deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else if (deleteType === 'selected') {
        const deletePromises = Array.from(selectedReviews).map(reviewId => 
          apiService.deletePRReview(selectedPR.id, reviewId)
        )
        await Promise.all(deletePromises)
        toast({
          title: 'Reviews Deleted',
          description: `${selectedReviews.size} review(s) have been deleted successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setSelectedReviews(new Set())
      } else if (deleteType === 'all') {
        const deletePromises = prReviews.map(review => 
          apiService.deletePRReview(selectedPR.id, review.id)
        )
        await Promise.all(deletePromises)
        toast({
          title: 'All Reviews Deleted',
          description: `${prReviews.length} review(s) have been deleted successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setSelectedReviews(new Set())
      }
      
      // Refresh the reviews list
      await fetchPRReviews(selectedPR.id)
    } catch (error: any) {
      console.error('Failed to delete review(s):', error)
      
      let errorMessage = 'Failed to delete review(s)'
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: 'Delete Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteType(null)
      setSingleReviewId(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteType(null)
    setSingleReviewId(null)
  }



  const toggleReviewSelection = (reviewId: number) => {
    const newSelection = new Set(selectedReviews)
    if (newSelection.has(reviewId)) {
      newSelection.delete(reviewId)
    } else {
      newSelection.add(reviewId)
    }
    setSelectedReviews(newSelection)
  }

  const selectAllReviews = () => {
    setSelectedReviews(new Set(prReviews.map(review => review.id)))
  }

  const clearSelection = () => {
    setSelectedReviews(new Set())
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
      // If PR is already approved, only allow comments
      if (isPRApproved && reviewAction !== 'comment') {
        toast({
          title: 'Review Action Not Allowed',
          description: 'This PR is already approved. You can only add comments.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }

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
                      fetchPRReviews(pr.id)
                      
                      // Check approval status after fetching reviews
                      setTimeout(() => {
                        const isApproved = checkPRApprovalStatus(pr)
                        setIsPRApproved(isApproved)
                      }, 100)
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
                    <HStack spacing={2}>
                      <Button
                        leftIcon={<FiZap />}
                        onClick={() => startAIReview(selectedPR)}
                        isLoading={isReviewing}
                        loadingText="Reviewing..."
                        variant="gradient"
                      >
                        AI Review
                      </Button>
                      {persistedAIReviews.has(selectedPR.id) && (
                        <Button
                          leftIcon={<FiDatabase />}
                          onClick={() => window.open(`/ai-reviews?pr=${selectedPR.id}`, '_blank')}
                          variant="outline"
                          colorScheme="blue"
                        >
                          View Saved Review
                        </Button>
                      )}
                    </HStack>
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
                      <Tab>Reviews</Tab>
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
                        <VStack align="stretch" spacing={4}>
                          {/* Delete Options Header */}
                          {prReviews.length > 0 && (
                            <Box p={3} bg="gray.50" borderRadius="md">
                              <HStack justify="space-between" mb={3}>
                                <Text fontSize="sm" fontWeight="semibold">
                                  Delete Options
                                </Text>
                                <HStack spacing={2}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={selectAllReviews}
                                    isDisabled={selectedReviews.size === prReviews.length}
                                  >
                                    Select All
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={clearSelection}
                                    isDisabled={selectedReviews.size === 0}
                                  >
                                    Clear
                                  </Button>
                                </HStack>
                              </HStack>
                              
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={confirmDeleteSelected}
                                  isDisabled={selectedReviews.size === 0}
                                  isLoading={isDeleting}
                                  leftIcon={<FiTrash2 />}
                                >
                                  Delete Selected ({selectedReviews.size})
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  variant="solid"
                                  onClick={confirmDeleteAll}
                                  isLoading={isDeleting}
                                  leftIcon={<FiTrash2 />}
                                >
                                  Delete All ({prReviews.length})
                                </Button>
                              </HStack>
                            </Box>
                          )}

                          {/* Reviews List */}
                          {prReviews.length > 0 ? (
                            prReviews.map((review) => (
                              <Box
                                key={review.id}
                                p={4}
                                border="1px"
                                borderColor={borderColor}
                                borderRadius="md"
                                position="relative"
                                bg={selectedReviews.has(review.id) ? "blue.50" : "transparent"}
                              >
                                <HStack justify="space-between" mb={2}>
                                  <HStack>
                                    <Checkbox
                                      isChecked={selectedReviews.has(review.id)}
                                      onChange={() => toggleReviewSelection(review.id)}
                                      colorScheme="blue"
                                    />
                                    <Text fontSize="sm" fontWeight="semibold">
                                      {review.user}
                                    </Text>
                                    <Badge colorScheme={getStatusColor(review.state)} size="sm">
                                      {review.state}
                                    </Badge>
                                  </HStack>
                                  <IconButton
                                    aria-label="Delete review"
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => confirmDeleteReview(review.id)}
                                  />
                                </HStack>
                                <Text fontSize="sm" mb={2} color="gray.600">
                                  {new Date(review.submitted_at).toLocaleString()}
                                </Text>
                                {review.body && (
                                  <Text fontSize="sm" whiteSpace="pre-wrap">
                                    {review.body}
                                  </Text>
                                )}
                              </Box>
                            ))
                          ) : (
                            <Box textAlign="center" py={8}>
                              <Text color="gray.500">
                                No reviews submitted yet for this PR.
                              </Text>
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
                    {isPRApproved ? (
                      <Alert status="success" variant="subtle">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>PR Already Approved</AlertTitle>
                          <AlertDescription>
                            This pull request has already been approved. You can still add comments but cannot change the approval status.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    ) : (
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
                    )}
                    
                    <Select
                      value={reviewAction}
                      onChange={(e) => setReviewAction(e.target.value as any)}
                      isDisabled={isPRApproved}
                    >
                      <option value="comment">Comment</option>
                      <option value="approve" disabled={isPRApproved}>Approve</option>
                      <option value="request_changes" disabled={isPRApproved}>Request Changes</option>
                    </Select>
                    
                    <Textarea
                      placeholder={isPRApproved ? "Add a comment to the approved PR..." : "Add your review comment..."}
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
                        isDisabled={isPRApproved}
                      >
                        Approve
                      </Button>
                      <Button
                        leftIcon={<FiThumbsDown />}
                        colorScheme="red"
                        variant={reviewAction === 'request_changes' ? 'solid' : 'outline'}
                        onClick={() => setReviewAction('request_changes')}
                        isDisabled={isPRApproved}
                      >
                        Request Changes
                      </Button>
                      <Button
                        leftIcon={<FiSend />}
                        onClick={submitReview}
                        variant="gradient"
                        ml="auto"
                        isDisabled={isPRApproved && reviewAction !== 'comment'}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Delete
            </AlertDialogHeader>

            <AlertDialogBody>
              {deleteType === 'single' && (
                <Text>Are you sure you want to delete this review? This action cannot be undone.</Text>
              )}
              {deleteType === 'selected' && (
                <Text>Are you sure you want to delete {selectedReviews.size} selected review(s)? This action cannot be undone.</Text>
              )}
              {deleteType === 'all' && (
                <Text>Are you sure you want to delete all {prReviews.length} reviews? This action cannot be undone.</Text>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={cancelDelete}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={executeDelete} 
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
