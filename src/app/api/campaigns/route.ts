import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { campaignSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "approved";
    const limit = Math.min(Number(searchParams.get("limit") || 12), 50);
    const offset = Number(searchParams.get("offset") || 0);

    let query = supabase
      .from("campaigns")
      .select("*, owner:profiles(full_name, avatar_url, is_verified)", { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      meta: { total: count, limit, offset },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = campaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Check profile role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["organization", "beneficiary", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Beneficiary monthly limit
    if (profile.role === "beneficiary") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("campaigns")
        .select("id", { count: "exact" })
        .eq("owner_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if ((count || 0) >= 2) {
        return NextResponse.json({ error: "Monthly campaign limit reached (max 2)" }, { status: 429 });
      }
    }

    const { data, error } = await supabase.from("campaigns").insert({
      ...parsed.data,
      owner_id: user.id,
      status: profile.role === "beneficiary" ? "approved" : "pending",
      is_beneficiary_campaign: profile.role === "beneficiary",
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
