import { Request, Response } from 'express';
import Team from '../schemas/Team';
import Player from '../schemas/Player';
import FinanceRecord from '../schemas/FinanceRecord';
import Sponsor from '../schemas/Sponsor';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const getSponsorBaseAmount = (leagueLevel: number, type: string): number => {
  const baseAmounts: Record<string, Record<number, number>> = {
    main: { 1: 120000000, 2: 60000000, 3: 30000000, 4: 12000000, 5: 4800000, 6: 1800000, 7: 600000 },
    sleeve: { 1: 36000000, 2: 18000000, 3: 9000000, 4: 3600000, 5: 1440000, 6: 540000, 7: 180000 },
    stadium: { 1: 50000000, 2: 25000000, 3: 10000000, 4: 5000000, 5: 2000000, 6: 1000000, 7: 500000 },
    training: { 1: 10000000, 2: 5000000, 3: 2000000, 4: 1000000, 5: 500000, 6: 200000, 7: 100000 },
    partner: { 1: 20000000, 2: 10000000, 3: 5000000, 4: 2000000, 5: 1000000, 6: 500000, 7: 200000 },
  };
  return baseAmounts[type]?.[leagueLevel] || baseAmounts[type][7];
};

const calculateFanCoefficient = (fans: number): number => {
  const globalAverageFans = 200000;
  return 1 + (fans / globalAverageFans) * 0.5;
};

const generateSponsorName = (type: string): string => {
  const prefixes: Record<string, string[]> = {
    main: ['华为', '阿里巴巴', '腾讯', '京东', '字节跳动', 'SAMSUNG', 'SONY', 'NIKE', 'ADIDAS'],
    sleeve: ['小米', 'OPPO', 'VIVO', '联想', '海尔', 'PEPSI', 'COCA-COLA'],
    stadium: ['万达', '恒大', '碧桂园', '万科', '绿地'],
    training: ['安踏', '李宁', '特步', '361度'],
    partner: ['中国移动', '中国联通', '中国电信', '工商银行', '建设银行'],
  };
  const names = prefixes[type] || prefixes.partner;
  return names[Math.floor(Math.random() * names.length)];
};

export const getFinanceOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId }).populate('players');
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const players = team.players as any[];
    const totalWages = players.reduce((sum, p) => sum + (p.wage || 0), 0);
    
    const fanCoef = calculateFanCoefficient(team.fans);
    const weeklyIncome = Math.round((team.finance as any).weeklyIncome * fanCoef);
    const weeklyExpense = totalWages + (team.finance as any).weeklyExpense;

    const sponsors = await Sponsor.find({ teamId: team._id, status: 'active' });
    const totalSponsorIncome = sponsors.reduce((sum, s) => sum + s.amount, 0);
    
    const recentRecords = await FinanceRecord.find({ teamId: team._id })
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        balance: (team.finance as any).budget,
        weekly: {
          income: weeklyIncome,
          expense: weeklyExpense,
          net: weeklyIncome - weeklyExpense,
        },
        breakdown: {
          income: {
            sponsors: totalSponsorIncome / 52,
            matchday: Math.round(team.fans * 50 * ((team.facilities as any).stadiumLevel * 0.1 + 0.5)),
            broadcasting: Math.round(weeklyIncome * 0.3),
            merchandise: Math.round(team.fans * 10),
            other: Math.round(weeklyIncome * 0.1),
          },
          expenses: {
            wages: totalWages,
            facilities: Math.round((team.facilities as any).stadiumLevel * 50000 + (team.facilities as any).trainingLevel * 30000 + (team.facilities as any).youthLevel * 20000),
            staff: Math.round(weeklyExpense * 0.1),
            other: Math.round(weeklyExpense * 0.05),
          }
        },
        sponsors: sponsors.map(s => ({
          type: s.type,
          typeName: { main: '球衣胸前广告', sleeve: '球衣袖口广告', stadium: '球场冠名', training: '训练服赞助', partner: '官方合作伙伴' }[s.type],
          name: s.name,
          amount: s.amount,
          duration: s.duration,
          startDate: s.startDate,
        })),
        recentTransactions: recentRecords.map(r => ({
          type: r.type,
          category: r.category,
          amount: r.amount,
          date: r.date,
          description: r.description,
        })),
      }
    });
  } catch (error) {
    logger.error('Get finance overview error:', error);
    res.status(500).json({ success: false, message: '获取财务概览失败' });
  }
};

