# 足球俱乐部经营游戏 MVP - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建足球俱乐部经营模拟手游MVP，包含账号、球员、比赛、训练、转会、经济、联赛七大核心系统

**Architecture:** 采用前后端分离架构，后端使用Node.js+TypeScript提供RESTful API，前端使用React Native构建跨平台App，数据存储使用MongoDB+Redis

**Tech Stack:** Node.js, TypeScript, Express, MongoDB, Redis, React Native, Jest

---

## 项目结构

```
e:\足球经理\
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── models/            # 数据模型
│   │   ├── schemas/           # MongoDB Schema
│   │   ├── controllers/       # 控制器
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── middleware/        # 中间件
│   │   ├── utils/             # 工具函数
│   │   └── tests/             # 测试文件
│   ├── package.json
│   └── tsconfig.json
├── mobile/                     # React Native App
│   ├── src/
│   │   ├── screens/           # 页面组件
│   │   ├── components/        # UI组件
│   │   ├── navigation/        # 导航配置
│   │   ├── store/             # 状态管理
│   │   ├── services/          # API服务
│   │   └── utils/             # 工具函数
│   ├── package.json
│   └── App.tsx
└── docs/                       # 文档
    ├── superpowers/
    │   ├── specs/             # 设计规格
    │   └── plans/             # 实施计划
    └── PRD.md
```

---

## 阶段一：基础设施搭建

### Task 1: 初始化后端项目

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/.env.example`

- [ ] **Step 1: 创建后端目录和初始化项目**

```bash
mkdir -p backend/src
cd backend
npm init -y
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install express mongoose redis dotenv cors helmet morgan bcryptjs jsonwebtoken
npm install -D typescript @types/node @types/express @types/mongoose @types/bcryptjs @types/jsonwebtoken @types/cors @types/morgan ts-node nodemon jest @types/jest
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: 创建 .env.example**

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/football-manager
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

- [ ] **Step 5: 创建入口文件 src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 6: 添加 npm scripts 到 package.json**

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  }
}
```

- [ ] **Step 7: 验证后端启动**

```bash
npm run dev
```

Expected: Server running on port 3000

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: initialize backend project with Express + TypeScript"
```

---

### Task 2: 配置数据库连接

**Files:**
- Create: `backend/src/config/index.ts`
- Create: `backend/src/config/database.ts`
- Create: `backend/src/utils/logger.ts`

- [ ] **Step 1: 创建配置文件 src/config/index.ts**

```typescript
import dotenv from 'dotenv';

dotenv.config();

export default {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/football-manager',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
```

- [ ] **Step 2: 创建数据库连接 src/config/database.ts**

```typescript
import mongoose from 'mongoose';
import config from './index';
import logger from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
```

- [ ] **Step 3: 创建日志工具 src/utils/logger.ts**

```typescript
const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
    }
  },
};

export default logger;
```

- [ ] **Step 4: 更新入口文件集成数据库**

```typescript
import { connectDatabase } from './config/database';

const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

startServer();
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/config backend/src/utils
git commit -m "feat: add database configuration and logger"
```

---

### Task 3: 创建用户认证系统

**Files:**
- Create: `backend/src/schemas/User.ts`
- Create: `backend/src/models/User.ts`
- Create: `backend/src/controllers/authController.ts`
- Create: `backend/src/routes/authRoutes.ts`
- Create: `backend/src/middleware/auth.ts`

- [ ] **Step 1: 创建用户 Schema**

```typescript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
});

export const UserModel = mongoose.model('User', userSchema);
```

- [ ] **Step 2: 创建认证控制器**

```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../schemas/User';
import config from '../config';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ username, email, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.status(201).json({ user: { id: user._id, username, email }, token });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.json({ user: { id: user._id, username: user.username, email }, token });
  } catch (error) {
    res.status(400).json({ error: 'Login failed' });
  }
};
```

- [ ] **Step 3: 创建认证路由**

```typescript
import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();
router.post('/register', register);
router.post('/login', login);

export default router;
```

