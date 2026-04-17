"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Copy, CheckCircle2, Loader2, ExternalLink,
  Shield, XCircle, RefreshCw, Mail, ArrowLeft, Info
} from "lucide-react";

interface PaypalPaymentProps {
  campaignId: string;
  amount: number;
  onSuccess?: (donationId: string) => void;
}

type Step = 1 | 2 | 3;
type VerifyState = "idle" | "verifying" | "success" | "error" | "pending";

export default function PaypalPayment({ campaignId, amount, onSuccess }: PaypalPaymentProps) {
  const [step, setStep] = useState<Step>(1);
  const [paypalInfo, setPaypalInfo] = useState<{ paypalEmail: string; paypalMeLink: string } | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [copied, setCopied] = useState<"email" | "link" | null>(null);

  useEffect(() => {
    fetch("/api/donations/verify-paypal")
      .then(r => r.json())
      .then(setPaypalInfo)
      .catch(() => {});
  }, []);

  const copyText = async (text: string, type: "email" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("✅ تم النسخ");
    setTimeout(() => setCopied(null), 2000);
  };

  const openPaypalMe = () => {
    if (!paypalInfo?.paypalMeLink) return;
    const url = `${paypalInfo.paypalMeLink}/${amount}USD`;
    window.open(url, "_blank");
    setStep(2);
  };

  const verifyPayment = async () => {
    if (!transactionId.trim()) {
      toast.error("أدخل معرف المعاملة (Transaction ID)");
      return;
    }
    setVerifyState("verifying");
    setVerifyResult(null);
    try {
      const res = await fetch("/api/donations/verify-paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transactionId.trim(),
          campaignId,
          expectedAmount: amount,
          senderEmail: senderEmail.trim(),
        }),
      });
      const data = await res.json();
      setVerifyResult(data);

      if (data.verified) {
        setVerifyState("success");
        toast.success(data.message);
        setTimeout(() => onSuccess?.(data.donationId), 1500);
      } else if (data.pendingReview) {
        setVerifyState("pending");
        toast.info(data.message);
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
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">مبلغ التبرع / Donation Amount</p>
        <p className="text-4xl font-black text-blue-600">${amount}</p>
        <p className="text-xs text-muted-foreground mt-1">دفع عبر PayPal</p>
      </div>

      {/* Commission Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-700 rounded-xl p-3 flex items-start gap-2">
        <span className="text-amber-500 text-base shrink-0">⚠️</span>
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
          <p className="font-bold">عمولة منصة أثر — Platform Commission</p>
          <p>🇸🇦 من تبرعك، 8% تذهب كعمولة لمنصة أثر لتغطية تكاليف التشغيل، والباقي ({((1-0.08)*amount).toFixed(2)}$) يصل للحملة.</p>
          <p className="text-amber-600 dark:text-amber-400">🇬🇧 8% of your donation (${(amount * 0.08).toFixed(2)}) goes to Athar platform as a fee. The remaining ${((1-0.08)*amount).toFixed(2)} reaches the campaign.</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {[{ n: 1, label: "اختر طريقة" }, { n: 2, label: "ادفع" }, { n: 3, label: "تأكيد" }].map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center w-full">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                step > s.n ? "bg-blue-500 border-blue-500 text-white"
                : step === s.n ? "bg-blue-600 border-blue-600 text-white shadow-md"
                : "bg-background border-border text-muted-foreground"
              }`}>
                {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <p className={`text-[10px] mt-1 font-medium ${step === s.n ? "text-blue-600" : "text-muted-foreground"}`}>{s.label}</p>
            </div>
            {i < 2 && <div className={`h-0.5 flex-1 -mt-4 mx-1 ${step > s.n ? "bg-blue-500" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose method */}
      {step === 1 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm font-semibold text-center text-muted-foreground">اختر طريقة الدفع عبر PayPal</p>

          {/* Option A: PayPal.me link */}
          {paypalInfo?.paypalMeLink && (
            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">رابط PayPal.me</p>
                  <p className="text-xs text-muted-foreground">الأسهل والأسرع — يفتح PayPal مباشرة</p>
                </div>
                <span className="mr-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">موصى به</span>
              </div>
              <div className="bg-muted rounded-xl p-2.5 mb-3 flex items-center gap-2">
                <p className="font-mono text-xs flex-1 truncate text-foreground/80">{paypalInfo.paypalMeLink}/{amount}USD</p>
                <button onClick={() => copyText(`${paypalInfo.paypalMeLink}/${amount}USD`, "link")}
                  className="w-7 h-7 bg-background rounded-lg flex items-center justify-center hover:bg-muted border border-border transition-colors shrink-0">
                  {copied === "link" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <Button onClick={openPaypalMe} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="w-4 h-4" /> فتح رابط PayPal (${ amount})
              </Button>
            </div>
          )}

          {/* Option B: Email transfer */}
          {paypalInfo?.paypalEmail && (
            <div className="border-2 border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm">إرسال لبريد PayPal</p>
                  <p className="text-xs text-muted-foreground">ابحث عن البريد في تطبيق PayPal وأرسل المبلغ</p>
                </div>
              </div>
              <div className="bg-muted rounded-xl p-2.5 mb-3 flex items-center gap-2">
                <p className="font-mono text-xs flex-1 text-foreground/80 truncate">{paypalInfo.paypalEmail}</p>
                <button onClick={() => copyText(paypalInfo.paypalEmail, "email")}
                  className="w-7 h-7 bg-background rounded-lg flex items-center justify-center hover:bg-muted border border-border transition-colors shrink-0">
                  {copied === "email" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-2.5 mb-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                في ملاحظة الدفع اكتب: <strong>Athar Campaign {campaignId.slice(0, 8)}</strong>
              </div>

              <Button variant="outline" onClick={() => setStep(2)} className="w-full gap-2">
                <Mail className="w-4 h-4" /> أرسلت عبر البريد — التالي
              </Button>
            </div>
          )}

          {!paypalInfo?.paypalEmail && !paypalInfo?.paypalMeLink && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              جاري تحميل معلومات PayPal...
            </div>
          )}
        </div>
      )}

      {/* Step 2: Payment reminder */}
      {step === 2 && (
        <div className="space-y-3 animate-fade-in">
          <div className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4">
            <p className="font-bold text-sm mb-2 text-blue-800 dark:text-blue-300">تأكد من اكتمال الدفع</p>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                المبلغ المُرسَل: <strong>${amount} USD</strong>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                بعد الدفع، اذهب لـ تاريخ المعاملات في PayPal
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                انسخ رقم المعاملة (Transaction ID)
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">رجوع</Button>
            <Button onClick={() => setStep(3)} className="flex-1 gap-1">
              دفعت — أدخل المعرف <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Verify */}
      {step === 3 && (
        <div className="space-y-3 animate-fade-in">
          <div className="space-y-3">
            <div>
              <Label className="font-semibold flex items-center gap-2 mb-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                Transaction ID / معرف المعاملة *
              </Label>
              <Input
                value={transactionId}
                onChange={e => { setTransactionId(e.target.value); setVerifyState("idle"); setVerifyResult(null); }}
                placeholder="مثال: 1AB23456CD789012E"
                className="font-mono h-11"
                dir="ltr"
                disabled={verifyState === "verifying" || verifyState === "success" || verifyState === "pending"}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                تجده في تطبيق PayPal: المعاملات ← اضغط على العملية ← رقم المعاملة
              </p>
            </div>

            <div>
              <Label className="font-medium mb-1.5 block text-sm flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                بريد PayPal المُرسِل (اختياري)
              </Label>
              <Input
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                placeholder="your@email.com"
                type="email"
                className="h-11"
                dir="ltr"
                disabled={verifyState === "verifying" || verifyState === "success"}
              />
            </div>
          </div>

          {/* Result */}
          {verifyResult && (
            <div className={`rounded-2xl p-4 text-sm border ${
              verifyState === "success" ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
              : verifyState === "pending" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300"
              : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
            }`}>
              {verifyState === "success" && (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />تم التحقق بنجاح!</p>
                  <p>المبلغ: <strong>${verifyResult.amount}</strong> — مسجّل ومؤكد</p>
                </div>
              )}
              {verifyState === "pending" && (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-2"><Shield className="w-5 h-5" />قيد المراجعة</p>
                  <p>{verifyResult.message}</p>
                </div>
              )}
              {verifyState === "error" && (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-2"><XCircle className="w-5 h-5" />فشل التحقق</p>
                  <p className="whitespace-pre-line">{verifyResult.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            {verifyState !== "success" && verifyState !== "pending" && (
              <Button variant="outline" onClick={() => setStep(2)} className="shrink-0">رجوع</Button>
            )}
            {(verifyState === "success" || verifyState === "pending") ? (
              <Button className={`flex-1 ${verifyState === "pending" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`} disabled>
                {verifyState === "pending"
                  ? <><Shield className="w-4 h-4 ml-2" />بانتظار مراجعة الإدارة</>
                  : <><CheckCircle2 className="w-4 h-4 ml-2" />تم التبرع!</>}
              </Button>
            ) : verifyState === "error" ? (
              <Button variant="outline" onClick={() => { setVerifyState("idle"); setVerifyResult(null); }} className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" />أعد المحاولة
              </Button>
            ) : (
              <Button onClick={verifyPayment} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700" size="lg"
                disabled={verifyState === "verifying" || !transactionId.trim()}>
                {verifyState === "verifying"
                  ? <><Loader2 className="w-4 h-4 animate-spin" />جاري التحقق...</>
                  : <><Shield className="w-4 h-4" />تحقق وأكد الدفع</>}
              </Button>
            )}
          </div>

          {verifyState === "idle" && (
            <p className="text-[11px] text-center text-muted-foreground">
              🔒 يتم التحقق عبر PayPal API — المعاملات الوهمية تُرفض تلقائياً
            </p>
          )}
        </div>
      )}
    </div>
  );
}
