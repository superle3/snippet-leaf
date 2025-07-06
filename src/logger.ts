import * as winston from 'winston';
import * as path from 'path';

const logFilePath = path.join(__dirname, '..', 'extension.log');
console.log(logFilePath);


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: logFilePath }),
    ],
});

export default logger;
