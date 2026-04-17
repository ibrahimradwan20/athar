"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getCampaignProgress, getCategoryLabel, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Campaign } from "@/types";
import UsdtPayment from "@/components/campaigns/usdt-payment";
import PaypalPayment from "@/components/campaigns/paypal-payment";
import CampaignInteractions from "@/components/campaigns/campaign-interactions";
import {
  Heart, Users, Share2, CheckCircle2, MapPin, Calendar, Target, ArrowRight
} from "lucide-react";
import Link from "next/link";


const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"usdt" | "paypal">("usdt");
  const [donateSuccess, setDonateSuccess] = useState(false);

  

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setUser(user);
      const { data } = await supabase
        .from("campaigns")
        .select("*, owner:profiles(full_name, avatar_url, is_verified, role)")
        .eq("id", id)
        .single();
      setCampaign(data as any);
      setLoading(false);
    };
    init();
  }, [id]);

  const handleShare = () => {
    navigator.share?.({ title: campaign?.title, url: window.location.href })
      .catch(() => { navigator.clipboard.writeText(window.location.href); toast.success("تم نسخ الرابط"); });
  };

  const finalAmount = customAmount ? Number(customAmount) : amount;

  if (loading) return (
    <MainLayout>
      <div className="container-max mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="aspect-video rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    </MainLayout>
  );

  if (!campaign) return (
    <MainLayout>
      <div className="container-max mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-xl font-bold mb-4">الحملة غير موجودة</h2>
        <Button asChild><Link href="/campaigns">العودة للحملات</Link></Button>
      </div>
    </MainLayout>
  );

  const progress = getCampaignProgress(campaign.raised_amount, campaign.target_amount);
  const daysLeft = campaign.end_date
    ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <MainLayout>
      <div className="container-max mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">الرئيسية</Link>
          <ArrowRight className="w-4 h-4 rotate-180" />
          <Link href="/campaigns" className="hover:text-foreground">الحملات</Link>
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span className="text-foreground truncate max-w-[200px]">{campaign.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="rounded-2xl overflow-hidden aspect-video img-zoom shadow-md">
              <Image
                src={campaign.images?.[0] || `https://picsum.photos/seed/${campaign.id}/1200/675`}
                alt={campaign.title}
                className="w-full h-full object-cover"
                loading="eager"
                width={800}
                height={600}
                unoptimized/>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge>{getCategoryLabel(campaign.category)}</Badge>
              {campaign.is_beneficiary_campaign && <Badge variant="warning">حملة فردية</Badge>}
              {campaign.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{campaign.location}
                </Badge>
              )}
              {daysLeft !== null && (
                <Badge variant={daysLeft <= 7 ? "destructive" : "default"}>
                  <Calendar className="w-3 h-3 ml-1" />
                  {daysLeft === 0 ? "ينتهي اليوم" : `${daysLeft} يوم متبقٍ`}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight">{campaign.title}</h1>

            {/* Owner */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  {campaign.owner?.full_name?.[0] || "م"}
                </div>
                <div>
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    {campaign.owner?.full_name || "جهة خيرية"}
                    {campaign.owner?.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">نُشرت {formatDate(campaign.created_at)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />مشاركة
              </Button>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-loose whitespace-pre-wrap text-base">
                {campaign.description}
              </p>
            </div>

            {/* Campaign Interactions */}
            <CampaignInteractions
              campaignId={id}
              isAdmin={campaign.owner?.role === "admin"}
              isModerator={campaign.owner?.role === "moderator"}
              commentsLocked={campaign.comments_locked}
            />

            {/* Progress */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-2xl font-black text-primary">{formatCurrency(campaign.raised_amount)}</p>
                  <p className="text-xs text-muted-foreground">من أصل {formatCurrency(campaign.target_amount)}</p>
                </div>
                <p className="text-3xl font-black">{progress}%</p>
              </div>
              <Progress value={progress} className="h-3 mb-4" />
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "جُمع", value: formatCurrency(campaign.raised_amount) },
                  { label: "متبرع", value: (campaign.donors_count || 0).toLocaleString("ar") },
                  { label: "الهدف", value: formatCurrency(campaign.target_amount) },
                ].map(s => (
                  <div key={s.label} className="bg-muted rounded-xl p-3">
                    <p className="font-black text-sm">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Donation sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border shadow-md overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-black text-lg mb-1">تبرع الآن / Donate Now</h3>
                <p className="text-muted-foreground text-xs">تبرعك يصل لمستحقيه مباشرة</p>
              </div>

              {/* Commission Notice */}
              <div className="mx-5 mt-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex items-start gap-2">
                <span className="text-amber-500 text-sm shrink-0 mt-0.5">⚠️</span>
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold mb-0.5">عمولة المنصة 8% — 8% Platform Fee</p>
                  <p className="text-amber-600 dark:text-amber-400">8% من تبرعك عمولة لمنصة أثر · 8% of your donation goes to Athar as a platform fee.</p>
                </div>
              </div>

              {!user ? (
                <div className="p-5 text-center">
                  <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold mb-1">سجّل دخولك للتبرع</p>
                  <p className="text-muted-foreground text-xs mb-4">نحتاج حسابك لتسجيل تبرعك بشكل صحيح</p>
                  <Button asChild className="w-full">
                    <Link href={`/auth/login?redirect=/campaigns/${id}`}>تسجيل الدخول</Link>
                  </Button>
                </div>
              ) : donateSuccess ? (
                <div className="p-5 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-black text-lg mb-2">شكراً لك! 🎉</h3>
                  <p className="text-muted-foreground text-sm mb-4">تبرعك سيحدث أثراً حقيقياً</p>
                  <Button variant="outline" className="w-full" onClick={() => { setDonateSuccess(false); setCustomAmount(""); }}>
                    تبرع مرة أخرى
                  </Button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Amount selection */}
                  <div>
                    <p className="text-sm font-semibold mb-2">اختر المبلغ ($)</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {QUICK_AMOUNTS.map(a => (
                        <button key={a}
                          onClick={() => { setAmount(a); setCustomAmount(""); }}
                          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                            amount === a && !customAmount
                              ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                              : "border-border hover:border-primary/50 hover:text-primary"
                          }`}>
                          ${a}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      placeholder="مبلغ آخر ($)"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      min="1"
                      className="h-11"
                      dir="ltr"
                    />
                  </div>

                  {/* Payment method tabs */}
                  <div>
                    <p className="text-sm font-semibold mb-2">طريقة الدفع</p>
                    <Tabs value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)}>
                      <TabsList className="w-full grid grid-cols-2 mb-4">
                        <TabsTrigger value="usdt" className="gap-2 text-xs">
                          🔐 USDT TRC20
                        </TabsTrigger>
                        <TabsTrigger value="paypal" className="gap-2 text-xs">
                          💳 PayPal
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="usdt">
                        <UsdtPayment
                          campaignId={id}
                          amount={finalAmount || 10}
                          onSuccess={(donationId) => {
                            setDonateSuccess(true);
                            toast.success("🎉 تم التبرع بنجاح!");
                          }}
                        />
                      </TabsContent>

                      <TabsContent value="paypal">
                        <PaypalPayment
                          campaignId={id}
                          amount={finalAmount || 10}
                          onSuccess={(donationId) => {
                            setDonateSuccess(true);
                            toast.success("🎉 تم تسجيل تبرعك!");
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-3 pt-1 border-t border-border">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> دفع آمن
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> تحقق حقيقي
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> شفافية كاملة
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
