const nodemailer = require('nodemailer');

// ── Create reusable transporter ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Maintenance Bill Notification ─────────────────────────────────────────────
/**
 * @param {Object} options
 * @param {string} options.toEmail  - Recipient email address
 * @param {string} options.toName   - Recipient name
 * @param {string} options.flatNo   - Flat number e.g. "A-101"
 * @param {string} options.month    - Billing month e.g. "2026-06"
 * @param {string} options.aptName  - Apartment name
 * @param {number} options.total    - Total amount due for this flat
 * @param {number} options.arrears  - Arrears carried over
 */
const sendMaintenanceBillEmail = async ({ toEmail, toName, flatNo, month, aptName, total, arrears, pdfBuffer }) => {
  const monthLabel = month
    ? new Date(month + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    : 'This Month';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
        .card { background: #fff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 32px 28px; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
        .body { padding: 28px; }
        .greeting { color: #334155; font-size: 15px; margin-bottom: 20px; }
        .bill-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .bill-box h3 { margin: 0 0 14px; color: #1e40af; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #475569; }
        .row:last-child { border-bottom: none; }
        .row.total { font-weight: 700; color: #0f172a; font-size: 16px; border-top: 2px solid #cbd5e1; padding-top: 14px; margin-top: 6px; }
        .arrears-note { color: #b91c1c; font-size: 13px; }
        .total-amount { color: #1e40af; font-size: 18px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
        .badge { display: inline-block; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🏢 Maintenance Bill Generated</h1>
          <p>${aptName} &nbsp;·&nbsp; <span class="badge" style="color:#93c5fd; background:transparent; border-color:#60a5fa">${monthLabel}</span></p>
        </div>
        <div class="body">
          <p class="greeting">Dear <strong>${toName}</strong>,</p>
          <p style="color:#475569; font-size:14px;">Your maintenance bill for <strong>${flatNo}</strong> has been generated for <strong>${monthLabel}</strong>. Please find the summary below:</p>

          <div class="bill-box">
            <h3>📋 Bill Summary</h3>
            <div class="row"><span>Flat No</span><span><strong>${flatNo}</strong></span></div>
            <div class="row"><span>Billing Month</span><span>${monthLabel}</span></div>
            ${arrears > 0 ? `<div class="row"><span class="arrears-note">⚠️ Previous Outstanding</span><span class="arrears-note">₹${Math.round(arrears).toLocaleString('en-IN')}</span></div>` : ''}
            <div class="row total">
              <span>TOTAL AMOUNT DUE</span>
              <span class="total-amount">₹${Math.round(total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p style="color:#64748b; font-size:13px;">Please pay your dues within 5 days to avoid late payment penalties. For queries, contact your apartment manager.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ${aptName} Apartment Management System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `🏢 Maintenance Bill – ${flatNo} | ${monthLabel}`,
    html,
  };

  if (pdfBuffer) {
    mailOptions.attachments = [{
      filename: `Invoice_${flatNo}_${month || 'bill'}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }];
  }

  await transporter.sendMail(mailOptions);
};

// ── Payment Received Notification ─────────────────────────────────────────────
/**
 * @param {Object} options
 * @param {string} options.toEmail  - Recipient email
 * @param {string} options.toName   - Recipient name
 * @param {string} options.flatNo   - Flat number
 * @param {number} options.amount   - Payment amount
 * @param {string} options.mode     - Payment mode (UPI, Cash, etc.)
 * @param {string} options.status   - New bill status (paid / partial)
 * @param {string} options.aptName  - Apartment name
 */
const sendPaymentConfirmationEmail = async ({ toEmail, toName, flatNo, amount, mode, status, aptName }) => {
  const isPaid = status === 'paid';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
        .card { background: #fff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${isPaid ? '#15803d, #22c55e' : '#b45309, #f59e0b'}); color: white; padding: 32px 28px; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
        .body { padding: 28px; }
        .amount-box { text-align: center; background: ${isPaid ? '#f0fdf4' : '#fffbeb'}; border: 2px solid ${isPaid ? '#86efac' : '#fcd34d'}; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .amount-box .amount { font-size: 36px; font-weight: 800; color: ${isPaid ? '#15803d' : '#b45309'}; }
        .amount-box .label { color: #64748b; font-size: 13px; margin-top: 4px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #475569; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${isPaid ? '✅ Payment Confirmed!' : '📩 Partial Payment Received'}</h1>
          <p>${aptName} &nbsp;·&nbsp; Flat ${flatNo}</p>
        </div>
        <div class="body">
          <p style="color:#475569; font-size:14px;">Dear <strong>${toName}</strong>, we have received your payment. Here are the details:</p>
          <div class="amount-box">
            <div class="amount">₹${Math.round(amount).toLocaleString('en-IN')}</div>
            <div class="label">${isPaid ? 'Bill Fully Paid ✅' : 'Partial Payment – Outstanding balance remains'}</div>
          </div>
          <div class="row"><span>Flat</span><span><strong>${flatNo}</strong></span></div>
          <div class="row"><span>Amount Paid</span><span><strong>₹${Math.round(amount).toLocaleString('en-IN')}</strong></span></div>
          <div class="row"><span>Payment Mode</span><span>${mode}</span></div>
          <div class="row"><span>Bill Status</span><span style="font-weight:700;color:${isPaid ? '#15803d' : '#b45309'}">${status.toUpperCase()}</span></div>
        </div>
        <div class="footer">
          <p>This is an automated confirmation from ${aptName} Apartment Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `${isPaid ? '✅ Payment Confirmed' : '📩 Partial Payment Received'} – ${flatNo} | ${aptName}`,
    html,
  });
};

module.exports = { sendMaintenanceBillEmail, sendPaymentConfirmationEmail };
