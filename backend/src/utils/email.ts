import nodemailer from 'nodemailer';

type OrderEmail = { customerName?: string; totalAmount?: number; paymentMethod?: string };

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string));

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true';
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`Email skipped for ${to}: SMTP_HOST, SMTP_USER, and SMTP_PASS are required.`);
    return false;
  }

  const from = process.env.SMTP_FROM || `ToolKit <${process.env.SMTP_USER}>`;
  await transporter.sendMail({ from, to: to.trim(), subject, text, html });
  return true;
};

export const sendOrderEmail = async (to: string, orderId: string, order: OrderEmail = {}) => {
  const subject = `ToolKit order confirmation #${orderId}`;
  const name = order.customerName || 'there';
  const total = typeof order.totalAmount === 'number' ? `PKR ${order.totalAmount.toFixed(0)}` : 'your order total';
  const payment = order.paymentMethod || 'selected payment method';
  const text = `Hi ${name},\n\nThanks for your ToolKit order #${orderId}. Your order total is ${total}, paid by ${payment}.\n\nWe will send another update when it is ready to ship.\n\nToolKit`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#111827"><h1 style="color:#2563eb">Order confirmed</h1><p>Hi ${escapeHtml(name)},</p><p>Thanks for your ToolKit order <strong>#${escapeHtml(orderId)}</strong>.</p><p>Total: <strong>${escapeHtml(total)}</strong><br>Payment: ${escapeHtml(payment)}</p><p>We will send another update when it is ready to ship.</p><p>ToolKit</p></div>`;

  try {
    if (await sendEmail(to, subject, text, html)) console.log(`Order confirmation email sent to ${to}.`);
  } catch (error) {
    console.error('Order email failed without blocking checkout', error);
  }
};

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
  const subject = 'Reset your ToolKit password';
  const text = `Use this link to reset your ToolKit password:\n\n${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`;
  const safeUrl = escapeHtml(resetUrl);
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#111827"><h1 style="color:#2563eb">Reset your password</h1><p>We received a request to reset your ToolKit password.</p><p><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;text-decoration:none">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p></div>`;

  try {
    if (await sendEmail(to, subject, text, html)) console.log(`Password reset email sent to ${to}.`);
  } catch (error) {
    console.error('Password reset email failed', error);
  }
};
