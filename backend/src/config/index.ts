import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/football-manager',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  compression: {
    enabled: process.env.COMPRESSION_ENABLED === 'true',
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024', 10),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
