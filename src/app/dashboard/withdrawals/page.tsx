"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLang } from "@/components/providers/lang-provider";
import {
  Wallet, DollarSign, Clock, CheckCircle2, XCircle,
  ArrowDownToLine, Loader2, AlertCircle, Info, RefreshCw, Percent
} from "lucide-react";

const COMMISSION_RATE = 0.08;

interface Balance {
  campaign_id: string;
  title: string;
  total_raised: number;
  withdrawn: number;
  available: number;
}

interface Withdrawal {
  id: string;
  campaign_id: string;
  campaign?: { title: string };
  amount: number;
  method: string;
  status: string;
  usdt_wallet?: string;
  paypal_email?: string;
  admin_note?: string;
  transaction_id?: string;
  created_at: string;
  processed_at?: string;
}

export default function WithdrawalsPage() {
  const { t, isRTL, locale } = useLang();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [method, setMethod] = useState<"usdt" | "paypal">("usdt");
  const [amount, setAmount] = useState("");
  const [usdtWallet, setUsdtWallet] = useState("");
  const [usdtNetwork, setUsdtNetwork] = useState("trc20");
  const [paypalEmail, setPaypalEmail] = useState("");

  const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
    pending:    { label: t("status_pending"),    variant: "warning",     icon: Clock },
    processing: { label: t("status_processing"), variant: "default",     icon: Loader2 },
    completed:  { label: t("status_completed"),  variant: "success",     icon: CheckCircle2 },
    rejected:   { label: t("status_rejected"),   variant: "destructive", icon: XCircle },
  };

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/withdrawals");
    if (res.ok) {
      const data = await res.json();
      setBalances(data.balances || []);
      setWithdrawals(data.withdrawals || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const selectedBalance = balances.find(b => b.campaign_id === selectedCampaign);
  const totalAvailable = balances.reduce((s, b) => s + b.available, 0);
  const numAmount = Number(amount);
  const commissionAmt = numAmount > 0 ? parseFloat((numAmount * COMMISSION_RATE).toFixed(2)) : 0;
  const netAmt = numAmount > 0 ? parseFloat((numAmount - commissionAmt).toFixed(2)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCampaign) { toast.error(locale === "ar" ? "اختر الحملة" : "Select a campaign"); return; }
    if (!numAmount || numAmount <= 0) { toast.error(locale === "ar" ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount"); return; }
    if (selectedBalance && numAmount > selectedBalance.available) {
      toast.error(locale === "ar"
        ? `الرصيد المتاح: ${formatCurrency(selectedBalance.available)} فقط`
        : `Available balance: ${formatCurrency(selectedBalance.available)} only`);
      return;
    }
    if (method === "usdt" && !usdtWallet.trim()) {
      toast.error(locale === "ar" ? "أدخل عنوان محفظة USDT" : "Enter USDT wallet address");
      return;
    }
    if (method === "paypal" && !paypalEmail.trim()) {
      toast.error(locale === "ar" ? "أدخل بريد PayPal" : "Enter PayPal email");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: selectedCampaign,
        amount: numAmount,
        method,
        usdt_wallet: usdtWallet,
        usdt_network: usdtNetwork,
        paypal_email: paypalEmail,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      const msg = locale === "ar" ? data.message : data.messageEn;
      toast.success(msg || (locale === "ar" ? "تم إرسال الطلب بنجاح" : "Request sent successfully"));
      setAmount(""); setUsdtWallet(""); setPaypalEmail("");
      fetchData();
    } else {
      toast.error(data.error);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black mb-1">{t("withdrawal_requests")}</h1>
        <p className="text-muted-foreground text-sm">{t("withdrawal_subtitle")}</p>
      </div>

      {/* Commission Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/15 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/30 rounded-xl flex items-center justify-center shrink-0">
          <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">
            {t("commission_title")} — {t("commission_rate")}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
            {t("commission_campaign_owner")}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-medium">
            {t("withdrawal_net_info")}
          </p>
        </div>
      </div>

      {/* Balance overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-black text-green-600">{formatCurrency(totalAvailable)}</p>
                <p className="text-xs text-muted-foreground">{t("total_available")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-black">{withdrawals.filter(w => w.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">{t("pending_requests")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign balances */}
      {balances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> {t("my_balance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {balances.map(b => (
              <div key={b.campaign_id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("total_label")}: {formatCurrency(b.total_raised)} • {t("withdrawn_label")}: {formatCurrency(b.withdrawn)}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className={`font-black text-sm ${b.available > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                    {formatCurrency(b.available)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t("available_to_withdraw")}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Withdrawal form */}
      {balances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold mb-1">{t("no_balance")}</h3>
            <p className="text-sm text-muted-foreground">{t("no_balance_desc")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-primary" /> {t("new_withdrawal")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="mb-1.5 block font-semibold">
                  {locale === "ar" ? "الحملة" : "Campaign"} *
                </Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_campaign")} />
                  </SelectTrigger>
                  <SelectContent>
                    {balances.map(b => (
                      <SelectItem key={b.campaign_id} value={b.campaign_id} disabled={b.available <= 0}>
                        {b.title} — {t("available_to_withdraw")}: {formatCurrency(b.available)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">
                  {t("withdrawal_amount")} *
                  {selectedBalance && (
                    <span className="text-xs text-green-600 font-normal mx-2">
                      ({t("max_label")}: {formatCurrency(selectedBalance.available)})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  min="5"
                  max={selectedBalance?.available}
                  step="0.01"
                  dir="ltr"
                  className="h-11"
                />
                {selectedBalance && (
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {[25, 50, 100].map(pct => {
                      const val = (selectedBalance.available * pct / 100).toFixed(2);
                      return (
                        <button key={pct} type="button" onClick={() => setAmount(val)}
                          className="text-xs bg-muted hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-lg transition-colors">
                          {pct}% ({formatCurrency(Number(val))})
                        </button>
                      );
                    })}
                    <button type="button" onClick={() => setAmount(String(selectedBalance.available))}
                      className="text-xs bg-muted hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-lg transition-colors">
                      {locale === "ar" ? "الكل" : "All"}
                    </button>
                  </div>
                )}
              </div>

              {/* Commission breakdown */}
              {numAmount > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5" /> {t("commission_title")}
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("amount_before_commission")}</span>
                      <span dir="ltr" className="font-mono">${numAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>{t("commission_amount")}</span>
                      <span dir="ltr" className="font-mono">− ${commissionAmt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-green-700 dark:text-green-400 text-sm border-t border-orange-200 dark:border-orange-800 pt-1.5">
                      <span>{t("net_amount")}</span>
                      <span dir="ltr" className="font-mono">${netAmt.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-1.5 block font-semibold">{t("receive_method")} *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "usdt", label: "USDT TRC20", emoji: "🔐" },
                    { v: "paypal", label: "PayPal", emoji: "💳" },
                  ].map(m => (
                    <button key={m.v} type="button" onClick={() => setMethod(m.v as any)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        method === m.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {method === "usdt" && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <Label className="mb-1.5 block">{t("usdt_wallet_address")} *</Label>
                    <Input value={usdtWallet} onChange={e => setUsdtWallet(e.target.value)}
                      placeholder="TXxxxxxxxxxxxxxxxxxxxx" className="font-mono h-11" dir="ltr" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">{t("network_label")}</Label>
                    <Select value={usdtNetwork} onValueChange={setUsdtNetwork}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trc20">TRC20 (TRON) — {locale === "ar" ? "موصى به" : "Recommended"}</SelectItem>
                        <SelectItem value="erc20">ERC20 (Ethereum)</SelectItem>
                        <SelectItem value="bep20">BEP20 (BSC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {method === "paypal" && (
                <div className="animate-fade-in">
                  <Label className="mb-1.5 block">{t("paypal_receiver_email")} *</Label>
                  <Input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)}
                    placeholder="your@paypal-email.com" className="h-11" dir="ltr" />
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">{t("important_info")}</p>
                  <p>{t("processing_time")}</p>
                  <p>{t("verify_address")}</p>
                  <p>{t("min_withdrawal")}</p>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base gap-2" disabled={submitting || !selectedCampaign || !amount}>
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{t("sending")}</>
                  : <><ArrowDownToLine className="w-4 h-4" />{t("send_withdrawal_request")}</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Withdrawals history */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("withdrawal_history")}</CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> {t("refresh")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {withdrawals.map(w => {
              const cfg = statusConfig[w.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const commission = parseFloat((Number(w.amount) * COMMISSION_RATE).toFixed(2));
              const net = parseFloat((Number(w.amount) - commission).toFixed(2));
              return (
                <div key={w.id} className="border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-base">{formatCurrency(w.amount)}</p>
                      <p className="text-xs text-muted-foreground">{w.campaign?.title}</p>
                    </div>
                    <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0">
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </Badge>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg px-3 py-2 mb-2 text-xs space-y-0.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("commission_amount")}</span>
                      <span dir="ltr" className="font-mono text-red-500">− ${commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-700 dark:text-green-400">
                      <span>{t("net_amount")}</span>
                      <span dir="ltr" className="font-mono">${net.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{locale === "ar" ? "طريقة" : "Method"}: {w.method === "usdt" ? "🔐 USDT " + (w.usdt_wallet?.slice(0,8) + "...") : "💳 PayPal " + w.paypal_email}</span>
                    <span>{t("request_date")}: {formatDate(w.created_at)}</span>
                  </div>

                  {w.status === "completed" && w.transaction_id && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg text-xs text-green-700 dark:text-green-400 font-mono break-all">
                      ✅ {t("tx_id_label")}: {w.transaction_id}
                    </div>
                  )}

                  {w.status === "rejected" && w.admin_note && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {t("rejection_reason")}: {w.admin_note}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
