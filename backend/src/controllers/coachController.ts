import { Request, Response } from 'express';
import Coach from '../schemas/Coach';
import Team from '../schemas/Team';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const coachNames = [
  '张伟', '李强', '王磊', '刘洋', '陈杰',
  'Carlos Mendes', 'Marco Rossi', 'Hans Mueller', 'Pierre Dupont', 'John Smith',
  'Jose Garcia', 'Antonio Fernandez', 'Michael Brown', 'David Wilson', 'Robert Johnson',
];

const generateCoachName = (): string => {
  return coachNames[Math.floor(Math.random() * coachNames.length)];
};

const generateCoachAttributes = (type: string): Record<string, number> => {
  const baseValue = Math.floor(Math.random() * 30) + 50;
  
  const typeBonus: Record<string, Record<string, number>> = {
    head: { coaching: 10, motivation: 5, tactical: 5 },
    goalkeeper: { technical: 15, coaching: 5 },
    fitness: { fitness: 20 },
    defense: { tactical: 10, technical: 5 },
    attack: { technical: 10, tactical: 5 },
    assistant: { coaching: 10, motivation: 5 },
    youth: { youth: 15, coaching: 5 },
    psychology: { motivation: 20 },
    analyst: { tactical: 15 },
  };
  
  const bonus = typeBonus[type] || {};
  
  return {
    coaching: Math.min(99, baseValue + (bonus.coaching || 0)),
    motivation: Math.min(99, baseValue + (bonus.motivation || 0)),
    tactical: Math.min(99, baseValue + (bonus.tactical || 0)),
    technical: Math.min(99, baseValue + (bonus.technical || 0)),
    fitness: Math.min(99, baseValue + (bonus.fitness || 0)),
    youth: Math.min(99, baseValue + (bonus.youth || 0)),
  };
};

const calculateOverallRating = (coach: any): number => {
  const typeWeights: Record<string, Record<string, number>> = {
    head: { coaching: 0.3, motivation: 0.2, tactical: 0.2, technical: 0.15, fitness: 0.1, youth: 0.05 },
    goalkeeper: { technical: 0.5, coaching: 0.3, motivation: 0.1, tactical: 0.1 },
    fitness: { fitness: 0.6, coaching: 0.2, motivation: 0.1, youth: 0.1 },
    defense: { tactical: 0.3, technical: 0.3, coaching: 0.2, motivation: 0.1, fitness: 0.1 },
    attack: { technical: 0.3, tactical: 0.3, coaching: 0.2, motivation: 0.1, fitness: 0.1 },
    assistant: { coaching: 0.4, motivation: 0.3, tactical: 0.1, technical: 0.1, fitness: 0.05, youth: 0.05 },
    youth: { youth: 0.5, coaching: 0.3, motivation: 0.1, technical: 0.1 },
    psychology: { motivation: 0.6, coaching: 0.2, tactical: 0.1, youth: 0.1 },
    analyst: { tactical: 0.5, technical: 0.2, coaching: 0.2, motivation: 0.1 },
  };
  
  const weights = typeWeights[coach.type] || {};
  let total = 0;
  
  for (const [attr, weight] of Object.entries(weights)) {
    const value = coach.attributes?.[attr] || 50;
    total += value * weight;
  }
  
  return Math.round(total);
};

const calculateTrainingBonus = (coach: any, attribute: string): number => {
  const typeBonuses: Record<string, Record<string, number>> = {
    head: { coaching: 1.0, motivation: 0.8, tactical: 0.8, technical: 0.7, fitness: 0.6, youth: 0.5 },
    goalkeeper: { technical: 1.2, coaching: 0.8 },
    fitness: { fitness: 1.5, coaching: 0.5 },
    defense: { tactical: 1.2, technical: 1.0, coaching: 0.6 },
    attack: { tactical: 1.0, technical: 1.2, coaching: 0.6 },
    assistant: { coaching: 1.0, motivation: 0.8, tactical: 0.5 },
    youth: { youth: 1.5, coaching: 0.8 },
    psychology: { motivation: 1.5, coaching: 0.5 },
    analyst: { tactical: 1.2, coaching: 0.4 },
  };
  
  const bonuses = typeBonuses[coach.type] || {};
  const attributeBonus = bonuses[attribute] || 0;
  const attributeValue = coach.attributes?.[attribute] || 50;
  
  return Math.round(attributeBonus * attributeValue / 100 * 100) / 100;
};

const calculateCoachWage = (coach: any): number => {
  const overallRating = calculateOverallRating(coach);
  const typeMultiplier: Record<string, number> = {
    head: 3.0,
    goalkeeper: 1.5,
    fitness: 1.2,
    defense: 1.5,
    attack: 1.5,
    assistant: 1.0,
    youth: 1.0,
    psychology: 1.2,
    analyst: 1.0,
  };
  
  return Math.round(overallRating * 500 * (typeMultiplier[coach.type] || 1));
};

export const getTeamCoaches = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const coaches = await Coach.find({ team: team._id });

    const coachesWithRating = coaches.map(coach => ({
      ...coach.toObject(),
      overallRating: calculateOverallRating(coach),
    }));

    res.json({
      success: true,
      data: coachesWithRating,
    });
  } catch (error) {
    logger.error('Get team coaches error:', error);
    res.status(500).json({ success: false, message: '获取教练团队失败' });
  }
};

