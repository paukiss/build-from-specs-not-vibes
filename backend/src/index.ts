import express, { Express, Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite3';
import { configureDatabase, runMigrations } from './db/sqlite';
import { errorHandler } from './middleware/errorHandler';
import { setupNotificationWorker } from './workers/notificationRetry';
import purchaseOrderRoutes from './api/purchaseOrders';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/v1', purchaseOrderRoutes);

// Error handling
app.use(errorHandler);

// Initialize application
async function initializeApp() {
  try {
    // Setup database
    await configureDatabase();
    await runMigrations();
    console.log('Database initialized');

    // Start notification worker
    setupNotificationWorker();
    console.log('Notification worker started');

    // Start server
    app.listen(PORT, () => {
      console.log(`Purchase Order API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

initializeApp();

export default app;
