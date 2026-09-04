import winston from 'winston';
import path from 'path';
import env from './env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Formato legível para desenvolvimento
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return stack
      ? `${ts} ${level}: ${message}\n${stack}${metaStr}`
      : `${ts} ${level}: ${message}${metaStr}`;
  })
);

// Formato JSON estruturado para produção
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: env.isDev() ? 'debug' : 'info',
  format: env.isProd() ? prodFormat : devFormat,
  defaultMeta: { service: 'flashcards-api' },
  transports: [
    new winston.transports.Console(),
  ],
});

// Em produção, log em arquivo também
if (env.isProd()) {
  const logsDir = path.resolve(__dirname, '../../logs');

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

export default logger;
