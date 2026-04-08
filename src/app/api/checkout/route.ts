import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan") as keyof typeof PLANS;

  if (!plan || !PLANS[plan]) {
    return NextResponse.redirect(new URL("/#pricing", req.url));
  }

  // If Stripe is not configured, redirect to login
  if (!stripe) {
    return NextResponse.redirect(new URL(`/login?plan=${plan}&stripe=pending`, req.url));
  }

  try {
    const planConfig = PLANS[plan];

    // Create or find a price
    const prices = await stripe.prices.list({
      lookup_keys: [`insideoil_${plan}_monthly`],
      limit: 1,
    });

    let priceId: string;

    if (prices.data.length > 0) {
      priceId = prices.data[0].id;
    } else {
      // Create product + price
      const product = await stripe.products.create({
        name: planConfig.name,
        description: planConfig.features.join(", "),
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: planConfig.price,
        currency: "usd",
        recurring: { interval: planConfig.interval },
        lookup_key: `insideoil_${plan}_monthly`,
      });

      priceId = price.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/dashboard?welcome=true&plan=${plan}`,
      cancel_url: `${req.nextUrl.origin}/#pricing`,
      allow_promotion_codes: true,
      metadata: { plan },
    });

    if (session.url) {
      return NextResponse.redirect(session.url);
    }

    return NextResponse.redirect(new URL("/#pricing", req.url));
  } catch (e) {
    console.error("[Stripe] Checkout error:", e);
    return NextResponse.redirect(new URL(`/login?plan=${plan}&error=checkout`, req.url));
  }
}
