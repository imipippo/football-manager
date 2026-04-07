import { Request, Response } from 'express';
import Team from '../schemas/Team';
import { MatchEngine } from '../services/matchEngine';
import { AuthRequest } from '../middleware/auth';

export const getNextMatch = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }

    const opponents = ['曼联', '切尔西', '阿森纳', '利物浦', '热刺', '曼城'];
    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
    
    const nextMatch = {
      opponent: randomOpponent,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
      competition: '英超联赛',
      venue: '主场',
    };

    res.json({
      success: true,
      data: nextMatch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取下一场比赛失败',
    });
  }
};

export const getMatchHistory = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }

    const history = [
      { opponent: '利物浦', result: '2-1', date: '2026-03-28', competition: '英超' },
      { opponent: '阿森纳', result: '1-1', date: '2026-03-21', competition: '英超' },
      { opponent: '切尔西', result: '3-0', date: '2026-03-14', competition: '英超' },
    ];

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取比赛历史失败',
    });
  }
};

export const simulateMatch = async (req: Request, res: Response) => {
  try {
    const { homeTeamId, awayTeamId } = req.body;
    
    const homeTeam = await Team.findById(homeTeamId).populate('players');
    const awayTeam = await Team.findById(awayTeamId).populate('players');
    
    if (!homeTeam || !awayTeam) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }
    
    const homeTeamData = {
      _id: homeTeam._id.toString(),
      name: homeTeam.name,
      players: homeTeam.players || [],
      tactics: {
        formation: homeTeam.tactics?.formation || '4-4-2',
        style: homeTeam.tactics?.style || 'balanced',
      },
      overallRating: calculateTeamOverall(homeTeam.players),
    };
    
    const awayTeamData = {
      _id: awayTeam._id.toString(),
      name: awayTeam.name,
      players: awayTeam.players || [],
      tactics: {
        formation: awayTeam.tactics?.formation || '4-4-2',
        style: awayTeam.tactics?.style || 'balanced',
      },
      overallRating: calculateTeamOverall(awayTeam.players),
    };
    
    const engine = new MatchEngine();
    const result = await engine.simulate(homeTeamData, awayTeamData);
    
    res.json({
      success: true,
      data: {
        homeTeam: {
          id: homeTeam._id,
          name: homeTeam.name,
          score: result.homeScore,
        },
        awayTeam: {
          id: awayTeam._id,
          name: awayTeam.name,
          score: result.awayScore,
        },
        events: result.events,
        statistics: {
          possession: {
            home: result.homePossession,
            away: result.awayPossession,
          },
          shots: {
            home: result.homeShots,
            away: result.awayShots,
          },
          shotsOnTarget: {
            home: result.homeShotsOnTarget,
            away: result.awayShotsOnTarget,
          },
          corners: {
            home: result.homeCorners,
            away: result.awayCorners,
          },
          fouls: {
            home: result.homeFouls,
            away: result.awayFouls,
          },
          yellowCards: {
            home: result.homeYellowCards,
            away: result.awayYellowCards,
          },
          redCards: {
            home: result.homeRedCards,
            away: result.awayRedCards,
          },
        },
      },
    });
  } catch (error) {
    console.error('Match simulation error:', error);
    res.status(500).json({
      success: false,
      message: '模拟比赛失败',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
};

export const getFixtures = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: [],
      message: '赛程功能待实现',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取赛程失败',
    });
  }
};

function calculateTeamOverall(players: any[]): number {
  if (!players || players.length === 0) return 50;
  
  const totalRating = players.reduce((sum, player) => {
    return sum + (player.overallRating || 50);
  }, 0);
  
  return Math.round(totalRating / players.length);
}
