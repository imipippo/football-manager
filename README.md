# 足球经理 (Football Manager)

一款足球俱乐部经营模拟移动游戏 MVP。

## 技术栈

### 后端
- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose
- Redis
- JWT 认证

### 移动端
- React Native
- TypeScript
- Redux Toolkit + Redux Persist
- React Navigation

## 项目结构

```
足球经理/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── schemas/        # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   │   └── matchEngine/ # 比赛引擎
│   │   ├── utils/          # 工具函数
│   │   └── __tests__/      # 测试文件
│   └── package.json
├── mobile/                  # 移动端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── screens/        # 页面
│   │   ├── navigation/     # 导航配置
│   │   ├── services/       # API服务
│   │   ├── store/          # Redux状态管理
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── utils/          # 工具函数
│   │   └── types/          # 类型定义
│   └── package.json
└── docker-compose.yml       # Docker编排
```

## 快速开始

### 环境要求

- Node.js >= 18
- MongoDB >= 6.0
- Redis >= 7.0
- React Native 开发环境

### 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 开发模式
npm run dev

# 生产构建
npm run build
npm start

# 运行测试
npm test
```

### 移动端启动

```bash
cd mobile

# 安装依赖
npm install

# iOS
npm run ios

# Android
npm run android
```

### Docker 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## API 接口

### 认证
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/profile` - 获取用户信息

### 球员
- `GET /api/v1/players` - 获取球员列表
- `GET /api/v1/players/:id` - 获取球员详情
- `POST /api/v1/players` - 创建球员
- `PUT /api/v1/players/:id` - 更新球员
- `DELETE /api/v1/players/:id` - 删除球员

### 球队
- `GET /api/v1/teams` - 获取球队列表
- `GET /api/v1/teams/:id` - 获取球队详情
- `POST /api/v1/teams` - 创建球队
- `PUT /api/v1/teams/:id` - 更新球队

### 比赛
- `POST /api/v1/matches/simulate` - 模拟比赛

### 联赛
- `GET /api/v1/leagues` - 获取联赛列表
- `GET /api/v1/leagues/:id` - 获取联赛详情

## 比赛引擎

比赛引擎采用事件驱动 + 状态机架构：

### 状态流转
```
not_started -> first_half -> half_time -> second_half -> finished
```

### 核心特性
- 基于球员能力的概率计算
- 战术克制系统（进攻克制防守，防守克制反击，反击克制进攻）
- 实时事件生成（进球、助攻、黄牌、红牌等）
- 心理变量影响（领先/落后状态）

## 环境变量

### 后端 (.env)
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/football-manager
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
```

## 开发指南

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 编写单元测试

### Git 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试相关

## License

MIT
