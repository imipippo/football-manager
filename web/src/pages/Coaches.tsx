import { useState, useEffect } from 'react'
import { coachAPI } from '../services/api'

interface Coach {
  _id: string
  name: string
  type: string
  attributes: {
    coaching: number
    motivation: number
    tactical: number
    technical: number
    fitness: number
    youth: number
  }
  overallRating: number
  wage: number
  contractEnd: string
  experience: number
}

interface AvailableCoach extends Coach {
  recommendedWage: number
}

const coachTypeNames: Record<string, string> = {
  head: '主教练',
  goalkeeper: '门将教练',
  fitness: '体能教练',
  defense: '防守教练',
  attack: '进攻教练',
  assistant: '助理教练',
  youth: '青训教练',
  psychology: '心理教练',
  analyst: '分析师',
}

export default function Coaches() {
  const [teamCoaches, setTeamCoaches] = useState<Coach[]>([])
  const [availableCoaches, setAvailableCoaches] = useState<AvailableCoach[]>([])
  const [trainingBonus, setTrainingBonus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [teamRes, bonusRes] = await Promise.all([
        coachAPI.getTeamCoaches(),
        coachAPI.getTrainingBonus(),
      ])
      setTeamCoaches(teamRes.data.data || [])
      setTrainingBonus(bonusRes.data.data)
    } catch (error) {
      console.error('Failed to load coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableCoaches = async () => {
    try {
      const response = await coachAPI.getAvailableCoaches()
      setAvailableCoaches(response.data.data || [])
    } catch (error) {
      console.error('Failed to load available coaches:', error)
    }
  }

  const handleHire = async (coachId: string) => {
    const years = prompt('请输入合同年限 (1-5年):')
    if (!years) return

    try {
      await coachAPI.hireCoach(coachId, Number(years))
      setMessage('教练聘用成功！')
      loadData()
      setAvailableCoaches(prev => prev.filter(c => c._id !== coachId))
    } catch (error: any) {
      setMessage(error.response?.data?.message || '聘用失败')
    }
  }

  const handleFire = async (coachId: string) => {
    if (!confirm('确定要解雇这名教练吗？需要支付违约金。')) return

    try {
      await coachAPI.fireCoach(coachId)
      setMessage('教练已解雇')
      loadData()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '解雇失败')
    }
  }

  const handleGenerate = async () => {
    try {
      await coachAPI.generateCoaches(10)
      setMessage('已生成新教练')
      loadAvailableCoaches()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '生成失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">教练团队</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {trainingBonus && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">训练加成</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(trainingBonus.totalBonuses || {}).map(([attr, bonus]) => (
              <div key={attr} className="text-center">
                <div className="text-sm text-gray-500 capitalize">{attr}</div>
                <div className="font-semibold text-green-600">+{(bonus as number).toFixed(1)}%</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            训练效果倍率: <span className="font-semibold">{trainingBonus.trainingMultiplier?.toFixed(2)}x</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">我的教练团队</h2>
          
          {teamCoaches.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无教练，请前往招聘
            </div>
          ) : (
            <div className="space-y-4">
              {teamCoaches.map(coach => (
                <div key={coach._id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">{coach.name}</div>
                      <div className="text-sm text-gray-500">
                        {coachTypeNames[coach.type] || coach.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{coach.overallRating}</div>
                      <div className="text-xs text-gray-500">综合评分</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div>执教: {coach.attributes.coaching}</div>
                    <div>激励: {coach.attributes.motivation}</div>
                    <div>战术: {coach.attributes.tactical}</div>
                    <div>技术: {coach.attributes.technical}</div>
                    <div>体能: {coach.attributes.fitness}</div>
                    <div>青训: {coach.attributes.youth}</div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <div className="text-sm">
                      <span className="text-gray-500">周薪:</span>
                      <span className="font-semibold ml-1">{coach.wage?.toLocaleString()} FC</span>
                    </div>
                    <button
                      onClick={() => handleFire(coach._id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      解雇
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">招聘市场</h2>
            <button
              onClick={() => { loadAvailableCoaches(); handleGenerate(); }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              刷新教练
            </button>
          </div>
          
          {availableCoaches.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              点击"刷新教练"查看可用教练
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableCoaches.map(coach => (
                <div key={coach._id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{coach.name}</div>
                      <div className="text-sm text-gray-500">
                        {coachTypeNames[coach.type] || coach.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{coach.overallRating}</div>
                      <div className="text-xs text-gray-500">综合</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <div className="text-sm">
                      <span className="text-gray-500">建议周薪:</span>
                      <span className="font-semibold ml-1 text-green-600">
                        {coach.recommendedWage?.toLocaleString()} FC
                      </span>
                    </div>
                    <button
                      onClick={() => handleHire(coach._id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      聘用
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
