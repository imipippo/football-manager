import mongoose from 'mongoose';
import config from './index';
import logger from '../utils/logger';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  const connectionOptions: mongoose.ConnectOptions = {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  };

  try {
    logger.info('Connecting to MongoDB...');
    logger.info(`URI: ${config.mongodb.uri.replace(/:[^:@]+@/, ':****@')}`);

    const connection = await mongoose.connect(config.mongodb.uri, connectionOptions);
    
    isConnected = true;
    
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    logger.info(`Database: ${connection.connection.name}`);

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    logger.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
};

export const isDatabaseConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};

