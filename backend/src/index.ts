import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import config from './config';
import { connectDatabase } from './config/database';
import logger from './utils/logger';
import authRoutes from './routes/authRoutes';
import playerRoutes from './routes/playerRoutes';
import teamRoutes from './routes/teamRoutes';
import matchRoutes from './routes/matchRoutes';
import leagueRoutes from './routes/leagueRoutes';
import trainingRoutes from './routes/trainingRoutes';
import transferRoutes from './routes/transferRoutes';
import financeRoutes from './routes/financeRoutes';
import youthRoutes from './routes/youthRoutes';
import coachRoutes from './routes/coachRoutes';
import socialRoutes from './routes/socialRoutes';

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(morgan('combined'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Football Manager API',
    version: '1.0.0',
    description: '足球俱乐部经营游戏后端API',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/leagues', leagueRoutes);
app.use('/api/v1/training', trainingRoutes);
app.use('/api/v1/transfer', transferRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/youth', youthRoutes);
app.use('/api/v1/coaches', coachRoutes);
app.use('/api/v1/social', socialRoutes);

app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    await connectDatabase();
    
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;

