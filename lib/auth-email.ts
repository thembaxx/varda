/**
 * Delivery is deliberately opt-in: password accounts must continue to work when
 * an email sender has not been configured or its domain has not been verified.
 * Keep codes out of logs, URLs, analytics and client storage.
 */
export function isEmailCodeConfigured() {
  return process.env.VARDA_EMAIL_OTP_ENABLED === 'true'
    && Boolean(process.env.RESEND_API_KEY?.trim())
    && Boolean(process.env.RESEND_FROM_EMAIL?.trim());
}

export async function sendSignInCode(email: string, otp: string, type: string) {
  if (type !== 'sign-in') throw new Error('Unsupported email-code operation.');
  if (!isEmailCodeConfigured()) throw new Error('Email-code sign-in is not configured.');
  if (!/^\\d{6}$/.test(otp)) throw new Error('Invalid email-code format.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      subject: 'Your Varda sign-in code',
      text: `Your Varda sign-in code is ${otp}. It expires in 5 minutes. If you didn't request it, you can ignore this email. Never share this code.`,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Email-code delivery failed.');
}
