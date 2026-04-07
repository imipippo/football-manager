import { useState, useEffect } from 'react'
import { youthAPI } from '../services/api'

interface YouthPlayer {
  player: {
    _id?: string
    name: string
    position: string
    age: number
    overallRating: number
    potential: number
    nationality: string
    physical: Record<string, number>
    technical: Record<string, number>
    mental: Record<string, number>
  }
  squad: 'U18' | 'U20'
}

interface YouthSquad {
  U18: {
    players: YouthPlayer[]
    count: number
    capacity: number
  }
  U20: {
    players: YouthPlayer[]
    count: number
    capacity: number
  }
}

export default function Youth() {
  const [squads, setSquads] = useState<YouthSquad | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<YouthPlayer | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSquads()
  }, [])

  const loadSquads = async () => {
    setLoading(true)
    try {
      const response = await youthAPI.getSquads()
      setSquads(response.data.data)
    } catch (error) {
      console.error('Failed to load youth squads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async (playerId: string, fromSquad: string, toSquad: string) => {
    try {
      await youthAPI.promotePlayer(playerId, fromSquad, toSquad)
      setMessage('球员提拔成功！')
      setSelectedPlayer(null)
      loadSquads()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '提拔失败')
    }
  }

  const handleRelease = async (playerId: string, squad: string) => {
    if (!confirm('确定要解雇这名球员吗？')) return
    
    try {
      await youthAPI.releasePlayer(playerId, squad)
      setMessage('球员已解雇')
      setSelectedPlayer(null)
      loadSquads()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '解雇失败')
    }
  }

  const handleScout = async (usePremium: boolean = false) => {
    try {
      const response = await youthAPI.scoutPlayer(usePremium)
      setMessage(`发现新球员：${response.data.data.player.name}！潜力 ${response.data.data.player.potential}`)
      loadSquads()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '球探失败')
    }
  }

  const handleRefresh = async () => {
    try {
      await youthAPI.refreshSquad()
      setMessage('青训梯队已刷新')
      loadSquads()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '刷新失败')
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
      <h1 className="text-3xl font-bold mb-6">青训中心</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('成功') || message.includes('发现') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleScout(false)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          球探搜索 (免费)
        </button>
        <button
          onClick={() => handleScout(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          高级球探 (15游戏币)
        </button>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          刷新梯队
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">U18 梯队</h2>
            <span className="text-gray-500">
              {squads?.U18?.count || 0}/{squads?.U18?.capacity || 15}人
            </span>
          </div>
          <div className="space-y-2">
            {squads?.U18?.players?.map((youth: YouthPlayer) => (
              <div
                key={youth.player._id || youth.player.name}
                onClick={() => setSelectedPlayer(youth)}
                className={`p-3 rounded cursor-pointer transition hover:bg-gray-50 ${
                  selectedPlayer?.player?.name === youth.player.name ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{youth.player.name}</div>
                    <div className="text-sm text-gray-500">
                      {youth.player.position} | {youth.player.age}岁 | {youth.player.nationality}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{youth.player.overallRating}</div>
                    <div className="text-xs text-purple-500">潜力 {youth.player.potential}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">U20 梯队</h2>
            <span className="text-gray-500">
              {squads?.U20?.count || 0}/{squads?.U20?.capacity || 15}人
            </span>
          </div>
          <div className="space-y-2">
            {squads?.U20?.players?.map((youth: YouthPlayer) => (
              <div
                key={youth.player._id || youth.player.name}
                onClick={() => setSelectedPlayer(youth)}
                className={`p-3 rounded cursor-pointer transition hover:bg-gray-50 ${
                  selectedPlayer?.player?.name === youth.player.name ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{youth.player.name}</div>
                    <div className="text-sm text-gray-500">
                      {youth.player.position} | {youth.player.age}岁 | {youth.player.nationality}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{youth.player.overallRating}</div>
                    <div className="text-xs text-purple-500">潜力 {youth.player.potential}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{selectedPlayer.player.name}</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">综合</div>
                <div className="text-2xl font-bold">{selectedPlayer.player.overallRating}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">潜力</div>
                <div className="text-2xl font-bold text-purple-600">{selectedPlayer.player.potential}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">年龄</div>
                <div className="text-2xl font-bold">{selectedPlayer.player.age}</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">属性</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>速度: {selectedPlayer.player.physical?.pace}</div>
                <div>力量: {selectedPlayer.player.physical?.strength}</div>
                <div>传球: {selectedPlayer.player.technical?.passing}</div>
                <div>射门: {selectedPlayer.player.technical?.shooting}</div>
                <div>盘带: {selectedPlayer.player.technical?.dribbling}</div>
                <div>防守: {selectedPlayer.player.technical?.defending}</div>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedPlayer.squad === 'U18' && selectedPlayer.player.age >= 18 && (
                <button
                  onClick={() => handlePromote(selectedPlayer.player._id!, 'U18', 'U20')}
                  className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  提拔至U20
                </button>
              )}
              {selectedPlayer.squad === 'U20' && (
                <button
                  onClick={() => handlePromote(selectedPlayer.player._id!, 'U20', 'senior')}
                  className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  提拔至一线队
                </button>
              )}
              <button
                onClick={() => handleRelease(selectedPlayer.player._id!, selectedPlayer.squad)}
                className="flex-1 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                解雇
              </button>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 py-2 border rounded hover:bg-gray-100"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
