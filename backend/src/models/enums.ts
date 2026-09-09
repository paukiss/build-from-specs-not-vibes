export enum PurchaseOrderStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Fulfilled = 'fulfilled',
  PartiallyFulfilled = 'partially_fulfilled',
  Cancelled = 'cancelled',
}

export enum ApprovalDecision {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum NotificationType {
  Submitted = 'submitted',
  Approved = 'approved',
  Fulfilled = 'fulfilled',
  Cancelled = 'cancelled',
}

export enum NotificationStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
}

export enum NotificationChannel {
  Email = 'email',
  Webhook = 'webhook',
}
