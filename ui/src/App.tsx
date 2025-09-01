import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { theme } from './theme'
import Layout from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { PRCreation } from './pages/PRCreation'
import { PRReview } from './pages/PRReview'
import { Tracking } from './pages/Tracking'
import { Settings } from './pages/Settings'
import { ConfigTestPage } from './pages/ConfigTestPage'
import { AIReviews } from './pages/AIReviews'
import { Login } from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Box textAlign="center">
          <Box
            w="16"
            h="16"
            border="4px"
            borderColor="brand.500"
            borderTopColor="transparent"
            borderRadius="full"
            animation="spin 1s linear infinite"
            mx="auto"
            mb={4}
          />
          <Box
            as="style"
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `,
            }}
          />
          <Box>Loading...</Box>
        </Box>
      </Box>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/create-pr" element={
        <ProtectedRoute>
          <Layout>
            <PRCreation />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/review-pr" element={
        <ProtectedRoute>
          <Layout>
            <PRReview />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/ai-reviews" element={
        <ProtectedRoute>
          <Layout>
            <AIReviews />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/tracking" element={
        <ProtectedRoute>
          <Layout>
            <Tracking />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/config-test" element={
        <ProtectedRoute>
          <Layout>
            <ConfigTestPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Box minH="100vh" bg="gray.50">
            <AppRoutes />
          </Box>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App
