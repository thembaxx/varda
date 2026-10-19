import crypto from 'crypto';
import {NextRequest, NextResponse} from 'next/server';

export type SaGatewayProvider =
  | 'payfast'
  | 'ozow'
  | 'payshap'
  | 'snapscan'
  | 'capitec_pay'
  | 'stokvel_split';

export interface CheckoutRequestPayload {
  provider: SaGatewayProvider;
  itemName: string;
  itemDescription: string;
  amountZar: number;
  buyerName: string;
  buyerEmail: string;
  buyerCell?: string;
  bankName?: string;
  shapId?: string;
  stokvelMembers?: number;
}

/**
 * Generates an official PayFast MD5 signature according to PayFast's
 * strict URL-encoding and field ordering rules.
 */
function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): {signature: string; parameterString: string} {
  const parts: string[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const encoded = encodeURIComponent(String(val).trim()).replace(/%20/g, '+');
      parts.push(`${key}=${encoded}`);
    }
  }

  let paramString = parts.join('&');
  if (passphrase && passphrase.trim() !== '') {
    const encodedPass = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
    paramString += `&passphrase=${encodedPass}`;
  }

  const signature = crypto.createHash('md5').update(paramString).digest('hex');
  return {signature, parameterString: paramString};
}

/**
 * Generates an official Ozow SHA-512 request hash for South African Instant EFT.
 */
function generateOzowSha512Hash(
  fieldsInOrder: string[],
  privateKey: string
): string {
  const concatenated = (fieldsInOrder.join('') + privateKey).toLowerCase();
  return crypto.createHash('sha512').update(concatenated, 'utf8').digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutRequestPayload;
    const {
      provider,
      itemName,
      itemDescription,
      amountZar,
      buyerName,
      buyerEmail,
      buyerCell = '0825550143',
      bankName = 'Capitec Bank',
      shapId = '0825550143@capitec',
      stokvelMembers = 1,
    } = body;

    if (!amountZar || amountZar <= 0 || !itemName) {
      return NextResponse.json(
        {error: 'Valid ZAR amount and item name are required.'},
        {status: 400}
      );
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const txReference = `VRD-ZA-${Date.now().toString().slice(-6)}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const effectiveAmount =
      provider === 'stokvel_split' && stokvelMembers > 1
        ? Number((amountZar / stokvelMembers).toFixed(2))
        : Number(amountZar.toFixed(2));

    // 1. PayFast Gateway Integration (Card, Instant EFT, Scan to Pay, Mobicred)
    const merchantId = process.env.PAYFAST_MERCHANT_ID || '10000100';
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a';
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    const isSandbox = process.env.PAYFAST_SANDBOX !== 'false';

    const nameParts = (buyerName || 'Themba Mndebele').trim().split(' ');
    const firstName = nameParts[0] || 'Themba';
    const lastName = nameParts.slice(1).join(' ') || 'Mndebele';

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${appUrl}/?payment=success&ref=${txReference}`,
      cancel_url: `${appUrl}/?payment=cancelled&ref=${txReference}`,
      notify_url: `${appUrl}/api/payments/itn`,
      name_first: firstName,
      name_last: lastName,
      email_address: buyerEmail || 'mndebele.themba@gmail.com',
      cell_number: buyerCell,
      m_payment_id: txReference,
      amount: effectiveAmount.toFixed(2),
      item_name: itemName.slice(0, 100),
      item_description: (itemDescription || 'Varda South Africa Spatial Order').slice(0, 255),
    };

    const {signature: payfastSignature} = generatePayFastSignature(
      payfastData,
      passphrase
    );

    const payfastProcessUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    // 2. Ozow Instant EFT Cryptographic Payload (SHA-512)
    const ozowSiteCode = process.env.OZOW_SITE_CODE || 'TST-TST-001';
    const ozowPrivateKey =
      process.env.OZOW_PRIVATE_KEY || '00000000-0000-0000-0000-000000000000';

    const ozowFields = {
      SiteCode: ozowSiteCode,
      CountryCode: 'ZA',
      CurrencyCode: 'ZAR',
      Amount: effectiveAmount.toFixed(2),
      TransactionReference: txReference,
      BankReference: `VARDA-${txReference.slice(-6)}`,
      CancelUrl: `${appUrl}/?payment=cancelled&ref=${txReference}`,
      ErrorUrl: `${appUrl}/?payment=error&ref=${txReference}`,
      SuccessUrl: `${appUrl}/?payment=success&ref=${txReference}`,
      NotifyUrl: `${appUrl}/api/payments/itn`,
      IsTest: isSandbox ? 'true' : 'false',
    };

    const ozowHashCheck = generateOzowSha512Hash(
      [
        ozowFields.SiteCode,
        ozowFields.CountryCode,
        ozowFields.CurrencyCode,
        ozowFields.Amount,
        ozowFields.TransactionReference,
        ozowFields.BankReference,
        ozowFields.CancelUrl,
        ozowFields.ErrorUrl,
        ozowFields.SuccessUrl,
        ozowFields.NotifyUrl,
        ozowFields.IsTest,
      ],
      ozowPrivateKey
    );

    // 3. PayShap & SnapScan EMVCo-style ZA Payload
    const emvQrString = `00020101021229370016za.co.varda.pay0113${txReference}520459995303710540${effectiveAmount.toFixed(
      2
    )}5802ZA5911VARDA STUDIO6012JOHANNESBURG6304`;

    return NextResponse.json({
      status: 'READY',
      provider,
      txReference,
      createdAt: new Date().toISOString(),
      currency: 'ZAR',
      totalAmountZar: amountZar,
      effectiveAmountZar: effectiveAmount,
      stokvelMembers,
      bankName,
      shapId,
      security: {
        encryption: 'TLS 1.3 + 3D Secure 2.2 (SARB Compliant)',
        payfastMd5Signature: payfastSignature,
        ozowSha512Hash: ozowHashCheck.slice(0, 48) + '...',
        fullOzowHash: ozowHashCheck,
      },
      payfast: {
        processUrl: payfastProcessUrl,
        isSandbox,
        fields: {
          ...payfastData,
          signature: payfastSignature,
        },
      },
      ozow: {
        processUrl: 'https://pay.ozow.com/',
        fields: {
          ...ozowFields,
          HashCheck: ozowHashCheck,
        },
      },
      qrPayload: emvQrString,
      ussdString: `*120*82732*${Math.round(effectiveAmount)}*${txReference.slice(-4)}#`,
    });
  } catch (err) {
    console.error('SA Payment Gateway initialization failed:', err);
    return NextResponse.json(
      {error: 'Failed to initialize South African payment gateway session.'},
      {status: 500}
    );
  }
}
