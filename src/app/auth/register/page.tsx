"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import {
  Eye, EyeOff, Loader2, ArrowLeft, ArrowRight,
  UserCheck, Building2, HeartHandshake, CheckCircle2, Heart, Info
} from "lucide-react";

type AccountType = "donor" | "organization" | "beneficiary";

const accountTypes = [
  {
    type: "donor" as AccountType,
    icon: UserCheck,
    label: "متبرع",
    description: "أريد التبرع ودعم الحملات الخيرية",
    defaultCanDonate: true,
    defaultCanCreate: false,
    color: "border-blue-200 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-400",
    activeColor: "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600",
  },
  {
    type: "organization" as AccountType,
    icon: Building2,
    label: "مؤسسة / صاحب حملة",
    description: "أمثل منظمة خيرية أو أريد إطلاق حملة",
    defaultCanDonate: true,
    defaultCanCreate: true,
    color: "border-green-200 bg-green-50 dark:bg-green-900/10 hover:border-green-400",
    activeColor: "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600",
  },
  {
    type: "beneficiary" as AccountType,
    icon: HeartHandshake,
    label: "مستفيد فردي",
    description: "أحتاج مساعدة وأريد إطلاق حملة شخصية",
    defaultCanDonate: true,
    defaultCanCreate: true,
    color: "border-amber-200 bg-amber-50 dark:bg-amber-900/10 hover:border-amber-400",
    activeColor: "border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600",
  },
];

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [canDonate, setCanDonate] = useState(true);
  const [canCreateCampaign, setCanCreateCampaign] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "donor", email: "", password: "", confirm_password: "", full_name: "" },
  });

  const selectType = (type: AccountType) => {
    const config = accountTypes.find(t => t.type === type)!;
    setAccountType(type);
    setCanDonate(config.defaultCanDonate);
    setCanCreateCampaign(config.defaultCanCreate);
  };

  const onSubmit = async (data: RegisterInput) => {
    if (!accountType) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: accountType,
          can_donate: canDonate,
          can_create_campaign: canCreateCampaign,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message.includes("already") ? "هذا البريد مسجل مسبقاً، جرب تسجيل الدخول" : "حدث خطأ أثناء التسجيل");
    } else {
      setStep(3);
    }
    setLoading(false);
  };

  const selectedConfig = accountTypes.find(t => t.type === accountType);

  return (
    <div className="animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s < step ? "bg-primary text-white" :
              s === step ? "bg-primary text-white ring-4 ring-primary/20" :
              "bg-muted text-muted-foreground"
            }`}>
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`w-10 h-0.5 transition-colors ${s < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Choose account type ── */}
      {step === 1 && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-black mb-1">اختر نوع حسابك</h1>
            <p className="text-muted-foreground text-sm">لا تقلق، يمكنك التبرع وإنشاء الحملات بأي نوع حساب</p>
          </div>

          <div className="space-y-3 mb-5">
            {accountTypes.map((type) => (
              <button key={type.type} type="button" onClick={() => selectType(type.type)}
                className={`w-full text-right p-4 rounded-2xl border-2 transition-all duration-200 ${
                  accountType === type.type ? type.activeColor : type.color
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type.iconBg} shrink-0`}>
                    <type.icon className={`w-6 h-6 ${type.iconColor}`} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-base">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  {accountType === type.type && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </div>
              </button>
            ))}
          </div>

          {/* Capabilities notice */}
          {accountType && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> صلاحيات حسابك (يمكن تغييرها لاحقاً)
              </p>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> التبرع للحملات
                </span>
                <Switch checked={canDonate} onCheckedChange={setCanDonate} />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-green-500" /> إنشاء وإدارة الحملات
                </span>
                <Switch checked={canCreateCampaign} onCheckedChange={setCanCreateCampaign} />
              </div>
            </div>
          )}

          <Button className="w-full" disabled={!accountType} onClick={() => setStep(2)}>
            متابعة <ArrowLeft className="w-4 h-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            لديك حساب؟{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">سجّل الدخول</Link>
          </p>
        </div>
      )}

      {/* ── Step 2: Enter data ── */}
      {step === 2 && (
        <div>
          <div className="mb-6">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-3 transition-colors">
              <ArrowRight className="w-4 h-4" /> تغيير نوع الحساب
            </button>
            {selectedConfig && (
              <div className={`flex items-center gap-3 p-3 rounded-xl border mb-4 ${selectedConfig.color}`}>
                <selectedConfig.icon className={`w-5 h-5 ${selectedConfig.iconColor}`} />
                <div>
                  <span className="text-sm font-semibold">{selectedConfig.label}</span>
                  <span className="text-xs text-muted-foreground mr-2">
                    {canDonate && "• يتبرع"} {canCreateCampaign && "• ينشئ حملات"}
                  </span>
                </div>
              </div>
            )}
            <h1 className="text-2xl font-black mb-1">بياناتك الشخصية</h1>
            <p className="text-muted-foreground text-sm">أكمل تسجيلك لإنشاء حسابك على أثر</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("role")} value={accountType || "donor"} />

            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                placeholder={accountType === "organization" ? "اسم المنظمة / المؤسسة" : "اسمك الكامل"}
                {...register("full_name")}
                className={`mt-1.5 ${errors.full_name ? "border-destructive" : ""}`}
              />
              {errors.full_name && <p className="text-destructive text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <Label>البريد الإلكتروني *</Label>
              <Input type="email" placeholder="example@email.com" {...register("email")}
                className={`mt-1.5 ${errors.email ? "border-destructive" : ""}`} dir="ltr" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label>كلمة المرور *</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} placeholder="8 أحرف على الأقل"
                  {...register("password")} className={`pl-10 ${errors.password ? "border-destructive" : ""}`} dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label>تأكيد كلمة المرور *</Label>
              <div className="relative mt-1.5">
                <Input type={showConfirm ? "text" : "password"} placeholder="أعد إدخال كلمة المرور"
                  {...register("confirm_password")} className={`pl-10 ${errors.confirm_password ? "border-destructive" : ""}`} dir="ltr" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-destructive text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء الحساب"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              بالتسجيل أنت توافق على{" "}
              <Link href="/terms" className="text-primary hover:underline">الشروط والأحكام</Link>
              {" "}و{" "}
              <Link href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>
            </p>
          </form>
        </div>
      )}

      {/* ── Step 3: Email verification ── */}
      {step === 3 && (
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-black mb-3">تحقق من بريدك! 📧</h1>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            أرسلنا رابط التفعيل إلى بريدك الإلكتروني.
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            اتبع التعليمات في الرسالة لتفعيل حسابك والبدء باستخدام أثر.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400 mb-6 text-right">
            💡 لم تجد الرسالة؟ تحقق من مجلد البريد غير المرغوب (Spam)
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">العودة لتسجيل الدخول</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
