import { useState, useEffect } from 'react'
import { trainingAPI, playerAPI } from '../services/api'

interface Player {
  _id: string
  name: string
  position: string
  overallRating: number
  age: number
  status: {
    fatigue: number
    injury: number
    morale: number
  }
}

interface TrainingStatus {
  playerId: string
  playerName: string
  todayTraining: {
    free: boolean
    fc: boolean
    premium: number
  }
  fatigue: number
  injury: number
  canTrain: boolean
  trainingCost: number
}

export default function Training() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const response = await playerAPI.getMyPlayers()
      setPlayers(response.data.data || [])
    } catch (error) {
      console.error('Failed to load players:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTrainingStatus = async (playerId: string) => {
    try {
      const response = await trainingAPI.getTrainingStatus(playerId)
      setTrainingStatus(response.data.data)
    } catch (error) {
      console.error('Failed to load training status:', error)
    }
  }

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player)
    loadTrainingStatus(player._id)
    setMessage('')
  }

  const handleTrain = async (type: 'free' | 'fc' | 'premium', attribute?: string) => {
    if (!selectedPlayer) return

    setTraining(true)
    setMessage('')

    try {
      const response = await trainingAPI.trainPlayer(selectedPlayer._id, type, attribute)
      setMessage(`训练成功！${response.data.training?.improvement?.toFixed(2)} 点提升`)
      await loadTrainingStatus(selectedPlayer._id)
      await loadPlayers()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '训练失败')
    } finally {
      setTraining(false)
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
      <h1 className="text-3xl font-bold mb-6">训练中心</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">球员列表</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.map(player => (
                <div
                  key={player._id}
                  onClick={() => handlePlayerSelect(player)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedPlayer?._id === player._id
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-500">
                        {player.position} | {player.age}岁
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{player.overallRating}</div>
                      <div className="text-xs text-gray-500">综合</div>
                    </div>
                  </div>
                  {player.status.injury > 0 && (
                    <div className="text-red-500 text-sm mt-1">伤病中</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedPlayer ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPlayer.name}</h2>
                  <p className="text-gray-500">
                    {selectedPlayer.position} | {selectedPlayer.age}岁 | 
                    综合 {selectedPlayer.overallRating}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">疲劳度</div>
                  <div className="text-lg font-semibold">{selectedPlayer.status.fatigue}%</div>
                </div>
              </div>

              {trainingStatus && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">今日训练状态</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-3 rounded text-center ${
                      trainingStatus.todayTraining.free ? 'bg-gray-200' : 'bg-green-100'
                    }`}>
                      <div className="text-sm">免费训练</div>
                      <div className="font-semibold">
                        {trainingStatus.todayTraining.free ? '已使用' : '可用'}
                      </div>
                    </div>
                    <div className={`p-3 rounded text-center ${
                      trainingStatus.todayTraining.fc ? 'bg-gray-200' : 'bg-blue-100'
                    }`}>
                      <div className="text-sm">FC训练</div>
                      <div className="font-semibold">
                        {trainingStatus.todayTraining.fc ? '已使用' : `${trainingStatus.trainingCost?.toLocaleString()} FC`}
                      </div>
                    </div>
                    <div className="p-3 rounded text-center bg-purple-100">
                      <div className="text-sm">游戏币训练</div>
                      <div className="font-semibold">15 游戏币</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPlayer.status.injury > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                  球员正在伤病中，无法训练
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">选择训练类型</h3>
                  
                  <button
                    onClick={() => handleTrain('free')}
                    disabled={trainingStatus?.todayTraining?.free || training}
                    className={`w-full py-3 rounded font-semibold ${
                      trainingStatus?.todayTraining?.free
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    免费训练 (整体属性微调提升)
                  </button>

                  <button
                    onClick={() => handleTrain('fc', 'physical.pace')}
                    disabled={trainingStatus?.todayTraining?.fc || training}
                    className={`w-full py-3 rounded font-semibold ${
                      trainingStatus?.todayTraining?.fc
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    FC训练 - 速度 ({trainingStatus?.trainingCost?.toLocaleString()} FC)
                  </button>

                  <button
                    onClick={() => handleTrain('premium', 'physical.pace')}
                    disabled={training}
                    className="w-full py-3 rounded font-semibold bg-purple-500 text-white hover:bg-purple-600"
                  >
                    游戏币训练 - 速度 (15 游戏币)
                  </button>
                </div>
              )}

              {message && (
                <div className={`mt-4 p-3 rounded ${
                  message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              请从左侧选择一名球员进行训练
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
