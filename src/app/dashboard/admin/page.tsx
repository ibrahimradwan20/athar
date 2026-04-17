"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getCategoryLabel, getStatusLabel, getRoleLabel, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Campaign, Profile } from "@/types";
import { CheckCircle, XCircle, Eye, Users, Heart, Shield, Loader2 } from "lucide-react";
import Link from "next/link";

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
      if (!user) { router.push("/auth/login"); return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p || !["admin", "moderator"].includes(p.role)) {
        router.push("/dashboard"); return;
      }
      setProfile(p);

      const [campaignsRes, usersRes] = await Promise.all([
        supabase.from("campaigns")
          .select("*, owner:profiles(full_name, email, role)")
          .order("created_at", { ascending: false })
          .limit(50),
        p.role === "admin"
          ? supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100)
          : Promise.resolve({ data: [] }),
      ]);

      setCampaigns((campaignsRes.data as any[]) || []);
      setUsers((usersRes.data as any[]) || []);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCampaignStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
    if (error) { toast.error("حدث خطأ"); }
    else {
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: status as any } : c));
      toast.success(status === "approved" ? "تم اعتماد الحملة" : "تم رفض الحملة");
    }
    setActionLoading(null);
  };

  const updateUserRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) { toast.error("حدث خطأ"); return; }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: role as any } : u));
    toast.success("تم تحديث الدور");
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-2xl" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );

  const pendingCampaigns = campaigns.filter(c => c.status === "pending");

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black">لوحة الإدارة</h1>
          <p className="text-muted-foreground text-sm">{pendingCampaigns.length} حملة تنتظر المراجعة</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "إجمالي الحملات", value: campaigns.length, icon: Heart, color: "text-green-500" },
          { label: "قيد المراجعة", value: pendingCampaigns.length, icon: Shield, color: "text-amber-500" },
          { label: "معتمدة", value: campaigns.filter(c => ["approved", "active"].includes(c.status)).length, icon: CheckCircle, color: "text-blue-500" },
          { label: "المستخدمون", value: users.length, icon: Users, color: "text-purple-500" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            قيد المراجعة {pendingCampaigns.length > 0 && (
              <span className="mr-1.5 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCampaigns.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">جميع الحملات</TabsTrigger>
          {profile?.role === "admin" && <TabsTrigger value="users">المستخدمون</TabsTrigger>}
        </TabsList>

        {/* Pending campaigns */}
        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingCampaigns.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold">لا توجد حملات معلقة</p>
              </div>
            ) : pendingCampaigns.map((campaign) => (
              <CampaignReviewCard key={campaign.id} campaign={campaign}
                onApprove={() => updateCampaignStatus(campaign.id, "approved")}
                onReject={() => updateCampaignStatus(campaign.id, "rejected")}
                loading={actionLoading} />
            ))}
          </div>
        </TabsContent>

        {/* All campaigns */}
        <TabsContent value="all">
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-card rounded-2xl border border-border p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{campaign.title}</p>
                  <p className="text-xs text-muted-foreground">{(campaign as any).owner?.full_name} • {formatDate(campaign.created_at)}</p>
                </div>
                <Badge variant={campaign.status === "approved" || campaign.status === "active" ? "success" : campaign.status === "pending" ? "warning" : "destructive"}>
                  {getStatusLabel(campaign.status)}
                </Badge>
                <div className="flex gap-2">
                  {campaign.status === "pending" && (
                    <>
                      <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => updateCampaignStatus(campaign.id, "approved")}
                        disabled={!!actionLoading}>
                        {actionLoading === campaign.id + "approved" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs rounded-lg" onClick={() => updateCampaignStatus(campaign.id, "rejected")}
                        disabled={!!actionLoading}>
                        {actionLoading === campaign.id + "rejected" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" asChild>
                    <Link href={`/campaigns/${campaign.id}`}><Eye className="w-3 h-3" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        {profile?.role === "admin" && (
          <TabsContent value="users">
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-card rounded-2xl border border-border p-4 flex flex-wrap items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary shrink-0">
                    {user.full_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Select value={user.role} onValueChange={(v) => updateUserRole(user.id, v)}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["admin", "moderator", "donor", "organization", "beneficiary"].map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">{getRoleLabel(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function CampaignReviewCard({ campaign, onApprove, onReject, loading }: {
  campaign: Campaign; onApprove: () => void; onReject: () => void; loading: string | null;
}) {
  return (
    <div className="bg-card rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0">
          <Image src={campaign.images?.[0] || `https://picsum.photos/seed/${campaign.id}/400/300`} alt={campaign.title} className="w-full h-full object-cover"
                width={800}
                height={600}
                unoptimized/>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold">{campaign.title}</h3>
            <Badge variant="warning">قيد المراجعة</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{campaign.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
            <span>📁 {getCategoryLabel(campaign.category)}</span>
            <span>💰 {formatCurrency(campaign.target_amount)}</span>
            <span>👤 {(campaign as any).owner?.full_name}</span>
            <span>📅 {formatDate(campaign.created_at)}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="h-9 gap-2 bg-green-600 hover:bg-green-700" onClick={onApprove} disabled={!!loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              اعتماد الحملة
            </Button>
            <Button size="sm" variant="destructive" className="h-9 gap-2" onClick={onReject} disabled={!!loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              رفض الحملة
            </Button>
            <Button size="sm" variant="outline" className="h-9" asChild>
              <Link href={`/campaigns/${campaign.id}`}><Eye className="w-4 h-4" /> معاينة</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
