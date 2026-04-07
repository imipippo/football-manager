import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Layout from './components/Layout'
import Login from './pages/Login'
import CreateTeam from './pages/CreateTeam'
import Home from './pages/Home'
import Squad from './pages/Squad'
import Market from './pages/Market'
import Match from './pages/Match'
import Profile from './pages/Profile'
import Training from './pages/Training'
import Transfer from './pages/Transfer'
import Finance from './pages/Finance'
import Youth from './pages/Youth'
import Coaches from './pages/Coaches'
import Social from './pages/Social'
import { setTeam } from './store/slices/teamSlice'
import api from './services/api'
import { RootState } from './store'

function App() {
  const [checking, setChecking] = useState(true)
  const [hasTeam, setHasTeam] = useState(false)
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.user)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const teamRes = await api.get('/teams/my')
          if (teamRes.data?.data) {
            dispatch(setTeam(teamRes.data.data))
            setHasTeam(true)
          }
        } catch {
          setHasTeam(false)
        }
      }
      setChecking(false)
    }
    checkAuth()
  }, [dispatch])

  const handleLogin = () => {
    setChecking(false)
  }

  const handleTeamCreated = async () => {
    try {
      const teamRes = await api.get('/teams/my')
      if (teamRes.data?.data) {
        dispatch(setTeam(teamRes.data.data))
        setHasTeam(true)
      }
    } catch {
      setHasTeam(false)
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  if (!hasTeam) {
    return <CreateTeam onCreated={handleTeamCreated} />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="squad" element={<Squad />} />
        <Route path="market" element={<Market />} />
        <Route path="match" element={<Match />} />
        <Route path="profile" element={<Profile />} />
        <Route path="training" element={<Training />} />
        <Route path="transfer" element={<Transfer />} />
        <Route path="finance" element={<Finance />} />
        <Route path="youth" element={<Youth />} />
        <Route path="coaches" element={<Coaches />} />
        <Route path="social" element={<Social />} />
      </Route>
    </Routes>
  )
}

export default App
