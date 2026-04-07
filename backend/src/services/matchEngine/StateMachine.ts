import { MatchContext } from './types';

export class StateMachine {
  updateState(context: MatchContext): void {
    if (context.state === 'not_started' && context.minute >= 1) {
      context.state = 'first_half';
    } else if (context.state === 'first_half' && context.minute >= 45) {
      context.state = 'half_time';
    } else if (context.state === 'half_time' && context.minute >= 46) {
      context.state = 'second_half';
    } else if (context.state === 'second_half' && context.minute >= 90) {
      context.state = 'finished';
    }
  }

  updatePossession(context: MatchContext): void {
    const random = Math.random();
    if (random < 0.45) {
      context.possession = 'home';
    } else if (random < 0.9) {
      context.possession = 'away';
    } else {
      context.possession = 'contest';
    }
  }

  updateBallZone(context: MatchContext): void {
    const zones: MatchContext['ballZone'][] = [
      'home_defense',
      'home_midfield',
      'away_midfield',
      'away_defense',
      'home_penalty',
      'away_penalty',
    ];
    
    const random = Math.random();
    
    if (context.possession === 'home') {
      if (random < 0.3) {
        context.ballZone = 'away_penalty';
      } else if (random < 0.5) {
        context.ballZone = 'away_defense';
      } else if (random < 0.7) {
        context.ballZone = 'away_midfield';
      } else if (random < 0.85) {
        context.ballZone = 'home_midfield';
      } else {
        context.ballZone = 'home_defense';
      }
    } else if (context.possession === 'away') {
      if (random < 0.3) {
        context.ballZone = 'home_penalty';
      } else if (random < 0.5) {
        context.ballZone = 'home_defense';
      } else if (random < 0.7) {
        context.ballZone = 'home_midfield';
      } else if (random < 0.85) {
        context.ballZone = 'away_midfield';
      } else {
        context.ballZone = 'away_defense';
      }
    } else {
      context.ballZone = zones[Math.floor(Math.random() * 4)];
    }
  }
}

export default StateMachine;