- [ ] **Step 4: 创建认证中间件**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/schemas backend/src/controllers backend/src/routes backend/src/middleware
git commit -m "feat: add user authentication system"
```

---

## 阶段二：核心数据模型

### Task 4: 创建球员数据模型

**Files:**
- Create: `backend/src/schemas/Player.ts`
- Create: `backend/src/models/Player.ts`

- [ ] **Step 1: 创建球员 Schema（完整属性）**

```typescript
import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 15, max: 45 },
  nationality: { type: String, required: true },
  position: { type: String, required: true, enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'] },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  
  physical: {
    speed: { type: Number, min: 1, max: 100 },
    stamina: { type: Number, min: 1, max: 100 },
    strength: { type: Number, min: 1, max: 100 },
    agility: { type: Number, min: 1, max: 100 },
    constitution: { type: Number, min: 1, max: 100 },
  },
  
  technical: {
    passing: { type: Number, min: 1, max: 100 },
    shooting: { type: Number, min: 1, max: 100 },
    dribbling: { type: Number, min: 1, max: 100 },
    ballControl: { type: Number, min: 1, max: 100 },
    setPieces: { type: Number, min: 1, max: 100 },
    interception: { type: Number, min: 1, max: 100 },
    tackling: { type: Number, min: 1, max: 100 },
    aggression: { type: Number, min: 1, max: 100 },
    marking: { type: Number, min: 1, max: 100 },
    heading: { type: Number, min: 1, max: 100 },
  },
  
  mental: {
    confidence: { type: Number, min: 1, max: 100 },
    composure: { type: Number, min: 1, max: 100 },
    focus: { type: Number, min: 1, max: 100 },
    determination: { type: Number, min: 1, max: 100 },
    leadership: { type: Number, min: 1, max: 100 },
    teamwork: { type: Number, min: 1, max: 100 },
  },
  
  footballIQ: { type: Number, min: 1, max: 100 },
  potential: { type: Number, min: 1, max: 100 },
  overallRating: { type: Number, min: 1, max: 100 },
  
  contract: {
    weeklyWage: { type: Number },
    endDate: { type: Date },
  },
  
  status: {
    fatigue: { type: Number, default: 0, min: 0, max: 100 },
    injury: { type: Number, default: 0 },
    morale: { type: Number, default: 70, min: 0, max: 100 },
  },
  
  createdAt: { type: Date, default: Date.now },
});

export const PlayerModel = mongoose.model('Player', playerSchema);
```

- [ ] **Step 2: 创建球员模型方法**

```typescript
playerSchema.methods.calculateOverallRating = function(): number {
  const positionWeights = {
    GK: { physical: 0.2, technical: 0.5, mental: 0.2, iq: 0.1 },
    CB: { physical: 0.35, technical: 0.35, mental: 0.2, iq: 0.1 },
    ST: { physical: 0.25, technical: 0.4, mental: 0.25, iq: 0.1 },
    default: { physical: 0.25, technical: 0.35, mental: 0.3, iq: 0.1 },
  };
  const weights = positionWeights[this.position] || positionWeights.default;
  const physicalAvg = Object.values(this.physical).reduce((a, b) => a + b, 0) / 5;
  const technicalAvg = Object.values(this.technical).reduce((a, b) => a + b, 0) / 10;
  const mentalAvg = Object.values(this.mental).reduce((a, b) => a + b, 0) / 6;
  return Math.round(physicalAvg * weights.physical + technicalAvg * weights.technical + mentalAvg * weights.mental + this.footballIQ * weights.iq);
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/schemas/Player.ts backend/src/models/Player.ts
git commit -m "feat: add player data model with complete attributes"
```

---

### Task 5: 创建球队数据模型

**Files:**
- Create: `backend/src/schemas/Team.ts`
- Create: `backend/src/models/Team.ts`

- [ ] **Step 1: 创建球队 Schema**

```typescript
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  city: { type: String, required: true },
  founded: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  league: {
    currentLeagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
    level: { type: Number, default: 1 },
  },
  
  finance: {
    balance: { type: Number, default: 15000000 },
    weeklyIncome: { type: Number, default: 0 },
    weeklyExpense: { type: Number, default: 0 },
    transferBudget: { type: Number, default: 5000000 },
    wageBudget: { type: Number, default: 500000 },
  },
  
  facilities: {
    stadiumLevel: { type: Number, default: 1 },
    trainingGroundLevel: { type: Number, default: 1 },
    youthAcademyLevel: { type: Number, default: 1 },
    medicalCenterLevel: { type: Number, default: 1 },
  },
  
  tactics: {
    formation: { type: String, default: '4-4-2' },
    style: { type: String, default: 'balanced' },
  },
  
  fans: { type: Number, default: 10000 },
  reputation: { type: Number, default: 50, min: 1, max: 100 },
  
  createdAt: { type: Date, default: Date.now },
});

