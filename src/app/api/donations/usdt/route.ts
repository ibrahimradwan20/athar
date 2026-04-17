import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Platform USDT wallet address (TRC20/ERC20)
const PLATFORM_WALLET = process.env.USDT_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, amount, txHash, network } = await req.json();

    if (!campaignId || !amount || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production: verify txHash on blockchain
    // For now, record the pending transaction
    const { data: donation, error } = await supabase.from("donations").insert({
      campaign_id: campaignId,
      donor_id: user.id,
      amount,
      currency: "USDT",
      payment_method: "usdt",
      transaction_id: txHash,
      status: "pending", // Will be verified by admin/webhook
    }).select().single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      message: "تم تسجيل تبرعك. سيتم التحقق من المعاملة خلال 24 ساعة.",
    });
  } catch (error) {
    console.error("USDT donation error:", error);
    return NextResponse.json({ error: "Failed to record donation" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    walletAddress: PLATFORM_WALLET,
    networks: [
      { name: "TRC20 (TRON)", id: "trc20" },
      { name: "ERC20 (Ethereum)", id: "erc20" },
      { name: "BEP20 (BSC)", id: "bep20" },
    ],
  });
}
