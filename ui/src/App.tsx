import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { theme } from './theme'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { PRCreation } from './pages/PRCreation'
import { PRReview } from './pages/PRReview'
import { Tracking } from './pages/Tracking'
import { Settings } from './pages/Settings'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create-pr" element={<PRCreation />} />
              <Route path="/review-pr" element={<PRReview />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App
