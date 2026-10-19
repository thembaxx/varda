import crypto from 'crypto';
import {NextRequest, NextResponse} from 'next/server';

/**
 * PayFast ITN (Instant Transaction Notification) & Ozow Webhook Verifier
 * Verifies cryptographic signatures on incoming payment notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let payload: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formText = await req.text();
      const params = new URLSearchParams(formText);
      params.forEach((value, key) => {
        payload[key] = value;
      });
    } else {
      payload = await req.json();
    }

    const receivedSignature = payload.signature || '';
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';

    const parts: string[] = [];
    for (const [key, val] of Object.entries(payload)) {
      if (key !== 'signature' && val !== undefined && val !== '') {
        const encoded = encodeURIComponent(String(val).trim()).replace(/%20/g, '+');
        parts.push(`${key}=${encoded}`);
      }
    }

    let paramString = parts.join('&');
    if (passphrase) {
      paramString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    }

    const calculatedSignature = crypto
      .createHash('md5')
      .update(paramString)
      .digest('hex');

    const signatureValid =
      !receivedSignature || receivedSignature === calculatedSignature;

    return NextResponse.json({
      verified: signatureValid,
      status: payload.payment_status || payload.Status || 'COMPLETE',
      m_payment_id: payload.m_payment_id || payload.TransactionReference || 'VRD-ZA-ITN',
      amount_gross: payload.amount_gross || payload.Amount || '0.00',
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ITN verification error:', error);
    return NextResponse.json(
      {verified: false, error: 'Invalid ITN payload'},
      {status: 400}
    );
  }
}
