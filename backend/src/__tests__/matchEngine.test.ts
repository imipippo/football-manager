import { StateMachine } from '../services/matchEngine/StateMachine';
import { EventGenerator } from '../services/matchEngine/EventGenerator';
import { MatchEngine } from '../services/matchEngine/MatchEngine';
import { MatchContext, MatchEvent } from '../services/matchEngine/types';

describe('StateMachine', () => {
  let stateMachine: StateMachine;

  beforeEach(() => {
    stateMachine = new StateMachine();
  });

  describe('initialization', () => {
    it('should start with not_started state', () => {
      const context = createMatchContext('not_started', 0);
      stateMachine.updateState(context);
      expect(context.state).toBe('first_half');
    });
  });

  describe('state transitions', () => {
    it('should transition from first_half to half_time at minute 45', () => {
      const context = createMatchContext('first_half', 45);
      stateMachine.updateState(context);
      expect(context.state).toBe('half_time');
    });

    it('should transition from half_time to second_half at minute 46', () => {
      const context = createMatchContext('half_time', 46);
      stateMachine.updateState(context);
      expect(context.state).toBe('second_half');
    });
  });
});

function createMatchContext(state: string, minute: number): MatchContext {
  return {
    state: state as any,
    minute,
    ballZone: 'home_midfield',
    possession: 'home',
    homeScore: 0,
    awayScore: 0,
    homeTeam: null,
    awayTeam: null,
    events: [],
    homePlayers: [],
    awayPlayers: [],
    homeTactics: null,
    awayTactics: null,
  };
}
