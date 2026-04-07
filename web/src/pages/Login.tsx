import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setUser } from '../store/slices/userSlice'
import api from '../services/api'

interface LoginProps {
  onLogin: () => void
}

const Login = ({ onLogin }: LoginProps) => {
  const [loginType, setLoginType] = useState<'phone' | 'wechat'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useDispatch()

  const sendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的手机号')
      return
    }

    if (countdown > 0) return

    try {
      await api.post('/auth/sms/send', { phone })
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || '发送验证码失败')
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login/phone', { phone, code })
      const result = response.data?.data || response.data
      const { token, user, isNewUser } = result
      
      dispatch(setUser({ 
        id: user._id, 
        username: user.username, 
        token 
      }))
      localStorage.setItem('token', token)
      localStorage.setItem('isNewUser', isNewUser ? 'true' : 'false')
      onLogin()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const mockCode = `mock_wx_code_${Date.now()}`
      const response = await api.post('/auth/login/wechat', { code: mockCode })
      const result = response.data?.data || response.data
      const { token, user, isNewUser } = result
      
      dispatch(setUser({ 
        id: user._id, 
        username: user.username, 
        token 
      }))
      localStorage.setItem('token', token)
      localStorage.setItem('isNewUser', isNewUser ? 'true' : 'false')
      onLogin()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || '微信登录失败')
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
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>足球经理</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>开始您的冠军之旅</p>
        </div>

        <div style={{ 
          display: 'flex', 
          marginBottom: 24, 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: 12,
          padding: 4
        }}>
          <button
            onClick={() => setLoginType('phone')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: loginType === 'phone' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: loginType === 'phone' ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
          >
            📱 手机登录
          </button>
          <button
            onClick={() => setLoginType('wechat')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: loginType === 'wechat' ? 'linear-gradient(135deg, #07c160 0%, #06ad56 100%)' : 'transparent',
              color: loginType === 'wechat' ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
          >
            💬 微信登录
          </button>
        </div>

        {loginType === 'phone' ? (
          <form onSubmit={handlePhoneLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 16
                }}
                placeholder="请输入手机号"
                maxLength={11}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>验证码</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 16
                  }}
                  placeholder="请输入验证码"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={countdown > 0 || !phone}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: countdown > 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: countdown > 0 ? 'rgba(255,255,255,0.4)' : '#fff',
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
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
              className="btn btn-primary"
              style={{ width: '100%', padding: 14, fontSize: 16 }}
              disabled={loading || !phone || code.length !== 6}
            >
              {loading ? '登录中...' : '登录 / 注册'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleWechatLogin}
              className="btn"
              style={{ 
                width: '100%', 
                padding: 14, 
                fontSize: 16,
                background: 'linear-gradient(135deg, #07c160 0%, #06ad56 100%)',
                color: '#fff'
              }}
              disabled={loading}
            >
              {loading ? '登录中...' : '💬 微信一键登录'}
            </button>
            
            <p style={{ 
              marginTop: 16, 
              fontSize: 12, 
              color: 'rgba(255,255,255,0.5)' 
            }}>
              首次微信登录将自动创建账号
            </p>
          </div>
        )}

        {error && loginType === 'wechat' && (
          <div style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.2)',
            borderRadius: 8,
            marginTop: 16,
            color: '#ef4444',
            fontSize: 14,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)'
        }}>
          <p style={{ marginBottom: 8 }}>💡 提示：</p>
          <p>• 手机号登录：输入验证码即可登录/注册</p>
          <p>• 微信登录：一键授权，快速进入游戏</p>
          <p>• 同一手机号/微信可绑定同一账号</p>
        </div>
      </div>
    </div>
  )
}

export default Login