export const getSponsorOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const leagueLevel = Math.max(1, Math.min(7, Math.ceil((100 - team.reputation) / 15)));
    const fanCoef = calculateFanCoefficient(team.fans);

    const sponsorTypes: Array<'main' | 'sleeve' | 'stadium' | 'training' | 'partner'> = ['main', 'sleeve', 'stadium', 'training', 'partner'];
    
    const existingSponsors = await Sponsor.find({ teamId: team._id, status: 'active' });
    const existingTypes = existingSponsors.map(s => s.type);

    const offers = sponsorTypes
      .filter(type => !existingTypes.includes(type))
      .map(type => {
        const baseAmount = getSponsorBaseAmount(leagueLevel, type);
        const finalAmount = Math.round(baseAmount * fanCoef);
        
        return {
          type,
          typeName: {
            main: '球衣胸前广告',
            sleeve: '球衣袖口广告',
            stadium: '球场冠名',
            training: '训练服赞助',
            partner: '官方合作伙伴',
          }[type],
          name: generateSponsorName(type),
          amount: finalAmount,
          duration: 52,
          totalValue: finalAmount * 52,
          reputation: team.reputation,
        };
      });

    res.json({
      success: true,
      data: {
        offers,
        leagueLevel,
        fanCoefficient: fanCoef,
      }
    });
  } catch (error) {
    logger.error('Get sponsor offers error:', error);
    res.status(500).json({ success: false, message: '获取赞助报价失败' });
  }
};

export const acceptSponsor = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { type, name, amount, duration } = req.body;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const existingSponsor = await Sponsor.findOne({ teamId: team._id, type, status: 'active' });
    if (existingSponsor) {
      res.status(400).json({ success: false, message: '该类型赞助已存在' });
      return;
    }

    const sponsor = await Sponsor.create({
      teamId: team._id,
      type,
      name,
      amount,
      duration,
      startDate: new Date(),
      status: 'active',
    });

    await FinanceRecord.create({
      teamId: team._id,
      type: 'income',
      category: 'sponsor',
      amount: amount * duration,
      description: `签署${name}${type === 'main' ? '胸前' : type === 'sleeve' ? '袖口' : type === 'stadium' ? '球场冠名' : type === 'training' ? '训练服' : '合作伙伴'}赞助`,
      date: new Date(),
    });

    logger.info(`Team ${team.name} accepted sponsor: ${name} (${type}) for ${amount} FC/week`);

    res.json({
      success: true,
      data: {
        sponsor: {
          type: sponsor.type,
          name: sponsor.name,
          amount: sponsor.amount,
          duration: sponsor.duration,
          startDate: sponsor.startDate,
        },
        totalValue: amount * duration,
      },
      message: '赞助签约成功'
    });
  } catch (error) {
    logger.error('Accept sponsor error:', error);
    res.status(500).json({ success: false, message: '签约赞助失败' });
  }
};

