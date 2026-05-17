import { createLogger, format, transports, Logger } from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, context, correlationId, ...meta }) => {
    const ctx = context ? `[${context}]` : '';
    const cid = correlationId ? ` cid=${correlationId}` : '';
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level} ${ctx}${cid} ${message}${extra}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export function createWinstonLogger(): Logger {
  const isDev = process.env.NODE_ENV !== 'production';

  return createLogger({
    level: isDev ? 'debug' : 'info',
    format: isDev ? devFormat : prodFormat,
    transports: [
      new transports.Console(),
      ...(isDev
        ? []
        : [
            new transports.File({ filename: 'logs/error.log', level: 'error' }),
            new transports.File({ filename: 'logs/combined.log' }),
          ]),
    ],
  });
}

export const winstonLogger = createWinstonLogger();
