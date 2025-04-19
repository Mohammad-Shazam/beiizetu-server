const app = require('./app');
const http = require('http');
const logger = require('./utils/logger');

const desiredPort = process.env.PORT || 5000;
const MAX_PORT_ATTEMPTS = 10;

async function findAvailablePort(startPort) {
  let port = startPort;
  const net = require('net');
  
  while (port <= startPort + MAX_PORT_ATTEMPTS) {
    const server = net.createServer();
    
    try {
      await new Promise((resolve, reject) => {
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            logger.warn(`Port ${port} is in use, trying ${port + 1}`);
            resolve(false);
          } else {
            reject(err);
          }
        });
        
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        
        server.listen(port);
      });
      
      return port;
    } catch (err) {
      throw err;
    } finally {
      port++;
    }
  }
  
  throw new Error(`No available ports found between ${startPort}-${startPort + MAX_PORT_ATTEMPTS}`);
}

async function startServer() {
  try {
    const availablePort = await findAvailablePort(desiredPort);
    
    if (availablePort !== desiredPort) {
      logger.warn(`Using port ${availablePort} instead of ${desiredPort}`);
    }

    const server = http.createServer(app);
    
    server.listen(availablePort, () => {
      logger.info(`Server running on port ${availablePort}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();