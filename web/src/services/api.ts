import axios from 'axios'

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api/v1'
  : `http://${window.location.hostname}:3001/api/v1`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api

export const playerAPI = {
  getMyPlayers: () => api.get('/players/my'),
  getPlayer: (id: string) => api.get(`/players/${id}`),
  updatePlayer: (id: string, data: any) => api.put(`/players/${id}`, data),
}

export const leagueAPI = {
  getLeagues: () => api.get('/leagues'),
  getLeague: (id: string) => api.get(`/leagues/${id}`),
  getStandings: (id: string) => api.get(`/leagues/${id}/standings`),
}

export const trainingAPI = {
  trainPlayer: (playerId: string, type: string, attribute?: string) => 
    api.post(`/training/${playerId}`, { type, attribute }),
  getTrainingStatus: (playerId: string) => 
    api.get(`/training/status/${playerId}`),
  getTeamTrainingStatus: () => 
    api.get('/training/team'),
}

export const transferAPI = {
  getMarketListings: (params?: any) => api.get('/transfer/listings', { params }),
  listPlayer: (playerId: string, askingPrice: number) => 
    api.post(`/transfer/list/${playerId}`, { askingPrice }),
  removeFromTransfer: (playerId: string) => 
    api.delete(`/transfer/list/${playerId}`),
  buyPlayer: (playerId: string, offeredWage: number, contractYears: number) => 
    api.post(`/transfer/buy/${playerId}`, { offeredWage, contractYears }),
  getPlayerTransferInfo: (playerId: string) => 
    api.get(`/transfer/player/${playerId}`),
  generateFreeAgents: (count: number, minRating: number, maxRating: number) => 
    api.post('/transfer/generate-free-agents', { count, minRating, maxRating }),
}

export const financeAPI = {
  getOverview: () => api.get('/finance/overview'),
  getSponsorOffers: () => api.get('/finance/sponsors'),
  acceptSponsor: (type: string, name: string, amount: number, duration: number) => 
    api.post('/finance/sponsors/accept', { type, name, amount, duration }),
  processWeeklyFinances: () => api.post('/finance/weekly'),
  upgradeFacility: (facility: string) => 
    api.post('/finance/upgrade', { facility }),
}

export const youthAPI = {
  getSquads: () => api.get('/youth'),
  promotePlayer: (playerId: string, fromSquad: string, toSquad: string) => 
    api.post('/youth/promote', { playerId, fromSquad, toSquad }),
  releasePlayer: (playerId: string, squad: string) => 
    api.delete(`/youth/release/${playerId}/${squad}`),
  refreshSquad: () => api.post('/youth/refresh'),
  scoutPlayer: (usePremium?: boolean) => 
    api.post('/youth/scout', { usePremium }),
}

export const coachAPI = {
  getTeamCoaches: () => api.get('/coaches/team'),
  getAvailableCoaches: (type?: string) => api.get('/coaches/available', { params: { type } }),
  getTrainingBonus: () => api.get('/coaches/bonus'),
  hireCoach: (coachId: string, contractYears: number) => 
    api.post('/coaches/hire', { coachId, contractYears }),
  fireCoach: (coachId: string) => api.delete(`/coaches/fire/${coachId}`),
  generateCoaches: (count: number) => api.post('/coaches/generate', null, { params: { count } }),
}

export const socialAPI = {
  getFriends: () => api.get('/social/friends'),
  getPendingRequests: () => api.get('/social/requests'),
  searchUsers: (keyword: string) => api.get('/social/search', { params: { keyword } }),
  getFriendDynamics: () => api.get('/social/dynamics'),
  sendFriendRequest: (recipientId: string) => 
    api.post('/social/request', { recipientId }),
  acceptFriendRequest: (requestId: string) => 
    api.post(`/social/accept/${requestId}`),
  rejectFriendRequest: (requestId: string) => 
    api.post(`/social/reject/${requestId}`),
  removeFriend: (friendId: string) => 
    api.delete(`/social/friend/${friendId}`),
}
