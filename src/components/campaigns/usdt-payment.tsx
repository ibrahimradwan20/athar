"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Copy, CheckCircle2, Loader2, AlertCircle,
  ExternalLink, Shield, ArrowLeft, RefreshCw, XCircle
} from "lucide-react";

interface UsdtPaymentProps {
  campaignId: string;
  amount: number;
  onSuccess?: (donationId: string) => void;
}

const TRC20_WALLET = process.env.NEXT_PUBLIC_USDT_TRC20_WALLET || "";
type Step = 1 | 2 | 3;
type VerifyState = "idle" | "verifying" | "success" | "error";

export default function UsdtPayment({ campaignId, amount, onSuccess }: UsdtPaymentProps) {
  const [step, setStep] = useState<Step>(1);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const copyWallet = async () => {
    if (!TRC20_WALLET) { toast.error("عنوان المحفظة غير مُعيَّن. تواصل مع المدير."); return; }
    await navigator.clipboard.writeText(TRC20_WALLET);
    setCopied(true);
    toast.success("✅ تم نسخ عنوان المحفظة");
    setTimeout(() => { setCopied(false); setStep(2); }, 1500);
  };

  const verifyTx = async () => {
    if (!txHash.trim() || txHash.trim().length < 30) {
      toast.error("رقم الهاش قصير جداً، تأكد من نسخه كاملاً"); return;
    }
    setVerifyState("verifying");
    setVerifyResult(null);
    try {
      const res = await fetch("/api/donations/verify-usdt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: txHash.trim(), campaignId, expectedAmount: amount }),
      });
      const data = await res.json();
      setVerifyResult(data);
      if (data.verified) {
        setVerifyState("success");
        toast.success(data.message);
        setTimeout(() => onSuccess?.(data.donationId), 1500);
      } else {
        setVerifyState("error");
      }
    } catch {
      setVerifyState("error");
      setVerifyResult({ error: "فشل الاتصال بالخادم." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Amount */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">مبلغ التبرع / Donation Amount</p>
        <p className="text-4xl font-black text-primary">${amount} <span className="text-lg text-green-600">USDT</span></p>
        <p className="text-xs text-muted-foreground mt-1">شبكة TRC20 (TRON) فقط</p>
      </div>

      {/* Commission Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-700 rounded-xl p-3 flex items-start gap-2">
        <span className="text-amber-500 text-base shrink-0">⚠️</span>
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
          <p className="font-bold">عمولة منصة أثر — Platform Commission</p>
          <p>🇸🇦 من تبرعك، 8% ({(amount * 0.08).toFixed(2)}$ USDT) تذهب كعمولة لمنصة أثر، والباقي ({((1-0.08)*amount).toFixed(2)}$ USDT) يصل للحملة.</p>
          <p className="text-amber-600 dark:text-amber-400">🇬🇧 8% of your donation (${(amount * 0.08).toFixed(2)} USDT) goes to Athar platform as a fee. The remaining ${((1-0.08)*amount).toFixed(2)} USDT reaches the campaign.</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {[{ n: 1, label: "انسخ العنوان" }, { n: 2, label: "أرسل" }, { n: 3, label: "تحقق" }].map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center w-full">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                step > s.n ? "bg-green-500 border-green-500 text-white"
                : step === s.n ? "bg-primary border-primary text-white shadow-md shadow-primary/30"
                : "bg-background border-border text-muted-foreground"
              }`}>
                {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <p className={`text-[10px] mt-1 font-medium ${step === s.n ? "text-primary" : "text-muted-foreground"}`}>{s.label}</p>
            </div>
            {i < 2 && <div className={`h-0.5 flex-1 -mt-4 mx-1 ${step > s.n ? "bg-green-500" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-3 animate-fade-in">
          <div className="border-2 border-dashed border-border rounded-2xl p-4">
            <p className="text-sm font-bold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> عنوان محفظة TRC20
            </p>
            {TRC20_WALLET ? (
              <>
                <div className="bg-muted rounded-xl p-3 mb-3 cursor-text select-all">
                  <p className="font-mono text-xs break-all">{TRC20_WALLET}</p>
                </div>
                <Button onClick={copyWallet} className="w-full gap-2" variant={copied ? "outline" : "default"} size="lg">
                  {copied ? <><CheckCircle2 className="w-4 h-4 text-green-500" />تم النسخ!</> : <><Copy className="w-4 h-4" />نسخ عنوان المحفظة</>}
                </Button>
              </>
            ) : (
              <p className="text-amber-600 text-sm text-center py-3">⚠️ عنوان المحفظة غير مُعيَّن — تواصل مع الإدارة</p>
            )}
          </div>
          <p className="text-xs text-center text-red-500 font-semibold">⚠️ استخدم شبكة TRC20 فقط — أي شبكة أخرى ستؤدي لضياع المبلغ</p>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-3 animate-fade-in">
          <div className="border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4">
            <p className="font-bold text-sm mb-3">تعليمات الإرسال</p>
            <ol className="space-y-2">
              {[
                "افتح محفظتك (Trust Wallet / Binance / OKX)",
                `اختر USDT — شبكة TRC20`,
                "الصق عنوان المحفظة من الخطوة السابقة",
                `أدخل المبلغ: $${amount} USDT`,
                "اضغط إرسال وانتظر التأكيد",
                "احتفظ بـ Transaction Hash من تاريخ المعاملات",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <span className="w-5 h-5 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-black shrink-0">{i+1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">رجوع</Button>
            <Button onClick={() => setStep(3)} className="flex-1 gap-1">أرسلت — التالي <ArrowLeft className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-3 animate-fade-in">
          <div>
            <Label className="flex items-center gap-2 mb-1.5 font-semibold">
              <Shield className="w-4 h-4 text-primary" /> Transaction Hash
            </Label>
            <Input
              value={txHash}
              onChange={(e) => { setTxHash(e.target.value); setVerifyState("idle"); setVerifyResult(null); }}
              placeholder="الصق رقم الهاش هنا..."
              className="font-mono text-xs h-12"
              dir="ltr"
              disabled={verifyState === "verifying" || verifyState === "success"}
            />
            <p className="text-[11px] text-muted-foreground mt-1">رقم الهاش يظهر في تاريخ معاملاتك بعد إتمام الإرسال</p>
          </div>

          {verifyResult && (
            <div className={`rounded-2xl p-4 text-sm border ${
              verifyState === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
            }`}>
              {verifyState === "success" ? (
                <div className="space-y-1.5">
                  <p className="font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />تم التحقق بنجاح!</p>
                  <p>مبلغ التبرع: <strong>${verifyResult.amount?.toFixed(2)} USDT</strong> — مؤكد على البلوكشين</p>
                  {verifyResult.txLink && (
                    <a href={verifyResult.txLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 underline font-medium text-xs mt-1">
                      <ExternalLink className="w-3.5 h-3.5" />عرض على TronScan
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="font-bold flex items-center gap-2"><XCircle className="w-5 h-5" />فشل التحقق</p>
                  <p className="whitespace-pre-line">{verifyResult.error}</p>
                  {verifyResult.txFound && verifyResult.transferAmount !== undefined && (
                    <p className="text-xs opacity-75">المبلغ المُرسَل: ${verifyResult.transferAmount?.toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {verifyState !== "success" && (
              <Button variant="outline" onClick={() => setStep(2)} className="shrink-0">رجوع</Button>
            )}
            {verifyState === "success" ? (
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled>
                <CheckCircle2 className="w-4 h-4 ml-2" />تم التبرع!
              </Button>
            ) : verifyState === "error" ? (
              <Button variant="outline" onClick={() => { setVerifyState("idle"); setVerifyResult(null); }} className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" />حاول مرة أخرى
              </Button>
            ) : (
              <Button onClick={verifyTx} className="flex-1 gap-2" size="lg"
                disabled={verifyState === "verifying" || txHash.trim().length < 10}>
                {verifyState === "verifying"
                  ? <><Loader2 className="w-4 h-4 animate-spin" />جاري التحقق من البلوكشين...</>
                  : <><Shield className="w-4 h-4" />تحقق من الدفع</>}
              </Button>
            )}
          </div>
          {verifyState === "idle" && (
            <p className="text-[11px] text-center text-muted-foreground">🔒 يتم التحقق مباشرة من شبكة TRON — لا يمكن تزوير الدفع</p>
          )}
        </div>
      )}
    </div>
  );
}
