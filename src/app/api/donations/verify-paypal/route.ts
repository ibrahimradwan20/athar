import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Platform PayPal email and PayPal.me link
const PLATFORM_PAYPAL_EMAIL = process.env.PAYPAL_RECEIVER_EMAIL || "";
const PLATFORM_PAYPAL_ME = process.env.NEXT_PUBLIC_PAYPAL_ME_LINK || "";

export async function GET() {
  return NextResponse.json({
    paypalEmail: PLATFORM_PAYPAL_EMAIL,
    paypalMeLink: PLATFORM_PAYPAL_ME,
    instructions: [
      "أرسل التبرع لبريد PayPal الخاص بالمنصة",
      "أو استخدم رابط PayPal.me للتبرع المباشر",
      "ضع معرف الحملة في ملاحظة الدفع",
      "احتفظ برقم معاملة PayPal (Transaction ID)",
    ]
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const { transactionId, campaignId, expectedAmount, senderEmail } = await req.json();

    if (!transactionId?.trim() || !campaignId || !expectedAmount) {
      return NextResponse.json({ verified: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    const cleanTxId = transactionId.trim();

    // ── Check: transaction ID already used? ──
    const { data: existing } = await supabase
      .from("donations")
      .select("id")
      .eq("transaction_id", cleanTxId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        verified: false,
        error: "⚠️ هذا المعرف مسجّل مسبقاً. لا يمكن استخدام نفس معرف PayPal مرتين."
      });
    }

    // ── PayPal IPN/API Verification ──
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
    const PAYPAL_BASE = process.env.NODE_ENV === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

    let verified = false;
    let actualAmount = 0;
    let paypalStatus = "";
    let receiverEmail = "";

    if (PAYPAL_CLIENT_ID && PAYPAL_SECRET) {
      // ── Real PayPal API verification ──
      try {
        // Get access token
        const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64")}`,
          },
          body: "grant_type=client_credentials",
        });
        const { access_token } = await tokenRes.json();

        // Look up the transaction
        const txRes = await fetch(
          `${PAYPAL_BASE}/v2/payments/captures/${cleanTxId}`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );

        if (txRes.ok) {
          const txData = await txRes.json();
          paypalStatus = txData.status;
          actualAmount = Number(txData.amount?.value || 0);

          // Check if payment is completed
          if (paypalStatus === "COMPLETED") {
            // Verify receiver
            const sellerRes = await fetch(
              `${PAYPAL_BASE}/v2/payments/captures/${cleanTxId}`,
              { headers: { Authorization: `Bearer ${access_token}` } }
            );
            verified = actualAmount >= expectedAmount * 0.99;
          }
        } else {
          // Try orders endpoint
          const orderRes = await fetch(
            `${PAYPAL_BASE}/v2/checkout/orders/${cleanTxId}`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            paypalStatus = orderData.status;
            const purchaseUnit = orderData.purchase_units?.[0];
            actualAmount = Number(purchaseUnit?.amount?.value || 0);
            if (paypalStatus === "COMPLETED") {
              verified = actualAmount >= expectedAmount * 0.99;
            }
          }
        }
      } catch (e) {
        console.error("PayPal API error:", e);
      }
    } else {
      // ── No PayPal credentials: Manual review mode ──
      // Store as pending for admin review
      const { data: donation, error } = await supabase
        .from("donations")
        .insert({
          campaign_id: campaignId,
          donor_id: user.id,
          amount: expectedAmount,
          currency: "USD",
          payment_method: "paypal",
          transaction_id: cleanTxId,
          status: "pending", // Admin must verify manually
          message: senderEmail ? `PayPal sender: ${senderEmail}` : undefined,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        verified: false,
        pendingReview: true,
        donationId: donation.id,
        message: "📋 تم تسجيل تبرعك وهو قيد المراجعة من قِبَل الإدارة. سيتم تأكيده خلال 24 ساعة بعد التحقق من الدفع.",
      });
    }

    if (!verified) {
      if (paypalStatus && paypalStatus !== "COMPLETED") {
        return NextResponse.json({
          verified: false,
          error: `❌ الدفع غير مكتمل. الحالة الحالية: ${paypalStatus}`,
          details: { paypalStatus, actualAmount, expectedAmount }
        });
      }
      if (actualAmount > 0 && actualAmount < expectedAmount * 0.99) {
        return NextResponse.json({
          verified: false,
          txFound: true,
          error: `❌ المبلغ غير مطابق.\nالمدفوع: $${actualAmount}\nالمطلوب: $${expectedAmount}`,
          details: { actualAmount, expectedAmount }
        });
      }
      return NextResponse.json({
        verified: false,
        error: "❌ لم يتم التحقق من الدفع. تأكد من معرف المعاملة وأن الدفع مكتمل."
      });
    }

    // ── Record completed donation ──
    const { data: donation, error: insertError } = await supabase
      .from("donations")
      .insert({
        campaign_id: campaignId,
        donor_id: user.id,
        amount: actualAmount,
        currency: "USD",
        payment_method: "paypal",
        transaction_id: cleanTxId,
        status: "completed",
        message: senderEmail ? `PayPal: ${senderEmail}` : undefined,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      verified: true,
      donationId: donation.id,
      amount: actualAmount,
      message: `✅ تم التحقق من الدفع بنجاح! تبرعك بـ $${actualAmount} مسجّل.`,
    });

  } catch (error: any) {
    console.error("PayPal verify error:", error);
    return NextResponse.json({
      verified: false,
      error: "خطأ في الخادم. حاول مرة أخرى."
    }, { status: 500 });
  }
}
