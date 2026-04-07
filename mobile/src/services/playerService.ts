import apiClient from './api';
import {Player} from '../types';

export interface PlayersResponse {
  success: boolean;
  data: Player[];
  count: number;
}

export interface PlayerResponse {
  success: boolean;
  data: Player;
}

export const playerService = {
  async getAll(): Promise<PlayersResponse> {
    const response = await apiClient.get<PlayersResponse>('/players');
    return response.data;
  },

  async getById(id: string): Promise<PlayerResponse> {
    const response = await apiClient.get<PlayerResponse>(`/players/${id}`);
    return response.data;
  },

  async getByTeam(teamId: string): Promise<PlayersResponse> {
    const response = await apiClient.get<PlayersResponse>(`/players/team/${teamId}`);
    return response.data;
  },

  async create(player: Partial<Player>): Promise<PlayerResponse> {
    const response = await apiClient.post<PlayerResponse>('/players', player);
    return response.data;
  },

  async update(id: string, player: Partial<Player>): Promise<PlayerResponse> {
    const response = await apiClient.put<PlayerResponse>(`/players/${id}`, player);
    return response.data;
  },

  async delete(id: string): Promise<{success: boolean; message: string}> {
    const response = await apiClient.delete<{success: boolean; message: string}>(`/players/${id}`);
    return response.data;
  },
};
