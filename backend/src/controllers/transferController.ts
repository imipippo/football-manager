import { Request, Response } from 'express';
import Player from '../schemas/Player';
import Team from '../schemas/Team';
import TransferListing from '../schemas/TransferListing';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const calculateMarketValue = (player: any): number => {
  const baseValue = player.overallRating * 50000;
  const ageMultiplier = player.age <= 22 ? 1.5 : player.age <= 26 ? 1.3 : player.age <= 30 ? 1.0 : player.age <= 33 ? 0.7 : 0.4;
  const potentialMultiplier = player.potential >= 90 ? 2.0 : player.potential >= 80 ? 1.5 : player.potential >= 70 ? 1.2 : 1.0;
  const positionMultiplier = ['ST', 'CAM', 'LW', 'RW'].includes(player.position) ? 1.2 : ['CB', 'CDM', 'CM'].includes(player.position) ? 1.0 : 0.9;
  
  return Math.round(baseValue * ageMultiplier * potentialMultiplier * positionMultiplier);
};

const calculateWage = (player: any): number => {
  const baseWage = player.overallRating * 500;
  const ageMultiplier = player.age <= 22 ? 0.5 : player.age <= 26 ? 1.0 : player.age <= 30 ? 1.1 : player.age <= 33 ? 0.85 : 0.6;
  const potentialMultiplier = player.potential >= 90 ? 1.5 : player.potential >= 80 ? 1.2 : 1.0;
  
  return Math.round(baseWage * ageMultiplier * potentialMultiplier);
};

export const getMarketListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position, minRating, maxRating, minAge, maxAge, minPrice, maxPrice, page = '1', limit = '20' } = req.query;
    
    const query: any = { status: 'active' };
    
    const listings = await TransferListing.find(query)
      .populate('playerId')
      .populate('listedBy', 'name shortName')
      .sort({ listedAt: -1 });
    
    const filteredListings = listings.filter((listing: any) => {
      const player = listing.playerId;
      if (!player) return false;
      
      if (position && player.position !== position) return false;
      if (minRating && player.overallRating < Number(minRating)) return false;
      if (maxRating && player.overallRating > Number(maxRating)) return false;
      if (minAge && player.age < Number(minAge)) return false;
      if (maxAge && player.age > Number(maxAge)) return false;
      if (minPrice && listing.askingPrice < Number(minPrice)) return false;
      if (maxPrice && listing.askingPrice > Number(maxPrice)) return false;
      
      return true;
    });

    const skip = (Number(page) - 1) * Number(limit);
    const paginatedListings = filteredListings.slice(skip, skip + Number(limit));

    const listingsWithDetails = paginatedListings.map((listing: any) => ({
      player: listing.playerId,
      askingPrice: listing.askingPrice,
      listedAt: listing.listedAt,
      marketValue: calculateMarketValue(listing.playerId),
      recommendedWage: calculateWage(listing.playerId),
    }));

    res.json({
      success: true,
      data: listingsWithDetails,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredListings.length,
        pages: Math.ceil(filteredListings.length / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get market listings error:', error);
    res.status(500).json({ success: false, message: '获取转会市场失败' });
  }
};

export const listPlayerForTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId, askingPrice } = req.body;

    if (!askingPrice || askingPrice < 0) {
      res.status(400).json({ success: false, message: '请输入有效的标价' });
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

    const marketValue = calculateMarketValue(player);
    const minPrice = Math.round(marketValue * 0.6);
    const maxPrice = Math.round(marketValue * 2.0);

    if (askingPrice < minPrice || askingPrice > maxPrice) {
      res.status(400).json({ 
        success: false, 
        message: `标价应在 ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} FC 之间`,
        data: { minPrice, maxPrice, marketValue }
      });
      return;
    }

    const existingListing = await TransferListing.findOne({
      playerId,
      status: 'active'
    });
    if (existingListing) {
      res.status(400).json({ success: false, message: '球员已在转会市场中' });
      return;
    }

    await TransferListing.create({
      playerId,
      askingPrice,
      listedBy: team._id,
      listedAt: new Date(),
      status: 'active',
    });

    logger.info(`Player ${player.name} listed for transfer at ${askingPrice} FC`);

    res.json({
      success: true,
      data: {
        player,
        askingPrice,
        marketValue,
        listedAt: new Date(),
      },
      message: '球员已挂牌'
    });
  } catch (error) {
    logger.error('List player for transfer error:', error);
    res.status(500).json({ success: false, message: '挂牌失败' });
  }
};

