import {
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Progress,
  Icon,
  useColorModeValue,
  Flex,
  Button,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  FiGitBranch,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiZap,
  FiRefreshCw,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import apiService from '../services/apiService'

// Real data state
interface DashboardStats {
  totalPRs: number
  openPRs: number
  approvedPRs: number
  pendingReviews: number
  avgReviewTime: string
  approvalRate: number
}

interface PRData {
  id: number
  number: number
  title: string
  status: string
  author: string
  createdAt: string
  reviews: number
  required: number
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalPRs: 0,
    openPRs: 0,
    approvedPRs: 0,
    pendingReviews: 0,
    avgReviewTime: '0h',
    approvalRate: 0,
  })
  const [recentPRs, setRecentPRs] = useState<PRData[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch stats
      const statsData = await apiService.getStats()
      setStats({
        totalPRs: statsData.totalPRs || 0,
        openPRs: statsData.openPRs || 0,
        approvedPRs: statsData.approvedPRs || 0,
        pendingReviews: statsData.pendingReviews || 0,
        avgReviewTime: statsData.avgReviewTime || '0h',
        approvalRate: statsData.approvalRate || 0,
      })
      
      // Fetch recent PRs
      const prsResponse = await apiService.getPullRequests()
      const prs = prsResponse.prs || []
      
      // Convert to dashboard format and take last 5
      const dashboardPRs: PRData[] = prs.slice(0, 5).map((pr: any) => ({
        id: pr.number,
        number: pr.number,
        title: pr.title,
        status: pr.state,
        author: pr.author,
        createdAt: pr.created_at,
        reviews: 0, // TODO: Get actual review count
        required: 1, // TODO: Get actual required reviews
      }))
      setRecentPRs(dashboardPRs)
      
      // Generate chart data from stats
      const chartDataFromStats = [
        { name: 'Total', PRs: statsData.totalPRs || 0, Reviews: 0, Approvals: statsData.approvedPRs || 0 },
        { name: 'Open', PRs: statsData.openPRs || 0, Reviews: 0, Approvals: 0 },
        { name: 'Closed', PRs: (statsData.totalPRs || 0) - (statsData.openPRs || 0), Reviews: 0, Approvals: 0 },
      ]
      setChartData(chartDataFromStats)
      
      // Generate pie chart data
      const pieDataFromStats = [
        { name: 'Open', value: statsData.openPRs || 0, color: '#3182CE' },
        { name: 'Approved', value: statsData.approvedPRs || 0, color: '#38A169' },
        { name: 'Pending Review', value: statsData.pendingReviews || 0, color: '#D69E2E' },
        { name: 'Closed', value: (statsData.totalPRs || 0) - (statsData.openPRs || 0), color: '#E53E3E' },
      ].filter(item => item.value > 0)
      setPieData(pieDataFromStats)
      
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err)
      setError(err?.message || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    loadDashboardData()
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'blue'
      case 'approved':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'closed':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Dashboard
          </Heading>
          <Text color="gray.600">
            Monitor your GitHub PR automation system
          </Text>
        </Box>
        <Button
          leftIcon={<FiRefreshCw />}
          onClick={refreshData}
          isLoading={isLoading}
          variant="outline"
        >
          Refresh
        </Button>
      </Flex>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      )}

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
                    {stats.totalPRs > 0 ? 'Active' : 'No PRs'}
                  </StatHelpText>
                </Box>
                <Icon as={FiGitBranch} w={8} h={8} color="brand.500" />
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
                    {stats.openPRs > 0 ? 'Needs Review' : 'All Closed'}
                  </StatHelpText>
                </Box>
                <Icon as={FiEye} w={8} h={8} color="purple.500" />
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
                    {stats.approvalRate.toFixed(1)}% rate
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
                  <StatLabel color="gray.600">Pending Reviews</StatLabel>
                  <StatNumber fontSize="2xl">{stats.pendingReviews}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    {stats.pendingReviews > 0 ? 'Needs Attention' : 'All Reviewed'}
                  </StatHelpText>
                </Box>
                <Icon as={FiClock} w={8} h={8} color="orange.500" />
              </HStack>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Charts and Activity */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Charts */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor} mb={6}>
            <CardHeader>
              <Heading size="md">PR Status Overview</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="PRs"
                    stackId="1"
                    stroke="#3182CE"
                    fill="#3182CE"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="Reviews"
                    stackId="1"
                    stroke="#38A169"
                    fill="#38A169"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="Approvals"
                    stackId="1"
                    stroke="#D69E2E"
                    fill="#D69E2E"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">PR Status Distribution</Heading>
            </CardHeader>
            <CardBody>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">No data available for chart</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Recent Activity */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Recent PRs</Heading>
            </CardHeader>
            <CardBody>
              {recentPRs.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {recentPRs.map((pr) => (
                    <Box
                      key={pr.id}
                      p={4}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                          {pr.title}
                        </Text>
                        <Badge colorScheme={getStatusColor(pr.status)}>
                          {pr.status}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.600" mb={2}>
                        by {pr.author} • {new Date(pr.createdAt).toLocaleDateString()}
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.600">
                          Reviews: {pr.reviews}/{pr.required}
                        </Text>
                        <Progress
                          value={(pr.reviews / pr.required) * 100}
                          size="sm"
                          width="60px"
                          colorScheme={pr.reviews >= pr.required ? 'green' : 'blue'}
                        />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">No PRs found</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  )
}
