/**
 * A browser return or a locally queued intent is never proof of settlement.
 * Live provider notifications must be verified against a durable server order
 * and the provider's validation endpoint before fulfillment can be enabled.
 */
export async function POST() {
  return Response.json(
    {
      verified: false,
      error:
        "Live settlement verification is not configured. No payment or booking has been confirmed.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
