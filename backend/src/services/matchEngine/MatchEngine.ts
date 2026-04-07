import { StateMachine } from './StateMachine';
import { EventGenerator } from './EventGenerator';
import { MatchContext, MatchEvent, EventType, TACTICAL_COUNTERS } from './types';

export class MatchEngine {
  private stateMachine: StateMachine;
  private eventGenerator: EventGenerator;

  constructor() {
    this.stateMachine = new StateMachine();
    this.eventGenerator = new EventGenerator();
  }

  async simulate(homeTeam: any, awayTeam: any): Promise<{
    events: MatchEvent[];
    homeScore: number;
    awayScore: number;
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    homeCorners: number;
    awayCorners: number;
    homeFouls: number;
    awayFouls: number;
    homeYellowCards: number;
    awayYellowCards: number;
    homeRedCards: number;
    awayRedCards: number;
  }> {
    const context: MatchContext = {
      state: 'not_started',
      minute: 0,
      ballZone: 'home_midfield',
      possession: 'home',
      homeScore: 0,
      awayScore: 0,
      homeTeam,
      awayTeam,
      events: [],
      homePlayers: homeTeam.players || [],
      awayPlayers: awayTeam.players || [],
      homeTactics: homeTeam.tactics || { formation: '4-4-2', style: 'balanced' },
      awayTactics: awayTeam.tactics || { formation: '4-4-2', style: 'balanced' },
    };
    this.eventGenerator.reset();
    const tacticalModifier = this.calculateTacticalModifier(
      context.homeTactics?.style || 'balanced',
      context.awayTactics?.style || 'balanced'
    );
    const homePossessionCount = { value: 0 };
    const awayPossessionCount = { value: 0 };
    const stats = {
      homeShots: 0,
      awayShots: 0,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
      homeCorners: 0,
      awayCorners: 0,
      homeFouls: 0,
      awayFouls: 0,
      homeYellowCards: 0,
      awayYellowCards: 0,
      homeRedCards: 0,
      awayRedCards: 0,
    };
    for (let minute = 1; minute <= 90; minute++) {
      context.minute = minute;
      this.stateMachine.updateState(context);
      if (context.state === 'half_time') {
        continue;
      }
      this.stateMachine.updatePossession(context);
      this.stateMachine.updateBallZone(context);
      if (context.possession === 'home') {
        homePossessionCount.value++;
      } else {
        awayPossessionCount.value++;
      }
      const event = this.eventGenerator.generateEvent(context);
      if (event) {
        this.applyTacticalModifierToEvent(event, tacticalModifier);
        context.events.push(event);
        this.processEvent(event, context, stats);
      }
    }
    context.state = 'finished';
    const totalPossession = homePossessionCount.value + awayPossessionCount.value;
    return {
      events: context.events,
      homeScore: context.homeScore,
      awayScore: context.awayScore,
      homePossession: Math.round((homePossessionCount.value / totalPossession) * 100),
      awayPossession: Math.round((awayPossessionCount.value / totalPossession) * 100),
      ...stats,
    };
  }

  private calculateTacticalModifier(homeStyle: string, awayStyle: string): number {
    const homeCounters = TACTICAL_COUNTERS[homeStyle] || TACTICAL_COUNTERS.balanced;
    const awayCounters = TACTICAL_COUNTERS[awayStyle] || TACTICAL_COUNTERS.balanced;
    let modifier = 0;
    modifier += homeCounters[awayStyle as keyof typeof homeCounters] || 0;
    modifier -= awayCounters[homeStyle as keyof typeof awayCounters] || 0;
    return modifier;
  }

  private applyTacticalModifierToEvent(event: MatchEvent, modifier: number): void {
    if (event.type === 'shot' || event.type === 'goal') {
      if (modifier > 0 && event.team === 'home') {
        event.success = event.success || Math.random() < modifier / 100;
      } else if (modifier < 0 && event.team === 'away') {
        event.success = event.success || Math.random() < Math.abs(modifier) / 100;
      }
    }
  }

  private processEvent(event: MatchEvent, context: MatchContext, stats: any): void {
    switch (event.type) {
      case 'goal':
        if (event.success) {
          if (event.team === 'home') {
            context.homeScore++;
          } else {
            context.awayScore++;
          }
        }
        break;
      case 'shot':
        if (event.team === 'home') {
          stats.homeShots++;
          if (event.success) stats.homeShotsOnTarget++;
        } else {
          stats.awayShots++;
          if (event.success) stats.awayShotsOnTarget++;
        }
        break;
      case 'corner':
        if (event.team === 'home') {
          stats.homeCorners++;
        } else {
          stats.awayCorners++;
        }
        break;
      case 'foul':
        if (event.team === 'home') {
          stats.homeFouls++;
        } else {
          stats.awayFouls++;
        }
        break;
      case 'yellow_card':
        if (event.team === 'home') {
          stats.homeYellowCards++;
        } else {
          stats.awayYellowCards++;
        }
        break;
      case 'red_card':
        if (event.team === 'home') {
          stats.homeRedCards++;
        } else {
          stats.awayRedCards++;
        }
        break;
    }
  }
}

export default MatchEngine;
