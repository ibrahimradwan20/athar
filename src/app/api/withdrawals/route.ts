import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: fetch user's withdrawals + available balance
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaign_id");

  // Get withdrawals
  let query = supabase
    .from("withdrawals")
    .select("*, campaign:campaigns(title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data: withdrawals, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get campaign balances for this user
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title, raised_amount, status")
    .eq("owner_id", user.id)
    .in("status", ["approved", "active", "completed"]);

  // Calculate available balance per campaign
  const balances = await Promise.all(
    (campaigns || []).map(async (c) => {
      const { data: withdrawn } = await supabase
        .from("withdrawals")
        .select("amount")
        .eq("campaign_id", c.id)
        .in("status", ["pending", "processing", "completed"]);

      const withdrawnTotal = (withdrawn || []).reduce((s, w) => s + Number(w.amount), 0);
      return {
        campaign_id: c.id,
        title: c.title,
        total_raised: Number(c.raised_amount),
        withdrawn: withdrawnTotal,
        available: Math.max(0, Number(c.raised_amount) - withdrawnTotal),
      };
    })
  );

  return NextResponse.json({ withdrawals, balances });
}

// POST: create withdrawal request
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { campaign_id, amount, method, usdt_wallet, usdt_network, paypal_email } = body;

  // Validate
  if (!campaign_id || !amount || !method) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  if (amount <= 0) return NextResponse.json({ error: "المبلغ يجب أن يكون أكبر من صفر" }, { status: 400 });
  if (method === "usdt" && !usdt_wallet?.trim()) {
    return NextResponse.json({ error: "أدخل عنوان محفظة USDT" }, { status: 400 });
  }
  if (method === "paypal" && !paypal_email?.trim()) {
    return NextResponse.json({ error: "أدخل بريد PayPal" }, { status: 400 });
  }

  // Verify campaign belongs to user
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, owner_id, raised_amount, title")
    .eq("id", campaign_id)
    .eq("owner_id", user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "الحملة غير موجودة أو لا تملكها" }, { status: 404 });
  }

  // Calculate available balance
  const { data: existing } = await supabase
    .from("withdrawals")
    .select("amount")
    .eq("campaign_id", campaign_id)
    .in("status", ["pending", "processing", "completed"]);

  const withdrawnTotal = (existing || []).reduce((s, w) => s + Number(w.amount), 0);
  const available = Number(campaign.raised_amount) - withdrawnTotal;

  if (amount > available) {
    return NextResponse.json({
      error: `الرصيد المتاح للسحب: $${available.toFixed(2)} فقط`,
    }, { status: 400 });
  }

  // ── Apply 8% platform commission ──
  const COMMISSION_RATE = 0.08;
  const commissionAmount = parseFloat((amount * COMMISSION_RATE).toFixed(2));
  const netAmount = parseFloat((amount - commissionAmount).toFixed(2));

  // Create withdrawal request
  const { data: withdrawal, error } = await supabase
    .from("withdrawals")
    .insert({
      user_id: user.id,
      campaign_id,
      amount,
      method,
      usdt_wallet: method === "usdt" ? usdt_wallet.trim() : null,
      usdt_network: method === "usdt" ? (usdt_network || "trc20") : null,
      paypal_email: method === "paypal" ? paypal_email.trim() : null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    withdrawal,
    commissionAmount,
    netAmount,
    commissionRate: COMMISSION_RATE,
    message: `✅ تم إرسال طلب سحب $${amount} بنجاح.\n💰 عمولة المنصة (8%): $${commissionAmount}\n💵 المبلغ الصافي الذي ستستلمه: $${netAmount}\n⏱️ سيتم معالجة الطلب خلال 24-48 ساعة.`,
    messageEn: `✅ Withdrawal request of $${amount} submitted successfully.\n💰 Platform commission (8%): $${commissionAmount}\n💵 Net amount you will receive: $${netAmount}\n⏱️ Request will be processed within 24-48 hours.`,
  });
}
