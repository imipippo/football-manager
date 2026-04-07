import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setTeam } from '../store/slices/teamSlice'
import api from '../services/api'

const Squad = () => {
  const dispatch = useDispatch()
  const { currentTeam } = useSelector((state: RootState) => state.team)
  const [loading, setLoading] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [selling, setSelling] = useState(false)

  const fetchTeam = async () => {
    setLoading(true)
    try {
      const response = await api.get('/teams/my')
      dispatch(setTeam(response.data?.data || response.data))
    } catch (error) {
      console.error('Failed to fetch team:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!currentTeam) {
      fetchTeam()
    }
  }, [currentTeam, dispatch])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}M`
    }
    return `£${(value / 1000).toFixed(0)}K`
  }

  const getRatingClass = (rating: number) => {
    if (rating >= 85) return 'rating-gold'
    if (rating >= 80) return 'rating-silver'
    return 'rating-bronze'
  }

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      'GK': '#ffd700',
      'CB': '#4CAF50',
      'LB': '#4CAF50',
      'RB': '#4CAF50',
      'CDM': '#2196F3',
      'CM': '#2196F3',
      'CAM': '#9C27B0',
      'LW': '#FF5722',
      'RW': '#FF5722',
      'ST': '#F44336',
    }
    return colors[position] || '#667eea'
  }

  const handleSellPlayer = async (playerId: string) => {
    if (!confirm('确定要出售这名球员吗？')) return
    setSelling(true)
    try {
      await api.post(`/api/players/${playerId}/sell`)
      await fetchTeam()
      setSelectedPlayer(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      alert(err.response?.data?.message || '出售失败')
    } finally {
      setSelling(false)
    }
  }

  const players = currentTeam?.players || []

  if (loading && !currentTeam) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">👥 球队阵容</h2>
          <button className="btn btn-primary" onClick={() => window.location.href = '/market'}>
            + 转会市场
          </button>
        </div>
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-item">
            <div className="stat-value">{players.length}</div>
            <div className="stat-label">球员数量</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {players.length > 0 ? (players.reduce((sum: number, p: { rating: number }) => sum + p.rating, 0) / players.length).toFixed(1) : '-'}
            </div>
            <div className="stat-label">平均评分</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {players.length > 0 ? (players.reduce((sum: number, p: { marketValue: number }) => sum + p.marketValue, 0) / 1000000).toFixed(0) : 0}M
            </div>
            <div className="stat-label">总身价</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {players.length > 0 ? (players.reduce((sum: number, p: { age: number }) => sum + p.age, 0) / players.length).toFixed(1) : '-'}
            </div>
            <div className="stat-label">平均年龄</div>
          </div>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ marginBottom: 16 }}>您的球队还没有球员</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/market'}>
            前往转会市场
          </button>
        </div>
      ) : (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>球员列表</h3>
          {players.map((player: {
            _id: string;
            name: string;
            position: string;
            rating: number;
            age: number;
            nationality: string;
            marketValue: number;
            form?: number;
            fitness?: number;
          }) => (
            <div 
              key={player._id} 
              className="player-card"
              onClick={() => setSelectedPlayer(selectedPlayer === player._id ? null : player._id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="player-position" style={{ background: getPositionColor(player.position) }}>
                {player.position}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player.nationality} {player.name}
                </div>
                <div className="player-stats">
                  年龄: {player.age} | 身价: {formatCurrency(player.marketValue)}
                  {player.form !== undefined && ` | 状态: ${player.form}%`}
                </div>
              </div>
              <div className={`player-rating ${getRatingClass(player.rating)}`}>
                {player.rating}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPlayer && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>球员详情</h3>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button 
              className="btn btn-danger" 
              onClick={() => handleSellPlayer(selectedPlayer)}
              disabled={selling}
            >
              {selling ? '处理中...' : '出售球员'}
            </button>
            <button className="btn btn-primary" onClick={() => setSelectedPlayer(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Squad