export const removeFromTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId } = req.params;

    const team = await Team.findOne({ owner: userId });
    if (!team) {
      res.status(404).json({ success: false, message: '未找到球队' });
      return;
    }

    const listing = await TransferListing.findOne({
      playerId,
      status: 'active'
    });
    if (!listing) {
      res.status(404).json({ success: false, message: '球员未在转会市场中' });
      return;
    }

    if (!listing.listedBy.equals(team._id)) {
      res.status(403).json({ success: false, message: '您无权取消此挂牌' });
      return;
    }

    listing.status = 'withdrawn';
    await listing.save();

    res.json({
      success: true,
      message: '已取消挂牌'
    });
  } catch (error) {
    logger.error('Remove from transfer error:', error);
    res.status(500).json({ success: false, message: '取消挂牌失败' });
  }
};

export const buyPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { playerId } = req.params;
    const { offeredWage, contractYears } = req.body;

    const listing = await TransferListing.findOne({
      playerId,
      status: 'active'
    });
    if (!listing) {
      res.status(404).json({ success: false, message: '球员未在转会市场中' });
      return;
    }

    const buyingTeam = await Team.findOne({ owner: userId });
    if (!buyingTeam) {
      res.status(404).json({ success: false, message: '未找到您的球队' });
      return;
    }

    if (buyingTeam._id.equals(listing.listedBy)) {
      res.status(400).json({ success: false, message: '不能购买自己挂牌的球员' });
      return;
    }

    const player = await Player.findById(playerId).populate('team');
    if (!player) {
      res.status(404).json({ success: false, message: '未找到球员' });
      return;
    }

    const transferFee = listing.askingPrice;
    const commission = Math.round(transferFee * 0.2);
    const totalCost = transferFee + commission;

    if (buyingTeam.finance.budget < totalCost) {
      res.status(400).json({ 
        success: false, 
        message: '预算不足',
        data: { required: totalCost, available: buyingTeam.finance.budget }
      });
      return;
    }

    const recommendedWage = calculateWage(player);
    const minWage = Math.round(recommendedWage * 0.7);
    const maxWage = Math.round(recommendedWage * 1.5);

    if (!offeredWage || offeredWage < minWage || offeredWage > maxWage) {
      res.status(400).json({ 
        success: false, 
        message: `周薪应在 ${minWage.toLocaleString()} - ${maxWage.toLocaleString()} FC 之间`,
        data: { minWage, maxWage, recommendedWage }
      });
      return;
    }

    if (!contractYears || contractYears < 1 || contractYears > 5) {
      res.status(400).json({ success: false, message: '合同年限应为1-5年' });
      return;
    }

    const sellingTeam = await Team.findById(listing.listedBy);

    buyingTeam.finance.budget -= totalCost;
    buyingTeam.players.push(player._id);
    buyingTeam.finance.weeklyWage += offeredWage;

    if (sellingTeam) {
      sellingTeam.finance.budget += transferFee;
      sellingTeam.players = sellingTeam.players.filter(p => !p.equals(player._id));
      sellingTeam.finance.weeklyWage -= player.wage;
      await sellingTeam.save();
    }

    player.team = buyingTeam._id;
    player.wage = offeredWage;
    player.contractEnd = new Date(Date.now() + contractYears * 365 * 24 * 60 * 60 * 1000);
    await player.save();

    listing.status = 'sold';
    await listing.save();

    await buyingTeam.save();

    logger.info(`Player ${player.name} transferred from ${sellingTeam?.name || 'Free Agent'} to ${buyingTeam.name} for ${transferFee} FC`);

    res.json({
      success: true,
      data: {
        player,
        transfer: {
          from: sellingTeam?.name || 'Free Agent',
          to: buyingTeam.name,
          fee: transferFee,
          commission,
          totalCost,
          wage: offeredWage,
          contractYears,
        }
      },
      message: '转会成功'
    });
  } catch (error) {
    logger.error('Buy player error:', error);
    res.status(500).json({ success: false, message: '转会失败' });
  }
};

