import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (limit.count >= 10) return false;
  limit.count++;
  return true;
}

// Create PayPal order
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, amount } = await req.json();
    if (!campaignId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
    const PAYPAL_BASE = process.env.NODE_ENV === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      // Return mock response for development
      return NextResponse.json({
        orderId: "MOCK-ORDER-" + Date.now(),
        approveUrl: "/campaigns/" + campaignId + "?payment=mock",
      });
    }

    // Get PayPal access token
    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    const { access_token } = await tokenRes.json();

    // Create order
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: amount.toFixed(2) },
          description: `تبرع لحملة - Athar Platform`,
          custom_id: `${campaignId}:${user.id}`,
        }],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/donations/paypal/capture`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaignId}?payment=cancelled`,
        },
      }),
    });

    const order = await orderRes.json();
    const approveUrl = order.links?.find((l: any) => l.rel === "approve")?.href;

    // Create pending donation record
    await supabase.from("donations").insert({
      campaign_id: campaignId,
      donor_id: user.id,
      amount,
      currency: "USD",
      payment_method: "paypal",
      transaction_id: order.id,
      status: "pending",
    });

    return NextResponse.json({ orderId: order.id, approveUrl });
  } catch (error) {
    console.error("PayPal error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}
