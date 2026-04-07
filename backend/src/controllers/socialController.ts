import { Request, Response } from 'express';
import Friendship from '../schemas/Friendship';
import Team from '../schemas/Team';
import User from '../schemas/User';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export const getFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    })
      .populate('requester', 'wechatNickname wechatAvatar')
      .populate('recipient', 'wechatNickname wechatAvatar');

    const friends = await Promise.all(friendships.map(async (f) => {
      const friendId = (f.requester as any)._id.toString() === userId ? f.recipient : f.requester;
      const team = await Team.findOne({ owner: friendId._id }).select('name reputation');
      
      return {
        _id: friendId._id,
        nickname: (friendId as any).wechatNickname || 'Player',
        avatar: (friendId as any).wechatAvatar,
        team: team ? { name: team.name, reputation: team.reputation } : null,
        friendsSince: f.createdAt,
      };
    }));

    res.json({
      success: true,
      data: friends,
    });
  } catch (error) {
    logger.error('Get friends error:', error);
    res.status(500).json({ success: false, message: '获取好友列表失败' });
  }
};

export const getPendingRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const requests = await Friendship.find({
      recipient: userId,
      status: 'pending',
    })
      .populate('requester', 'wechatNickname wechatAvatar')
      .sort({ createdAt: -1 });

    const requestsWithTeam = await Promise.all(requests.map(async (r) => {
      const team = await Team.findOne({ owner: (r.requester as any)._id }).select('name reputation');
      return {
        _id: r._id,
        from: {
          _id: (r.requester as any)._id,
          nickname: (r.requester as any).wechatNickname || 'Player',
          avatar: (r.requester as any).wechatAvatar,
          team: team ? { name: team.name, reputation: team.reputation } : null,
        },
        createdAt: r.createdAt,
      };
    }));

    res.json({
      success: true,
      data: requestsWithTeam,
    });
  } catch (error) {
    logger.error('Get pending requests error:', error);
    res.status(500).json({ success: false, message: '获取好友请求失败' });
  }
};

export const sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { recipientId } = req.body;

    if (userId === recipientId) {
      res.status(400).json({ success: false, message: '不能添加自己为好友' });
      return;
    }

    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: userId, recipient: recipientId },
        { requester: recipientId, recipient: userId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        res.status(400).json({ success: false, message: '已经是好友了' });
        return;
      }
      if (existingFriendship.status === 'pending') {
        res.status(400).json({ success: false, message: '好友请求已发送' });
        return;
      }
    }

    const friendship = new Friendship({
      requester: userId,
      recipient: recipientId,
      status: 'pending',
    });

    await friendship.save();

    logger.info(`Friend request sent from ${userId} to ${recipientId}`);

    res.json({
      success: true,
      message: '好友请求已发送',
    });
  } catch (error) {
    logger.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: '发送好友请求失败' });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { requestId } = req.params;

    const friendship = await Friendship.findById(requestId);

    if (!friendship) {
      res.status(404).json({ success: false, message: '好友请求不存在' });
      return;
    }

    if (friendship.recipient.toString() !== userId) {
      res.status(403).json({ success: false, message: '无权处理此请求' });
      return;
    }

    if (friendship.status !== 'pending') {
      res.status(400).json({ success: false, message: '该请求已处理' });
      return;
    }

    friendship.status = 'accepted';
    await friendship.save();

    logger.info(`Friend request ${requestId} accepted`);

    res.json({
      success: true,
      message: '已接受好友请求',
    });
  } catch (error) {
    logger.error('Accept friend request error:', error);
    res.status(500).json({ success: false, message: '接受好友请求失败' });
  }
};

export const rejectFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { requestId } = req.params;

    const friendship = await Friendship.findById(requestId);

    if (!friendship) {
      res.status(404).json({ success: false, message: '好友请求不存在' });
      return;
    }

    if (friendship.recipient.toString() !== userId) {
      res.status(403).json({ success: false, message: '无权处理此请求' });
      return;
    }

    friendship.status = 'rejected';
    await friendship.save();

    res.json({
      success: true,
      message: '已拒绝好友请求',
    });
  } catch (error) {
    logger.error('Reject friend request error:', error);
    res.status(500).json({ success: false, message: '拒绝好友请求失败' });
  }
};

export const removeFriend = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { friendId } = req.params;

    const result = await Friendship.deleteOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: 'accepted',
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: '好友关系不存在' });
      return;
    }

    logger.info(`Friend removed: ${userId} - ${friendId}`);

    res.json({
      success: true,
      message: '已删除好友',
    });
  } catch (error) {
    logger.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: '删除好友失败' });
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string' || keyword.length < 2) {
      res.status(400).json({ success: false, message: '请输入至少2个字符' });
      return;
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { wechatNickname: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword } },
      ],
    })
      .select('wechatNickname wechatAvatar')
      .limit(20);

    const usersWithTeam = await Promise.all(users.map(async (u) => {
      const team = await Team.findOne({ owner: u._id }).select('name reputation');
      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: u._id },
          { requester: u._id, recipient: userId },
        ],
      });

      return {
        _id: u._id,
        nickname: u.wechatNickname || 'Player',
        avatar: u.wechatAvatar,
        team: team ? { name: team.name, reputation: team.reputation } : null,
        friendshipStatus: friendship?.status || null,
      };
    }));

    res.json({
      success: true,
      data: usersWithTeam,
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ success: false, message: '搜索用户失败' });
  }
};

export const getFriendDynamics = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    });

    const friendIds = friendships.map(f => 
      f.requester.toString() === userId ? f.recipient : f.requester
    );

    const teams = await Team.find({ owner: { $in: friendIds } })
      .populate('owner', 'wechatNickname wechatAvatar')
      .select('name reputation')
      .sort({ createdAt: -1 })
      .limit(20);

    const dynamics = teams.map(team => ({
      friend: {
        _id: (team.owner as any)._id,
        nickname: (team.owner as any).wechatNickname || 'Player',
        avatar: (team.owner as any).wechatAvatar,
      },
      team: {
        name: team.name,
        reputation: team.reputation,
      },
      lastActive: team.createdAt,
    }));

    res.json({
      success: true,
      data: dynamics,
    });
  } catch (error) {
    logger.error('Get friend dynamics error:', error);
    res.status(500).json({ success: false, message: '获取好友动态失败' });
  }
};
