import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setTeam } from '../store/slices/teamSlice'
import api from '../services/api'

interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow' | 'red' | 'substitution' | 'injury'
  team: 'home' | 'away'
  player: string
  assist?: string
  playerOut?: string
  playerIn?: string
}

interface MatchData {
  _id: string
  homeTeam: { _id: string; name: string }
  awayTeam: { _id: string; name: string }
  homeScore: number
  awayScore: number
  events: MatchEvent[]
  status: 'scheduled' | 'playing' | 'finished'
  date: string
}

const Match = () => {
  const dispatch = useDispatch()
  const { currentTeam } = useSelector((state: RootState) => state.team)
  const [nextMatch, setNextMatch] = useState<MatchData | null>(null)
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([])
  const [standings, setStandings] = useState<{ team: { _id: string; name: string }; played: number; won: number; points: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [matchStats, setMatchStats] = useState<{
    possession: { home: number; away: number }
    shots: { home: number; away: number }
    shotsOnTarget: { home: number; away: number }
    corners: { home: number; away: number }
    fouls: { home: number; away: number }
  } | null>(null)
  const [currentMinute, setCurrentMinute] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [matchRes, historyRes, standingsRes] = await Promise.all([
        api.get('/matches/next').catch(() => ({ data: null })),
        api.get('/matches/history').catch(() => ({ data: [] })),
        api.get('/leagues/standings').catch(() => ({ data: [] }))
      ])
      setNextMatch(matchRes.data?.data || matchRes.data)
      setMatchHistory(historyRes.data?.data || historyRes.data)
      setStandings(standingsRes.data?.data || standingsRes.data)
      
      if (!currentTeam) {
        const teamRes = await api.get('/teams/my')
        dispatch(setTeam(teamRes.data?.data || teamRes.data))
      }
    } catch (error) {
      console.error('Failed to fetch match data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentTeam, dispatch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const simulateMatch = async () => {
    if (!nextMatch) return
    setSimulating(true)
    setCurrentMinute(0)
    setShowResult(false)
    setMatchStats(null)

    try {
      const response = await api.post(`/matches/${nextMatch._id}/simulate`)
      
      const result = response.data?.data || response.data
      const { match, stats } = result
      
      const animateMatch = async () => {
        for (let minute = 0; minute <= 90; minute += 5) {
          setCurrentMinute(minute)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        setNextMatch(match)
        setMatchStats(stats)
        setShowResult(true)
        await fetchData()
      }
      
      animateMatch()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      alert(err.response?.data?.message || '比赛模拟失败')
    } finally {
      setSimulating(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return '⚽'
      case 'yellow': return '🟨'
      case 'red': return '🟥'
      case 'substitution': return '🔄'
      case 'injury': return '🏥'
      default: return '📋'
    }
  }

  const isMyTeam = (teamId: string) => teamId === currentTeam?._id

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      {nextMatch ? (
        <>
          <div className="match-scoreboard">
            <div className="team-display">
              <div className="team-logo">{isMyTeam(nextMatch.homeTeam._id) ? '🔴' : '🔵'}</div>
              <div className="team-name">{nextMatch.homeTeam.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {isMyTeam(nextMatch.homeTeam._id) ? '我的球队' : '主场'}
              </div>
            </div>
            
            <div className="score-display">
              <div className="score">
                <span>{nextMatch.homeScore}</span>
                <span className="score-divider"> - </span>
                <span>{nextMatch.awayScore}</span>
              </div>
              <div className="match-time">
                {simulating ? `${currentMinute}'` : (nextMatch.status === 'finished' ? '已结束' : '未开始')}
              </div>
            </div>
            
            <div className="team-display">
              <div className="team-logo">{isMyTeam(nextMatch.awayTeam._id) ? '🔴' : '🔵'}</div>
              <div className="team-name">{nextMatch.awayTeam.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {isMyTeam(nextMatch.awayTeam._id) ? '我的球队' : '客场'}
              </div>
            </div>
          </div>

          {simulating && (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 16 }}>⚽ 比赛进行中...</div>
              <div className="progress-bar" style={{ height: 12 }}>
                <div 
                  className="progress-fill progress-green" 
                  style={{ width: `${(currentMinute / 90) * 100}%` }} 
                />
              </div>
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.6)' }}>{currentMinute}'</div>
            </div>
          )}

          {showResult && matchStats && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16, textAlign: 'center' }}>
                📊 比赛统计
              </h3>
              <div style={{ marginTop: 16 }}>
                {Object.entries({
                  possession: '控球率',
                  shots: '射门',
                  shotsOnTarget: '射正',
                  corners: '角球',
                  fouls: '犯规',
                }).map(([key, label]) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>{(matchStats as Record<string, { home: number; away: number }>)[key].home}{key === 'possession' ? '%' : ''}</span>
                      <span>{label}</span>
                      <span>{(matchStats as Record<string, { home: number; away: number }>)[key].away}{key === 'possession' ? '%' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div 
                          className="progress-fill progress-red" 
                          style={{ width: `${(matchStats as Record<string, { home: number; away: number }>)[key].home}%` }} 
                        />
                      </div>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div 
                          className="progress-fill progress-green" 
                          style={{ width: `${(matchStats as Record<string, { home: number; away: number }>)[key].away}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nextMatch.events && nextMatch.events.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>📋 比赛事件</h3>
              <div className="match-events">
                {nextMatch.events.map((event, index) => (
                  <div key={index} className="event-item">
                    <div className="event-minute">{event.minute}'</div>
                    <div className="event-icon">{getEventIcon(event.type)}</div>
                    <div className="event-text">
                      {event.type === 'goal' && (
                        <span>
                          <strong>{event.player}</strong> 进球！
                          {event.assist && ` 助攻: ${event.assist}`}
                        </span>
                      )}
                      {event.type === 'yellow' && <span>{event.player} 黄牌</span>}
                      {event.type === 'red' && <span>{event.player} 红牌</span>}
                      {event.type === 'substitution' && (
                        <span>换人: {event.playerOut} ↓ {event.playerIn} ↑</span>
                      )}
                      {event.type === 'injury' && <span>{event.player} 受伤</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!simulating && nextMatch.status !== 'finished' && (
            <div className="card">
              <button
                className="btn btn-success"
                style={{ width: '100%', padding: 16, fontSize: 18 }}
                onClick={simulateMatch}
              >
                ⚽ 开始比赛
              </button>
            </div>
          )}

          {showResult && (
            <div className="card">
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => { setShowResult(false); fetchData(); }}
              >
                查看下一场比赛
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h3 style={{ marginBottom: 8 }}>暂无比赛安排</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>请等待联赛安排下一场比赛</p>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>🏆 联赛积分榜</h3>
          {standings.length > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 40px 40px', gap: 8, marginBottom: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                <span>#</span>
                <span>球队</span>
                <span>场次</span>
                <span>积分</span>
              </div>
              {standings.slice(0, 10).map((s, index) => (
                <div 
                  key={s.team._id} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '30px 1fr 40px 40px', 
                    gap: 8, 
                    padding: '8px 0',
                    background: isMyTeam(s.team._id) ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    borderRadius: 4
                  }}
                >
                  <span style={{ fontWeight: index < 3 ? 600 : 400 }}>{index + 1}</span>
                  <span style={{ fontWeight: isMyTeam(s.team._id) ? 600 : 400 }}>{s.team.name}</span>
                  <span>{s.played}</span>
                  <span style={{ fontWeight: 600 }}>{s.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>暂无积分榜数据</p>
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>📋 近期战绩</h3>
          {matchHistory.length > 0 ? (
            matchHistory.slice(0, 5).map((match) => (
              <div 
                key={match._id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>{match.homeTeam.name}</div>
                <div style={{ 
                  padding: '4px 12px', 
                  background: match.homeScore > match.awayScore ? 'rgba(56, 239, 125, 0.2)' : 
                             match.homeScore < match.awayScore ? 'rgba(244, 92, 67, 0.2)' : 
                             'rgba(255, 210, 0, 0.2)',
                  borderRadius: 4,
                  fontWeight: 600
                }}>
                  {match.homeScore} - {match.awayScore}
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>{match.awayTeam.name}</div>
              </div>
            ))
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>暂无比赛记录</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Match
