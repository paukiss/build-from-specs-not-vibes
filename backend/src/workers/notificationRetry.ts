import { allAsync, runAsync } from '../db/sqlite';
import { EmailNotificationChannel } from '../notifications/notificationChannel';
import { logger } from '../utils/logger';

const notificationChannel = new EmailNotificationChannel();

export function setupNotificationWorker() {
  setInterval(async () => {
    try {
      const pending = await allAsync('SELECT * FROM notifications WHERE status = ? LIMIT 10', ['pending']);
      
      for (const notif of pending) {
        const success = await notificationChannel.sendNotification(notif.recipient, notif.type, {} as any);
        
        if (success) {
          await runAsync('UPDATE notifications SET status = ? WHERE id = ?', ['sent', notif.id]);
          logger.info('Notification sent', { id: notif.id });
        } else {
          const newRetry = notif.retry_count + 1;
          if (newRetry >= 3) {
            await runAsync('UPDATE notifications SET status = ? WHERE id = ?', ['failed', notif.id]);
            logger.error('Notification failed after retries', { id: notif.id });
          } else {
            await runAsync('UPDATE notifications SET retry_count = ? WHERE id = ?', [newRetry, notif.id]);
          }
        }
      }
    } catch (error) {
      logger.error('Notification worker error', error);
    }
  }, 30000); // Run every 30 seconds
}
