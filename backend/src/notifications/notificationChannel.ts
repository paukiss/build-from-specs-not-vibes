import { PurchaseOrder } from '../models/purchaseOrder';
import { NotificationType } from '../models/enums';

export interface NotificationChannel {
  sendNotification(
    recipient: string,
    type: NotificationType,
    po: PurchaseOrder
  ): Promise<boolean>;
}

export class EmailNotificationChannel implements NotificationChannel {
  async sendNotification(recipient: string, type: NotificationType, po: PurchaseOrder): Promise<boolean> {
    console.log(`[EMAIL] Sending ${type} notification to ${recipient} for PO ${po.id}`);
    // Stub implementation - in production, use nodemailer
    return true;
  }
}
