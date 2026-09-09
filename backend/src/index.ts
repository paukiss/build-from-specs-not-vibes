import express, { Express } from 'express';
import { configureDatabase, runMigrations } from './db/sqlite';
import { errorHandler } from './middleware/errorHandler';
import { setupNotificationWorker } from './workers/notificationRetry';
import purchaseOrderRoutes from './api/purchaseOrders';
import { logger } from './utils/logger';
import { config } from './config/index';

const app: Express = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/v1', purchaseOrderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize application
async function initializeApp() {
  try {
    logger.info('Initializing Purchase Order Management API...');
    
    // Setup database
    await configureDatabase();
    await runMigrations();
    logger.info('Database initialized successfully');

    // Start notification worker
    setupNotificationWorker();
    logger.info('Notification worker started');

    // Start server
    app.listen(config.port, () => {
      logger.info(`API listening on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to initialize application', error);
    process.exit(1);
  }
}

initializeApp();

export default app;