export const getPlayerTransferInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params;

    const player = await Player.findById(playerId).populate('team', 'name shortName');
    if (!player) {
      res.status(404).json({ success: false, message: '未找到球员' });
      return;
    }

    const listing = await TransferListing.findOne({
      playerId,
      status: 'active'
    });
    const marketValue = calculateMarketValue(player);
    const recommendedWage = calculateWage(player);

    res.json({
      success: true,
      data: {
        player,
        isListed: !!listing,
        listing: listing ? {
          askingPrice: listing.askingPrice,
          listedAt: listing.listedAt,
        } : null,
        marketValue,
        priceRange: {
          min: Math.round(marketValue * 0.6),
          max: Math.round(marketValue * 2.0),
        },
        wageRange: {
          min: Math.round(recommendedWage * 0.7),
          max: Math.round(recommendedWage * 1.5),
          recommended: recommendedWage,
        },
      }
    });
  } catch (error) {
    logger.error('Get player transfer info error:', error);
    res.status(500).json({ success: false, message: '获取转会信息失败' });
  }
};

export const generateFreeAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count = 10, minRating = 50, maxRating = 80 } = req.query;
    
    const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];
    const nationalities = ['中国', '日本', '韩国', '巴西', '阿根廷', '德国', '法国', '英国', '西班牙', '意大利'];
    const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', 'Carlos', 'Juan', 'Marco', 'Lucas', 'David', 'Alex', 'Mike', 'John'];
    const lastNames = ['伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '明', '辉', 'Silva', 'Santos', 'Rossi', 'Mueller', 'Smith', 'Johnson', 'Williams'];

    const generatedPlayers = [];

    for (let i = 0; i < Number(count); i++) {
      const position = positions[Math.floor(Math.random() * positions.length)];
      const overallRating = Math.floor(Math.random() * (Number(maxRating) - Number(minRating) + 1)) + Number(minRating);
      const potential = Math.min(99, overallRating + Math.floor(Math.random() * 15));
      const age = Math.floor(Math.random() * 20) + 16;

      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName}${lastName}`;

      const player = new Player({
        name,
        age,
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        position,
        team: null,
        physical: {
          pace: Math.floor(Math.random() * 30) + overallRating - 15,
          strength: Math.floor(Math.random() * 30) + overallRating - 15,
          stamina: Math.floor(Math.random() * 30) + overallRating - 15,
          agility: Math.floor(Math.random() * 30) + overallRating - 15,
          jumping: Math.floor(Math.random() * 30) + overallRating - 15,
        },
        technical: {
          passing: Math.floor(Math.random() * 30) + overallRating - 15,
          shooting: Math.floor(Math.random() * 30) + overallRating - 15,
          dribbling: Math.floor(Math.random() * 30) + overallRating - 15,
          defending: Math.floor(Math.random() * 30) + overallRating - 15,
          heading: Math.floor(Math.random() * 30) + overallRating - 15,
          technique: Math.floor(Math.random() * 30) + overallRating - 15,
        },
        mental: {
          vision: Math.floor(Math.random() * 30) + overallRating - 15,
          composure: Math.floor(Math.random() * 30) + overallRating - 15,
          positioning: Math.floor(Math.random() * 30) + overallRating - 15,
          decisions: Math.floor(Math.random() * 30) + overallRating - 15,
          leadership: Math.floor(Math.random() * 30) + overallRating - 15,
        },
        potential,
        marketValue: 0,
        wage: 0,
        status: {
          fatigue: 0,
          injury: 0,
          morale: 70,
        },
      });

      await player.save();

      const marketValue = calculateMarketValue(player);
      await TransferListing.create({
        playerId: player._id,
        askingPrice: marketValue,
        listedBy: null,
        listedAt: new Date(),
        status: 'active',
      });

      generatedPlayers.push({
        player,
        askingPrice: marketValue,
      });
    }

    res.json({
      success: true,
      data: {
        count: generatedPlayers.length,
        players: generatedPlayers,
      },
      message: `已生成 ${generatedPlayers.length} 名自由球员`
    });
  } catch (error) {
    logger.error('Generate free agents error:', error);
    res.status(500).json({ success: false, message: '生成自由球员失败' });
  }
};
