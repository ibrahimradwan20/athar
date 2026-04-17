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
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

// ✅ Singleton
const supabase = createClient();

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // ✅ LOGIN (معدّل بالكامل)
  const onSubmit = async (data: LoginInput) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(
          error.message.includes("Invalid")
            ? "البريد أو كلمة المرور غير صحيحة"
            : "حدث خطأ، حاول مرة أخرى"
        );
        return;
      }

      toast.success("مرحباً بك! تم تسجيل الدخول بنجاح");

      // 🔥 مهم: تأكد من تثبيت session
      await supabase.auth.getSession();

      // 🔥 تحويل آمن
      router.replace("/dashboard");
    } catch (err) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) toast.error("فشل تسجيل الدخول بـ Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) {
      toast.error("أدخل بريدك الإلكتروني");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotEmail,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        toast.error("حدث خطأ، تحقق من البريد الإلكتروني");
      } else {
        setForgotSent(true);
        toast.success("تم إرسال رابط إعادة تعيين كلمة المرور");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-2">نسيت كلمة المرور؟</h1>
          <p className="text-muted-foreground text-sm">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {forgotSent ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📧</div>
            <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">
              تم إرسال الرابط!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-500">
              تحقق من صندوق بريدك واتبع التعليمات
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                setShowForgot(false);
                setForgotSent(false);
              }}
            >
              العودة لتسجيل الدخول
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="mt-1.5"
                dir="ltr"
              />
            </div>

            <Button
              onClick={handleForgot}
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "إرسال رابط الاستعادة"
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowForgot(false)}
            >
              العودة لتسجيل الدخول
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2">أهلاً بعودتك! 👋</h1>
        <p className="text-muted-foreground text-sm">
          سجّل دخولك للوصول إلى حسابك
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full mb-4 h-11"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span>المتابعة بحساب Google</span>
          </>
        )}
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-background px-3">
            أو سجّل بالبريد الإلكتروني
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>البريد الإلكتروني</Label>
          <Input
            type="email"
            placeholder="example@email.com"
            {...register("email")}
            className={`mt-1.5 ${
              errors.email ? "border-destructive" : ""
            }`}
            dir="ltr"
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center">
            <Label>كلمة المرور</Label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <div className="relative mt-1.5">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className={`pl-10 ${
                errors.password ? "border-destructive" : ""
              }`}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-destructive text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ليس لديك حساب؟{" "}
        <Link
          href="/auth/register"
          className="text-primary font-semibold hover:underline"
        >
          أنشئ حساباً الآن
        </Link>
      </p>
    </div>
  );
}