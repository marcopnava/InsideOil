import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function planFromMetadata(metadata: Record<string, string> | null): string {
  const plan = metadata?.plan ?? "";
  if (plan.startsWith("professional")) return "professional";
  if (plan.startsWith("trader")) return "trader";
  if (plan.startsWith("junior")) return "junior";
  return "free";
}

function roleFromTier(tier: string): "ADMIN" | "OPERATOR" | "VIEWER" {
  if (tier === "professional") return "OPERATOR";
  return "VIEWER";
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email?.toLowerCase().trim();
        const tier = planFromMetadata(session.metadata);
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (customerEmail) {
          await db.user.updateMany({
            where: { email: customerEmail },
            data: {
              subscriptionTier: tier,
              stripeCustomerId: customerId ?? undefined,
              role: roleFromTier(tier),
            },
          });
          console.log(`[Stripe] Activated ${tier} for ${customerEmail}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

        if (customerId) {
          const sub = subscription as unknown as { current_period_end?: number };
          const endDate = sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null;

          await db.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionEnd: endDate,
            },
          });
          console.log(`[Stripe] Subscription updated: ${customerId}, ends ${endDate?.toISOString()}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

        if (customerId) {
          await db.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionTier: "free",
              role: "VIEWER",
              subscriptionEnd: null,
            },
          });
          console.log(`[Stripe] Subscription cancelled: ${customerId} → free`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log(`[Stripe] Payment failed for: ${invoice.customer_email ?? "unknown"}`);
        // Grace period: subscription stays active until Stripe auto-cancels
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[Stripe] Webhook error:", e);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
