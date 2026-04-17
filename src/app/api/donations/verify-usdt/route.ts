import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TRON_API = "https://api.trongrid.io";
// USDT TRC20 contract address on TRON mainnet
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const { txHash, campaignId, expectedAmount } = await req.json();

    if (!txHash?.trim() || !campaignId || !expectedAmount) {
      return NextResponse.json({ verified: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    const cleanHash = txHash.trim();

    // ── Check: hash already used? ──
    const { data: existing } = await supabase
      .from("donations")
      .select("id, amount")
      .eq("transaction_id", cleanHash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        verified: false,
        error: "⚠️ هذه المعاملة مسجّلة مسبقاً. لا يمكن استخدام نفس الهاش مرتين."
      });
    }

    // ── Fetch TX from TRON ──
    const txRes = await fetch(`${TRON_API}/v1/transactions/${cleanHash}`, {
      headers: { "Accept": "application/json", "TRON-PRO-API-KEY": process.env.TRON_API_KEY || "" },
    });

    if (!txRes.ok) {
      return NextResponse.json({
        verified: false,
        error: "❌ لم يُعثَر على المعاملة. تأكد من رقم الهاش أو انتظر دقيقتين بعد الإرسال."
      });
    }

    const txData = await txRes.json();
    const tx = txData?.data?.[0];

    if (!tx) {
      return NextResponse.json({
        verified: false,
        error: "❌ المعاملة غير موجودة في شبكة TRON."
      });
    }

    // ── Check: transaction confirmed? ──
    const contractRet = tx.ret?.[0]?.contractRet;
    if (contractRet !== "SUCCESS") {
      return NextResponse.json({
        verified: false,
        error: `⏳ المعاملة لم تُؤكَّد بعد (الحالة: ${contractRet || "غير معروفة"}). انتظر قليلاً وأعد المحاولة.`
      });
    }

    // ── Fetch TRC20 transfer events ──
    const eventsRes = await fetch(
      `${TRON_API}/v1/transactions/${cleanHash}/events`,
      { headers: { "Accept": "application/json", "TRON-PRO-API-KEY": process.env.TRON_API_KEY || "" } }
    );

    if (!eventsRes.ok) {
      return NextResponse.json({
        verified: false,
        error: "فشل التحقق من تفاصيل التحويل. حاول مرة أخرى."
      });
    }

    const eventsData = await eventsRes.json();
    const events = eventsData?.data || [];

    // Find the Transfer event from USDT contract
    const transferEvent = events.find((e: any) =>
      e.event_name === "Transfer" &&
      e.contract_address === USDT_CONTRACT
    );

    if (!transferEvent) {
      return NextResponse.json({
        verified: false,
        error: "❌ هذه المعاملة ليست تحويل USDT TRC20. تأكد أنك أرسلت USDT وليس TRX أو عملة أخرى."
      });
    }

    // Amount (USDT has 6 decimals)
    const transferAmount = Number(transferEvent.result?.value || 0) / 1_000_000;
    const toAddress = transferEvent.result?.to || "";
    const fromAddress = transferEvent.result?.from || "";

    // ── Verify destination wallet ──
    const platformWallet = (process.env.NEXT_PUBLIC_USDT_TRC20_WALLET || "").toLowerCase();

    if (!platformWallet) {
      return NextResponse.json({
        verified: false,
        error: "عنوان محفظة المنصة غير مُعيَّن. تواصل مع الإدارة."
      });
    }

    if (toAddress.toLowerCase() !== platformWallet) {
      return NextResponse.json({
        verified: false,
        txFound: true,
        error: `❌ المعاملة لم تُرسَل لمحفظة المنصة.\nالمحفظة المستقبِلة: ${toAddress}\nمحفظة المنصة: ${platformWallet}`,
        details: { transferAmount, toAddress, fromAddress }
      });
    }

    // ── Verify amount (allow 0.5% tolerance) ──
    const tolerance = expectedAmount * 0.005;
    if (transferAmount < expectedAmount - tolerance) {
      return NextResponse.json({
        verified: false,
        txFound: true,
        error: `❌ المبلغ غير مطابق.\nالمُرسَل: $${transferAmount.toFixed(2)} USDT\nالمطلوب: $${expectedAmount} USDT`,
        details: { transferAmount, expectedAmount, toAddress }
      });
    }

    // ── All checks passed → Record donation ──
    const { data: donation, error: insertError } = await supabase
      .from("donations")
      .insert({
        campaign_id: campaignId,
        donor_id: user.id,
        amount: transferAmount,
        currency: "USDT",
        payment_method: "usdt",
        transaction_id: cleanHash,
        status: "completed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return NextResponse.json({
      verified: true,
      donationId: donation.id,
      amount: transferAmount,
      fromAddress,
      message: `✅ تم التحقق بنجاح! تبرعك بمبلغ $${transferAmount.toFixed(2)} USDT مؤكد على البلوكشين.`,
      txLink: `https://tronscan.org/#/transaction/${cleanHash}`,
    });

  } catch (error: any) {
    console.error("USDT verify error:", error);
    return NextResponse.json({
      verified: false,
      error: "خطأ في الخادم. حاول مرة أخرى."
    }, { status: 500 });
  }
}
