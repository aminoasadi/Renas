/**
 * Plain, production-safe HTML email templates. Kept deliberately simple
 * (table-free, inline-styled, no external assets) so they render
 * consistently across email clients without a dedicated build step.
 */

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F1EB;font-family:Helvetica,Arial,sans-serif;color:#232629;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e5e1d8;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e5e1d8;">
                <span style="font-size:18px;font-weight:700;letter-spacing:0.05em;">RENAS</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e5e1d8;font-size:12px;color:#7C8385;">
                RENAS Group — this is an automated message.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function otpEmailTemplate(code: string, ttlMinutes: number): { subject: string; html: string } {
  return {
    subject: `Your RENAS CMS login code: ${code}`,
    html: layout(
      "Your login code",
      `<p style="font-size:28px;font-weight:700;letter-spacing:0.1em;margin:0 0 16px;">${code}</p>
       <p style="font-size:14px;color:#4a4d4f;">This code expires in ${ttlMinutes} minutes and can only be used once. If you did not request this, you can ignore this email.</p>`,
    ),
  };
}

export function rfqInternalNotificationTemplate(payload: {
  productName: string;
  contactName: string;
  companyName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  id: string;
}): { subject: string; html: string } {
  return {
    subject: `New supply request: ${payload.productName}`,
    html: layout(
      "New supply request",
      `<p><strong>Product:</strong> ${escapeHtml(payload.productName)}</p>
       <p><strong>Contact:</strong> ${escapeHtml(payload.contactName)}${payload.companyName ? ` (${escapeHtml(payload.companyName)})` : ""}</p>
       ${payload.contactEmail ? `<p><strong>Email:</strong> ${escapeHtml(payload.contactEmail)}</p>` : ""}
       ${payload.contactPhone ? `<p><strong>Phone:</strong> ${escapeHtml(payload.contactPhone)}</p>` : ""}
       <p style="font-size:13px;color:#7C8385;">Request ID: ${payload.id}</p>`,
    ),
  };
}

export function rfqConfirmationTemplate(payload: { contactName: string; productName: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "We received your supply request",
    html: layout(
      "Thanks for reaching out",
      `<p>Hi ${escapeHtml(payload.contactName)},</p>
       <p>We've received your request for <strong>${escapeHtml(payload.productName)}</strong>. Our team will review it and follow up shortly.</p>`,
    ),
  };
}

export function contactNotificationTemplate(payload: {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}): { subject: string; html: string } {
  return {
    subject: `New contact form submission from ${payload.name}`,
    html: layout(
      "New contact submission",
      `<p><strong>From:</strong> ${escapeHtml(payload.name)} (${escapeHtml(payload.email)})</p>
       ${payload.subject ? `<p><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p>` : ""}
       <p style="white-space:pre-wrap;">${escapeHtml(payload.message)}</p>`,
    ),
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
