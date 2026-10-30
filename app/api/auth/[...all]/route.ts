import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch {
    return Response.json(
      {
        message:
          "Accounts are not configured yet. Run npm run setup:local or configure the server environment.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export { handler as GET, handler as POST };
