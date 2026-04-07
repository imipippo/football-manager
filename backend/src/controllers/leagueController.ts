import { Request, Response } from 'express';
import League from '../schemas/League';
import Team from '../schemas/Team';
import { AuthRequest } from '../middleware/auth';

export const getMyLeagueStandings = async (req: Request, res: Response) => {
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

    let league = await League.findOne({ teams: team._id })
      .populate({
        path: 'standings.team',
        select: 'name shortName',
      });

    if (!league) {
      const teams = await Team.find().limit(10);
      const standings = teams.map((t, index) => ({
        team: { _id: t._id, name: t.name, shortName: t.shortName },
        played: Math.floor(Math.random() * 10) + 20,
        won: Math.floor(Math.random() * 15) + 5,
        drawn: Math.floor(Math.random() * 8),
        lost: Math.floor(Math.random() * 10),
        goalsFor: Math.floor(Math.random() * 30) + 20,
        goalsAgainst: Math.floor(Math.random() * 25) + 10,
        goalDifference: 0,
        points: 0,
      }));

      standings.forEach((s: any) => {
        s.goalDifference = s.goalsFor - s.goalsAgainst;
        s.points = s.won * 3 + s.drawn;
      });

      standings.sort((a: any, b: any) => b.points - a.points);

      return res.json({
        success: true,
        data: standings,
      });
    }

    const sortedStandings = league.standings.sort((a: any, b: any) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    res.json({
      success: true,
      data: sortedStandings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取积分榜失败',
    });
  }
};

export const getLeagues = async (req: Request, res: Response) => {
  try {
    const { level, region } = req.query;
    
    const query: any = {};
    if (level) query.level = Number(level);
    if (region) query.region = region;
    
    const leagues = await League.find(query)
      .populate('teams', 'name shortName')
      .sort({ level: 1, region: 1 });
    
    res.json({
      success: true,
      data: leagues,
      count: leagues.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取联赛失败',
    });
  }
};

export const getLeagueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const league = await League.findById(id)
      .populate('teams', 'name shortName reputation');
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: '未找到联赛',
      });
    }
    
    res.json({
      success: true,
      data: league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取联赛失败',
    });
  }
};

export const getLeagueStandings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const league = await League.findById(id)
      .populate({
        path: 'standings.team',
        select: 'name shortName',
      });
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: '未找到联赛',
      });
    }
    
    const sortedStandings = league.standings.sort((a: any, b: any) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    res.json({
      success: true,
      data: sortedStandings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取积分榜失败',
    });
  }
};

export const createLeague = async (req: Request, res: Response) => {
  try {
    const { name, level, region, teams } = req.body;
    
    const existingLeague = await League.findOne({ name });
    if (existingLeague) {
      return res.status(400).json({
        success: false,
        message: '联赛名称已存在',
      });
    }
    
    const standings = teams.map((teamId: string) => ({
      team: teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));
    
    const league = await League.create({
      name,
      level,
      region,
      teams,
      standings,
      fixtures: [],
      season: new Date().getFullYear(),
    });
    
    res.status(201).json({
      success: true,
      data: league,
      message: '联赛创建成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建联赛失败',
    });
  }
};