export const processWeeklyFinances = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId }).populate('players');
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const players = team.players as any[];
    const totalWages = players.reduce((sum, p) => sum + (p.wage || 0), 0);
    
    const fanCoef = calculateFanCoefficient(team.fans);

    const sponsors = await Sponsor.find({ teamId: team._id, status: 'active' });
    const sponsorIncome = sponsors.reduce((sum, s) => sum + s.amount, 0);
    
    const matchdayIncome = Math.round(team.fans * 50 * ((team.facilities as any).stadiumLevel * 0.1 + 0.5));
    const broadcastingIncome = Math.round((team.finance as any).weeklyIncome * 0.3 * fanCoef);
    const merchandiseIncome = Math.round(team.fans * 10);
    
    const facilityExpense = Math.round(
      (team.facilities as any).stadiumLevel * 50000 + 
      (team.facilities as any).trainingLevel * 30000 + 
      (team.facilities as any).youthLevel * 20000 +
      (team.facilities as any).medicalLevel * 15000
    );

    const totalIncome = sponsorIncome + matchdayIncome + broadcastingIncome + merchandiseIncome + (team.finance as any).weeklyIncome;
    const totalExpense = totalWages + facilityExpense + (team.finance as any).weeklyExpense;

    const netIncome = totalIncome - totalExpense;
    (team.finance as any).budget += netIncome;
    (team.finance as any).weeklyIncome = totalIncome;
    (team.finance as any).weeklyExpense = totalExpense;

    await FinanceRecord.create({
      teamId: team._id,
      type: netIncome >= 0 ? 'income' : 'expense',
      category: 'weekly',
      amount: Math.abs(netIncome),
      description: `周结算: 收入 ${totalIncome.toLocaleString()} FC, 支出 ${totalExpense.toLocaleString()} FC`,
      date: new Date(),
    });

    await team.save();

    logger.info(`Team ${team.name} weekly finance: +${totalIncome} -${totalExpense} = ${netIncome >= 0 ? '+' : ''}${netIncome}`);

    res.json({
      success: true,
      data: {
        income: totalIncome,
        expense: totalExpense,
        net: netIncome,
        newBalance: (team.finance as any).budget,
        breakdown: {
          income: {
            sponsors: sponsorIncome,
            matchday: matchdayIncome,
            broadcasting: broadcastingIncome,
            merchandise: merchandiseIncome,
            other: (team.finance as any).weeklyIncome,
          },
          expenses: {
            wages: totalWages,
            facilities: facilityExpense,
            other: (team.finance as any).weeklyExpense,
          }
        }
      },
      message: netIncome >= 0 ? '本周盈利' : '本周亏损'
    });
  } catch (error) {
    logger.error('Process weekly finances error:', error);
    res.status(500).json({ success: false, message: '处理周财务失败' });
  }
};

export const upgradeFacility = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { facility } = req.body;

    if (!['stadiumLevel', 'trainingLevel', 'youthLevel', 'medicalLevel'].includes(facility)) {
      res.status(400).json({ success: false, message: '无效的设施类型' });
      return;
    }

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const currentLevel = (team.facilities as any)[facility];
    if (currentLevel >= 10) {
      res.status(400).json({ success: false, message: '设施已达最高等级' });
      return;
    }

    const upgradeCost = currentLevel * 1000000;
    if ((team.finance as any).budget < upgradeCost) {
      res.status(400).json({ 
        success: false, 
        message: '预算不足',
        data: { required: upgradeCost, available: (team.finance as any).budget }
      });
      return;
    }

    (team.finance as any).budget -= upgradeCost;
    (team.facilities as any)[facility] = currentLevel + 1;

    await FinanceRecord.create({
      teamId: team._id,
      type: 'expense',
      category: 'facility',
      amount: upgradeCost,
      description: `升级${facility === 'stadiumLevel' ? '球场' : facility === 'trainingLevel' ? '训练场' : facility === 'youthLevel' ? '青训营' : '医疗中心'}到等级 ${currentLevel + 1}`,
      date: new Date(),
    });

    await team.save();

    logger.info(`Team ${team.name} upgraded ${facility} to level ${currentLevel + 1}`);

    res.json({
      success: true,
      data: {
        facility,
        newLevel: currentLevel + 1,
        cost: upgradeCost,
        newBalance: (team.finance as any).budget,
      },
      message: '设施升级成功'
    });
  } catch (error) {
    logger.error('Upgrade facility error:', error);
    res.status(500).json({ success: false, message: '升级设施失败' });
  }
};
