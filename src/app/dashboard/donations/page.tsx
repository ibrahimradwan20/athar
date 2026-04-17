"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, CreditCard, Heart, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function DonationsPage() {
  const { profile } = useProfile();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from("donations")
        .select("*, campaign:campaigns(title, images)")
        .eq("donor_id", profile.id)
        .order("created_at", { ascending: false });
      setDonations(data || []);
      setLoading(false);
    };
    load();
  }, [profile?.id]);

  const total = donations.filter(d => d.status === "completed").reduce((s, d) => s + Number(d.amount), 0);

  const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
    completed: { label: "مكتمل ✓", variant: "success", icon: CheckCircle },
    pending:   { label: "معلق", variant: "warning", icon: Clock },
    failed:    { label: "فشل", variant: "destructive", icon: XCircle },
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">سجل التبرعات</h1>
        <p className="text-muted-foreground text-sm">إجمالي تبرعاتك المؤكدة: <strong className="text-primary">{formatCurrency(total)}</strong></p>
      </div>

      {donations.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold mb-2">لا توجد تبرعات بعد</h3>
          <Link href="/campaigns" className="text-primary hover:underline text-sm">تصفح الحملات وتبرع الآن</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map((d) => {
            const cfg = statusConfig[d.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={d.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                  {d.campaign?.images?.[0]
                    ? <Image src={d.campaign.images[0]} alt="" className="w-full h-full object-cover"
                width={800}
                height={600}
                unoptimized/>
                    : <div className="w-full h-full flex items-center justify-center"><Heart className="w-5 h-5 text-muted-foreground" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.campaign?.title || "حملة"}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {d.payment_method === "usdt"
                        ? <><Wallet className="w-3 h-3" />USDT TRC20</>
                        : <><CreditCard className="w-3 h-3" />PayPal</>
                      }
                    </span>
                  </div>
                  {d.transaction_id && d.status === "completed" && (
                    <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                      TX: {d.transaction_id.slice(0, 20)}...
                    </p>
                  )}
                </div>
                <div className="text-left shrink-0 space-y-1">
                  <p className="font-black text-primary text-base">{formatCurrency(d.amount)}</p>
                  <Badge variant={cfg.variant} className="text-xs flex items-center gap-1 justify-end">
                    <StatusIcon className="w-3 h-3" />{cfg.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
