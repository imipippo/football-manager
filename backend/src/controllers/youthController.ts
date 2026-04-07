import { Request, Response } from 'express';
import Player from '../schemas/Player';
import Team from '../schemas/Team';
import YouthPlayer from '../schemas/YouthPlayer';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];
const nationalities = ['中国', '日本', '韩国', '巴西', '阿根廷', '德国', '法国', '英国', '西班牙', '意大利'];
const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', 'Carlos', 'Juan', 'Marco', 'Lucas', 'David', 'Alex'];
const lastNames = ['伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '明', '辉', 'Silva', 'Santos', 'Rossi', 'Mueller', 'Smith'];

const generateYouthPlayerData = (age: number, youthLevel: number, regionQuality: number = 50) => {
  const position = positions[Math.floor(Math.random() * positions.length)];
  const baseRating = Math.floor(Math.random() * 20) + 40 + Math.floor(youthLevel * 2) + Math.floor(regionQuality * 0.1);
  const potential = Math.min(99, baseRating + Math.floor(Math.random() * 25) + Math.floor(youthLevel * 1.5));

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName}${lastName}`;

  const physical = {
    pace: Math.floor(Math.random() * 20) + baseRating - 10,
    strength: Math.floor(Math.random() * 20) + baseRating - 10,
    stamina: Math.floor(Math.random() * 20) + baseRating - 10,
    agility: Math.floor(Math.random() * 20) + baseRating - 10,
    jumping: Math.floor(Math.random() * 20) + baseRating - 10,
  };

  const technical = {
    passing: Math.floor(Math.random() * 20) + baseRating - 10,
    shooting: Math.floor(Math.random() * 20) + baseRating - 10,
    dribbling: Math.floor(Math.random() * 20) + baseRating - 10,
    defending: Math.floor(Math.random() * 20) + baseRating - 10,
    heading: Math.floor(Math.random() * 20) + baseRating - 10,
    technique: Math.floor(Math.random() * 20) + baseRating - 10,
  };

  const mental = {
    vision: Math.floor(Math.random() * 20) + baseRating - 10,
    composure: Math.floor(Math.random() * 20) + baseRating - 10,
    positioning: Math.floor(Math.random() * 20) + baseRating - 10,
    decisions: Math.floor(Math.random() * 20) + baseRating - 10,
    leadership: Math.floor(Math.random() * 20) + baseRating - 10,
  };

  const overallRating = Math.round(
    (physical.pace + physical.strength + physical.stamina + physical.agility + physical.jumping +
     technical.passing + technical.shooting + technical.dribbling + technical.defending + technical.heading + technical.technique +
     mental.vision + mental.composure + mental.positioning + mental.decisions + mental.leadership) / 16
  );

  return {
    name,
    age,
    nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
    position,
    overallRating,
    potential,
    physical,
    technical,
    mental,
  };
};

const ensureYouthSquad = async (teamId: string, youthLevel: number): Promise<void> => {
  const u18Count = await YouthPlayer.countDocuments({ teamId, squad: 'U18' });
  
  if (u18Count < 15) {
    const playersToCreate = 15 - u18Count;
    const youthPlayers = [];
    
    for (let i = 0; i < playersToCreate; i++) {
      const playerData = generateYouthPlayerData(Math.floor(Math.random() * 3) + 15, youthLevel);
      youthPlayers.push({
        teamId,
        squad: 'U18',
        playerData,
      });
    }
    
    await YouthPlayer.insertMany(youthPlayers);
  }
};

export const getYouthSquads = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    await ensureYouthSquad(team._id.toString(), team.facilities.youthLevel);

    const u18Players = await YouthPlayer.find({ teamId: team._id, squad: 'U18' });
    const u20Players = await YouthPlayer.find({ teamId: team._id, squad: 'U20' });

    res.json({
      success: true,
      data: {
        youthLevel: team.facilities.youthLevel,
        U18: {
          players: u18Players.map(p => ({ _id: p._id, player: p.playerData, squad: 'U18' })),
          count: u18Players.length,
          capacity: 15,
        },
        U20: {
          players: u20Players.map(p => ({ _id: p._id, player: p.playerData, squad: 'U20' })),
          count: u20Players.length,
          capacity: 15,
        },
      }
    });
  } catch (error) {
    logger.error('Get youth squads error:', error);
    res.status(500).json({ success: false, message: '获取青训梯队失败' });
  }
};

export const promotePlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId, fromSquad, toSquad } = req.body;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const youthPlayer = await YouthPlayer.findOne({ _id: playerId, teamId: team._id, squad: fromSquad });
    if (!youthPlayer) {
      res.status(404).json({ success: false, message: '未找到青训球员' });
      return;
    }

    if (toSquad === 'senior') {
      const player = new Player({
        name: youthPlayer.playerData.name,
        position: youthPlayer.playerData.position,
        age: youthPlayer.playerData.age,
        nationality: youthPlayer.playerData.nationality,
        overallRating: youthPlayer.playerData.overallRating,
        potential: youthPlayer.playerData.potential,
        physical: youthPlayer.playerData.physical,
        technical: youthPlayer.playerData.technical,
        mental: youthPlayer.playerData.mental,
        team: team._id,
        wage: Math.round(youthPlayer.playerData.potential * 200),
        contractEnd: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
        status: {
          fatigue: 0,
          injury: 0,
          morale: 70,
        },
      });

      await player.save();
      team.players.push(player._id as any);
      await team.save();

      youthPlayer.promotedAt = new Date();
      youthPlayer.promotedTo = 'senior';
      await youthPlayer.save();
      await YouthPlayer.deleteOne({ _id: playerId });

      logger.info(`Player ${player.name} promoted from ${fromSquad} to senior team`);

      res.json({
        success: true,
        data: {
          player,
          fromSquad,
          toSquad: 'senior',
        },
        message: '球员已提拔至一线队'
      });
    } else if (toSquad === 'U20' && fromSquad === 'U18') {
      if (youthPlayer.playerData.age < 18) {
        res.status(400).json({ success: false, message: '球员年龄不足18岁，无法进入U20' });
        return;
      }

      youthPlayer.squad = 'U20';
      youthPlayer.promotedAt = new Date();
      youthPlayer.promotedTo = 'U20';
      await youthPlayer.save();

      logger.info(`Player ${youthPlayer.playerData.name} promoted from U18 to U20`);

      res.json({
        success: true,
        data: {
          player: youthPlayer.playerData,
          fromSquad,
          toSquad,
        },
        message: '球员已提拔至U20'
      });
    } else {
      res.status(400).json({ success: false, message: '无效的提拔操作' });
    }
  } catch (error) {
    logger.error('Promote player error:', error);
    res.status(500).json({ success: false, message: '提拔球员失败' });
  }
};

export const releaseYouthPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId, squad: squadType } = req.params;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const youthPlayer = await YouthPlayer.findOneAndDelete({ _id: playerId, teamId: team._id, squad: squadType });
    if (!youthPlayer) {
      res.status(404).json({ success: false, message: '未找到青训球员' });
      return;
    }

    if (squadType === 'U18') {
      await ensureYouthSquad(team._id.toString(), team.facilities.youthLevel);
    }

    logger.info(`Youth player ${youthPlayer.playerData.name} released from ${squadType}`);

    res.json({
      success: true,
      message: '球员已解约'
    });
  } catch (error) {
    logger.error('Release youth player error:', error);
    res.status(500).json({ success: false, message: '解约球员失败' });
  }
};

export const refreshYouthSquad = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    await ensureYouthSquad(team._id.toString(), team.facilities.youthLevel);

    const u18Players = await YouthPlayer.find({ teamId: team._id, squad: 'U18' });
    const u20Players = await YouthPlayer.find({ teamId: team._id, squad: 'U20' });

    res.json({
      success: true,
      data: {
        U18: {
          players: u18Players.map(p => ({ _id: p._id, player: p.playerData })),
          count: u18Players.length,
        },
        U20: {
          players: u20Players.map(p => ({ _id: p._id, player: p.playerData })),
          count: u20Players.length,
        },
      },
      message: '青训梯队已刷新'
    });
  } catch (error) {
    logger.error('Refresh youth squad error:', error);
    res.status(500).json({ success: false, message: '刷新青训梯队失败' });
  }
};

export const scoutYouthPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { usePremium } = req.body;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const u18Count = await YouthPlayer.countDocuments({ teamId: team._id, squad: 'U18' });
    if (u18Count >= 15) {
      res.status(400).json({ success: false, message: 'U18梯队已满' });
      return;
    }

    const youthLevel = team.facilities.youthLevel;
    const playerData = generateYouthPlayerData(15, youthLevel);
    
    if (usePremium) {
      playerData.potential = Math.min(99, playerData.potential + 20);
      playerData.physical = {
        pace: Math.min(99, playerData.physical.pace + 5),
        strength: Math.min(99, playerData.physical.strength + 5),
        stamina: Math.min(99, playerData.physical.stamina + 5),
        agility: Math.min(99, playerData.physical.agility + 5),
        jumping: Math.min(99, playerData.physical.jumping + 5),
      };
      playerData.technical = {
        passing: Math.min(99, playerData.technical.passing + 5),
        shooting: Math.min(99, playerData.technical.shooting + 5),
        dribbling: Math.min(99, playerData.technical.dribbling + 5),
        defending: Math.min(99, playerData.technical.defending + 5),
        heading: Math.min(99, playerData.technical.heading + 5),
        technique: Math.min(99, playerData.technical.technique + 5),
      };
      playerData.mental = {
        vision: Math.min(99, playerData.mental.vision + 5),
        composure: Math.min(99, playerData.mental.composure + 5),
        positioning: Math.min(99, playerData.mental.positioning + 5),
        decisions: Math.min(99, playerData.mental.decisions + 5),
        leadership: Math.min(99, playerData.mental.leadership + 5),
      };
      playerData.overallRating = Math.round(
        (playerData.physical.pace + playerData.physical.strength + playerData.physical.stamina + playerData.physical.agility + playerData.physical.jumping +
         playerData.technical.passing + playerData.technical.shooting + playerData.technical.dribbling + playerData.technical.defending + playerData.technical.heading + playerData.technical.technique +
         playerData.mental.vision + playerData.mental.composure + playerData.mental.positioning + playerData.mental.decisions + playerData.mental.leadership) / 16
      );
    }

    const youthPlayer = await YouthPlayer.create({
      teamId: team._id,
      squad: 'U18',
      playerData,
    });

    logger.info(`Team ${team.name} scouted youth player: ${playerData.name} (Potential: ${playerData.potential})`);

    res.json({
      success: true,
      data: {
        player: playerData,
        _id: youthPlayer._id,
        squad: 'U18',
        usedPremium: usePremium,
      },
      message: '球探发现新球员'
    });
  } catch (error) {
    logger.error('Scout youth player error:', error);
    res.status(500).json({ success: false, message: '球探失败' });
  }
};
