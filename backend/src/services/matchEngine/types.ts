export type MatchState = 'not_started' | 'first_half' | 'half_time' | 'second_half' | 'finished';
export type BallZone = 'home_defense' | 'home_midfield' | 'away_midfield' | 'away_defense' | 'home_penalty' | 'away_penalty';
export type Possession = 'home' | 'away' | 'contest';

export interface MatchContext {
  state: MatchState;
  minute: number;
  ballZone: BallZone;
  possession: Possession;
  homeScore: number;
  awayScore: number;
  homeTeam: any;
  awayTeam: any;
  events: MatchEvent[];
  homePlayers: any[];
  awayPlayers: any[];
  homeTactics: any;
  awayTactics: any;
}

export type EventType = 'pass' | 'shot' | 'goal' | 'foul' | 'corner' | 'free_kick' | 'penalty' | 'yellow_card' | 'red_card' | 'save' | 'tackle' | 'dribble' | 'assist' | 'own_goal';

export interface MatchEvent {
  type: EventType;
  minute: number;
  team: 'home' | 'away';
  playerId?: string;
  playerName?: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  success: boolean;
  description: string;
}

export interface TacticalCounter {
  pressing: number;
  counterAttack: number;
  possession: number;
  wingPlay: number;
}

export const TACTICAL_COUNTERS: Record<string, TacticalCounter> = {
  pressing: { pressing: 0, counterAttack: -15, possession: 10, wingPlay: -5 },
  counterAttack: { pressing: -15, counterAttack: 0, possession: -10, wingPlay: 5 },
  possession: { pressing: 10, counterAttack: -10, possession: 0, wingPlay: -5 },
  wingPlay: { pressing: -5, counterAttack: 5, possession: -5, wingPlay: 0 },
};

export const POSITION_WEIGHTS: Record<string, { physical: number; technical: number; mental: number; iq: number }> = {
  GK: { physical: 0.2, technical: 0.5, mental: 0.2, iq: 0.1 },
  CB: { physical: 0.35, technical: 0.35, mental: 0.2, iq: 0.1 },
  LB: { physical: 0.3, technical: 0.35, mental: 0.25, iq: 0.1 },
  RB: { physical: 0.3, technical: 0.35, mental: 0.25, iq: 0.1 },
  CDM: { physical: 0.25, technical: 0.35, mental: 0.3, iq: 0.1 },
  CM: { physical: 0.2, technical: 0.4, mental: 0.3, iq: 0.1 },
  CAM: { physical: 0.15, technical: 0.45, mental: 0.3, iq: 0.1 },
  LM: { physical: 0.25, technical: 0.4, mental: 0.25, iq: 0.1 },
  RM: { physical: 0.25, technical: 0.4, mental: 0.25, iq: 0.1 },
  LW: { physical: 0.25, technical: 0.4, mental: 0.25, iq: 0.1 },
  RW: { physical: 0.25, technical: 0.4, mental: 0.25, iq: 0.1 },
  ST: { physical: 0.25, technical: 0.4, mental: 0.25, iq: 0.1 },
};
