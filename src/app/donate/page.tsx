"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import CampaignGrid from "@/components/campaigns/campaign-grid";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Campaign } from "@/types";
import { Heart, Zap, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function DonatePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("*, owner:profiles(full_name, avatar_url, is_verified)")
        .in("status", ["approved", "active"])
        .order("raised_amount", { ascending: false })
        .limit(6);
      setCampaigns((data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <MainLayout>
      {/* Hero */}
      <div className="hero-gradient text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-20" />
        <div className="container-max mx-auto relative z-10 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">تبرّع الآن</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-4">
            كل تبرع مهما صغر يُحدث فرقاً في حياة إنسان. ابدأ الآن وكن سبباً في الخير.
          </p>

          {/* Commission Notice */}
          <div className="max-w-xl mx-auto mt-2 mb-6 bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3 text-right">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">تنبيه: عمولة منصة أثر 8% — Athar Platform 8% Commission</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">🇸🇦 يُخصم 8% من كل تبرع كعمولة لمنصة أثر لتغطية تكاليف التشغيل والإدارة. الباقي يذهب مباشرةً للحملة.</p>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">🇬🇧 8% of every donation is deducted as an Athar platform fee to cover operational costs. The rest goes directly to the campaign.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold" asChild>
              <Link href="/auth/register">
                إنشاء حساب وتبرع
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold" asChild>
              <Link href="/campaigns">تصفح الحملات</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Why Donate */}
      <section className="section-padding bg-muted/30">
        <div className="container-max mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Zap, title: "سريع وسهل", desc: "أتمم تبرعك في أقل من دقيقة عبر PayPal أو USDT" },
              { icon: Shield, title: "آمن وموثوق", desc: "جميع المعاملات مشفرة وتصل لأصحابها مباشرةً" },
              { icon: Heart, title: "أثر حقيقي", desc: "تابع تأثير تبرعك وانظر الفرق الذي أحدثته" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-2xl border border-border p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="section-padding">
        <div className="container-max mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">
                أكثر الحملات <span className="text-primary">احتياجاً</span>
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">اختر حملة وساهم في الوصول لهدفها</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link href="/campaigns">عرض الكل <ArrowLeft className="w-4 h-4" /></Link>
            </Button>
          </div>
          <CampaignGrid campaigns={campaigns} loading={loading} />
        </div>
      </section>
    </MainLayout>
  );
}
