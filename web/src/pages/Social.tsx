import { useState, useEffect } from 'react'
import { socialAPI } from '../services/api'

interface Friend {
  _id: string
  nickname: string
  avatar?: string
  team?: {
    name: string
    reputation: number
  }
  friendsSince: string
}

interface FriendRequest {
  _id: string
  from: {
    _id: string
    nickname: string
    avatar?: string
    team?: {
      name: string
      reputation: number
    }
  }
  createdAt: string
}

interface User {
  _id: string
  nickname: string
  avatar?: string
  team?: {
    name: string
    reputation: number
  }
  friendshipStatus: string | null
}

export default function Social() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        socialAPI.getFriends(),
        socialAPI.getPendingRequests(),
      ])
      setFriends(friendsRes.data.data || [])
      setRequests(requestsRes.data.data || [])
    } catch (error) {
      console.error('Failed to load social data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return
    
    try {
      const response = await socialAPI.searchUsers(searchKeyword)
      setSearchResults(response.data.data || [])
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleSendRequest = async (recipientId: string) => {
    try {
      await socialAPI.sendFriendRequest(recipientId)
      setMessage('好友请求已发送')
      handleSearch()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '发送失败')
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await socialAPI.acceptFriendRequest(requestId)
      setMessage('已接受好友请求')
      loadData()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '操作失败')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await socialAPI.rejectFriendRequest(requestId)
      setMessage('已拒绝好友请求')
      loadData()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '操作失败')
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('确定要删除此好友吗？')) return
    
    try {
      await socialAPI.removeFriend(friendId)
      setMessage('已删除好友')
      loadData()
    } catch (error: any) {
      setMessage(error.response?.data?.message || '删除失败')
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
      <h1 className="text-3xl font-bold mb-6">社交中心</h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 rounded ${
            activeTab === 'friends' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          好友列表 ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded ${
            activeTab === 'requests' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          好友请求 ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded ${
            activeTab === 'search' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          搜索用户
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'friends' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">我的好友</h2>
            {friends.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                暂无好友，去搜索添加吧！
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map(friend => (
                  <div key={friend._id} className="border rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{friend.nickname}</div>
                        {friend.team && (
                          <div className="text-sm text-gray-500">
                            {friend.team.name} | 声望 {friend.team.reputation}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          成为好友: {new Date(friend.friendsSince).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend._id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">好友请求</h2>
            {requests.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                暂无好友请求
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <div key={request._id} className="border rounded p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{request.from.nickname}</div>
                      {request.from.team && (
                        <div className="text-sm text-gray-500">
                          {request.from.team.name} | 声望 {request.from.team.reputation}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        接受
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">搜索用户</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="输入昵称或手机号搜索..."
                className="flex-1 border rounded p-2"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                搜索
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.map(user => (
                  <div key={user._id} className="border rounded p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{user.nickname}</div>
                      {user.team && (
                        <div className="text-sm text-gray-500">
                          {user.team.name} | 声望 {user.team.reputation}
                        </div>
                      )}
                    </div>
                    <div>
                      {user.friendshipStatus === 'accepted' ? (
                        <span className="text-green-500">已是好友</span>
                      ) : user.friendshipStatus === 'pending' ? (
                        <span className="text-gray-500">请求中</span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          添加好友
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
