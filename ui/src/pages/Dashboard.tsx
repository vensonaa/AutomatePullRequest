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

// TODO: Replace with real API calls
const mockStats = {
  totalPRs: 0,
  openPRs: 0,
  approvedPRs: 0,
  pendingReviews: 0,
  avgReviewTime: '0h',
  approvalRate: 0,
}

const mockChartData: any[] = []

const mockRecentPRs: any[] = []

const mockPieData: any[] = []

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const refreshData = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000)
  }

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

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel color="gray.600">Total PRs</StatLabel>
                  <StatNumber fontSize="2xl">{mockStats.totalPRs}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12.5%
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
                  <StatNumber fontSize="2xl">{mockStats.openPRs}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    8.2%
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
                  <StatNumber fontSize="2xl">{mockStats.approvedPRs}</StatNumber>
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
                  <StatLabel color="gray.600">Pending Reviews</StatLabel>
                  <StatNumber fontSize="2xl">{mockStats.pendingReviews}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    5.1%
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
              <Heading size="md">PR Activity (Last 7 Days)</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockChartData}>
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
              <VStack spacing={4} align="stretch">
                {mockRecentPRs.map((pr) => (
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
                      by {pr.author} • {pr.createdAt}
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
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  )
}
