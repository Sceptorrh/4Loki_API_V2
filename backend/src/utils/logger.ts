import winston from 'winston';

// Create a custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      metaStr = JSON.stringify(metadata);
    }
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    // Always add console transport
    new winston.transports.Console({
      format: customFormat
    }),
    // Add file transports
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      format: customFormat
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      format: customFormat
    })
  ]
}); 