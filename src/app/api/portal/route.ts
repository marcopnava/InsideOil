import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Creates a Stripe Billing Portal session for the current user and redirects
 * to it. The portal lets the user upgrade/downgrade/cancel with automatic
 * proration (Stripe credits unused time on the old plan toward the new plan).
 *
 * Stripe dashboard → Settings → Billing → Customer portal must be enabled and
 * configured to allow the relevant plan switches for this to work in prod.
 */
export async function GET(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/settings", req.url));
  }
  const userId = (session.user as { id: string }).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true },
  });

  if (!user?.stripeCustomerId) {
    // User has no Stripe subscription yet — send them to upgrade page instead
    return NextResponse.redirect(new URL("/upgrade", req.url));
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.nextUrl.origin}/settings`,
    });
    return NextResponse.redirect(portal.url);
  } catch (e) {
    console.error("[Stripe] Portal error:", e);
    return NextResponse.json(
      {
        error:
          "Unable to open billing portal. Make sure the Stripe Customer Portal is enabled in dashboard → Settings → Billing.",
        details: String(e),
      },
      { status: 500 }
    );
  }
}
