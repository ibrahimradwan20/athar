"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { campaignSchema, type CampaignInput } from "@/lib/validations";
import { Loader2, Upload, X, Info } from "lucide-react";

const categories = [
  { value: "health", label: "الصحة والعلاج" },
  { value: "education", label: "التعليم" },
  { value: "food", label: "الغذاء" },
  { value: "shelter", label: "المأوى" },
  { value: "emergency", label: "الطوارئ" },
  { value: "orphans", label: "الأيتام" },
  { value: "water", label: "المياه" },
  { value: "other", label: "أخرى" },
];

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function NewCampaignPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (campaignId: string): Promise<string[]> => {
    if (!images.length) return [];
    setUploadingImages(true);
    const urls: string[] = [];

    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `${campaignId}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("campaign-images")
        .upload(path, file, { upsert: true });

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from("campaign-images").getPublicUrl(path);
        urls.push(publicUrl);
      }
    }

    setUploadingImages(false);
    return urls;
  };

  const onSubmit = async (data: CampaignInput) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
    if (!user) { toast.error("يجب تسجيل الدخول"); setLoading(false); return; }

    // Check profile role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const isBeneficiary = profile?.role === "beneficiary";

    if (isBeneficiary) {
      // Check monthly limit (2 campaigns/month)
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("campaigns")
        .select("id", { count: "exact" })
        .eq("owner_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if ((count || 0) >= 2) {
        toast.error("لا يمكنك إنشاء أكثر من حملتين في الشهر الواحد");
        setLoading(false); return;
      }
    }

    // Insert campaign first to get ID
    const { data: campaign, error } = await supabase.from("campaigns").insert({
      title: data.title,
      description: data.description,
      target_amount: data.target_amount,
      category: data.category,
      end_date: data.end_date || null,
      owner_id: user.id,
      status: isBeneficiary ? "approved" : "pending",
      is_beneficiary_campaign: isBeneficiary,
    }).select().single();

    if (error) {
      toast.error("حدث خطأ أثناء إنشاء الحملة");
      setLoading(false); return;
    }

    // Upload images
    if (images.length && campaign) {
      const imageUrls = await uploadImages(campaign.id);
      if (imageUrls.length) {
        await supabase.from("campaigns").update({ images: imageUrls }).eq("id", campaign.id);
      }
    }

    toast.success(
      isBeneficiary ? "تم نشر حملتك بنجاح!" : "تم إرسال حملتك للمراجعة. سيتم الموافقة عليها قريباً."
    );
    router.push("/dashboard/campaigns");
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">إنشاء حملة جديدة</h1>
        <p className="text-muted-foreground text-sm">أكمل النموذج لإطلاق حملتك الخيرية</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700 dark:text-amber-400">
          <p className="font-semibold mb-1">ملاحظة مهمة / Important Note</p>
          <p>حملات المؤسسات تحتاج موافقة المشرفين قبل النشر. أما حملات المستفيدين الأفراد فتُنشر فوراً بحد أقصى حملتين شهرياً.</p>
        </div>
      </div>

      {/* Commission Notice for Campaign Owners */}
      <div className="bg-orange-50 dark:bg-orange-900/15 border-2 border-orange-300 dark:border-orange-700 rounded-2xl p-4 mb-6 flex gap-3">
        <span className="text-xl shrink-0">💰</span>
        <div className="text-sm">
          <p className="font-bold text-orange-800 dark:text-orange-300 mb-1">عمولة منصة أثر للسحب: 8% — Withdrawal Commission: 8%</p>
          <p className="text-orange-700 dark:text-orange-400">🇸🇦 عند طلب سحب الأموال المجمّعة، يُخصم 8% كعمولة لمنصة أثر مقابل خدمات الموقع. ستستلم 92% من المبلغ المسحوب.</p>
          <p className="text-orange-600 dark:text-orange-500 mt-1">🇬🇧 When withdrawing collected funds, 8% is deducted as an Athar platform commission. You will receive 92% of the withdrawn amount.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">معلومات الحملة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>عنوان الحملة *</Label>
              <Input placeholder="اكتب عنواناً واضحاً ومؤثراً" {...register("title")} className="mt-1.5" />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label>وصف الحملة *</Label>
              <Textarea
                placeholder="اشرح قصة الحملة وسبب الحاجة للتمويل، كلما كان الوصف أكثر تفصيلاً كلما زادت ثقة المتبرعين..."
                {...register("description")}
                className="mt-1.5 min-h-[140px]"
                rows={6}
              />
              {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>التصنيف *</Label>
                <Select onValueChange={(v) => setValue("category", v as any)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <Label>المبلغ المستهدف ($) *</Label>
                <Input
                  type="number"
                  placeholder="مثال: 5000"
                  {...register("target_amount", { valueAsNumber: true })}
                  className="mt-1.5"
                  dir="ltr"
                  min="100"
                />
                {errors.target_amount && <p className="text-destructive text-xs mt-1">{errors.target_amount.message}</p>}
              </div>
            </div>

            <div>
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input type="date" {...register("end_date")} className="mt-1.5" dir="ltr"
                min={new Date().toISOString().split("T")[0]} />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader><CardTitle className="text-base">صور الحملة</CardTitle></CardHeader>
          <CardContent>
            <label className="block border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">اضغط لرفع الصور</p>
              <p className="text-xs text-muted-foreground">PNG, JPG حتى 5MB (أقصى 5 صور)</p>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-video">
                    <Image src={preview} alt="" className="w-full h-full object-cover"
                width={800}
                height={600}
                unoptimized/>
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 left-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-base" disabled={loading || uploadingImages}>
          {loading || uploadingImages ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {uploadingImages ? "جاري رفع الصور..." : "جاري الإنشاء..."}</>
          ) : "إطلاق الحملة"}
        </Button>
      </form>
    </div>
  );
}
