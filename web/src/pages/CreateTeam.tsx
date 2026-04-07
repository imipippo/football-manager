import { useState } from 'react'
import api from '../services/api'

interface CreateTeamProps {
  onCreated: () => void
}

const CreateTeam = ({ onCreated }: CreateTeamProps) => {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formations = [
    { id: '4-3-3', name: '4-3-3', description: '攻击型阵型' },
    { id: '4-4-2', name: '4-4-2', description: '平衡型阵型' },
    { id: '3-5-2', name: '3-5-2', description: '中场控制' },
    { id: '5-3-2', name: '5-3-2', description: '防守反击' },
    { id: '4-2-3-1', name: '4-2-3-1', description: '现代足球' },
  ]

  const [selectedFormation, setSelectedFormation] = useState('4-3-3')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) {
      setError('请输入球队名称')
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/teams', {
        name: teamName,
        shortName: teamName.substring(0, 3).toUpperCase(),
        tactics: {
          formation: selectedFormation
        }
      })
      onCreated()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || '创建球队失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div className="card" style={{ maxWidth: 500, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>创建您的球队</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>开始您的足球经理之旅</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>球队名称</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 16
              }}
              placeholder="例如：曼联、皇家马德里..."
              maxLength={30}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>选择初始阵型</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {formations.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFormation(f.id)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: selectedFormation === f.id ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                    background: selectedFormation === f.id ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f.description}</div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              padding: 12,
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              marginBottom: 16,
              color: '#ef4444',
              fontSize: 14
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success"
            style={{ width: '100%', padding: 14, fontSize: 16 }}
            disabled={loading}
          >
            {loading ? '创建中...' : '创建球队'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)'
        }}>
          <p style={{ marginBottom: 8 }}>🎁 创建球队后您将获得：</p>
          <p>• 初始预算 £50,000,000</p>
          <p>• 18名初始球员</p>
          <p>• 自动加入联赛</p>
        </div>
      </div>
    </div>
  )
}

export default CreateTeam
