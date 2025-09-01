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
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tag,
  TagLabel,
  TagLeftIcon,
  TagRightIcon,
  Wrap,
  WrapItem,
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
  FiSearch,
  FiFilter,
  FiStar,
  FiTrendingUp,
  FiDatabase,
  FiFileText,
  FiCode,
  FiUser,
  FiCalendar,
} from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'
import apiService from '../services/apiService'

interface AIReview {
  id: number
  pr_number: number
  pr_title: string
  pr_author: string
  review_summary: string
  review_score: number
  review_suggestions: string
  review_issues: string
  created_at: string
  updated_at: string
}

interface AIReviewComment {
  id: number
  review_id: number
  comment_body: string
  file_path: string
  line_number: number
  position: number
  created_at: string
}

interface AIReviewFile {
  id: number
  review_id: number
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  created_at: string
}

interface AIReviewMetadata {
  id: number
  review_id: number
  ai_model: string
  processing_time_ms: number
  tokens_used: number
  cost_estimate: number
  created_at: string
}

interface AIReviewDetail {
  review: AIReview
  comments: AIReviewComment[]
  files: AIReviewFile[]
  metadata: AIReviewMetadata | null
}

interface AIReviewStatistics {
  total_reviews: number
  average_score: number
  reviews_by_author: Array<{
    pr_author: string
    count: number
  }>
  recent_reviews: number
}

