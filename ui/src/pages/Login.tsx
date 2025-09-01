import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Card,
  CardBody,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiZap, FiGithub } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    
    try {
      const success = await login(email, password)
      
      if (success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
        
        // Redirect to dashboard
        navigate('/')
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setEmail('admin@example.com')
    setPassword('admin123')
    
    // Auto-submit after setting demo credentials
    setTimeout(() => {
      handleSubmit(new Event('submit') as any)
    }, 100)
  }

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-br, brand.50, purple.50, pink.50)" 
      py={20}
      position="relative"
      overflow="hidden"
    >
      {/* Background decorative elements */}
      <Box
        position="absolute"
        top="-50%"
        right="-50%"
        w="100%"
        h="100%"
        bgGradient="radial(circle, brand.100 0%, transparent 70%)"
        opacity="0.3"
        transform="rotate(45deg)"
      />
      <Box
        position="absolute"
        bottom="-50%"
        left="-50%"
        w="100%"
        h="100%"
        bgGradient="radial(circle, purple.100 0%, transparent 70%)"
        opacity="0.3"
        transform="rotate(-45deg)"
      />
      
      <Flex justify="center" align="center" position="relative" zIndex={1}>
        <Card 
          variant="elevated"
          maxW="md"
          w="full"
          mx={4}
          backdropFilter="blur(10px)"
          bg="rgba(255, 255, 255, 0.9)"
          border="1px solid"
          borderColor="white"
        >
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <Box textAlign="center">
                <Flex justify="center" mb={4}>
                  <Box
                    p={4}
                    borderRadius="full"
                    bgGradient="linear(to-r, brand.400, purple.400)"
                    color="white"
                    fontSize="3xl"
                    boxShadow="glow"
                    _hover={{
                      transform: 'scale(1.1) rotate(5deg)',
                      boxShadow: 'glow-purple',
                    }}
                    transition="all 0.3s ease"
                  >
                    <FiZap />
                  </Box>
                </Flex>
                <Heading size="lg" mb={2} bgGradient="linear(to-r, brand.600, purple.600)" bgClip="text">
                  Welcome Back
                </Heading>
                <Text color="gray.600">
                  Sign in to your GitHub PR Automation account
                </Text>
              </Box>

              {/* Demo Login Alert */}
              <Alert status="info" borderRadius="xl" bgGradient="linear(to-r, blue.50, indigo.50)">
                <AlertIcon color="blue.500" />
                <Box>
                  <AlertTitle color="blue.700">Demo Mode</AlertTitle>
                  <AlertDescription color="blue.600">
                    Use any email/password combination to login. 
                    Or click "Try Demo" for quick access.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium" color="gray.700">Email</FormLabel>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="lg"
                      borderRadius="xl"
                      border="2px solid"
                      borderColor="gray.200"
                      _focus={{
                        borderColor: 'brand.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                      }}
                      _hover={{
                        borderColor: 'brand.300',
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="medium" color="gray.700">Password</FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        borderRadius="xl"
                        border="2px solid"
                        borderColor="gray.200"
                        _focus={{
                          borderColor: 'brand.400',
                          boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                        }}
                        _hover={{
                          borderColor: 'brand.300',
                        }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                          color="gray.500"
                          _hover={{ color: 'brand.500' }}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    borderRadius="xl"
                    py={6}
                    fontSize="lg"
                    fontWeight="bold"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'xl',
                    }}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>

              {/* Demo Login Button */}
              <Button
                variant="vibrant"
                size="lg"
                w="full"
                onClick={handleDemoLogin}
                leftIcon={<FiGithub />}
                borderRadius="xl"
                py={6}
                fontSize="lg"
                fontWeight="bold"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'xl',
                }}
                transition="all 0.2s"
              >
                Try Demo
              </Button>

              {/* Footer */}
              <Box textAlign="center" pt={4}>
                <Text fontSize="sm" color="gray.500">
                  This is a demo application. No real authentication required.
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Flex>
    </Box>
  )
}
