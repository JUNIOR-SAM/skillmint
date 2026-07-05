import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import LandingPage  from './pages/LandingPage'
import AuthPage     from './pages/AuthPage'
import Dashboard    from './pages/Dashboard'
import ExplorePage  from './pages/ExplorePage'
import ProfilePage  from './pages/ProfilePage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/login"          element={<AuthPage />} />
        <Route path="/signup"         element={<AuthPage />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/explore"        element={<ExplorePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Routes>
    </Router>
  )
}

export default App