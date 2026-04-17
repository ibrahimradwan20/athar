"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowDownToLine, CheckCircle2, XCircle, Loader2,
  Clock, RefreshCw, DollarSign, Copy, ExternalLink
} from "lucide-react";

const STATUS = {
  pending: { label: "معلق", variant: "warning" as const, color: "text-amber-600" },
  processing: { label: "جاري", variant: "default" as const, color: "text-blue-600" },
  completed: { label: "مكتمل", variant: "success" as const, color: "text-green-600" },
  rejected: { label: "مرفوض", variant: "destructive" as const, color: "text-red-600" },
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [txIds, setTxIds] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!["admin", "moderator"].includes(p?.role)) { router.push("/dashboard"); return; }
      fetchWithdrawals();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawals")
      .select("*, user:profiles(full_name,email), campaign:campaigns(title)")
      .order("created_at", { ascending: false });
    setWithdrawals(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    if (status === "completed" && !txIds[id]?.trim()) {
      toast.error("أدخل معرف المعاملة (Transaction ID) قبل التأكيد");
      return;
    }
    setProcessing(id);
    const res = await fetch(`/api/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        admin_note: notes[id] || null,
        transaction_id: txIds[id] || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(status === "completed" ? "✅ تم تأكيد السحب" : status === "rejected" ? "تم رفض الطلب" : "تم التحديث");
      fetchWithdrawals();
    } else {
      toast.error(data.error);
    }
    setProcessing(null);
  };

  const filtered = filter === "all" ? withdrawals : withdrawals.filter(w => w.status === filter);
  const pendingCount = withdrawals.filter(w => w.status === "pending").length;
  const pendingAmount = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ArrowDownToLine className="w-6 h-6 text-primary" /> إدارة طلبات السحب
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {pendingCount} طلب معلق • {formatCurrency(pendingAmount)} إجمالي
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWithdrawals} className="gap-2">
          <RefreshCw className="w-4 h-4" /> تحديث
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: "pending", label: "معلقة", count: withdrawals.filter(w => w.status === "pending").length },
          { k: "processing", label: "جارية", count: withdrawals.filter(w => w.status === "processing").length },
          { k: "completed", label: "مكتملة", count: withdrawals.filter(w => w.status === "completed").length },
          { k: "rejected", label: "مرفوضة", count: withdrawals.filter(w => w.status === "rejected").length },
          { k: "all", label: "الكل", count: withdrawals.length },
        ].map(tab => (
          <button key={tab.k} onClick={() => setFilter(tab.k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              filter === tab.k ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
            }`}>
            {tab.label}
            <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === tab.k ? "bg-white/20" : "bg-muted"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(w => {
            const cfg = STATUS[w.status as keyof typeof STATUS] || STATUS.pending;
            return (
              <div key={w.id} className={`bg-card rounded-2xl border-2 p-5 ${
                w.status === "pending" ? "border-amber-200 dark:border-amber-800" : "border-border"
              }`}>
                {/* Top row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-2xl font-black">{formatCurrency(w.amount)}</p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm font-semibold">{w.user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{w.user?.email}</p>
                    <p className="text-xs text-muted-foreground">الحملة: {w.campaign?.title}</p>
                    {/* Commission breakdown for admin */}
                    <div className="mt-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 rounded-lg px-2.5 py-1.5 text-xs space-y-0.5">
                      <div className="flex gap-3">
                        <span className="text-muted-foreground">عمولة المنصة (8%):</span>
                        <span className="font-bold text-red-600" dir="ltr">${(Number(w.amount) * 0.08).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-muted-foreground">صافي للمستفيد:</span>
                        <span className="font-bold text-green-700" dir="ltr">${(Number(w.amount) * 0.92).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-xs text-muted-foreground mb-1">طريقة الاستلام</p>
                    <div className="bg-muted rounded-xl p-2.5 font-mono text-xs max-w-[220px]">
                      {w.method === "usdt" ? (
                        <div>
                          <p className="font-semibold text-[10px] text-muted-foreground mb-0.5">USDT {w.usdt_network?.toUpperCase()}</p>
                          <p className="break-all">{w.usdt_wallet}</p>
                          <button onClick={() => navigator.clipboard.writeText(w.usdt_wallet).then(() => toast.success("تم النسخ"))}
                            className="mt-1 flex items-center gap-1 text-primary text-[10px] hover:underline">
                            <Copy className="w-3 h-3" /> نسخ العنوان
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-[10px] text-muted-foreground mb-0.5">PayPal Email</p>
                          <p>{w.paypal_email}</p>
                          <button onClick={() => navigator.clipboard.writeText(w.paypal_email).then(() => toast.success("تم النسخ"))}
                            className="mt-1 flex items-center gap-1 text-primary text-[10px] hover:underline">
                            <Copy className="w-3 h-3" /> نسخ البريد
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(w.created_at)}</p>
                  </div>
                </div>

                {/* Action area for pending/processing */}
                {(w.status === "pending" || w.status === "processing") && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold block mb-1">
                          Transaction ID / Hash *
                          <span className="text-muted-foreground font-normal"> (مطلوب للتأكيد)</span>
                        </label>
                        <Input value={txIds[w.id] || ""} onChange={e => setTxIds(p => ({ ...p, [w.id]: e.target.value }))}
                          placeholder="أدخل رقم المعاملة بعد الإرسال..." className="h-9 font-mono text-xs" dir="ltr" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1">ملاحظة (اختياري)</label>
                        <Input value={notes[w.id] || ""} onChange={e => setNotes(p => ({ ...p, [w.id]: e.target.value }))}
                          placeholder="للرفض: سبب الرفض..." className="h-9 text-sm" />
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {w.status === "pending" && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateStatus(w.id, "processing")} disabled={processing === w.id}>
                          {processing === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                          بدء المعالجة
                        </Button>
                      )}
                      <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatus(w.id, "completed")} disabled={processing === w.id}>
                        {processing === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        تأكيد الإرسال
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1.5"
                        onClick={() => updateStatus(w.id, "rejected")} disabled={processing === w.id}>
                        <XCircle className="w-3.5 h-3.5" /> رفض
                      </Button>
                    </div>
                  </div>
                )}

                {/* Completed: show TX */}
                {w.status === "completed" && w.transaction_id && (
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs font-semibold text-green-600 mb-1">✅ معرف المعاملة:</p>
                    <p className="font-mono text-xs bg-green-50 dark:bg-green-900/10 p-2 rounded-lg break-all">
                      {w.transaction_id}
                    </p>
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
