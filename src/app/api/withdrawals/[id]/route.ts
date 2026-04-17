import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Admin: update withdrawal status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { status, admin_note, transaction_id } = await req.json();
  const validStatuses = ["processing", "completed", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("withdrawals")
    .update({
      status,
      admin_note: admin_note || null,
      transaction_id: transaction_id || null,
      processed_by: user.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, withdrawal: data });
}
