import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan") as keyof typeof PLANS;

  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: "Invalid plan", plan }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const planConfig = PLANS[plan];
    const lookupKey = `insideoil_${plan}`;

    // Find existing price or create new one
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      limit: 1,
    });

    let priceId: string;

    if (prices.data.length > 0) {
      priceId = prices.data[0].id;
    } else {
      const product = await stripe.products.create({
        name: planConfig.name,
        description: planConfig.features.join(", "),
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: planConfig.price,
        currency: planConfig.currency || "eur",
        recurring: { interval: planConfig.interval },
        lookup_key: lookupKey,
      });

      priceId = price.id;
    }

    // If the user is logged in, link the checkout to their account so the
    // webhook can upgrade them directly.
    const session = await getServerSession(authOptions);
    let customerEmail: string | undefined;
    let stripeCustomerId: string | undefined;
    let userId: string | undefined;
    if (session?.user) {
      userId = (session.user as { id: string }).id;
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, stripeCustomerId: true },
      });
      customerEmail = dbUser?.email ?? undefined;
      stripeCustomerId = dbUser?.stripeCustomerId ?? undefined;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/welcome?plan=${plan}&upgraded=1`,
      cancel_url: `${req.nextUrl.origin}/upgrade`,
      allow_promotion_codes: true,
      metadata: { plan, userId: userId ?? "" },
      subscription_data: { metadata: { plan, userId: userId ?? "" } },
      ...(stripeCustomerId ? { customer: stripeCustomerId } : customerEmail ? { customer_email: customerEmail } : {}),
    });

    if (checkoutSession.url) {
      return NextResponse.redirect(checkoutSession.url);
    }

    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  } catch (e) {
    console.error("[Stripe] Checkout error:", e);
    return NextResponse.json(
      { error: "Checkout failed", details: String(e) },
      { status: 500 }
    );
  }
}