export const getAvailableCoaches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    const query: any = { team: null };
    if (type) query.type = type;

    const coaches = await Coach.find(query).limit(20);

    const coachesWithRating = coaches.map(coach => ({
      ...coach.toObject(),
      overallRating: calculateOverallRating(coach),
      recommendedWage: calculateCoachWage(coach),
    }));

    res.json({
      success: true,
      data: coachesWithRating,
    });
  } catch (error) {
    logger.error('Get available coaches error:', error);
    res.status(500).json({ success: false, message: '获取可用教练失败' });
  }
};

export const hireCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { coachId, contractYears } = req.body;

    if (!contractYears || contractYears < 1 || contractYears > 5) {
      res.status(400).json({ success: false, message: '合同年限应为1-5年' });
      return;
    }

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ success: false, message: '未找到教练' });
      return;
    }

    if (coach.team) {
      res.status(400).json({ success: false, message: '该教练已被聘用' });
      return;
    }

    const existingCoach = await Coach.findOne({ team: team._id, type: coach.type });
    if (existingCoach) {
      res.status(400).json({ 
        success: false, 
        message: `球队已有${coach.type === 'head' ? '主教练' : coach.type === 'goalkeeper' ? '门将教练' : coach.type}职位教练` 
      });
      return;
    }

    const wage = calculateCoachWage(coach);
    const totalCost = wage * 52 * contractYears;

    if (team.finance.budget < totalCost) {
      res.status(400).json({ 
        success: false, 
        message: '预算不足',
        data: { required: totalCost, available: team.finance.budget }
      });
      return;
    }

    team.finance.budget -= totalCost;
    team.finance.weeklyWage += wage;
    await team.save();

    coach.team = team._id as any;
    coach.wage = wage;
    coach.contractEnd = new Date(Date.now() + contractYears * 365 * 24 * 60 * 60 * 1000);
    await coach.save();

    logger.info(`Team ${team.name} hired coach ${coach.name} (${coach.type})`);

    res.json({
      success: true,
      data: {
        coach: {
          ...coach.toObject(),
          overallRating: calculateOverallRating(coach),
        },
        contract: {
          wage,
          years: contractYears,
          totalCost,
        }
      },
      message: '教练聘用成功'
    });
  } catch (error) {
    logger.error('Hire coach error:', error);
    res.status(500).json({ success: false, message: '聘用教练失败' });
  }
};

export const fireCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { coachId } = req.params;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ success: false, message: '未找到教练' });
      return;
    }

    if (!coach.team || !coach.team.equals(team._id)) {
      res.status(403).json({ success: false, message: '该教练不在您的球队' });
      return;
    }

    const remainingContract = coach.contractEnd ? 
      Math.max(0, Math.ceil((coach.contractEnd.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000))) : 0;
    
    const severancePay = coach.wage * 52 * remainingContract;

    if (team.finance.budget < severancePay) {
      res.status(400).json({ 
        success: false, 
        message: '预算不足以支付违约金',
        data: { required: severancePay, available: team.finance.budget }
      });
      return;
    }

    team.finance.budget -= severancePay;
    team.finance.weeklyWage -= coach.wage;
    await team.save();

    coach.team = undefined as any;
    coach.wage = 0;
    coach.contractEnd = undefined as any;
    await coach.save();

    logger.info(`Team ${team.name} fired coach ${coach.name}`);

    res.json({
      success: true,
      data: {
        severancePay,
      },
      message: '教练已解约'
    });
  } catch (error) {
    logger.error('Fire coach error:', error);
    res.status(500).json({ success: false, message: '解约教练失败' });
  }
};

export const generateCoaches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count = 10 } = req.query;
    const types: Array<'head' | 'goalkeeper' | 'fitness' | 'defense' | 'attack' | 'assistant' | 'youth' | 'psychology' | 'analyst'> = 
      ['head', 'goalkeeper', 'fitness', 'defense', 'attack', 'assistant', 'youth', 'psychology', 'analyst'];

    const generatedCoaches = [];

    for (let i = 0; i < Number(count); i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const attributes = generateCoachAttributes(type);
      
      const coach = new Coach({
        name: generateCoachName(),
        type,
        attributes,
        experience: Math.floor(Math.random() * 20),
      });

      await coach.save();
      generatedCoaches.push({
        ...coach.toObject(),
        overallRating: calculateOverallRating(coach),
        recommendedWage: calculateCoachWage(coach),
      });
    }

    res.json({
      success: true,
      data: {
        count: generatedCoaches.length,
        coaches: generatedCoaches,
      },
      message: `已生成 ${generatedCoaches.length} 名教练`
    });
  } catch (error) {
    logger.error('Generate coaches error:', error);
    res.status(500).json({ success: false, message: '生成教练失败' });
  }
};

export const getTrainingBonus = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const coaches = await Coach.find({ team: team._id });

    const bonuses: Record<string, number> = {
      coaching: 0,
      motivation: 0,
      tactical: 0,
      technical: 0,
      fitness: 0,
      youth: 0,
    };

    for (const coach of coaches) {
      for (const attr of Object.keys(bonuses)) {
        bonuses[attr] += calculateTrainingBonus(coach, attr);
      }
    }

    res.json({
      success: true,
      data: {
        coaches: coaches.map(c => ({
          name: c.name,
          type: c.type,
          overallRating: calculateOverallRating(c),
        })),
        totalBonuses: bonuses,
        trainingMultiplier: 1 + Math.max(...Object.values(bonuses)) / 100,
      }
    });
  } catch (error) {
    logger.error('Get training bonus error:', error);
    res.status(500).json({ success: false, message: '获取训练加成失败' });
  }
};
