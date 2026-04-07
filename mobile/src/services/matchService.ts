import apiClient from './api';

export interface MatchResult {
  success: boolean;
  data: {
    homeTeam: {
      id: string;
      name: string;
      score: number;
    };
    awayTeam: {
      id: string;
      name: string;
      score: number;
    };
    events: any[];
    statistics: {
      possession: {home: number; away: number};
      shots: {home: number; away: number};
      shotsOnTarget: {home: number; away: number};
      corners: {home: number; away: number};
      fouls: {home: number; away: number};
      yellowCards: {home: number; away: number};
      redCards: {home: number; away: number};
    };
  };
}

export const matchService = {
  async simulate(data: {homeTeamId: string; awayTeamId: string}): Promise<MatchResult> {
    const response = await apiClient.post<MatchResult>('/matches/simulate', data);
    return response.data;
  },

  async getFixtures(): Promise<{success: boolean; data: any[]}> {
    const response = await apiClient.get<{success: boolean; data: any[]}>('/matches/fixtures');
    return response.data;
  },
};