export const TeamModel = mongoose.model('Team', teamSchema);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/schemas/Team.ts
git commit -m "feat: add team data model"
```

---

### Task 6: 创建联赛数据模型

**Files:**
- Create: `backend/src/schemas/League.ts`
- Create: `backend/src/models/League.ts`

- [ ] **Step 1: 创建联赛 Schema**

```typescript
import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: Number, required: true },
  region: { type: String, required: true },
  season: { type: Number, default: 1 },
  
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  
  standings: [{
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
  }],
  
  fixtures: [{
    homeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    awayTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    matchday: { type: Number },
    date: { type: Date },
    played: { type: Boolean, default: false },
    homeScore: { type: Number },
    awayScore: { type: Number },
  }],
  
  createdAt: { type: Date, default: Date.now },
});

export const LeagueModel = mongoose.model('League', leagueSchema);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/schemas/League.ts
git commit -m "feat: add league data model"
```

---

## 阶段三：比赛引擎

### Task 7: 创建比赛引擎核心

**Files:**
- Create: `backend/src/services/matchEngine/MatchEngine.ts`
- Create: `backend/src/services/matchEngine/StateMachine.ts`
- Create: `backend/src/services/matchEngine/EventGenerator.ts`

- [ ] **Step 1: 创建状态机**

```typescript
export type MatchState = 'not_started' | 'first_half' | 'half_time' | 'second_half' | 'finished';
export type BallZone = 'home_defense' | 'home_midfield' | 'away_midfield' | 'away_defense' | 'home_penalty' | 'away_penalty';
export type Possession = 'home' | 'away' | 'contest';

export interface MatchContext {
  state: MatchState;
  minute: number;
  ballZone: BallZone;
  possession: Possession;
  homeScore: number;
  awayScore: number;
  homeTeam: any;
  awayTeam: any;
  events: any[];
}
```

- [ ] **Step 2: 创建事件生成器**

```typescript
export type EventType = 'pass' | 'shot' | 'goal' | 'foul' | 'corner' | 'free_kick' | 'penalty' | 'yellow_card' | 'red_card' | 'save' | 'tackle' | 'dribble';

export interface MatchEvent {
  type: EventType;
  minute: number;
  team: 'home' | 'away';
  playerId?: string;
  targetPlayerId?: string;
  success: boolean;
  description: string;
}

export class EventGenerator {
  generateEvent(context: MatchContext): MatchEvent | null {
    const eventProbabilities = this.calculateEventProbabilities(context);
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [eventType, probability] of Object.entries(eventProbabilities)) {
      cumulative += probability;
      if (roll < cumulative) {
        return this.createEvent(eventType as EventType, context);
      }
    }
    return null;
  }
  
  private calculateEventProbabilities(context: MatchContext): Record<EventType, number> {
    return {
      pass: 40,
      dribble: 15,
      shot: 8,
      tackle: 12,
      foul: 5,
      corner: 3,
      free_kick: 4,
      save: 8,
      goal: 3,
      penalty: 0.5,
      yellow_card: 1,
      red_card: 0.5,
    };
  }
  
  private createEvent(type: EventType, context: MatchContext): MatchEvent {
    return {
      type,
      minute: context.minute,
      team: context.possession,
      success: Math.random() > 0.3,
      description: `${type} event at minute ${context.minute}`,
    };
  }
}
```

- [ ] **Step 3: 创建比赛引擎主类**

```typescript
import { EventGenerator, MatchEvent } from './EventGenerator';
import { MatchContext, MatchState, BallZone, Possession } from './StateMachine';

