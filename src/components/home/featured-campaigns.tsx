"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CampaignGrid from "@/components/campaigns/campaign-grid";
import { createClient } from "@/lib/supabase/client";
import type { Campaign } from "@/types";
import { ArrowLeft } from "lucide-react";

// ✅ Client outside component — not re-created on render
const supabase = createClient();

export default function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*, owner:profiles(full_name, avatar_url, is_verified)")
          .in("status", ["approved", "active"])
          .order("raised_amount", { ascending: false })
          .limit(6);
        if (!cancelled) {
          setCampaigns((data as any[]) || []);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCampaigns();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-padding">
      <div className="container-max mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-primary inline-block" />
              حملاتنا المميزة
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              ساهم في الحملات
              <span className="text-primary"> النشطة</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              اختر الحملة التي تلامس قلبك وساهم في تحقيق أثر حقيقي في حياة المحتاجين
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/campaigns">عرض الكل<ArrowLeft className="w-4 h-4" /></Link>
          </Button>
        </div>
        <CampaignGrid campaigns={campaigns} loading={loading} />
        <div className="text-center mt-8 sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/campaigns">عرض جميع الحملات</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
