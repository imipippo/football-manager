import { useState, useEffect } from 'react'
import { financeAPI } from '../services/api'

interface FinanceOverview {
  balance: number
  weekly: {
    income: number
    expense: number
    net: number
  }
  breakdown: {
    income: {
      sponsors: number
      matchday: number
      broadcasting: number
      merchandise: number
      other: number
    }
    expenses: {
      wages: number
      facilities: number
      staff: number
      other: number
    }
  }
  sponsors: Sponsor[]
  recentTransactions: Transaction[]
}

interface Sponsor {
  type: string
  typeName: string
  name: string
  amount: number
  duration: number
  totalValue: number
}

interface Transaction {
  type: string
  category: string
  amount: number
  date: string
  description: string
}

export default function Finance() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [sponsorOffers, setSponsorOffers] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewRes, sponsorsRes] = await Promise.all([
        financeAPI.getOverview(),
        financeAPI.getSponsorOffers(),
      ])
      setOverview(overviewRes.data.data)
      setSponsorOffers(sponsorsRes.data.data.offers || [])
    } catch (error) {
      console.error('Failed to load finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptSponsor = async (sponsor: Sponsor) => {
    try {
      await financeAPI.acceptSponsor(sponsor.type, sponsor.name, sponsor.amount, sponsor.duration)
      setMessage(`成功签约 ${sponsor.name}！`)
      loadData()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '签约失败')
    }
  }

  const handleUpgradeFacility = async (facility: string) => {
    try {
      await financeAPI.upgradeFacility(facility)
      setMessage('设施升级成功！')
      loadData()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '升级失败')
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
      <h1 className="text-3xl font-bold mb-6">财务管理</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">财务概览</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-500">账户余额</div>
              <div className="text-2xl font-bold text-green-600">
                {overview?.balance?.toLocaleString()} FC
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">周收入</div>
              <div className="text-xl font-semibold text-blue-600">
                +{overview?.weekly?.income?.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">周支出</div>
              <div className="text-xl font-semibold text-red-600">
                -{overview?.weekly?.expense?.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-green-600">收入来源</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>赞助</span>
                  <span>{overview?.breakdown?.income?.sponsors?.toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between">
                  <span>比赛日</span>
                  <span>{overview?.breakdown?.income?.matchday?.toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between">
                  <span>转播</span>
                  <span>{overview?.breakdown?.income?.broadcasting?.toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between">
                  <span>周边</span>
                  <span>{overview?.breakdown?.income?.merchandise?.toLocaleString()} FC</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600">支出项目</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>工资</span>
                  <span>{overview?.breakdown?.expenses?.wages?.toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between">
                  <span>设施</span>
                  <span>{overview?.breakdown?.expenses?.facilities?.toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between">
                  <span>员工</span>
                  <span>{overview?.breakdown?.expenses?.staff?.toLocaleString()} FC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">设施升级</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleUpgradeFacility('stadiumLevel')}
              className="p-4 border rounded hover:bg-gray-50"
            >
              <div className="font-semibold">球场</div>
              <div className="text-sm text-gray-500">增加比赛日收入</div>
            </button>
            <button
              onClick={() => handleUpgradeFacility('trainingLevel')}
              className="p-4 border rounded hover:bg-gray-50"
            >
              <div className="font-semibold">训练场</div>
              <div className="text-sm text-gray-500">提升训练效果</div>
            </button>
            <button
              onClick={() => handleUpgradeFacility('youthLevel')}
              className="p-4 border rounded hover:bg-gray-50"
            >
              <div className="font-semibold">青训营</div>
              <div className="text-sm text-gray-500">提升青训质量</div>
            </button>
            <button
              onClick={() => handleUpgradeFacility('medicalLevel')}
              className="p-4 border rounded hover:bg-gray-50"
            >
              <div className="font-semibold">医疗中心</div>
              <div className="text-sm text-gray-500">加速伤病恢复</div>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">赞助商报价</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsorOffers.map(offer => (
            <div key={offer.type} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">{offer.name}</div>
                  <div className="text-sm text-gray-500">{offer.typeName}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {offer.amount.toLocaleString()} FC/周
                  </div>
                  <div className="text-xs text-gray-500">
                    总计 {offer.totalValue.toLocaleString()} FC
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAcceptSponsor(offer)}
                className="w-full mt-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                签约
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
