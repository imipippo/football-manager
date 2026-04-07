import { MatchContext, MatchEvent, EventType, TACTICAL_COUNTERS } from './types';

export class EventGenerator {
  private eventCount = 0;

  reset(): void {
    this.eventCount = 0;
  }

  generateEvent(context: MatchContext): MatchEvent | null {
    this.eventCount++;
    
    if (this.eventCount % 3 !== 0) {
      return null;
    }

    const probabilities = this.calculateEventProbabilities(context);
    const roll = Math.random() * 100;
    let cumulative = 0;

    for (const [eventType, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      if (roll < cumulative) {
        return this.createEvent(eventType as EventType, context);
      }
    }

    return this.createEvent('pass', context);
  }

  private calculateEventProbabilities(context: MatchContext): Record<EventType, number> {
    const baseProbabilities: Record<EventType, number> = {
      pass: 35,
      dribble: 15,
      shot: 8,
      tackle: 12,
      foul: 5,
      corner: 3,
      free_kick: 4,
      save: 8,
      goal: 2,
      penalty: 0.3,
      yellow_card: 1,
      red_card: 0.2,
      assist: 0,
      own_goal: 0.5,
    };

    if (context.ballZone === 'away_penalty' || context.ballZone === 'home_penalty') {
      baseProbabilities.shot = 20;
      baseProbabilities.goal = 5;
      baseProbabilities.save = 15;
    }

    if (context.minute > 75) {
      baseProbabilities.foul += 2;
      baseProbabilities.yellow_card += 1;
    }

    return baseProbabilities;
  }

  private createEvent(type: EventType, context: MatchContext): MatchEvent {
    const team = context.possession === 'home' || context.possession === 'away' ? context.possession : 'home';
    const players = team === 'home' ? context.homePlayers : context.awayPlayers;
    const player = this.selectPlayer(players, type);
    
    const success = this.calculateSuccess(type, context, player);
    const description = this.generateDescription(type, context, player, success);

    return {
      type,
      minute: context.minute,
      team,
      playerId: player?._id?.toString(),
      playerName: player?.name,
      success,
      description,
    };
  }

  private selectPlayer(players: any[], eventType: EventType): any {
    if (!players || players.length === 0) {
      return { name: 'Unknown Player', overallRating: 50 };
    }

    const weights = players.map((p: any) => {
      let weight = p.overallRating || 50;
      
      if (eventType === 'shot' || eventType === 'goal') {
        if (p.position === 'ST' || p.position === 'LW' || p.position === 'RW') {
          weight *= 2;
        }
      } else if (eventType === 'save') {
        if (p.position === 'GK') {
          weight *= 3;
        }
      } else if (eventType === 'tackle') {
        if (p.position === 'CB' || p.position === 'CDM') {
          weight *= 1.5;
        }
      }
      return weight;
    });
    const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (let i = 0; i < players.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return players[i];
      }
    }
    return players[0];
  }

  private calculateSuccess(eventType: EventType, context: MatchContext, player: any): boolean {
    const baseSuccessRates: Record<EventType, number> = {
      pass: 80,
      dribble: 60,
      shot: 30,
      tackle: 70,
      foul: 100,
      corner: 100,
      free_kick: 100,
      save: 70,
      goal: 20,
      penalty: 75,
      yellow_card: 100,
      red_card: 100,
      assist: 100,
      own_goal: 100,
    };

    let successRate = baseSuccessRates[eventType] || 50;
    if (player && player.overallRating) {
      const ratingModifier = (player.overallRating - 50) / 100;
      successRate += ratingModifier * 20;
    }
    if (context.ballZone === 'away_penalty' || context.ballZone === 'home_penalty') {
      if (eventType === 'shot') {
        successRate += 10;
      }
      if (eventType === 'goal') {
        successRate += 5;
      }
    }
    return Math.random() * 100 < successRate;
  }

  private generateDescription(type: EventType, context: MatchContext, player: any, success: boolean): string {
    const playerName = player?.name || 'A player';
    const descriptions: Record<EventType, { success: string[]; fail: string[] }> = {
      pass: {
        success: [`${playerName} completes a pass`, `Good pass from ${playerName}`],
        fail: [`${playerName} loses possession`, `Pass intercepted from ${playerName}`],
      },
      dribble: {
        success: [`${playerName} dribbles past a defender`, `Great dribble from ${playerName}`],
        fail: [`${playerName} is dispossessed`, `${playerName} loses the ball`],
      },
      shot: {
        success: [`${playerName} takes a shot on target!`, `${playerName} fires a shot!`],
        fail: [`${playerName}'s shot goes wide`, `${playerName} misses the target`],
      },
      goal: {
        success: [`GOAL! ${playerName} scores!`, `GOAL! ${playerName} finds the net!`],
        fail: [`${playerName} misses a chance`, `Shot saved from ${playerName}`],
      },
      tackle: {
        success: [`${playerName} makes a clean tackle`, `${playerName} wins the ball`],
        fail: [`${playerName} fails to tackle`, `${playerName} is beaten`],
      },
      foul: {
        success: [`${playerName} commits a foul`, `Foul by ${playerName}`],
        fail: [`${playerName} commits a foul`],
      },
      corner: {
        success: [`Corner kick awarded`, `Corner for the attacking team`],
        fail: [`Corner kick awarded`],
      },
      free_kick: {
        success: [`Free kick awarded`, `Free kick in a dangerous position`],
        fail: [`Free kick awarded`],
      },
      save: {
        success: [`${playerName} makes a save!`, `Great save by ${playerName}!`],
        fail: [`${playerName} concedes a chance`],
      },
      penalty: {
        success: [`PENALTY! ${playerName} scores from the spot!`, `PENALTY GOAL! ${playerName} converts!`],
        fail: [`PENALTY SAVED! ${playerName} denied!`, `PENALTY MISSED by ${playerName}!`],
      },
      yellow_card: {
        success: [`Yellow card shown to ${playerName}`, `${playerName} is booked`],
        fail: [`Yellow card for ${playerName}`],
      },
      red_card: {
        success: [`RED CARD! ${playerName} is sent off!`, `${playerName} receives a red card!`],
        fail: [`Red card for ${playerName}`],
      },
      assist: {
        success: [`Assist from ${playerName}`, `${playerName} provides the assist`],
        fail: [`Assist from ${playerName}`],
      },
      own_goal: {
        success: [`OWN GOAL! ${playerName} scores for the opposition!`, `Unfortunate own goal by ${playerName}`],
        fail: [`Own goal by ${playerName}`],
      },
    };
    const category = descriptions[type] || descriptions.pass;
    const options = success ? category.success : category.fail;
    return options[Math.floor(Math.random() * options.length)];
  }
}

export default EventGenerator;
