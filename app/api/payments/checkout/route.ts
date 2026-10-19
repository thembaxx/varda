import crypto from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';

export type SaGatewayProvider = 'payfast' | 'ozow' | 'payshap' | 'snapscan' | 'capitec_pay' | 'stokvel_split';
export const runtime = 'nodejs';

/** Sandbox handoff only. Live orders need server-side prices and verified settlement. */
export async function POST(request: NextRequest) {
  try {
    if (process.env.PAYFAST_SANDBOX === 'false') return NextResponse.json({error: 'Live payments aren’t configured. Your host needs to connect order verification first.'}, {status: 503});
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({error: 'This checkout request isn’t allowed.'}, {status: 403});
    const body = await request.json();
    const {provider, itemName, itemDescription, amountZar, buyerName, buyerEmail} = body;
    if (!['payfast', 'ozow'].includes(provider) || typeof itemName !== 'string' || !itemName.trim() || itemName.length > 200 || typeof amountZar !== 'number' || !Number.isFinite(amountZar) || amountZar <= 0 || amountZar > 1_000_000 || typeof buyerName !== 'string' || buyerName.length > 80 || typeof buyerEmail !== 'string' || buyerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({error: 'Please check your name, email, selection, and amount.'}, {status: 400});
    }
    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    const txReference = `VRD-TEST-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const amount = amountZar.toFixed(2);
    const nameParts = buyerName.trim().split(/\s+/);
    if (provider === 'payfast') {
      if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY) return NextResponse.json({error: 'PayFast sandbox isn’t connected yet. Your host can add the sandbox merchant details. Your plan can still be saved for later.'}, {status: 503});
      const fields: Record<string, string> = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID, merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        return_url: `${appUrl}/?payment=returned#wallet`, cancel_url: `${appUrl}/?payment=cancelled#wallet`, notify_url: `${appUrl}/api/payments/itn`,
        name_first: nameParts[0] || '', name_last: nameParts.slice(1).join(' '), email_address: buyerEmail,
        m_payment_id: txReference, amount, item_name: itemName.slice(0, 100), item_description: typeof itemDescription === 'string' ? itemDescription.slice(0, 255) : '',
      };
      const encode = (value: string) => encodeURIComponent(value.trim()).replace(/%20/g, '+');
      const parts = Object.entries(fields).filter(([, value]) => value.trim()).map(([key, value]) => `${key}=${encode(value)}`);
      if (process.env.PAYFAST_PASSPHRASE) parts.push(`passphrase=${encode(process.env.PAYFAST_PASSPHRASE)}`);
      fields.signature = crypto.createHash('md5').update(parts.join('&')).digest('hex');
      return NextResponse.json({status: 'SANDBOX', txReference, payfast: {processUrl: 'https://sandbox.payfast.co.za/eng/process', fields}});
    }
    if (!process.env.OZOW_SITE_CODE || !process.env.OZOW_PRIVATE_KEY) return NextResponse.json({error: 'Ozow sandbox isn’t connected yet. Your host can add the test credentials. Your plan can still be saved for later.'}, {status: 503});
    const fields: Record<string, string> = {
      SiteCode: process.env.OZOW_SITE_CODE, CountryCode: 'ZA', CurrencyCode: 'ZAR', Amount: amount, TransactionReference: txReference,
      BankReference: txReference.slice(0, 20), CancelUrl: `${appUrl}/?payment=cancelled#wallet`, ErrorUrl: `${appUrl}/?payment=error#wallet`, SuccessUrl: `${appUrl}/?payment=returned#wallet`, NotifyUrl: `${appUrl}/api/payments/itn`, IsTest: 'true',
    };
    fields.HashCheck = crypto.createHash('sha512').update((Object.values(fields).join('') + process.env.OZOW_PRIVATE_KEY).toLowerCase()).digest('hex');
    return NextResponse.json({status: 'SANDBOX', txReference, ozow: {processUrl: 'https://pay.ozow.com/', fields}});
  } catch { return NextResponse.json({error: 'Checkout couldn’t start. Please try again.'}, {status: 400}); }
}
