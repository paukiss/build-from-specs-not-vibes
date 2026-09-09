export const config = {
  debug: process.env.DEBUG === 'true',
  databasePath: process.env.DATABASE_PATH || './data/purchase_orders.db',
  notificationRetryInterval: parseInt(process.env.NOTIFICATION_RETRY_INTERVAL || '30000'),
  port: parseInt(process.env.PORT || '3000'),
  notificationEmail: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@example.com',
  notificationSmtp: {
    host: process.env.NOTIFICATION_SMTP_HOST || 'localhost',
    port: parseInt(process.env.NOTIFICATION_SMTP_PORT || '1025'),
  },
};
