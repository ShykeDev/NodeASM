const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Custom logger middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  const logMessage = `[${timestamp}] ${method} ${url} - IP: ${ip}`;
  
  // Log to console
  console.log(logMessage);
  
  // Log to file
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage + '\n');
  
  next();
};

// Morgan configuration for development
const morganConfig = morgan('combined', {
  stream: {
    write: (message) => {
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, `access-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, message);
    }
  }
});

module.exports = {
  logger,
  morganConfig
};
