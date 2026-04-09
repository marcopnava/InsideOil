import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { stripe, PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendWelcomeEmail, sendReceiptEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function planFromMetadata(metadata: Record<string, string> | null): string {
  const plan = metadata?.plan ?? "";
  if (plan.startsWith("professional")) return "professional";
  if (plan.startsWith("trader")) return "trader";
  if (plan.startsWith("junior")) return "junior";
  return "free";
}

function planDisplayName(metadata: Record<string, string> | null): string {
  const plan = metadata?.plan ?? "";
  const config = PLANS[plan];
  return config?.name ?? "InsideOil";
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
        const displayName = planDisplayName(session.metadata);
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0";
        const currency = (session.currency ?? "eur") === "eur" ? "\u20ac" : "$";

        if (!customerEmail) break;

        // Check if user already exists (returning customer)
        const existingUser = await db.user.findUnique({ where: { email: customerEmail } });

        if (existingUser && existingUser.passwordHash) {
          // Existing registered user — just upgrade tier
          await db.user.update({
            where: { email: customerEmail },
            data: {
              subscriptionTier: tier,
              stripeCustomerId: customerId ?? undefined,
              role: roleFromTier(tier),
            },
          });
          console.log(`[Stripe] Upgraded ${customerEmail} to ${tier}`);
        } else {
          // New user — create account with registration token
          const token = crypto.randomBytes(32).toString("hex");
          const tokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

          await db.user.upsert({
            where: { email: customerEmail },
            update: {
              subscriptionTier: tier,
              stripeCustomerId: customerId ?? undefined,
              role: roleFromTier(tier),
              registrationToken: token,
              tokenExpiresAt: tokenExpires,
            },
            create: {
              email: customerEmail,
              subscriptionTier: tier,
              stripeCustomerId: customerId ?? undefined,
              role: roleFromTier(tier),
              registrationToken: token,
              tokenExpiresAt: tokenExpires,
            },
          });

          // Send welcome email with registration link
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://insideoil.it";
          const registrationLink = `${baseUrl}/register?token=${token}`;
          await sendWelcomeEmail(customerEmail, registrationLink, displayName).catch((e) =>
            console.error("[Email] Welcome email failed:", e)
          );

          console.log(`[Stripe] Created account for ${customerEmail}, tier: ${tier}`);
        }

        // Send receipt email
        await sendReceiptEmail(customerEmail, displayName, amountTotal, currency).catch((e) =>
          console.error("[Email] Receipt email failed:", e)
        );

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
            data: { subscriptionEnd: endDate },
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
