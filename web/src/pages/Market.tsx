import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setTeam } from '../store/slices/teamSlice'
import api from '../services/api'

interface MarketPlayer {
  _id: string
  name: string
  position: string
  rating: number
  age: number
  nationality: string
  marketValue: number
  club?: string
}

const Market = () => {
  const dispatch = useDispatch()
  const { currentTeam } = useSelector((state: RootState) => state.team)
  const [players, setPlayers] = useState<MarketPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/players/available', {
        params: { position: positionFilter || undefined }
      })
      setPlayers(response.data?.data || response.data)
    } catch (error) {
      console.error('Failed to fetch players:', error)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTeam = async () => {
    try {
      const response = await api.get('/teams/my')
      dispatch(setTeam(response.data?.data || response.data))
    } catch (error) {
      console.error('Failed to fetch team:', error)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}M`
    }
    return `£${(value / 1000).toFixed(0)}K`
  }

  const getRatingClass = (rating: number) => {
    if (rating >= 90) return 'rating-gold'
    if (rating >= 85) return 'rating-silver'
    return 'rating-bronze'
  }

  const handleBuy = async (playerId: string) => {
    if (!confirm('确定要购买这名球员吗？')) return
    setBuying(playerId)
    try {
      await api.post(`/players/${playerId}/buy`)
      await Promise.all([fetchPlayers(), fetchTeam()])
      alert('购买成功！')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      alert(err.response?.data?.message || '购买失败')
    } finally {
      setBuying(null)
    }
  }

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const budget = currentTeam?.budget || 0

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">💰 转会市场</h2>
          <div style={{ color: '#38ef7d', fontWeight: 600 }}>
            预算: {formatCurrency(budget)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <input 
            type="text" 
            placeholder="搜索球员..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: 8, 
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              flex: 1
            }}
          />
          <select
            value={positionFilter}
            onChange={(e) => { setPositionFilter(e.target.value); fetchPlayers(); }}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff'
            }}
          >
            <option value="">全部位置</option>
            <option value="GK">门将</option>
            <option value="CB">中后卫</option>
            <option value="LB">左后卫</option>
            <option value="RB">右后卫</option>
            <option value="CDM">后腰</option>
            <option value="CM">中场</option>
            <option value="CAM">前腰</option>
            <option value="LW">左边锋</option>
            <option value="RW">右边锋</option>
            <option value="ST">前锋</option>
          </select>
          <button className="btn btn-primary" onClick={fetchPlayers}>刷新</button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p>加载中...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p>暂无可购买球员</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            可购买球员 ({filteredPlayers.length})
          </h3>
          {filteredPlayers.map((player) => (
            <div key={player._id} className="player-card">
              <div className="player-position" style={{ background: '#667eea' }}>
                {player.position}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player.nationality} {player.name}
                </div>
                <div className="player-stats">
                  年龄: {player.age} | {player.club || '自由球员'}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 16 }}>
                <div className={`player-rating ${getRatingClass(player.rating)}`}>
                  {player.rating}
                </div>
                <div style={{ fontSize: 12, color: player.marketValue > budget ? '#f45c43' : '#38ef7d', marginTop: 4 }}>
                  {formatCurrency(player.marketValue)}
                </div>
              </div>
              <button 
                className="btn btn-success"
                onClick={() => handleBuy(player._id)}
                disabled={buying === player._id || player.marketValue > budget}
              >
                {buying === player._id ? '处理中...' : '购买'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="card-title">📊 市场统计</h3>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>可购买球员</span>
            <span style={{ fontWeight: 600 }}>{players.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>您的预算</span>
            <span style={{ fontWeight: 600, color: '#38ef7d' }}>{formatCurrency(budget)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>可负担球员</span>
            <span style={{ fontWeight: 600 }}>
              {players.filter(p => p.marketValue <= budget).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Market
