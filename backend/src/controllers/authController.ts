import { Request, Response } from 'express';
import User from '../schemas/User';
import config from '../config';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: '7d' }
  );
};

const generateUsername = (prefix: string): string => {
  const randomNum = Math.floor(Math.random() * 100000);
  return `${prefix}${randomNum}`;
};

export const sendSmsCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({ success: false, message: '请输入有效的手机号' });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    logger.info(`SMS code for ${phone}: ${code}`);

    res.json({
      success: true,
      message: '验证码已发送',
      data: {
        expiresIn: 300,
      },
    });
  } catch (error) {
    logger.error('Send SMS error:', error);
    res.status(500).json({ success: false, message: '发送验证码失败' });
  }
};

export const loginWithPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({ success: false, message: '请输入有效的手机号' });
      return;
    }

    if (!code || !/^\d{6}$/.test(code)) {
      res.status(400).json({ success: false, message: '请输入6位数字验证码' });
      return;
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        phoneVerified: true,
        username: generateUsername('用户'),
      });
      logger.info(`New user registered via phone: ${phone}`);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          wechatNickname: user.wechatNickname,
          wechatAvatar: user.wechatAvatar,
          lastLogin: user.lastLogin,
        },
        token,
        isNewUser: !user.username || user.username.startsWith('用户'),
      },
      message: '登录成功',
    });
  } catch (error) {
    logger.error('Phone login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
};

export const loginWithWechat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: '微信授权码不能为空' });
      return;
    }

    const mockOpenid = `mock_openid_${Date.now()}`;
    const mockUnionid = `mock_unionid_${Date.now()}`;
    const mockNickname = '微信用户';
    const mockAvatar = '';

    let user = await User.findOne({ wechatOpenid: mockOpenid });

    if (!user) {
      user = await User.create({
        wechatOpenid: mockOpenid,
        wechatUnionid: mockUnionid,
        wechatNickname: mockNickname,
        wechatAvatar: mockAvatar,
        username: mockNickname,
      });
      logger.info(`New user registered via WeChat: ${mockOpenid}`);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          wechatNickname: user.wechatNickname,
          wechatAvatar: user.wechatAvatar,
          lastLogin: user.lastLogin,
        },
        token,
        isNewUser: !user.phone,
      },
      message: '登录成功',
    });
  } catch (error) {
    logger.error('WeChat login error:', error);
    res.status(500).json({ success: false, message: '微信登录失败' });
  }
};

export const bindPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    const { phone, code } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({ success: false, message: '请输入有效的手机号' });
      return;
    }

    const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
    if (existingUser) {
      res.status(400).json({ success: false, message: '该手机号已被其他账号绑定' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    user.phone = phone;
    user.phoneVerified = true;
    await user.save();

    res.json({
      success: true,
      data: {
        phone: user.phone,
        phoneVerified: user.phoneVerified,
      },
      message: '手机号绑定成功',
    });
  } catch (error) {
    logger.error('Bind phone error:', error);
    res.status(500).json({ success: false, message: '绑定手机号失败' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    const { username } = req.body;

    if (!username || username.length < 2 || username.length > 30) {
      res.status(400).json({ success: false, message: '用户名长度需要在2-30个字符之间' });
      return;
    }

    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
      res.status(400).json({ success: false, message: '该用户名已被使用' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    user.username = username;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        wechatNickname: user.wechatNickname,
        wechatAvatar: user.wechatAvatar,
      },
      message: '更新成功',
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        wechatNickname: user.wechatNickname,
        wechatAvatar: user.wechatAvatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};
