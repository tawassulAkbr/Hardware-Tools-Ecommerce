import net from 'node:net';
import tls from 'node:tls';

type OrderEmail = { customerName?: string; totalAmount?: number; paymentMethod?: string };

const readResponse = (socket: net.Socket | tls.TLSSocket) => new Promise<string>((resolve, reject) => {
  let buffer = '';
  const onData = (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    const complete = lines.filter((line) => /^\d{3} /.test(line));
    if (complete.length) {
      socket.off('data', onData);
      resolve(complete[complete.length - 1]);
    }
  };
  socket.on('data', onData);
  socket.once('error', reject);
});

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string));

const sendCommand = async (socket: net.Socket | tls.TLSSocket, command: string, expected: number[]) => {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);
  const code = Number(response.slice(0, 3));
  if (!expected.includes(code)) throw new Error(`SMTP ${code}: ${response}`);
};

const smtpSend = async (to: string, subject: string, body: string, html: string) => {
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
  const configuredFrom = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const from = configuredFrom.match(/<([^>]+)>/)?.[1] || configuredFrom;
  const fromHeader = configuredFrom.includes('<') ? configuredFrom : `ToolKit <${from}>`;
  const recipient = to.trim();
  let socket: net.Socket | tls.TLSSocket = secure ? tls.connect({ host, port, servername: host }) : net.connect(port, host);
  socket.setTimeout(10000, () => socket.destroy(new Error('SMTP connection timed out')));
  await readResponse(socket);
  await sendCommand(socket, `EHLO toolkit.local`, [250]);
  if (!secure && port === 587) {
    await sendCommand(socket, 'STARTTLS', [220]);
    socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const upgraded = tls.connect({ socket: socket as net.Socket, servername: host }, () => resolve(upgraded));
      upgraded.once('error', reject);
    });
    await sendCommand(socket, `EHLO toolkit.local`, [250]);
  }
  await sendCommand(socket, 'AUTH LOGIN', [334]);
  await sendCommand(socket, Buffer.from(process.env.SMTP_USER!).toString('base64'), [334]);
  const smtpPassword = process.env.SMTP_PASS!.replace(/\s/g, '');
  await sendCommand(socket, Buffer.from(smtpPassword).toString('base64'), [235]);
  await sendCommand(socket, `MAIL FROM:<${from}>`, [250]);
  await sendCommand(socket, `RCPT TO:<${recipient}>`, [250, 251]);
  await sendCommand(socket, 'DATA', [354]);
  socket.write(`From: ${fromHeader}\r\nTo: ${recipient}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary="toolkit-boundary"\r\n\r\n--toolkit-boundary\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}\r\n\r\n--toolkit-boundary\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${html}\r\n\r\n--toolkit-boundary--\r\n.\r\n`);
  await readResponse(socket);
  socket.write('QUIT\r\n');
  socket.end();
};

export const sendOrderEmail = async (to: string, orderId: string, order: OrderEmail = {}) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Email skipped for ${to}: SMTP is not configured.`);
    return;
  }

  const subject = `ToolKit order confirmation #${orderId}`;
  const name = order.customerName || 'there';
  const total = typeof order.totalAmount === 'number' ? `$${order.totalAmount.toFixed(2)}` : 'your order total';
  const payment = order.paymentMethod || 'selected payment method';
  const body = `Hi ${name},\n\nThanks for your ToolKit order #${orderId}. Your order total is ${total}, paid by ${payment}.\n\nWe will send another update when it is ready to ship.\n\nToolKit`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#111827"><h1 style="color:#2563eb">Order confirmed</h1><p>Hi ${escapeHtml(name)},</p><p>Thanks for your ToolKit order <strong>#${escapeHtml(orderId)}</strong>.</p><p>Total: <strong>${escapeHtml(total)}</strong><br>Payment: ${escapeHtml(payment)}</p><p>We will send another update when it is ready to ship.</p><p>ToolKit</p></div>`;

  try {
    await smtpSend(to, subject, body, html);
    console.log(`Order confirmation email sent to ${to}.`);
  } catch (error) {
    console.error('Order email failed without blocking checkout', error);
  }
};

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Password reset email skipped for ${to}: SMTP is not configured.`);
    return;
  }

  const subject = 'Reset your ToolKit password';
  const body = `Use this link to reset your ToolKit password:\n\n${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`;
  const safeUrl = escapeHtml(resetUrl);
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#111827"><h1 style="color:#2563eb">Reset your password</h1><p>We received a request to reset your ToolKit password.</p><p><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;text-decoration:none">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p></div>`;

  try {
    await smtpSend(to, subject, body, html);
    console.log(`Password reset email sent to ${to}.`);
  } catch (error) {
    console.error('Password reset email failed', error);
  }
};