export function AIReviews() {
  const [reviews, setReviews] = useState<AIReview[]>([])
  const [selectedReview, setSelectedReview] = useState<AIReviewDetail | null>(null)
  const [statistics, setStatistics] = useState<AIReviewStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReview, setIsLoadingReview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    fetchReviews()
    fetchStatistics()
  }, [currentPage, selectedAuthor])

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getAllAIReviews(20, currentPage * 20, selectedAuthor || undefined)
      setReviews(response.reviews || [])
      setTotalReviews(response.total || 0)
    } catch (err: any) {
      console.error('Failed to fetch AI reviews:', err)
      setError(err.message || 'Failed to load AI reviews')
      toast({
        title: 'Error',
        description: 'Failed to load AI reviews',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const stats = await apiService.getAIReviewStatistics()
      setStatistics(stats)
    } catch (err: any) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const fetchReviewDetail = async (prNumber: number) => {
    try {
      setIsLoadingReview(true)
      const reviewDetail = await apiService.getAIReview(prNumber)
      setSelectedReview(reviewDetail)
      onOpen()
    } catch (err: any) {
      console.error('Failed to fetch review detail:', err)
      toast({
        title: 'Error',
        description: 'Failed to load review details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingReview(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchReviews()
      return
    }

    try {
      setIsSearching(true)
      const response = await apiService.searchAIReviews(searchQuery, 50)
      setReviews(response.reviews || [])
      setTotalReviews(response.total || 0)
      setCurrentPage(0)
    } catch (err: any) {
      console.error('Failed to search reviews:', err)
      toast({
        title: 'Error',
        description: 'Failed to search reviews',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSearching(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'green'
    if (score >= 6) return 'yellow'
    return 'red'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseJsonArray = (jsonString: string): string[] => {
    try {
      return JSON.parse(jsonString)
    } catch {
      return []
    }
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="lg" display="flex" alignItems="center" gap={2}>
              <Icon as={FiDatabase} />
              AI Review History
            </Heading>
            <Text color="gray.500">
              View and manage persisted AI reviews
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            onClick={() => {
              fetchReviews()
              fetchStatistics()
            }}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </Flex>

        {/* Statistics Cards */}
        {statistics && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Reviews</StatLabel>
                  <StatNumber>{statistics.total_reviews}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {statistics.recent_reviews} this week
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Average Score</StatLabel>
                  <StatNumber>{statistics.average_score}/10</StatNumber>
                  <StatHelpText>
                    <Icon as={FiStar} color="yellow.400" />
                    Quality rating
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Top Reviewer</StatLabel>
                  <StatNumber>
                    {statistics.reviews_by_author[0]?.pr_author || 'N/A'}
                  </StatNumber>
                  <StatHelpText>
                    {statistics.reviews_by_author[0]?.count || 0} reviews
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Recent Activity</StatLabel>
                  <StatNumber>{statistics.recent_reviews}</StatNumber>
                  <StatHelpText>
                    <Icon as={FiTrendingUp} color="green.400" />
                    Last 7 days
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Search and Filter */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4}>
              <HStack w="full" spacing={4}>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FiSearch} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search reviews by title or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </InputGroup>
                <Button
                  leftIcon={<Icon as={FiSearch} />}
                  onClick={handleSearch}
                  isLoading={isSearching}
                >
                  Search
                </Button>
              </HStack>

              <HStack w="full" spacing={4}>
                <Select
                  placeholder="Filter by author"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                >
                  {statistics?.reviews_by_author.map((author) => (
                    <option key={author.pr_author} value={author.pr_author}>
                      {author.pr_author} ({author.count})
                    </option>
                  ))}
                </Select>
                <Button
                  leftIcon={<Icon as={FiFilter} />}
                  onClick={() => {
                    setSelectedAuthor('')
                    setSearchQuery('')
                    fetchReviews()
                  }}
                >
                  Clear Filters
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Reviews Table */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">AI Reviews ({totalReviews})</Heading>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Flex justify="center" py={8}>
                <Spinner size="lg" />
              </Flex>
            ) : reviews.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>No reviews found!</AlertTitle>
                <AlertDescription>
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No AI reviews have been generated yet.'}
                </AlertDescription>
              </Alert>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>PR</Th>
                      <Th>Title</Th>
                      <Th>Author</Th>
                      <Th>Score</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reviews.map((review) => (
                      <Tr key={review.id}>
                        <Td>
                          <Badge colorScheme="blue">#{review.pr_number}</Badge>
                        </Td>
                        <Td>
                          <Text fontWeight="medium" noOfLines={2}>
                            {review.pr_title}
                          </Text>
                        </Td>
                        <Td>
                          <HStack>
                            <Avatar size="sm" name={review.pr_author} />
                            <Text>{review.pr_author}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getScoreColor(review.review_score)}>
                            {review.review_score}/10
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.500">
                            {formatDate(review.created_at)}
                          </Text>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            leftIcon={<Icon as={FiEye} />}
                            onClick={() => fetchReviewDetail(review.pr_number)}
                            isLoading={isLoadingReview}
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {totalReviews > 20 && (
              <HStack justify="center" mt={6}>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  isDisabled={currentPage === 0}
                >
                  Previous
                </Button>
                <Text>
                  Page {currentPage + 1} of {Math.ceil(totalReviews / 20)}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  isDisabled={(currentPage + 1) * 20 >= totalReviews}
                >
                  Next
                </Button>
              </HStack>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Review Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            AI Review Details - PR #{selectedReview?.review.pr_number}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedReview && (
              <VStack spacing={6} align="stretch">
                {/* Review Summary */}
                <Card>
                  <CardHeader>
                    <Heading size="md">{selectedReview.review.pr_title}</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="start" spacing={4}>
                      <HStack>
                        <Badge colorScheme="blue">PR #{selectedReview.review.pr_number}</Badge>
                        <Badge colorScheme={getScoreColor(selectedReview.review.review_score)}>
                          Score: {selectedReview.review.review_score}/10
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          by {selectedReview.review.pr_author}
                        </Text>
                      </HStack>
                      
                      <Text>{selectedReview.review.review_summary}</Text>
                      
                      <VStack align="start" spacing={2}>
                        <Text fontWeight="semibold">Suggestions:</Text>
                        <Wrap>
                          {parseJsonArray(selectedReview.review.review_suggestions).map((suggestion, index) => (
                            <WrapItem key={index}>
                              <Tag colorScheme="green">
                                <TagLeftIcon as={FiCheckCircle} />
                                <TagLabel>{suggestion}</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </VStack>

                      {parseJsonArray(selectedReview.review.review_issues).length > 0 && (
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="semibold">Issues:</Text>
                          <Wrap>
                            {parseJsonArray(selectedReview.review.review_issues).map((issue, index) => (
                              <WrapItem key={index}>
                                <Tag colorScheme="red">
                                  <TagLeftIcon as={FiAlertTriangle} />
                                  <TagLabel>{issue}</TagLabel>
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </VStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Comments */}
                {selectedReview.comments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Review Comments ({selectedReview.comments.length})</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {selectedReview.comments.map((comment) => (
                          <Box key={comment.id} p={4} border="1px" borderColor={borderColor} borderRadius="md">
                            <HStack justify="space-between" mb={2}>
                              <Text fontWeight="semibold" fontSize="sm">
                                {comment.file_path}:{comment.line_number}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {formatDate(comment.created_at)}
                              </Text>
                            </HStack>
                            <Text>{comment.comment_body}</Text>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Files */}
                {selectedReview.files.length > 0 && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Files Reviewed ({selectedReview.files.length})</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>File</Th>
                              <Th>Status</Th>
                              <Th>Additions</Th>
                              <Th>Deletions</Th>
                              <Th>Changes</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {selectedReview.files.map((file) => (
                              <Tr key={file.id}>
                                <Td>
                                  <Code fontSize="xs">{file.filename}</Code>
                                </Td>
                                <Td>
                                  <Badge colorScheme={file.status === 'added' ? 'green' : file.status === 'removed' ? 'red' : 'blue'}>
                                    {file.status}
                                  </Badge>
                                </Td>
                                <Td>+{file.additions}</Td>
                                <Td>-{file.deletions}</Td>
                                <Td>{file.changes}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                )}

                {/* Metadata */}
                {selectedReview.metadata && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Review Metadata</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Text fontWeight="semibold">AI Model:</Text>
                          <Badge>{selectedReview.metadata.ai_model}</Badge>
                        </HStack>
                        {selectedReview.metadata.processing_time_ms && (
                          <HStack>
                            <Text fontWeight="semibold">Processing Time:</Text>
                            <Text>{selectedReview.metadata.processing_time_ms}ms</Text>
                          </HStack>
                        )}
                        {selectedReview.metadata.tokens_used && (
                          <HStack>
                            <Text fontWeight="semibold">Tokens Used:</Text>
                            <Text>{selectedReview.metadata.tokens_used}</Text>
                          </HStack>
                        )}
                        {selectedReview.metadata.cost_estimate && (
                          <HStack>
                            <Text fontWeight="semibold">Cost Estimate:</Text>
                            <Text>${selectedReview.metadata.cost_estimate.toFixed(4)}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
