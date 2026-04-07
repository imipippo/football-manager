import api from './api'

export interface MatchResult {
  _id: string
  homeTeam: {
    _id: string
    name: string
  }
  awayTeam: {
    _id: string
    name: string
  }
  homeScore: number
  awayScore: number
  events: MatchEvent[]
  status: 'scheduled' | 'playing' | 'finished'
  date: string
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow' | 'red' | 'substitution' | 'injury'
  team: 'home' | 'away'
  player: string
  assist?: string
  playerOut?: string
  playerIn?: string
}

export interface MatchStats {
  possession: { home: number; away: number }
  shots: { home: number; away: number }
  shotsOnTarget: { home: number; away: number }
  corners: { home: number; away: number }
  fouls: { home: number; away: number }
}

export const matchService = {
  getNextMatch: async (): Promise<MatchResult | null> => {
    const response = await api.get('/api/matches/next')
    return response.data
  },

  getMatchHistory: async (limit = 10): Promise<MatchResult[]> => {
    const response = await api.get('/api/matches/history', { params: { limit } })
    return response.data
  },

  simulateMatch: async (matchId: string): Promise<{ match: MatchResult; stats: MatchStats }> => {
    const response = await api.post(`/api/matches/${matchId}/simulate`)
    return response.data
  },

  getLeagueStandings: async (): Promise<{ team: { _id: string; name: string }; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; points: number }[]> => {
    const response = await api.get('/api/leagues/standings')
    return response.data
  },
}