export class MatchEngine {
  private eventGenerator: EventGenerator;
  
  constructor() {
    this.eventGenerator = new EventGenerator();
  }
  
  async simulate(homeTeam: any, awayTeam: any): Promise<{ events: MatchEvent[], homeScore: number, awayScore: number }> {
    const context: MatchContext = {
      state: 'first_half',
      minute: 0,
      ballZone: 'home_midfield',
      possession: 'home',
      homeScore: 0,
      awayScore: 0,
      homeTeam,
      awayTeam,
      events: [],
    };
    
    for (let minute = 1; minute <= 90; minute++) {
      context.minute = minute;
      this.updateState(context);
      const event = this.eventGenerator.generateEvent(context);
      if (event) {
        context.events.push(event);
        if (event.type === 'goal') {
          if (event.team === 'home') context.homeScore++;
          else context.awayScore++;
        }
      }
    }
    
    context.state = 'finished';
    return {
      events: context.events,
      homeScore: context.homeScore,
      awayScore: context.awayScore,
    };
  }
  
  private updateState(context: MatchContext): void {
    if (context.minute === 45) context.state = 'half_time';
    if (context.minute === 46) context.state = 'second_half';
    if (Math.random() < 0.1) {
      context.possession = context.possession === 'home' ? 'away' : 'home';
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/matchEngine
git commit -m "feat: add match engine with state machine and event generator"
```

---

## 阶段四：API路由

### Task 8: 创建球员API

**Files:**
- Create: `backend/src/controllers/playerController.ts`
- Create: `backend/src/routes/playerRoutes.ts`

- [ ] **Step 1: 创建球员控制器**

```typescript
import { Request, Response } from 'express';
import { PlayerModel } from '../schemas/Player';

export const getPlayers = async (req: Request, res: Response) => {
  try {
    const { teamId, position, minRating, maxRating } = req.query;
    const query: any = {};
    if (teamId) query.teamId = teamId;
    if (position) query.position = position;
    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = Number(minRating);
      if (maxRating) query.overallRating.$lte = Number(maxRating);
    }
    const players = await PlayerModel.find(query).populate('teamId');
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
};

export const getPlayer = async (req: Request, res: Response) => {
  try {
    const player = await PlayerModel.findById(req.params.id).populate('teamId');
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player' });
  }
};
```

- [ ] **Step 2: 创建球员路由**

```typescript
import { Router } from 'express';
import { getPlayers, getPlayer } from '../controllers/playerController';
import { auth } from '../middleware/auth';

const router = Router();
router.get('/', auth, getPlayers);
router.get('/:id', auth, getPlayer);

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/playerController.ts backend/src/routes/playerRoutes.ts
git commit -m "feat: add player API routes"
```

---

### Task 9: 创建球队API

**Files:**
- Create: `backend/src/controllers/teamController.ts`
- Create: `backend/src/routes/teamRoutes.ts`

- [ ] **Step 1: 创建球队控制器**

```typescript
import { Request, Response } from 'express';
import { TeamModel } from '../schemas/Team';
import { PlayerModel } from '../schemas/Player';

export const getMyTeam = async (req: Request, res: Response) => {
  try {
    const team = await TeamModel.findOne({ userId: req.userId }).populate('league.currentLeagueId');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, shortName, city } = req.body;
    const team = await TeamModel.create({ name, shortName, city, userId: req.userId });
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create team' });
  }
};

export const updateTactics = async (req: Request, res: Response) => {
  try {
    const { formation, style } = req.body;
    const team = await TeamModel.findOneAndUpdate(
      { userId: req.userId },
      { tactics: { formation, style } },
      { new: true }
    );
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update tactics' });
  }
};

export const getSquad = async (req: Request, res: Response) => {
  try {
    const team = await TeamModel.findOne({ userId: req.userId });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const players = await PlayerModel.find({ teamId: team._id });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch squad' });
  }
};
```

- [ ] **Step 2: 创建球队路由**

```typescript
import { Router } from 'express';
import { getMyTeam, createTeam, updateTactics, getSquad } from '../controllers/teamController';
import { auth } from '../middleware/auth';

const router = Router();
router.get('/my', auth, getMyTeam);
router.post('/', auth, createTeam);
router.put('/tactics', auth, updateTactics);
router.get('/squad', auth, getSquad);

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/teamController.ts backend/src/routes/teamRoutes.ts
git commit -m "feat: add team API routes"
```

---

### Task 10: 创建比赛API

**Files:**
- Create: `backend/src/controllers/matchController.ts`
- Create: `backend/src/routes/matchRoutes.ts`

- [ ] **Step 1: 创建比赛控制器**

```typescript
import { Request, Response } from 'express';
import { MatchEngine } from '../services/matchEngine/MatchEngine';
import { TeamModel } from '../schemas/Team';
import { LeagueModel } from '../schemas/League';

const matchEngine = new MatchEngine();

export const getFixtures = async (req: Request, res: Response) => {
  try {
    const team = await TeamModel.findOne({ userId: req.userId });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const league = await LeagueModel.findById(team.league.currentLeagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });
    const fixtures = league.fixtures.filter(f => 
      f.homeTeamId.equals(team._id) || f.awayTeamId.equals(team._id)
    );
    res.json(fixtures);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
};

export const simulateMatch = async (req: Request, res: Response) => {
  try {
    const { fixtureId } = req.params;
    const team = await TeamModel.findOne({ userId: req.userId }).populate('league.currentLeagueId');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const league = await LeagueModel.findById(team.league.currentLeagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });
    const fixture = league.fixtures.id(fixtureId);
    if (!fixture) return res.status(404).json({ error: 'Fixture not found' });
    const homeTeam = await TeamModel.findById(fixture.homeTeamId);
    const awayTeam = await TeamModel.findById(fixture.awayTeamId);
    const result = await matchEngine.simulate(homeTeam, awayTeam);
    fixture.homeScore = result.homeScore;
    fixture.awayScore = result.awayScore;
    fixture.played = true;
    await league.save();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate match' });
  }
};
```

- [ ] **Step 2: 创建比赛路由**

```typescript
import { Router } from 'express';
import { getFixtures, simulateMatch } from '../controllers/matchController';
import { auth } from '../middleware/auth';

const router = Router();
router.get('/fixtures', auth, getFixtures);
router.post('/simulate/:fixtureId', auth, simulateMatch);

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/matchController.ts backend/src/routes/matchRoutes.ts
git commit -m "feat: add match API routes"
```

---

## 阶段五：前端开发

### Task 11: 初始化React Native项目

**Files:**
- Create: `mobile/` 目录结构

- [ ] **Step 1: 创建React Native项目**

```bash
npx react-native init FootballManager --directory mobile
cd mobile
npm install @react-navigation/native @react-navigation/stack @reduxjs/toolkit react-redux axios
```

- [ ] **Step 2: 创建目录结构**

```bash
mkdir -p src/screens src/components src/navigation src/store src/services src/utils
```

- [ ] **Step 3: 创建API服务**

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (username: string, email: string, password: string) => 
    api.post('/auth/register', { username, email, password }),
};

export const teamAPI = {
  getMyTeam: () => api.get('/teams/my'),
  getSquad: () => api.get('/teams/squad'),
  updateTactics: (formation: string, style: string) => 
    api.put('/teams/tactics', { formation, style }),
};

export const matchAPI = {
  getFixtures: () => api.get('/matches/fixtures'),
  simulateMatch: (fixtureId: string) => api.post(`/matches/simulate/${fixtureId}`),
};
```

- [ ] **Step 4: Commit**

```bash
git add mobile/
git commit -m "feat: initialize React Native project with API services"
```

---

### Task 12: 创建登录/注册页面

**Files:**
- Create: `mobile/src/screens/LoginScreen.tsx`
- Create: `mobile/src/screens/RegisterScreen.tsx`

- [ ] **Step 1: 创建登录页面**

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { authAPI, setAuthToken } from '../services/api';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    try {
      const response = await authAPI.login(email, password);
      setAuthToken(response.data.token);
      navigation.replace('Main');
    } catch (error) {
      alert('Login failed');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Football Manager</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});
