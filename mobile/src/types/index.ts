export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface Player {
  _id: string;
  name: string;
  age: number;
  nationality: string;
  position: PlayerPosition;
  overallRating: number;
  physical: PhysicalAttributes;
  technical: TechnicalAttributes;
  mental: MentalAttributes;
  team?: string;
  marketValue: number;
  wage: number;
  contractEnd: string;
}

export type PlayerPosition = 
  | 'GK' 
  | 'CB' 
  | 'LB' 
  | 'RB' 
  | 'CDM' 
  | 'CM' 
  | 'CAM' 
  | 'LM' 
  | 'RM' 
  | 'LW' 
  | 'RW' 
  | 'ST';

export interface PhysicalAttributes {
  pace: number;
  strength: number;
  stamina: number;
  agility: number;
  jumping: number;
}

export interface TechnicalAttributes {
  passing: number;
  shooting: number;
  dribbling: number;
  defending: number;
  heading: number;
  technique: number;
}

export interface MentalAttributes {
  vision: number;
  composure: number;
  positioning: number;
  decisions: number;
  leadership: number;
}

export interface Team {
  _id: string;
  name: string;
  shortName: string;
  logo?: string;
  owner: string;
  league: string;
  players: string[];
  tactics: TeamTactics;
  finance: TeamFinance;
  facilities: TeamFacilities;
  reputation: number;
}

export interface TeamTactics {
  formation: string;
  style: 'attacking' | 'balanced' | 'defensive' | 'counter';
  pressingIntensity: number;
  tempo: number;
  width: number;
}

export interface TeamFinance {
  budget: number;
  weeklyWage: number;
  weeklyIncome: number;
  weeklyExpense: number;
}

export interface TeamFacilities {
  stadiumLevel: number;
  trainingLevel: number;
  youthLevel: number;
  medicalLevel: number;
}

export interface League {
  _id: string;
  name: string;
  level: number;
  region: string;
  teams: string[];
  standings: LeagueStanding[];
  fixtures: Fixture[];
  season: number;
}

export interface LeagueStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Fixture {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  matchday: number;
  status: 'scheduled' | 'in_progress' | 'finished';
}

export interface Match {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  date: string;
  status: 'not_started' | 'first_half' | 'half_time' | 'second_half' | 'finished';
}

export interface MatchEvent {
  type: MatchEventType;
  minute: number;
  team: 'home' | 'away';
  player?: string;
  assistPlayer?: string;
  description: string;
}

export type MatchEventType = 
  | 'goal' 
  | 'assist' 
  | 'yellow_card' 
  | 'red_card' 
  | 'substitution' 
  | 'injury' 
  | 'penalty' 
  | 'own_goal';
