import { useState, useEffect } from 'react'
import { transferAPI } from '../services/api'

interface Player {
  _id: string
  name: string
  position: string
  overallRating: number
  potential: number
  age: number
  nationality: string
  wage: number
  team?: {
    name: string
    shortName: string
  }
}

interface MarketListing {
  player: Player
  askingPrice: number
  marketValue: number
  recommendedWage: number
  listedAt: string
}

export default function Transfer() {
  const [listings, setListings] = useState<MarketListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null)
  const [filters, setFilters] = useState({
    position: '',
    minRating: '',
    maxRating: '',
    minPrice: '',
    maxPrice: '',
  })
  const [buying, setBuying] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setLoading(true)
    try {
      const response = await transferAPI.getMarketListings(filters)
      setListings(response.data.data || [])
    } catch (error) {
      console.error('Failed to load listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    loadListings()
  }

  const handleBuy = async (playerId: string, _askingPrice: number, recommendedWage: number) => {
    const wageInput = prompt(`请输入周薪 (${Math.round(recommendedWage * 0.7).toLocaleString()} - ${Math.round(recommendedWage * 1.5).toLocaleString()} FC):`)
    if (!wageInput) return

    const yearsInput = prompt('请输入合同年限 (1-5年):')
    if (!yearsInput) return

    setBuying(true)
    setMessage('')

    try {
      await transferAPI.buyPlayer(playerId, Number(wageInput), Number(yearsInput))
      setMessage('签约成功！')
      loadListings()
      setSelectedListing(null)
    } catch (error: any) {
      setMessage(error.response?.data?.message || '签约失败')
    } finally {
      setBuying(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`
    }
    return `${(price / 1000).toFixed(0)}K`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">转会市场</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <select
            value={filters.position}
            onChange={(e) => handleFilterChange('position', e.target.value)}
            className="border rounded p-2"
          >
            <option value="">所有位置</option>
            <option value="GK">门将</option>
            <option value="CB">中后卫</option>
            <option value="LB">左后卫</option>
            <option value="RB">右后卫</option>
            <option value="CDM">后腰</option>
            <option value="CM">中前卫</option>
            <option value="CAM">前腰</option>
            <option value="LM">左中场</option>
            <option value="RM">右中场</option>
            <option value="LW">左边锋</option>
            <option value="RW">右边锋</option>
            <option value="ST">中锋</option>
          </select>

          <input
            type="number"
            placeholder="最低评分"
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
            className="border rounded p-2"
          />

          <input
            type="number"
            placeholder="最高评分"
            value={filters.maxRating}
            onChange={(e) => handleFilterChange('maxRating', e.target.value)}
            className="border rounded p-2"
          />

          <input
            type="number"
            placeholder="最低价格"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="border rounded p-2"
          />

          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600"
          >
            搜索
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => (
            <div
              key={listing.player._id}
              onClick={() => setSelectedListing(listing)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer transition hover:shadow-lg ${
                selectedListing?.player._id === listing.player._id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{listing.player.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {listing.player.position} | {listing.player.age}岁 | {listing.player.nationality}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{listing.player.overallRating}</div>
                  <div className="text-xs text-gray-500">综合</div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-500">标价</div>
                  <div className="font-semibold text-blue-600">
                    {formatPrice(listing.askingPrice)} FC
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">市场价值</div>
                  <div className="font-semibold">
                    {formatPrice(listing.marketValue)} FC
                  </div>
                </div>
              </div>

              {listing.player.team && (
                <div className="mt-2 text-sm text-gray-500">
                  所属: {listing.player.team.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {listings.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          暂无符合条件的球员
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">{selectedListing.player.name}</h2>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">位置</span>
                <span className="font-semibold">{selectedListing.player.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">年龄</span>
                <span className="font-semibold">{selectedListing.player.age}岁</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">综合评分</span>
                <span className="font-semibold">{selectedListing.player.overallRating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">潜力</span>
                <span className="font-semibold">{selectedListing.player.potential}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">转会费</span>
                <span className="font-bold text-blue-600">
                  {selectedListing.askingPrice.toLocaleString()} FC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">手续费 (20%)</span>
                <span className="font-semibold">
                  {Math.round(selectedListing.askingPrice * 0.2).toLocaleString()} FC
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">总计</span>
                <span className="font-bold text-red-600">
                  {Math.round(selectedListing.askingPrice * 1.2).toLocaleString()} FC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">建议周薪</span>
                <span className="font-semibold">
                  {selectedListing.recommendedWage.toLocaleString()} FC
                </span>
              </div>
            </div>

            {message && (
              <div className={`mb-4 p-2 rounded text-center ${
                message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedListing(null)}
                className="flex-1 py-2 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => handleBuy(
                  selectedListing.player._id,
                  selectedListing.askingPrice,
                  selectedListing.recommendedWage
                )}
                disabled={buying}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                {buying ? '处理中...' : '签约'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
