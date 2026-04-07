import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store'
import { setTeam } from '../store/slices/teamSlice'
import api from '../services/api'

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentTeam } = useSelector((state: RootState) => state.team)
  const [loading, setLoading] = useState(!currentTeam)
  const [nextMatch, setNextMatch] = useState<{ opponent: string; date: string } | null>(null)
  const [standings, setStandings] = useState<{ position: number; points: number } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        let team = currentTeam
        if (!team) {
          const teamRes = await api.get('/teams/my')
          dispatch(setTeam(teamRes.data?.data || teamRes.data))
          team = teamRes.data?.data || teamRes.data
        }
        const matchRes = await api.get('/matches/next')
        setNextMatch(matchRes.data?.data || matchRes.data)
        const standingsRes = await api.get('/leagues/standings')
        const standingsData = standingsRes.data?.data || standingsRes.data
        const teamId = team?._id
        if (teamId) {
          const myPosition = standingsData.findIndex(
            (s: { team: { _id: string } }) => s.team._id === teamId
          )
          if (myPosition >= 0) {
            setStandings({
              position: myPosition + 1,
              points: standingsData[myPosition].points
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentTeam, dispatch])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}M`
    }
    return `£${(value / 1000).toFixed(0)}K`
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p>加载中...</p>
      </div>
    )
  }

  const teamData = currentTeam || {
    name: '我的球队',
    budget: 50000000,
    reputation: 70,
    players: [],
    formation: '4-3-3',
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🏆 {teamData.name}</h2>
          <span className="rating-gold">⭐ {teamData.reputation}</span>
        </div>
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-value">#{standings?.position || '-'}</div>
            <div className="stat-label">联赛排名</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{standings?.points || 0}</div>
            <div className="stat-label">积分</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatCurrency(teamData.budget)}</div>
            <div className="stat-label">预算</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{teamData.players?.length || 0}</div>
            <div className="stat-label">球员数</div>
          </div>
        </div>
      </div>

      {nextMatch && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>📅 下一场比赛</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{teamData.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>主场</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <div style={{ fontSize: 14, color: '#667eea' }}>VS</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{nextMatch.date}</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{nextMatch.opponent}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>客场</div>
            </div>
          </div>
          <button
            className="btn btn-success"
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => navigate('/match')}
          >
            进入比赛
          </button>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">💰 财务状况</h3>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>账户余额</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(teamData.budget)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>球队身价</span>
              <span style={{ color: '#38ef7d' }}>
                {formatCurrency(teamData.players?.reduce((sum: number, p: { marketValue: number }) => sum + p.marketValue, 0) || 0)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>球员数量</span>
              <span style={{ color: '#667eea' }}>{teamData.players?.length || 0} 人</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">📊 球队数据</h3>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>阵型</span>
              <span style={{ fontWeight: 600 }}>{teamData.formation || '4-3-3'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>平均评分</span>
              <span style={{ color: '#ffd700' }}>
                {teamData.players?.length 
                  ? (teamData.players.reduce((sum: number, p: { rating: number }) => sum + p.rating, 0) / teamData.players.length).toFixed(1)
                  : '-'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>平均年龄</span>
              <span style={{ color: '#667eea' }}>
                {teamData.players?.length 
                  ? (teamData.players.reduce((sum: number, p: { age: number }) => sum + p.age, 0) / teamData.players.length).toFixed(1)
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 快捷操作</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/squad')}>管理球队</button>
          <button className="btn btn-primary" onClick={() => navigate('/match')}>查看赛程</button>
          <button className="btn btn-success" onClick={() => navigate('/market')}>进入市场</button>
          <button className="btn btn-primary" onClick={() => navigate('/match')}>开始比赛</button>
        </div>
      </div>
    </div>
  )
}

export default Home
