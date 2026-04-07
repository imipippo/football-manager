import { Request, Response } from 'express';
import Player from '../schemas/Player';
import Team from '../schemas/Team';
import TrainingRecord from '../schemas/TrainingRecord';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const getAgeCoefficient = (age: number): number => {
  if (age <= 18) return 1.5;
  if (age <= 22) return 1.3;
  if (age <= 26) return 1.1;
  if (age <= 30) return 1.0;
  if (age <= 33) return 0.8;
  if (age <= 36) return 0.5;
  return 0.2;
};

const getPotentialCoefficient = (potential: number, currentRating: number): number => {
  const potentialLevel = potential >= 90 ? 1.5 : potential >= 80 ? 1.3 : potential >= 70 ? 1.1 : 0.9;
  const gapCoefficient = 1 - currentRating / potential;
  return potentialLevel * (0.5 + gapCoefficient * 0.5);
};

const getPositionCoefficient = (position: string, attribute: string): number => {
  const positionAttributeWeights: Record<string, Record<string, number>> = {
    GK: { pace: 0.8, strength: 1.0, stamina: 0.8, agility: 1.2, jumping: 1.5, passing: 0.8, shooting: 0.3, dribbling: 0.5, defending: 1.0, heading: 1.0, technique: 0.8, vision: 0.8, composure: 1.0, positioning: 1.5, decisions: 1.0, leadership: 1.0 },
    CB: { pace: 0.9, strength: 1.3, stamina: 0.9, agility: 0.8, jumping: 1.2, passing: 0.9, shooting: 0.5, dribbling: 0.6, defending: 1.5, heading: 1.3, technique: 0.7, vision: 0.8, composure: 1.0, positioning: 1.3, decisions: 1.1, leadership: 1.0 },
    LB: { pace: 1.3, strength: 0.8, stamina: 1.2, agility: 1.1, jumping: 0.9, passing: 1.1, shooting: 0.6, dribbling: 1.0, defending: 1.2, heading: 0.8, technique: 1.0, vision: 1.0, composure: 0.9, positioning: 1.1, decisions: 1.0, leadership: 0.9 },
    RB: { pace: 1.3, strength: 0.8, stamina: 1.2, agility: 1.1, jumping: 0.9, passing: 1.1, shooting: 0.6, dribbling: 1.0, defending: 1.2, heading: 0.8, technique: 1.0, vision: 1.0, composure: 0.9, positioning: 1.1, decisions: 1.0, leadership: 0.9 },
    CDM: { pace: 0.8, strength: 1.1, stamina: 1.2, agility: 0.9, jumping: 0.9, passing: 1.1, shooting: 0.6, dribbling: 0.8, defending: 1.4, heading: 1.0, technique: 0.9, vision: 1.1, composure: 1.2, positioning: 1.2, decisions: 1.2, leadership: 1.1 },
    CM: { pace: 1.0, strength: 0.9, stamina: 1.2, agility: 1.0, jumping: 0.8, passing: 1.3, shooting: 0.9, dribbling: 1.1, defending: 1.0, heading: 0.8, technique: 1.2, vision: 1.3, composure: 1.1, positioning: 1.1, decisions: 1.2, leadership: 1.0 },
    CAM: { pace: 1.0, strength: 0.7, stamina: 0.9, agility: 1.2, jumping: 0.6, passing: 1.4, shooting: 1.2, dribbling: 1.3, defending: 0.5, heading: 0.6, technique: 1.3, vision: 1.4, composure: 1.2, positioning: 1.1, decisions: 1.3, leadership: 1.0 },
    LM: { pace: 1.4, strength: 0.7, stamina: 1.2, agility: 1.1, jumping: 0.7, passing: 1.1, shooting: 1.0, dribbling: 1.2, defending: 0.7, heading: 0.7, technique: 1.1, vision: 1.0, composure: 1.0, positioning: 1.0, decisions: 1.0, leadership: 0.9 },
    RM: { pace: 1.4, strength: 0.7, stamina: 1.2, agility: 1.1, jumping: 0.7, passing: 1.1, shooting: 1.0, dribbling: 1.2, defending: 0.7, heading: 0.7, technique: 1.1, vision: 1.0, composure: 1.0, positioning: 1.0, decisions: 1.0, leadership: 0.9 },
    LW: { pace: 1.5, strength: 0.6, stamina: 1.0, agility: 1.3, jumping: 0.6, passing: 1.0, shooting: 1.2, dribbling: 1.4, defending: 0.4, heading: 0.6, technique: 1.2, vision: 1.0, composure: 1.1, positioning: 1.0, decisions: 1.0, leadership: 0.8 },
    RW: { pace: 1.5, strength: 0.6, stamina: 1.0, agility: 1.3, jumping: 0.6, passing: 1.0, shooting: 1.2, dribbling: 1.4, defending: 0.4, heading: 0.6, technique: 1.2, vision: 1.0, composure: 1.1, positioning: 1.0, decisions: 1.0, leadership: 0.8 },
    ST: { pace: 1.2, strength: 1.0, stamina: 0.9, agility: 1.0, jumping: 1.1, passing: 0.8, shooting: 1.5, dribbling: 1.1, defending: 0.3, heading: 1.2, technique: 1.1, vision: 0.9, composure: 1.2, positioning: 1.3, decisions: 1.0, leadership: 0.9 },
  };
  
  return positionAttributeWeights[position]?.[attribute] || 1.0;
};

