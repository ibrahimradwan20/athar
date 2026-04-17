"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getCampaignProgress, getCategoryLabel, getStatusLabel, formatDate } from "@/lib/utils";
import type { Campaign } from "@/types";
import { PlusCircle, Eye, Trash2, AlertCircle, Target } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, any> = { pending:"warning", approved:"success", active:"success", rejected:"destructive", completed:"secondary" };

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function MyCampaignsPage() {
  const { profile } = useProfile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      const { data } = await supabase.from("campaigns").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false });
      setCampaigns((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, [profile?.id]);

  const deleteCampaign = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحملة؟")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) { toast.error("لا يمكن حذف الحملة"); return; }
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success("تم حذف الحملة");
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1">حملاتي</h1>
          <p className="text-muted-foreground text-sm">{campaigns.length} حملة إجمالاً</p>
        </div>
        {profile?.can_create_campaign && (
          <Button asChild>
            <Link href="/dashboard/campaigns/new"><PlusCircle className="w-4 h-4" />حملة جديدة</Link>
          </Button>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold mb-2">لا توجد حملات بعد</h3>
          {profile?.can_create_campaign && (
            <Button asChild className="mt-4"><Link href="/dashboard/campaigns/new">إنشاء حملة</Link></Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => {
            const progress = getCampaignProgress(campaign.raised_amount, campaign.target_amount);
            return (
              <div key={campaign.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden shrink-0">
                    <Image src={campaign.images?.[0] || `https://picsum.photos/seed/${campaign.id}/400/300`} alt={campaign.title} className="w-full h-full object-cover"
                width={800}
                height={600}
                unoptimized/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-base leading-tight">{campaign.title}</h3>
                      <Badge variant={statusColors[campaign.status]}>{getStatusLabel(campaign.status)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                      <span>{getCategoryLabel(campaign.category)}</span>
                      <span>•</span>
                      <span>{formatDate(campaign.created_at)}</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-primary">{formatCurrency(campaign.raised_amount)} جُمع</span>
                        <span className="text-muted-foreground">{progress}% من {formatCurrency(campaign.target_amount)}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" asChild className="h-8 text-xs rounded-lg">
                        <Link href={`/campaigns/${campaign.id}`}><Eye className="w-3 h-3" />عرض</Link>
                      </Button>
                      {campaign.status === "pending" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg text-destructive hover:text-destructive" onClick={() => deleteCampaign(campaign.id)}>
                          <Trash2 className="w-3 h-3" />حذف
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {campaign.status === "rejected" && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>تم رفض الحملة. تواصل مع الدعم لمعرفة السبب.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
