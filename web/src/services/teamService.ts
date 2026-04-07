import api from './api'

export interface Player {
  _id: string
  name: string
  position: string
  rating: number
  age: number
  nationality: string
  stats: {
    pace: number
    shooting: number
    passing: number
    dribbling: number
    defending: number
    physical: number
  }
  marketValue: number
  form: number
  fitness: number
  morale: number
}

export interface Team {
  _id: string
  name: string
  budget: number
  reputation: number
  formation: string
  players: Player[]
  tactics?: {
    style: string
    tempo: string
    pressing: number
  }
}

export const teamService = {
  getMyTeam: async (): Promise<Team> => {
    const response = await api.get('/api/teams/my')
    return response.data
  },

  createTeam: async (name: string, formation: string): Promise<Team> => {
    const response = await api.post('/api/teams', { name, formation })
    return response.data
  },

  updateFormation: async (formation: string): Promise<Team> => {
    const response = await api.put('/api/teams/formation', { formation })
    return response.data
  },

  updateTactics: async (tactics: { style: string; tempo: string; pressing: number }): Promise<Team> => {
    const response = await api.put('/api/teams/tactics', tactics)
    return response.data
  },

  getAvailablePlayers: async (filters?: { position?: string; minRating?: number; maxPrice?: number }): Promise<Player[]> => {
    const response = await api.get('/api/players/available', { params: filters })
    return response.data
  },

  buyPlayer: async (playerId: string): Promise<{ team: Team; player: Player }> => {
    const response = await api.post(`/api/players/${playerId}/buy`)
    return response.data
  },

  sellPlayer: async (playerId: string): Promise<{ team: Team; price: number }> => {
    const response = await api.post(`/api/players/${playerId}/sell`)
    return response.data
  },
}