const calculateTrainingCost = (overallRating: number): number => {
  if (overallRating < 60) return 100000;
  if (overallRating < 70) return 200000;
  if (overallRating < 80) return 300000;
  if (overallRating < 90) return 400000;
  return 500000;
};

const getTodayStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const applyTrainingToAttribute = (player: any, attribute: string, improvement: number): boolean => {
  const attributeParts = attribute.split('.');
  if (attributeParts.length === 2) {
    const [category, attr] = attributeParts;
    if (player[category] && typeof player[category][attr] === 'number') {
      const currentValue = player[category][attr];
      const newValue = Math.min(100, Math.max(1, currentValue + improvement));
      player[category][attr] = Math.round(newValue * 100) / 100;
      return true;
    }
  }
  return false;
};

export const trainPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId } = req.params;
    const { type, attribute } = req.body;

    if (!['free', 'fc', 'premium'].includes(type)) {
      res.status(400).json({ success: false, message: '无效的训练类型' });
      return;
    }

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }
    const player = await Player.findById(playerId);
    if (!player) {
      res.status(404).json({ success: false, message: '未找到球员' });
      return;
    }
    if (!player.team || !player.team.equals(team._id)) {
      res.status(403).json({ success: false, message: '该球员不在您的球队中' });
      return;
    }
    if (player.status.injury > 0) {
      res.status(400).json({ success: false, message: '受伤球员无法训练' });
      return;
    }
    const todayStart = getTodayStart();
    const existingTraining = await TrainingRecord.findOne({
      playerId,
      type,
      date: { $gte: todayStart }
    });
    if (existingTraining) {
      res.status(400).json({ 
        success: false, 
        message: type === 'free' ? '今日已使用免费训练' : type === 'fc' ? '今日已使用FC训练' : '本赛季游戏币训练次数已用完'
      });
      return;
    }
    const ageCoef = getAgeCoefficient(player.age);
    const potentialCoef = getPotentialCoefficient(player.potential, player.overallRating);
    
    let baseImprovement: number;
    let cost = 0;
    switch (type) {
      case 'free':
        baseImprovement = 0.01;
        break;
      case 'fc':
        baseImprovement = 0.2;
        cost = calculateTrainingCost(player.overallRating);
        if (team.finance.budget < cost) {
          res.status(400).json({ success: false, message: '预算不足' });
          return;
        }
        break;
      case 'premium':
        baseImprovement = 0.5;
        cost = 15;
        break;
      default:
        baseImprovement = 0.01;
    }
    let totalImprovement = 0;
    if (type === 'free') {
      const allAttributes = [
        'physical.pace', 'physical.strength', 'physical.stamina', 'physical.agility', 'physical.jumping',
        'technical.passing', 'technical.shooting', 'technical.dribbling', 'technical.defending', 'technical.heading', 'technical.technique',
        'mental.vision', 'mental.composure', 'mental.positioning', 'mental.decisions', 'mental.leadership'
      ];
      for (const attr of allAttributes) {
        const posCoef = getPositionCoefficient(player.position, attr.split('.')[1]);
        const improvement = baseImprovement * ageCoef * posCoef * potentialCoef;
        if (applyTrainingToAttribute(player, attr, improvement)) {
          totalImprovement += improvement;
        }
      }
    } else {
      if (!attribute) {
        res.status(400).json({ success: false, message: '请指定要训练的属性' });
        return;
      }
      const posCoef = getPositionCoefficient(player.position, attribute.split('.')[1]);
      const improvement = baseImprovement * ageCoef * posCoef * potentialCoef;
      if (applyTrainingToAttribute(player, attribute, improvement)) {
        totalImprovement = improvement;
      }
    }
    if (type === 'fc') {
      team.finance.budget -= cost;
      await team.save();
    }
    player.status.fatigue = Math.min(100, player.status.fatigue + (type === 'free' ? 3 : 5));
    await player.save();
    await TrainingRecord.create({
      playerId: player._id,
      teamId: team._id,
      type,
      attribute,
      improvement: totalImprovement,
      cost,
      date: new Date(),
    });
    logger.info(`Player ${player.name} trained (${type}): +${totalImprovement.toFixed(2)}`);
    res.json({
      success: true,
      data: {
        player,
        training: {
          type,
          attribute: type === 'free' ? 'all' : attribute,
          improvement: Math.round(totalImprovement * 100) / 100,
          cost,
          coefficients: {
            age: ageCoef,
            potential: potentialCoef,
          }
        }
      },
      message: '训练完成'
    });
  } catch (error) {
    logger.error('Train player error:', error);
    res.status(500).json({ success: false, message: '训练失败' });
  }
};
export const getTrainingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId } = req.params;
    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }
    const player = await Player.findById(playerId);
    if (!player) {
      res.status(404).json({ success: false, message: '未找到球员' });
      return;
    }
    const todayStart = getTodayStart();
    const todayRecords = await TrainingRecord.find({
      playerId,
      date: { $gte: todayStart }
    });
    res.json({
      success: true,
      data: {
        playerId,
        playerName: player.name,
        todayTraining: {
          free: todayRecords.some(r => r.type === 'free'),
          fc: todayRecords.some(r => r.type === 'fc'),
          premium: todayRecords.filter(r => r.type === 'premium').length,
        },
        fatigue: player.status.fatigue,
        injury: player.status.injury,
        canTrain: player.status.injury === 0,
        trainingCost: calculateTrainingCost(player.overallRating),
        coefficients: {
          age: getAgeCoefficient(player.age),
          potential: getPotentialCoefficient(player.potential, player.overallRating),
        }
      }
    });
  } catch (error) {
    logger.error('Get training status error:', error);
    res.status(500).json({ success: false, message: '获取训练状态失败' });
  }
};
export const getTeamTrainingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const team = await Team.findOne({ owner: userId }).populate('players');
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }
    const todayStart = getTodayStart();
    const todayRecords = await TrainingRecord.find({
      teamId: team._id,
      date: { $gte: todayStart }
    });
    const playersStatus = (team.players as any[]).map(player => {
      const playerRecords = todayRecords.filter(r => r.playerId.toString() === player._id.toString());
      return {
        _id: player._id,
        name: player.name,
        position: player.position,
        overallRating: player.overallRating,
        fatigue: player.status.fatigue,
        injury: player.status.injury,
        todayTraining: {
          free: playerRecords.some(r => r.type === 'free'),
          fc: playerRecords.some(r => r.type === 'fc'),
        }
      };
    });
    res.json({
      success: true,
      data: {
        team: {
          name: team.name,
          budget: team.finance.budget,
          trainingLevel: team.facilities.trainingLevel,
        },
        players: playersStatus,
      }
    });
  } catch (error) {
    logger.error('Get team training status error:', error);
    res.status(500).json({ success: false, message: '获取球队训练状态失败' });
  }
};
