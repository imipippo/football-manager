import { Request, Response } from 'express';
import Player from '../schemas/Player';
import Team from '../schemas/Team';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const getMyPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const players = await Player.find({ team: team._id }).sort({ overallRating: -1 });

    res.json({
      success: true,
      data: players,
    });
  } catch (error) {
    logger.error('Get my players error:', error);
    res.status(500).json({ success: false, message: '获取球员失败' });
  }
};

export const getPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId, position, minRating, maxRating, page = '1', limit = '20' } = req.query;
    
    const query: any = {};
    
    if (teamId) query.team = teamId;
    if (position) query.position = position;
    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = Number(minRating);
      if (maxRating) query.overallRating.$lte = Number(maxRating);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const players = await Player.find(query)
      .populate('team', 'name shortName')
      .skip(skip)
      .limit(Number(limit))
      .sort({ overallRating: -1 });

    const total = await Player.countDocuments(query);

    res.json({
      success: true,
      data: players,
      count: players.length,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get players error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch players' });
  }
};

export const getPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team', 'name shortName');

    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }

    res.json({ success: true, data: player });
  } catch (error) {
    logger.error('Get player error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch player' });
  }
};

export const createPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const player = new Player(req.body);
    await player.save();
    
    logger.info(`Player created: ${player.name}`);
    
    res.status(201).json({ success: true, data: player });
  } catch (error) {
    logger.error('Create player error:', error);
    res.status(400).json({ success: false, message: 'Failed to create player' });
  }
};

export const updatePlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }

    logger.info(`Player updated: ${player.name}`);
    
    res.json({ success: true, data: player });
  } catch (error) {
    logger.error('Update player error:', error);
    res.status(400).json({ success: false, message: 'Failed to update player' });
  }
};

export const deletePlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }

    logger.info(`Player deleted: ${player.name}`);
    
    res.json({ success: true, message: 'Player deleted successfully' });
  } catch (error) {
    logger.error('Delete player error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete player' });
  }
};

export const searchPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, position, minAge, maxAge, minRating, maxRating } = req.query;
    
    const query: any = {};
    
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }
    if (position) {
      query.position = position;
    }
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = Number(minAge);
      if (maxAge) query.age.$lte = Number(maxAge);
    }
    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = Number(minRating);
      if (maxRating) query.overallRating.$lte = Number(maxRating);
    }

    const players = await Player.find(query)
      .limit(50)
      .sort({ overallRating: -1 });

    res.json({ success: true, data: players });
  } catch (error) {
    logger.error('Search players error:', error);
    res.status(500).json({ success: false, message: 'Failed to search players' });
  }
};
