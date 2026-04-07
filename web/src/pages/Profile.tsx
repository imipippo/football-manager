import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store'
import { logout } from '../store/slices/userSlice'

const Profile = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { username } = useSelector((state: RootState) => state.user)
  const { currentTeam } = useSelector((state: RootState) => state.team)

  const userInfo = {
    username: username || 'manager',
    email: `${username || 'manager'}@example.com`,
    level: 15,
    experience: 2350,
    nextLevel: 3000,
    achievements: 12,
    totalMatches: 156,
    winRate: 68,
    trophies: 3,
  }

  const achievements = [
    { id: 1, name: '首胜', icon: '🏆', unlocked: true },
    { id: 2, name: '联赛冠军', icon: '🥇', unlocked: true },
    { id: 3, name: '杯赛冠军', icon: '🏅', unlocked: true },
    { id: 4, name: '不败赛季', icon: '⭐', unlocked: false },
    { id: 5, name: '三冠王', icon: '👑', unlocked: false },
    { id: 6, name: '传奇教练', icon: '🌟', unlocked: false },
  ]

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      dispatch(logout())
      navigate('/')
    }
  }

  return (
    <div>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 16px'
          }}>
            👤
          </div>
          <h2>{userInfo.username}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>{userInfo.email}</p>
          {currentTeam && (
            <p style={{ color: '#667eea', marginTop: 8 }}>🏆 {currentTeam.name}</p>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>等级 {userInfo.level}</span>
            <span>{userInfo.experience} / {userInfo.nextLevel} XP</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill progress-green" style={{ width: `${(userInfo.experience / userInfo.nextLevel) * 100}%` }} />
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-value">{userInfo.totalMatches}</div>
            <div className="stat-label">总比赛</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{userInfo.winRate}%</div>
            <div className="stat-label">胜率</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{userInfo.trophies}</div>
            <div className="stat-label">奖杯</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{userInfo.achievements}</div>
            <div className="stat-label">成就</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>🏅 成就</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              style={{ 
                textAlign: 'center', 
                padding: 16, 
                background: achievement.unlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                opacity: achievement.unlocked ? 1 : 0.5
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{achievement.icon}</div>
              <div style={{ fontSize: 12 }}>{achievement.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>⚙️ 设置</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary" style={{ textAlign: 'left' }}>
            📱 账号设置
          </button>
          <button className="btn btn-primary" style={{ textAlign: 'left' }}>
            🔔 通知设置
          </button>
          <button className="btn btn-primary" style={{ textAlign: 'left' }}>
            🎮 游戏设置
          </button>
          <button 
            className="btn btn-danger" 
            style={{ textAlign: 'left' }}
            onClick={handleLogout}
          >
            🚪 退出登录
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
