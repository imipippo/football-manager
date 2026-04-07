import apiClient from './api';
import {Team} from '../types';

export interface TeamResponse {
  success: boolean;
  data: Team;
  message?: string;
}

export const teamService = {
  async getMyTeam(): Promise<TeamResponse> {
    const response = await apiClient.get<TeamResponse>('/teams/my');
    return response.data;
  },

  async getTeamById(id: string): Promise<TeamResponse> {
    const response = await apiClient.get<TeamResponse>(`/teams/${id}`);
    return response.data;
  },

  async createTeam(data: {name: string; shortName?: string}): Promise<TeamResponse> {
    const response = await apiClient.post<TeamResponse>('/teams', data);
    return response.data;
  },

  async updateTeam(data: Partial<Team>): Promise<TeamResponse> {
    const response = await apiClient.put<TeamResponse>('/teams', data);
    return response.data;
  },

  async addPlayer(playerId: string): Promise<TeamResponse> {
    const response = await apiClient.post<TeamResponse>('/teams/players', {playerId});
    return response.data;
  },

  async removePlayer(playerId: string): Promise<{success: boolean; message: string}> {
    const response = await apiClient.delete<{success: boolean; message: string}>(
      `/teams/players/${playerId}`,
    );
    return response.data;
  },
};
