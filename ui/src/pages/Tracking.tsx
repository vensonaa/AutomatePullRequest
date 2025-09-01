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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Progress,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import {
  FiBarChart,
  FiRefreshCw,
  FiDownload,
  FiFilter,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import apiService from '../services/apiService'

interface TrackingData {
  prNumber: number
  title: string
  status: string
  createdDate: string
  reviewStatus: string
  approvals: string
  commentsCount: number
  lastUpdated: string
  author: string
  branch: string
}

// Initial empty state
const initialStats = {
  totalPRs: 0,
  openPRs: 0,
  approvedPRs: 0,
  pendingReviews: 0,
  avgReviewTime: '0h',
  approvalRate: 0,
}

export function Tracking() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState(initialStats)
  const [trackingData, setTrackingData] = useState<TrackingData[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'blue'
      case 'closed':
        return 'red'
      case 'merged':
        return 'green'
      default:
        return 'gray'
    }
  }

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'changes_requested':
        return 'red'
      default:
        return 'gray'
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Fetch stats
      const s = await apiService.getStats()
      setStats({
        totalPRs: s.totalPRs ?? 0,
        openPRs: s.openPRs ?? 0,
        approvedPRs: s.approvedPRs ?? 0,
        pendingReviews: s.pendingReviews ?? 0,
        avgReviewTime: s.avgReviewTime ?? '0h',
        approvalRate: s.approvalRate ?? 0,
      })

      // Fetch PR list
      const prsResp = await apiService.getPullRequests()
      const apiPRs = prsResp.prs || []
      const rows: TrackingData[] = apiPRs.map((pr: any) => ({
        prNumber: pr.number,
        title: pr.title,
        status: pr.state,
        createdDate: pr.created_at,
        reviewStatus: pr.state === 'open' ? 'pending' : 'approved',
        approvals: pr.state !== 'open' ? '✅ Approved' : '⏳ Pending',
        commentsCount: 0,
        lastUpdated: pr.updated_at,
        author: pr.author,
        branch: `${pr.head_branch} → ${pr.base_branch}`,
      }))
      setTrackingData(rows)

      toast({
        title: 'Data Loaded',
        description: 'Tracking data loaded from backend',
        status: 'success',
        duration: 1500,
        isClosable: true,
      })
    } catch (err: any) {
      console.error('Failed to load tracking data:', err)
      toast({
        title: 'Failed to load data',
        description: err?.message || 'Backend may not be running',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    loadData()
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exportToCSV = () => {
    toast({
      title: 'Export Started',
      description: 'Downloading tracking data as CSV',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const filteredData = trackingData.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.prNumber.toString().includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            PR Tracking
          </Heading>
          <Text color="gray.600">
            Monitor PR approvals and status in Google Sheets
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiDownload />}
            onClick={exportToCSV}
            variant="outline"
          >
            Export CSV
          </Button>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={refreshData}
            isLoading={isLoading}
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel color="gray.600">Total PRs</StatLabel>
                  <StatNumber fontSize="2xl">{stats.totalPRs}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12.5%
                  </StatHelpText>
                </Box>
                <Icon as={FiBarChart} w={8} h={8} color="brand.500" />
              </HStack>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel color="gray.600">Open PRs</StatLabel>
                  <StatNumber fontSize="2xl">{stats.openPRs}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    8.2%
                  </StatHelpText>
                </Box>
                <Icon as={FiClock} w={8} h={8} color="purple.500" />
              </HStack>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel color="gray.600">Approved PRs</StatLabel>
                  <StatNumber fontSize="2xl">{stats.approvedPRs}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    15.3%
                  </StatHelpText>
                </Box>
                <Icon as={FiCheckCircle} w={8} h={8} color="green.500" />
              </HStack>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel color="gray.600">Approval Rate</StatLabel>
                  <StatNumber fontSize="2xl">{stats.approvalRate}%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    5.1%
                  </StatHelpText>
                </Box>
                <Icon as={FiTrendingUp} w={8} h={8} color="teal.500" />
              </HStack>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters and Search */}
      <Card bg={cardBg} border="1px" borderColor={borderColor} mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <Box flex={1}>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search PRs by title, author, or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Box>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              width="200px"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="merged">Merged</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Tracking Table */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">PR Tracking Data</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>PR #</Th>
                  <Th>Title</Th>
                  <Th>Author</Th>
                  <Th>Status</Th>
                  <Th>Review Status</Th>
                  <Th>Approvals</Th>
                  <Th>Comments</Th>
                  <Th>Created</Th>
                  <Th>Last Updated</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredData.map((item) => (
                  <Tr key={item.prNumber}>
                    <Td>
                      <Text fontWeight="semibold">#{item.prNumber}</Text>
                    </Td>
                    <Td>
                      <Box>
                        <Text fontWeight="medium" noOfLines={1}>
                          {item.title}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {item.branch}
                        </Text>
                      </Box>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{item.author}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getReviewStatusColor(item.reviewStatus)}>
                        {item.reviewStatus}
                      </Badge>
                    </Td>
                    <Td>
                      <Box>
                        <Text fontSize="sm">{item.approvals}</Text>
                        {item.approvals.includes('✅') && (
                          <Progress
                            value={100}
                            size="xs"
                            colorScheme="green"
                            mt={1}
                          />
                        )}
                      </Box>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Icon as={FiUsers} w={3} h={3} color="gray.500" />
                        <Text fontSize="sm">{item.commentsCount}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(item.createdDate).toLocaleDateString()}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </Box>
  )
}
