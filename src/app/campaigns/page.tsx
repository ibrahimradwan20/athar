"use client";

import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/main-layout";
import CampaignGrid from "@/components/campaigns/campaign-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Campaign } from "@/types";
import { Search, X } from "lucide-react";

const categories = [
  { value: "all", label: "جميع التصنيفات" },
  { value: "health", label: "الصحة" },
  { value: "education", label: "التعليم" },
  { value: "food", label: "الغذاء" },
  { value: "shelter", label: "المأوى" },
  { value: "emergency", label: "الطوارئ" },
  { value: "orphans", label: "الأيتام" },
  { value: "water", label: "المياه" },
  { value: "other", label: "أخرى" },
];

const sortOptions = [
  { value: "newest", label: "الأحدث" },
  { value: "most_raised", label: "الأكثر تمويلاً" },
  { value: "nearly_complete", label: "الأقرب للاكتمال" },
  { value: "oldest", label: "الأقدم" },
];

// ✅ Singleton outside component
const supabase = createClient();

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("campaigns")
        .select("*, owner:profiles(full_name, avatar_url, is_verified)")
        .in("status", ["approved", "active"]);

      if (category !== "all") query = query.eq("category", category);
      if (search) query = query.ilike("title", `%${search}%`);

      switch (sort) {
        case "most_raised": query = query.order("raised_amount", { ascending: false }); break;
        case "oldest": query = query.order("created_at", { ascending: true }); break;
        default: query = query.order("created_at", { ascending: false });
      }

      const { data } = await query.limit(24);
      let results = (data as any[]) || [];

      if (sort === "nearly_complete") {
        results = results.sort((a, b) => {
          const aP = a.target_amount > 0 ? a.raised_amount / a.target_amount : 0;
          const bP = b.target_amount > 0 ? b.raised_amount / b.target_amount : 0;
          return bP - aP;
        });
      }
      setCampaigns(results);
    } catch (e) {
      console.error("Failed to fetch campaigns:", e);
    } finally {
      setLoading(false);
    }
  }, [category, sort, search]);

  useEffect(() => {
    const timer = setTimeout(fetchCampaigns, 300);
    return () => clearTimeout(timer);
  }, [fetchCampaigns]);

  const clearFilters = () => { setSearch(""); setCategory("all"); setSort("newest"); };
  const hasFilters = search || category !== "all" || sort !== "newest";

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-primary/5 to-transparent pt-8 pb-4">
        <div className="container-max mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black mb-3">
              حملات <span className="text-primary">التبرعات</span>
            </h1>
            <p className="text-muted-foreground">اختر الحملة التي تلامس قلبك</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 mb-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن حملة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {categories.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === c.value
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section-padding pt-6">
        <div className="container-max mx-auto">
          {!loading && (
            <p className="text-sm text-muted-foreground mb-6">
              {campaigns.length} حملة {hasFilters ? "مطابقة للبحث" : "متاحة"}
            </p>
          )}
          <CampaignGrid campaigns={campaigns} loading={loading}
            emptyMessage="لا توجد حملات تطابق معايير البحث. جرب تغيير الفلاتر." />
        </div>
      </div>
    </MainLayout>
  );
}
