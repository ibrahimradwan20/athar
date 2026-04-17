"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { getRoleLabel, formatDate, formatCurrency } from "@/lib/utils";
import type { Profile, Campaign, Donation } from "@/types";
import {
  Camera, Loader2, Save, User, MapPin, Phone, Calendar,
  Shield, Globe, Facebook, Twitter, Instagram, Heart, Target,
  Briefcase, Edit3, Check, TrendingUp, Clock, ImageIcon
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import CampaignCard from "@/components/campaigns/campaign-card";
import Link from "next/link";

// ✅ Singleton - prevents lock conflicts
const supabase = createClient();

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [canDonate, setCanDonate] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
      if (!user) return;

      const [profileRes, campaignsRes, donationsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("campaigns")
          .select("*, owner:profiles(full_name,avatar_url,is_verified)")
          .eq("owner_id", user.id).order("created_at", { ascending: false }),
        supabase.from("donations")
          .select("*, campaign:campaigns(title,images)")
          .eq("donor_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (profileRes.data) {
        const p = profileRes.data as Profile;
        setProfile(p);
        setCanDonate(p.can_donate ?? true);
        setCanCreate(p.can_create_campaign ?? false);
        reset({
          full_name: p.full_name,
          bio: p.bio || "",
          address: p.address || "",
          city: p.city || "",
          country: p.country || "فلسطين",
          phone: p.phone || "",
          website: p.website || "",
          facebook: p.facebook || "",
          twitter: p.twitter || "",
          instagram: p.instagram || "",
          occupation: p.occupation || "",
          gender: p.gender,
          date_of_birth: p.date_of_birth || "",
        });
      }
      setMyCampaigns((campaignsRes.data as any[]) || []);
      setMyDonations((donationsRes.data as any[]) || []);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: ProfileInput) => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
    if (!user) return;

    const { error } = await supabase.from("profiles").update({
      ...data,
      can_donate: canDonate,
      can_create_campaign: canCreate,
      website: data.website || null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    if (error) {
      toast.error("خطأ في الحفظ: " + error.message);
    } else {
      toast.success("✅ تم حفظ الملف الشخصي");
      setProfile(prev => prev ? { ...prev, ...data, can_donate: canDonate, can_create_campaign: canCreate } : null);
      setEditMode(false);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

    const { url, error } = await uploadImage(file, "avatars", path);

    if (error) {
      toast.error(error);
    } else if (url) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
      setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
      toast.success("✅ تم تحديث الصورة الشخصية");
    }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingCover(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/cover-${Date.now()}.${ext}`;

    const { url, error } = await uploadImage(file, "avatars", path);

    if (error) {
      toast.error(error);
    } else if (url) {
      await supabase.from("profiles").update({ cover_url: url }).eq("id", profile.id);
      setProfile(prev => prev ? { ...prev, cover_url: url } : null);
      toast.success("✅ تم تحديث صورة الغلاف");
    }
    setUploadingCover(false);
    e.target.value = "";
  };

  const totalRaised = myCampaigns.reduce((s, c) => s + Number(c.raised_amount), 0);
  const completedDonations = myDonations.filter(d => d.status === "completed");
  const totalDonated = completedDonations.reduce((s, d) => s + Number(d.amount), 0);

  if (loading) return (
    <MainLayout>
      <div className="container-max mx-auto px-4 py-8 max-w-4xl space-y-4">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="container-max mx-auto px-4 sm:px-6 py-8 max-w-4xl animate-fade-in">

        {/* ── Cover + Avatar header ── */}
        <div className="rounded-3xl overflow-hidden border border-border shadow-md mb-6 bg-card">
          {/* Cover */}
          <div className="relative h-44 sm:h-52 group cursor-pointer">
            {profile?.cover_url ? (
              <Image src={profile.cover_url} alt="غلاف" className="w-full h-full object-cover" width={400} height={400} unoptimized />
            ) : (
              <div className="w-full h-full hero-gradient pattern-bg" />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <label className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl cursor-pointer font-semibold hover:bg-white/30 transition-colors">
                {uploadingCover
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ImageIcon className="w-4 h-4" />}
                {uploadingCover ? "جاري الرفع..." : "تغيير صورة الغلاف"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
              </label>
            </div>
          </div>

          {/* Avatar + info */}
          <div className="px-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14 mb-4">
              {/* Avatar */}
              <div className="relative w-fit group">
                <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-card shadow-xl">
                  <AvatarImage src={profile?.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-primary to-green-400 text-white">
                    {profile?.full_name?.[0] || "م"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  {uploadingAvatar
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <Camera className="w-6 h-6 text-white" />}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
                {uploadingAvatar && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Name + badges */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black">{profile?.full_name}</h1>
                  {profile?.is_verified && (
                    <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      <Check className="w-3 h-3" /> موثّق
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-2">{profile?.email}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge>{getRoleLabel(profile?.role || "")}</Badge>
                  {profile?.can_donate && <Badge variant="success">❤ يتبرع</Badge>}
                  {profile?.can_create_campaign && <Badge variant="gold">✦ ينشر حملات</Badge>}
                  {profile?.occupation && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />{profile.occupation}
                    </Badge>
                  )}
                </div>
              </div>

              <Button size="sm" onClick={() => setEditMode(!editMode)} className="gap-2 shrink-0">
                <Edit3 className="w-4 h-4" />
                {editMode ? "إلغاء" : "تعديل"}
              </Button>
            </div>

            {/* Bio & quick info */}
            {profile?.bio && !editMode && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-3 max-w-2xl">{profile.bio}</p>
            )}

            {!editMode && (
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                {(profile?.city || profile?.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {[profile.city, profile.country].filter(Boolean).join("، ")}
                  </span>
                )}
                {profile?.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    {profile.phone}
                  </a>
                )}
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Globe className="w-3.5 h-3.5 text-primary" />موقع إلكتروني
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  عضو منذ {profile?.created_at ? formatDate(profile.created_at) : "—"}
                </span>
              </div>
            )}

            {/* Social links */}
            {!editMode && (profile?.facebook || profile?.twitter || profile?.instagram) && (
              <div className="flex gap-2 mt-3">
                {profile.facebook && (
                  <a href={`https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-sky-100 dark:bg-sky-900/20 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    <Twitter className="w-4 h-4 text-sky-500" />
                  </a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-pink-100 dark:bg-pink-900/20 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    <Instagram className="w-4 h-4 text-pink-500" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Heart, label: "إجمالي تبرعاتي", value: formatCurrency(totalDonated), color: "text-red-500 bg-red-50 dark:bg-red-900/10" },
            { icon: TrendingUp, label: "حملاتي النشطة", value: myCampaigns.filter(c => ["approved","active"].includes(c.status)).length, color: "text-green-500 bg-green-50 dark:bg-green-900/10" },
            { icon: Target, label: "جُمع لحملاتي", value: formatCurrency(totalRaised), color: "text-blue-500 bg-blue-50 dark:bg-blue-900/10" },
            { icon: Clock, label: "عدد التبرعات", value: completedDonations.length, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/10" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center card-hover">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="campaigns">
          <TabsList className="mb-5 w-full sm:w-auto">
            <TabsTrigger value="campaigns" onClick={() => setEditMode(false)}>حملاتي ({myCampaigns.length})</TabsTrigger>
            <TabsTrigger value="donations" onClick={() => setEditMode(false)}>تبرعاتي ({myDonations.length})</TabsTrigger>
            <TabsTrigger value="edit" onClick={() => setEditMode(true)}>تعديل الملف</TabsTrigger>
          </TabsList>

          {/* Campaigns */}
          <TabsContent value="campaigns">
            {myCampaigns.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold mb-2">لا توجد حملات بعد</h3>
                {profile?.can_create_campaign && (
                  <Button asChild className="mt-4"><Link href="/dashboard/campaigns/new">أنشئ حملة</Link></Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCampaigns.map(c => <CampaignCard key={c.id} campaign={c} compact />)}
              </div>
            )}
          </TabsContent>

          {/* Donations */}
          <TabsContent value="donations">
            {myDonations.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold mb-2">لم تتبرع بعد</h3>
                <Button asChild className="mt-4"><Link href="/campaigns">تصفح الحملات</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myDonations.map((d: any) => (
                  <div key={d.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 card-hover">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                      {d.campaign?.images?.[0]
                        ? <Image src={d.campaign.images[0]} alt="" className="w-full h-full object-cover"
                width={800}
                height={600}
                unoptimized/>
                        : <div className="w-full h-full flex items-center justify-center"><Heart className="w-5 h-5 text-muted-foreground" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{d.campaign?.title || "حملة"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-black text-primary">{formatCurrency(d.amount)}</p>
                      <Badge variant={d.status === "completed" ? "success" : d.status === "pending" ? "warning" : "destructive"} className="text-xs">
                        {d.status === "completed" ? "مكتمل" : d.status === "pending" ? "معلق" : "فشل"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Edit form */}
          <TabsContent value="edit">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Capabilities */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />صلاحيات حسابي</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "التبرع للحملات", desc: "أقدر أتبرع لأي حملة على المنصة", value: canDonate, set: setCanDonate },
                    { label: "إنشاء الحملات", desc: "أقدر أطلق حملات جمع تبرعات", value: canCreate, set: setCanCreate },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                      <div>
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch checked={item.value} onCheckedChange={item.set} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Basic info */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" />المعلومات الأساسية</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>الاسم الكامل *</Label>
                    <Input {...register("full_name")} className="mt-1.5" />
                    {errors.full_name && <p className="text-destructive text-xs mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <Label>المهنة</Label>
                    <Input {...register("occupation")} placeholder="طالب، مهندس، طبيب..." className="mt-1.5" />
                  </div>
                  <div>
                    <Label>الجنس</Label>
                    <Select defaultValue={profile?.gender} onValueChange={v => setValue("gender", v as any)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                        <SelectItem value="prefer_not_to_say">أفضّل عدم الذكر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>تاريخ الميلاد</Label>
                    <Input type="date" {...register("date_of_birth")} className="mt-1.5" dir="ltr" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />الهاتف</Label>
                    <Input {...register("phone")} placeholder="+970567972555" className="mt-1.5" dir="ltr" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>نبذة شخصية</Label>
                    <Textarea {...register("bio")} placeholder="اكتب نبذة عن نفسك..." className="mt-1.5" rows={3} />
                    {errors.bio && <p className="text-destructive text-xs mt-1">{errors.bio.message}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />الموقع</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>المدينة</Label>
                    <Input {...register("city")} placeholder="غزة، رام الله..." className="mt-1.5" />
                  </div>
                  <div>
                    <Label>الدولة</Label>
                    <Input {...register("country")} placeholder="فلسطين" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>العنوان</Label>
                    <Input {...register("address")} placeholder="الحي، الشارع..." className="mt-1.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Social */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />التواصل الاجتماعي</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />الموقع الإلكتروني</Label>
                    <Input {...register("website")} placeholder="https://..." className="mt-1.5" dir="ltr" />
                    {errors.website && <p className="text-destructive text-xs mt-1">{errors.website.message}</p>}
                  </div>
                  {[
                    { name: "facebook" as const, icon: Facebook, color: "text-blue-600", prefix: "fb.com/" },
                    { name: "twitter" as const, icon: Twitter, color: "text-sky-500", prefix: "@" },
                    { name: "instagram" as const, icon: Instagram, color: "text-pink-500", prefix: "@" },
                  ].map(s => (
                    <div key={s.name}>
                      <Label className={`flex items-center gap-1.5 ${s.color}`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
                      </Label>
                      <div className="flex mt-1.5">
                        <span className="flex items-center px-3 bg-muted border border-l-0 border-input rounded-r-xl text-xs text-muted-foreground">{s.prefix}</span>
                        <Input {...register(s.name)} placeholder="username" className="rounded-r-none" dir="ltr" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />حفظ التغييرات</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditMode(false)}>إلغاء</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
