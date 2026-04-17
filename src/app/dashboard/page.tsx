"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CampaignCard from "@/components/campaigns/campaign-card";
import { formatCurrency, getRoleLabel } from "@/lib/utils";
import type { Campaign, Donation } from "@/types";
import { Heart, TrendingUp, Clock, PlusCircle, ArrowLeft, Wallet, DollarSign } from "lucide-react";

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      const [campaignsRes, donationsRes] = await Promise.all([
        supabase.from("campaigns")
          .select("*, owner:profiles(full_name, avatar_url, is_verified)")
          .eq("owner_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.from("donations")
          .select("*")
          .eq("donor_id", profile.id)
          .eq("status", "completed"),
      ]);

      const myCampaigns = (campaignsRes.data as any[]) || [];
      const myDonations = (donationsRes.data as any[]) || [];

      setCampaigns(myCampaigns);
      setDonations(myDonations.slice(0, 5));
      setTotalDonated(myDonations.reduce((s, d) => s + Number(d.amount), 0));
      setTotalRaised(myCampaigns.reduce((s, c) => s + Number(c.raised_amount), 0));
      setDataLoading(false);
    };
    load();
  }, [profile?.id]);

  const canCreateCampaign = profile?.can_create_campaign;
  const loading = profileLoading || dataLoading;

  if (profileLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-primary to-athar-green-light rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-20" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm">مرحباً بك،</p>
            <h1 className="text-2xl font-black mt-0.5">{profile?.full_name} 👋</h1>
            <p className="text-white/70 text-sm mt-1">{getRoleLabel(profile?.role || "")}</p>
          </div>
          {canCreateCampaign && (
            <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-bold shrink-0">
              <Link href="/dashboard/campaigns/new">
                <PlusCircle className="w-4 h-4" />
                حملة جديدة
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Commission Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">💡</span>
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">
            عمولة منصة أثر 8% — Athar Platform 8% Commission
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            🇸🇦 تُخصم عمولة 8% من كل عملية سحب لأصحاب الحملات، و8% من كل تبرع كرسوم خدمة منصة أثر.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            🇬🇧 An 8% commission is deducted from every withdrawal by campaign owners, and 8% from every donation as Athar platform service fees.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Heart, label: "إجمالي تبرعاتي", value: formatCurrency(totalDonated), color: "text-red-500 bg-red-50 dark:bg-red-900/10" },
          { icon: TrendingUp, label: "حملاتي النشطة", value: campaigns.filter(c => ["approved","active"].includes(c.status)).length, color: "text-green-500 bg-green-50 dark:bg-green-900/10" },
          { icon: DollarSign, label: "جُمع لحملاتي", value: formatCurrency(totalRaised), color: "text-blue-500 bg-blue-50 dark:bg-blue-900/10" },
          { icon: Clock, label: "حملات قيد المراجعة", value: campaigns.filter(c => c.status === "pending").length, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/10" },
        ].map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black truncate">{stat.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My campaigns */}
      {campaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black">حملاتي الأخيرة</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/campaigns">عرض الكل <ArrowLeft className="w-4 h-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(c => <CampaignCard key={c.id} campaign={c} compact />)}
          </div>
        </div>
      )}

      {/* Recent donations */}
      {donations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">آخر تبرعاتي</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/donations">عرض الكل</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {donations.map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{formatCurrency(d.amount)}</p>
                  <p className="text-xs text-muted-foreground">{d.payment_method === "usdt" ? "USDT" : "PayPal"}</p>
                </div>
                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-semibold">✓ مكتمل</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && campaigns.length === 0 && donations.length === 0 && (
        <Card className="text-center py-14">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold mb-2">ابدأ رحلتك مع أثر</h3>
            <p className="text-muted-foreground text-sm mb-6">تصفح الحملات وابدأ بالتبرع أو أنشئ حملتك الخاصة</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild><Link href="/campaigns"><Heart className="w-4 h-4" />تصفح الحملات</Link></Button>
              {canCreateCampaign && (
                <Button variant="outline" asChild>
                  <Link href="/dashboard/campaigns/new"><PlusCircle className="w-4 h-4" />حملة جديدة</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
