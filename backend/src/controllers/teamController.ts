import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Team from '../schemas/Team';
import Player from '../schemas/Player';
import { AuthRequest } from '../middleware/auth';

export const getMyTeam = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    const team = await Team.findOne({ owner: userId })
      .populate('players');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }
    
    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取球队失败',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const team = await Team.findById(id)
      .populate('players');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }
    
    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取球队失败',
    });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { name, shortName } = req.body;
    
    const existingTeam = await Team.findOne({ owner: userId });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: '您已经拥有一支球队',
      });
    }
    
    const team = await Team.create({
      name,
      shortName: shortName || name.substring(0, 3).toUpperCase(),
      owner: userId,
      players: [],
      tactics: {
        formation: '4-4-2',
        style: 'balanced',
        pressingIntensity: 50,
        tempo: 50,
        width: 50,
      },
      finance: {
        budget: 5000000,
        weeklyWage: 0,
        weeklyIncome: 100000,
        weeklyExpense: 0,
      },
      facilities: {
        stadiumLevel: 1,
        trainingLevel: 1,
        youthLevel: 1,
        medicalLevel: 1,
      },
      reputation: 50,
    });
    
    res.status(201).json({
      success: true,
      data: team,
      message: '球队创建成功',
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: '创建球队失败',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { name, tactics, shortName } = req.body;
    
    const team = await Team.findOne({ owner: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }
    
    if (name) team.name = name;
    if (shortName) team.shortName = shortName;
    if (tactics) {
      team.tactics = {
        ...team.tactics,
        ...tactics,
      };
    }
    
    await team.save();
    
    res.json({
      success: true,
      data: team,
      message: '球队更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新球队失败',
    });
  }
};

export const addPlayerToTeam = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId } = req.body;
    
    const team = await Team.findOne({ owner: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }
    
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: '未找到球员',
      });
    }
    
    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    if (team.players.some(p => p.equals(playerObjectId))) {
      return res.status(400).json({
        success: false,
        message: '球员已在球队中',
      });
    }
    
    team.players.push(playerObjectId);
    player.team = team._id;
    
    await team.save();
    await player.save();
    
    res.json({
      success: true,
      data: team,
      message: '球员添加成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加球员失败',
    });
  }
};

export const removePlayerFromTeam = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId } = req.params;
    
    const team = await Team.findOne({ owner: userId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '未找到球队',
      });
    }
    
    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    const playerIndex = team.players.findIndex(p => p.equals(playerObjectId));
    if (playerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: '球员不在球队中',
      });
    }
    
    team.players.splice(playerIndex, 1);
    
    await Player.findByIdAndUpdate(playerId, { team: null });
    await team.save();
    
    res.json({
      success: true,
      data: team,
      message: '球员移除成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '移除球员失败',
    });
  }
};
