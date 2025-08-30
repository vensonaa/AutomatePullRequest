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
import { useState } from 'react'

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

const mockPRs: PRReview[] = [
  {
    id: 123,
    title: 'Add user authentication feature',
    author: 'john.doe',
    status: 'open',
    branch: 'feature/user-auth',
    baseBranch: 'main',
    description: 'This PR implements user authentication with JWT tokens and OAuth2 support.',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    reviewers: ['jane.smith', 'mike.wilson'],
    labels: ['enhancement', 'security'],
    aiScore: 8.5,
    aiSuggestions: [
      'Consider adding rate limiting for authentication endpoints',
      'Add input validation for email format',
      'Include error handling for expired tokens',
    ],
    aiComments: [
      {
        id: '1',
        body: 'Consider using a more secure password hashing algorithm like bcrypt',
        path: 'src/auth/password.js',
        line: 45,
        severity: 'high',
      },
      {
        id: '2',
        body: 'Missing input validation for email field',
        path: 'src/auth/validation.js',
        line: 23,
        severity: 'medium',
      },
    ],
    filesChanged: [
      { filename: 'src/auth/auth.js', additions: 150, deletions: 20, changes: 170 },
      { filename: 'src/auth/validation.js', additions: 45, deletions: 5, changes: 50 },
      { filename: 'tests/auth.test.js', additions: 200, deletions: 0, changes: 200 },
    ],
  },
  {
    id: 124,
    title: 'Fix navigation bug in mobile view',
    author: 'jane.smith',
    status: 'pending',
    branch: 'bugfix/mobile-nav',
    baseBranch: 'main',
    description: 'Fixes the navigation menu not working properly on mobile devices.',
    createdAt: '2024-01-15T09:15:00Z',
    updatedAt: '2024-01-15T11:45:00Z',
    reviewers: ['john.doe'],
    labels: ['bug-fix', 'ui/ux'],
    aiScore: 7.2,
    aiSuggestions: [
      'Add unit tests for mobile navigation',
      'Consider adding accessibility improvements',
    ],
    aiComments: [
      {
        id: '3',
        body: 'Good fix! Consider adding a test for this specific mobile scenario',
        path: 'src/components/Navigation.js',
        line: 78,
        severity: 'low',
      },
    ],
    filesChanged: [
      { filename: 'src/components/Navigation.js', additions: 25, deletions: 15, changes: 40 },
      { filename: 'src/styles/mobile.css', additions: 30, deletions: 10, changes: 40 },
    ],
  },
]

export function PRReview() {
  const [selectedPR, setSelectedPR] = useState<PRReview | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewAction, setReviewAction] = useState<'approve' | 'request_changes' | 'comment'>('comment')

  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

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
    try {
      // Simulate AI review
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast({
        title: 'AI Review Complete',
        description: `AI has reviewed PR #${pr.id} with a score of ${pr.aiScore}/10`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Review Failed',
        description: 'Failed to complete AI review',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsReviewing(false)
    }
  }

  const submitReview = async () => {
    if (!selectedPR) return

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Review Submitted',
        description: `Your review for PR #${selectedPR.id} has been submitted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      setReviewComment('')
      setReviewAction('comment')
    } catch (error) {
      toast({
        title: 'Review Failed',
        description: 'Failed to submit review',
        status: 'error',
        duration: 3000,
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
              <VStack spacing={4} align="stretch">
                {mockPRs.map((pr) => (
                  <Box
                    key={pr.id}
                    p={4}
                    border="1px"
                    borderColor={selectedPR?.id === pr.id ? 'brand.400' : borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                    onClick={() => setSelectedPR(pr)}
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
                        {pr.filesChanged.length} files changed
                      </Text>
                      <HStack spacing={1}>
                        <Text fontSize="xs" color="green.600">+{pr.filesChanged.reduce((sum, f) => sum + f.additions, 0)}</Text>
                        <Text fontSize="xs" color="red.600">-{pr.filesChanged.reduce((sum, f) => sum + f.deletions, 0)}</Text>
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
                      <Tab>Suggestions</Tab>
                      <Tab>Comments</Tab>
                      <Tab>Files</Tab>
                    </TabList>
                    
                    <TabPanels>
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
                          {selectedPR.filesChanged.map((file, index) => (
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