```

- [ ] **Step 2: 创建注册页面**

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { authAPI, setAuthToken } from '../services/api';

export const RegisterScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleRegister = async () => {
    try {
      const response = await authAPI.register(username, email, password);
      setAuthToken(response.data.token);
      navigation.replace('Main');
    } catch (error) {
      alert('Registration failed');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/LoginScreen.tsx mobile/src/screens/RegisterScreen.tsx
git commit -m "feat: add login and register screens"
```

---

### Task 13: 创建主页面

**Files:**
- Create: `mobile/src/screens/HomeScreen.tsx`
- Create: `mobile/src/screens/TeamScreen.tsx`
- Create: `mobile/src/screens/MatchScreen.tsx`

- [ ] **Step 1: 创建主页面**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { teamAPI } from '../services/api';

export const HomeScreen = () => {
  const [team, setTeam] = useState<any>(null);
  
  useEffect(() => {
    loadTeam();
  }, []);
  
  const loadTeam = async () => {
    try {
      const response = await teamAPI.getMyTeam();
      setTeam(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  
  if (!team) return <Text>Loading...</Text>;
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.teamName}>{team.name}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Finance</Text>
        <Text>Balance: {team.finance.balance.toLocaleString()} FC</Text>
        <Text>Transfer Budget: {team.finance.transferBudget.toLocaleString()} FC</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tactics</Text>
        <Text>Formation: {team.tactics.formation}</Text>
        <Text>Style: {team.tactics.style}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fans</Text>
        <Text>{team.fans.toLocaleString()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  teamName: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
});
```

- [ ] **Step 2: 创建球队页面**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { teamAPI } from '../services/api';

export const TeamScreen = () => {
  const [players, setPlayers] = useState<any[]>([]);
  
  useEffect(() => {
    loadSquad();
  }, []);
  
  const loadSquad = async () => {
    try {
      const response = await teamAPI.getSquad();
      setPlayers(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const renderPlayer = ({ item }: { item: any }) => (
    <View style={styles.playerCard}>
      <Text style={styles.playerName}>{item.name}</Text>
      <Text>{item.position} | {item.age}y | OVR: {item.overallRating}</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Squad</Text>
      <FlatList data={players} keyExtractor={(item) => item._id} renderItem={renderPlayer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  playerCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10 },
  playerName: { fontSize: 16, fontWeight: 'bold' },
});
```

- [ ] **Step 3: 创建比赛页面**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { matchAPI } from '../services/api';

export const MatchScreen = () => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  
  useEffect(() => {
    loadFixtures();
  }, []);
  
  const loadFixtures = async () => {
    try {
      const response = await matchAPI.getFixtures();
      setFixtures(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleSimulate = async (fixtureId: string) => {
    try {
      await matchAPI.simulateMatch(fixtureId);
      loadFixtures();
    } catch (error) {
      console.error(error);
    }
  };
  
  const renderFixture = ({ item }: { item: any }) => (
    <View style={styles.fixtureCard}>
      <Text>{item.homeTeamId.name} vs {item.awayTeamId.name}</Text>
      <Text>Matchday {item.matchday}</Text>
      {item.played ? (
        <Text style={styles.score}>{item.homeScore} - {item.awayScore}</Text>
      ) : (
        <Button title="Simulate" onPress={() => handleSimulate(item._id)} />
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fixtures</Text>
      <FlatList data={fixtures} keyExtractor={(item) => item._id} renderItem={renderFixture} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  fixtureCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10 },
  score: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
});
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/HomeScreen.tsx mobile/src/screens/TeamScreen.tsx mobile/src/screens/MatchScreen.tsx
git commit -m "feat: add home, team, and match screens"
```

---

### Task 14: 配置导航

**Files:**
- Create: `mobile/src/navigation/AppNavigator.tsx`
- Create: `mobile/src/navigation/MainNavigator.tsx`

- [ ] **Step 1: 创建认证导航**

```typescript
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MainNavigator } from './MainNavigator';

const Stack = createStackNavigator();

export const AppNavigator = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
  </Stack.Navigator>
);
```

- [ ] **Step 2: 创建主导航**

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { MatchScreen } from '../screens/MatchScreen';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Team" component={TeamScreen} />
    <Tab.Screen name="Match" component={MatchScreen} />
  </Tab.Navigator>
);
```

- [ ] **Step 3: 更新 App.tsx**

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/navigation mobile/App.tsx
git commit -m "feat: add navigation configuration"
```

---

## 阶段六：测试

### Task 15: 编写后端单元测试

**Files:**
- Create: `backend/src/tests/setup.ts`
- Create: `backend/src/tests/auth.test.ts`
- Create: `backend/src/tests/matchEngine.test.ts`

- [ ] **Step 1: 创建测试配置**

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
```

- [ ] **Step 2: 创建认证测试**

```typescript
import request from 'supertest';
import app from '../index';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

describe('Auth API', () => {
  beforeAll(async () => await connectTestDB());
  afterAll(async () => await disconnectTestDB());
  afterEach(async () => await clearTestDB());

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });
    expect(response.status).toBe(201);
    expect(response.body.user.username).toBe('testuser');
  });

  it('should login existing user', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

- [ ] **Step 3: 创建比赛引擎测试**

```typescript
import { MatchEngine } from '../services/matchEngine/MatchEngine';

describe('MatchEngine', () => {
  it('should simulate a match and return events', async () => {
    const engine = new MatchEngine();
    const homeTeam = { _id: 'home', name: 'Home Team' };
    const awayTeam = { _id: 'away', name: 'Away Team' };
    const result = await engine.simulate(homeTeam, awayTeam);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.homeScore).toBeGreaterThanOrEqual(0);
    expect(result.awayScore).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
cd backend
npm test
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/tests
git commit -m "feat: add unit tests for auth and match engine"
```

---

## 阶段七：集成与部署

### Task 16: 创建Docker配置

**Files:**
- Create: `backend/Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建后端Dockerfile**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: 创建docker-compose**

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/football-manager
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
```

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile docker-compose.yml
git commit -m "feat: add Docker configuration"
```

---

### Task 17: 创建README文档

**Files:**
- Create: `README.md`

- [ ] **Step 1: 创建README**

```markdown
# 足球俱乐部经营游戏

## 项目概述

足球俱乐部经营模拟手游MVP版本

## 技术栈

- 后端: Node.js + TypeScript + Express
- 数据库: MongoDB + Redis
- 前端: React Native

## 快速开始

### 后端

```bash
cd backend
npm install
npm run dev
```

### 前端

```bash
cd mobile
npm install
npm start
```

### Docker

```bash
docker-compose up -d
```

## API文档

- POST /api/v1/auth/register - 注册
- POST /api/v1/auth/login - 登录
- GET /api/v1/teams/my - 获取我的球队
- GET /api/v1/teams/squad - 获取球队阵容
- GET /api/v1/matches/fixtures - 获取赛程
- POST /api/v1/matches/simulate/:id - 模拟比赛

## 开发进度

- [x] 后端基础架构
- [x] 用户认证系统
- [x] 球员数据模型
- [x] 球队数据模型
- [x] 比赛引擎核心
- [x] API路由
- [x] 前端基础页面
- [x] 导航配置
- [x] 单元测试
- [x] Docker配置
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## 完成检查清单

- [ ] 后端服务可以正常启动
- [ ] 数据库连接正常
- [ ] 用户注册/登录功能正常
- [ ] 球员API可以正常访问
- [ ] 球队API可以正常访问
- [ ] 比赛引擎可以模拟比赛
- [ ] 前端可以正常启动
- [ ] 前端可以登录并访问主页面
- [ ] 单元测试全部通过
- [ ] Docker可以正常部署
