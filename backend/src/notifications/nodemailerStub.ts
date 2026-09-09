export async function sendNotification(recipient: string, subject: string, body: string) {
  // Stub: record to console for now; in real impl swap with nodemailer transport
  // eslint-disable-next-line no-console
  console.log('sendNotification stub', { recipient, subject, body });
  return { ok: true };
}
