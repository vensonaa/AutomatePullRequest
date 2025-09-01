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
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={20}>
      <Flex justify="center" align="center">
        <Card 
          bg={cardBg} 
          border="1px" 
          borderColor={borderColor}
          shadow="xl"
          maxW="md"
          w="full"
          mx={4}
        >
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <Box textAlign="center">
                <Flex justify="center" mb={4}>
                  <Box
                    p={3}
                    borderRadius="full"
                    bg="brand.500"
                    color="white"
                    fontSize="2xl"
                  >
                    <FiZap />
                  </Box>
                </Flex>
                <Heading size="lg" mb={2}>
                  Welcome Back
                </Heading>
                <Text color="gray.600">
                  Sign in to your GitHub PR Automation account
                </Text>
              </Box>

              {/* Demo Login Alert */}
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Demo Mode</AlertTitle>
                  <AlertDescription>
                    Use any email/password combination to login. 
                    Or click "Try Demo" for quick access.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>

              {/* Demo Login Button */}
              <Button
                variant="outline"
                size="lg"
                w="full"
                onClick={handleDemoLogin}
                leftIcon={<FiGithub />}
                colorScheme="gray"
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
