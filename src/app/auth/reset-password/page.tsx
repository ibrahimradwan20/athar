"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validations";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import type { z } from "zod";

type ResetInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<ResetInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetInput) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      toast.error("حدث خطأ أثناء تحديث كلمة المرور");
    } else {
      toast.success("تم تغيير كلمة المرور بنجاح!");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-black mb-2">تعيين كلمة مرور جديدة</h1>
      <p className="text-muted-foreground text-sm mb-8">اختر كلمة مرور قوية وآمنة</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>كلمة المرور الجديدة</Label>
          <div className="relative mt-1.5">
            <Input type={showPassword ? "text" : "password"} placeholder="••••••••"
              {...register("password")} className="pl-10" dir="ltr" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <Label>تأكيد كلمة المرور</Label>
          <div className="relative mt-1.5">
            <Input type={showConfirm ? "text" : "password"} placeholder="••••••••"
              {...register("confirm_password")} className="pl-10" dir="ltr" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-destructive text-xs mt-1">{errors.confirm_password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ كلمة المرور الجديدة"}
        </Button>
      </form>
    </div>
  );
}
