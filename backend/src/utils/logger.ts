type LogLevel = 'info' | 'error' | 'warn' | 'debug';

const formatMessage = (level: LogLevel, message: string, ...args: unknown[]): string => {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ') : '';
  return `${timestamp} ${level.toUpperCase()}: ${message}${formattedArgs}`;
};

const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(formatMessage('info', message, ...args));
  },
  
  error: (message: string, ...args: unknown[]): void => {
    console.error(formatMessage('error', message, ...args));
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(formatMessage('warn', message, ...args));
  },
  
  debug: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, ...args));
    }
  },
};

export default logger;
