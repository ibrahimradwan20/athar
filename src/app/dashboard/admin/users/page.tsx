"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRoleLabel, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile } from "@/types";
import {
  Users, Search, Shield, CheckCircle2, Heart,
  Target, Calendar, RefreshCw, Crown, Settings,
  X, Save, Loader2, Lock, Eye, Trash2,
  UserCheck, Building2, HeartHandshake, ChevronDown, ChevronUp,
  AlertTriangle
} from "lucide-react";

interface ModeratorPermissions {
  can_approve_campaigns: boolean;
  can_reject_campaigns: boolean;
  can_delete_campaigns: boolean;
  can_view_users: boolean;
  can_verify_users: boolean;
  can_toggle_donate: boolean;
  can_toggle_create: boolean;
  notes: string;
}

const DEFAULT_PERMS: ModeratorPermissions = {
  can_approve_campaigns: false,
  can_reject_campaigns: false,
  can_delete_campaigns: false,
  can_view_users: false,
  can_verify_users: false,
  can_toggle_donate: false,
  can_toggle_create: false,
  notes: "",
};

const PERMISSION_LABELS = [
  {
    key: "can_approve_campaigns",
    label: "اعتماد الحملات",
    desc: "الموافقة على الحملات المعلقة ونشرها",
    icon: CheckCircle2,
    color: "text-green-500",
    group: "الحملات",
  },
  {
    key: "can_reject_campaigns",
    label: "رفض الحملات",
    desc: "رفض الحملات غير المناسبة",
    icon: X,
    color: "text-red-500",
    group: "الحملات",
  },
  {
    key: "can_delete_campaigns",
    label: "حذف الحملات",
    desc: "حذف الحملات نهائياً من المنصة",
    icon: Trash2,
    color: "text-red-600",
    group: "الحملات",
  },
  {
    key: "can_view_users",
    label: "عرض المستخدمين",
    desc: "رؤية قائمة المستخدمين ومعلوماتهم",
    icon: Eye,
    color: "text-blue-500",
    group: "المستخدمون",
  },
  {
    key: "can_verify_users",
    label: "توثيق الحسابات",
    desc: "منح وإلغاء علامة التوثيق للمستخدمين",
    icon: CheckCircle2,
    color: "text-blue-600",
    group: "المستخدمون",
  },
  {
    key: "can_toggle_donate",
    label: "التحكم بصلاحية التبرع",
    desc: "تفعيل أو إيقاف قدرة المستخدم على التبرع",
    icon: Heart,
    color: "text-pink-500",
    group: "المستخدمون",
  },
  {
    key: "can_toggle_create",
    label: "التحكم بإنشاء الحملات",
    desc: "السماح أو منع إنشاء حملات للمستخدم",
    icon: Target,
    color: "text-amber-500",
    group: "المستخدمون",
  },
] as const;

const ROLE_OPTIONS = [
  { value: "donor", label: "متبرع", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10" },
  { value: "organization", label: "مؤسسة", icon: Building2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/10" },
  { value: "beneficiary", label: "مستفيد", icon: HeartHandshake, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" },
  { value: "moderator", label: "مشرف", icon: Shield, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [modPerms, setModPerms] = useState<Record<string, ModeratorPermissions>>({});
  const [savingPerms, setSavingPerms] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    const profiles = (data as Profile[]) || [];
    setUsers(profiles);
    setFiltered(profiles);

    // Fetch moderator permissions for all moderators
    const mods = profiles.filter(u => u.role === "moderator");
    if (mods.length > 0) {
      const { data: permsData } = await supabase
        .from("moderator_permissions")
        .select("*")
        .in("user_id", mods.map(m => m.id));
      const permsMap: Record<string, ModeratorPermissions> = {};
      (permsData || []).forEach((p: any) => {
        permsMap[p.user_id] = {
          can_approve_campaigns: p.can_approve_campaigns,
          can_reject_campaigns: p.can_reject_campaigns,
          can_delete_campaigns: p.can_delete_campaigns,
          can_view_users: p.can_view_users,
          can_verify_users: p.can_verify_users,
          can_toggle_donate: p.can_toggle_donate,
          can_toggle_create: p.can_toggle_create,
          notes: p.notes || "",
        };
      });
      setModPerms(permsMap);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();

      if (profile?.role !== "admin") {
        toast.error("هذه الصفحة للمدير فقط");
        router.push("/dashboard");
        return;
      }
      await fetchUsers();
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter
  useEffect(() => {
    let result = users;
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, roleFilter, users]);

  // Change role — admin cannot be assigned (only you are admin)
  const updateRole = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      toast.error("لا يمكنك تغيير دورك كمدير النظام");
      return;
    }
    if (newRole === "admin") {
      toast.error("لا يمكن تعيين مدير آخر. أنت المدير الوحيد للمنصة.");
      return;
    }
    setUpdatingId(userId);

    const { error } = await supabase.from("profiles").update({
      role: newRole,
      can_create_campaign: ["organization", "beneficiary"].includes(newRole),
    }).eq("id", userId);

    if (error) {
      toast.error("حدث خطأ أثناء تحديث الدور");
    } else {
      // If promoted to moderator, create default permissions row
      if (newRole === "moderator") {
        await supabase.from("moderator_permissions").upsert({
          user_id: userId,
          granted_by: currentUserId,
          ...DEFAULT_PERMS,
        }, { onConflict: "user_id" });
        setModPerms(prev => ({ ...prev, [userId]: { ...DEFAULT_PERMS } }));
      }
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, role: newRole as any, can_create_campaign: ["organization","beneficiary"].includes(newRole) }
        : u
      ));
      toast.success(`تم تغيير الدور إلى "${getRoleLabel(newRole)}"`);
      if (newRole === "moderator") {
        setExpandedUser(userId);
        toast.info("حدد صلاحيات المشرف الآن ↓");
      }
    }
    setUpdatingId(null);
  };

  const saveModeratorPerms = async (userId: string) => {
    const perms = modPerms[userId];
    if (!perms) return;
    setSavingPerms(userId);

    const { error } = await supabase.from("moderator_permissions").upsert({
      user_id: userId,
      granted_by: currentUserId,
      ...perms,
    }, { onConflict: "user_id" });

    if (error) {
      toast.error("فشل حفظ الصلاحيات");
    } else {
      toast.success("تم حفظ صلاحيات المشرف ✓");
      setExpandedUser(null);
    }
    setSavingPerms(null);
  };

  const toggleVerified = async (userId: string, current: boolean) => {
    setUpdatingId(userId);
    const { error } = await supabase.from("profiles")
      .update({ is_verified: !current }).eq("id", userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !current } : u));
      toast.success(!current ? "✓ تم توثيق الحساب" : "تم إلغاء التوثيق");
    }
    setUpdatingId(null);
  };

  const toggleCanDonate = async (userId: string, current: boolean) => {
    setUpdatingId(userId);
    const { error } = await supabase.from("profiles")
      .update({ can_donate: !current }).eq("id", userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_donate: !current } : u));
      toast.success(!current ? "تم تفعيل التبرع" : "تم إيقاف التبرع");
    }
    setUpdatingId(null);
  };

  const toggleCanCreate = async (userId: string, current: boolean) => {
    setUpdatingId(userId);
    const { error } = await supabase.from("profiles")
      .update({ can_create_campaign: !current }).eq("id", userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_create_campaign: !current } : u));
      toast.success(!current ? "تم تفعيل إنشاء الحملات" : "تم إيقاف إنشاء الحملات");
    }
    setUpdatingId(null);
  };

  const roleCounts = {
    all: users.length,
    admin: users.filter(u => u.role === "admin").length,
    moderator: users.filter(u => u.role === "moderator").length,
    organization: users.filter(u => u.role === "organization").length,
    beneficiary: users.filter(u => u.role === "beneficiary").length,
    donor: users.filter(u => u.role === "donor").length,
  };

  const groupedPerms = {
    "الحملات": PERMISSION_LABELS.filter(p => p.group === "الحملات"),
    "المستخدمون": PERMISSION_LABELS.filter(p => p.group === "المستخدمون"),
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black">إدارة المستخدمين</h1>
            <p className="text-muted-foreground text-sm">{users.length} مستخدم • أنت المدير الوحيد</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="w-4 h-4" /> تحديث
        </Button>
      </div>

      {/* Admin notice */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-amber-800 dark:text-amber-400">أنت المدير الوحيد للمنصة</p>
          <p className="text-amber-700 dark:text-amber-500 text-xs mt-0.5">
            لا يمكن تعيين مدير آخر. يمكنك تعيين مشرفين وتحديد صلاحياتهم بدقة.
          </p>
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "الكل" },
          { key: "moderator", label: "المشرفون" },
          { key: "organization", label: "المؤسسات" },
          { key: "beneficiary", label: "المستفيدون" },
          { key: "donor", label: "المتبرعون" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              roleFilter === tab.key
                ? "bg-primary text-white border-primary shadow-sm"
                : "border-border bg-card hover:border-primary/40 text-muted-foreground"
            }`}
          >
            {tab.label}
            <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              roleFilter === tab.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {roleCounts[tab.key as keyof typeof roleCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث بالاسم أو البريد الإلكتروني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Users list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold">لا توجد نتائج</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isMod = user.role === "moderator";
            const isExpanded = expandedUser === user.id;
            const perms = modPerms[user.id] || { ...DEFAULT_PERMS };

            return (
              <div key={user.id}
                className={`bg-card rounded-2xl border transition-all ${
                  isCurrentUser ? "border-primary/40 bg-primary/3" :
                  isMod ? "border-purple-200 dark:border-purple-800" :
                  "border-border"
                }`}
              >
                {/* Main row */}
                <div className="p-4 flex flex-wrap items-center gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="w-11 h-11 border-2 border-border">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {user.full_name?.[0] || "م"}
                      </AvatarFallback>
                    </Avatar>
                    {user.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border border-card">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{user.full_name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <Crown className="w-2.5 h-2.5" /> أنت (المدير)
                        </span>
                      )}
                      {isMod && !isCurrentUser && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">
                          🛡️ مشرف
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDate(user.created_at)}
                      </span>
                      {user.city && <span className="text-[10px] text-muted-foreground">📍 {user.city}</span>}
                    </div>
                  </div>

                  {/* Role changer (not for self) */}
                  {!isCurrentUser && (
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {ROLE_OPTIONS.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => updateRole(user.id, r.value)}
                          disabled={updatingId === user.id || user.role === r.value}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            user.role === r.value
                              ? `${r.bg} ${r.color} border-current`
                              : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                          } disabled:opacity-50`}
                        >
                          {updatingId === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <r.icon className="w-3 h-3" />
                          )}
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick toggles */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Verified */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">توثيق</span>
                      <Switch
                        checked={user.is_verified}
                        onCheckedChange={() => !isCurrentUser && toggleVerified(user.id, user.is_verified)}
                        disabled={updatingId === user.id || isCurrentUser}
                        className="scale-75"
                      />
                    </div>
                    {/* Donate */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">تبرع</span>
                      <Switch
                        checked={user.can_donate ?? true}
                        onCheckedChange={() => !isCurrentUser && toggleCanDonate(user.id, user.can_donate ?? true)}
                        disabled={updatingId === user.id || isCurrentUser}
                        className="scale-75"
                      />
                    </div>
                    {/* Create */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">حملة</span>
                      <Switch
                        checked={user.can_create_campaign ?? false}
                        onCheckedChange={() => !isCurrentUser && toggleCanCreate(user.id, user.can_create_campaign ?? false)}
                        disabled={updatingId === user.id || isCurrentUser}
                        className="scale-75"
                      />
                    </div>

                    {/* Moderator permissions button */}
                    {isMod && !isCurrentUser && (
                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        صلاحياته
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Moderator Permissions Panel */}
                {isMod && isExpanded && !isCurrentUser && (
                  <div className="border-t border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/5 rounded-b-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <h3 className="font-bold text-sm text-purple-800 dark:text-purple-300">
                        صلاحيات {user.full_name} كمشرف
                      </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      {Object.entries(groupedPerms).map(([groupName, groupPerms]) => (
                        <div key={groupName} className="bg-card rounded-xl border border-border p-4">
                          <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                            {groupName}
                          </p>
                          <div className="space-y-3">
                            {groupPerms.map((perm) => (
                              <div key={perm.key} className="flex items-center justify-between gap-3">
                                <div className="flex items-start gap-2 flex-1">
                                  <perm.icon className={`w-4 h-4 ${perm.color} shrink-0 mt-0.5`} />
                                  <div>
                                    <p className="text-xs font-semibold">{perm.label}</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight">{perm.desc}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={perms[perm.key as keyof ModeratorPermissions] as boolean}
                                  onCheckedChange={(val) => {
                                    setModPerms(prev => ({
                                      ...prev,
                                      [user.id]: {
                                        ...prev[user.id] || DEFAULT_PERMS,
                                        [perm.key]: val,
                                      }
                                    }));
                                  }}
                                  className="scale-90 shrink-0"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">ملاحظات (اختياري)</label>
                      <Input
                        placeholder="مثال: مسؤول عن حملات الطوارئ فقط"
                        value={perms.notes || ""}
                        onChange={(e) => setModPerms(prev => ({
                          ...prev,
                          [user.id]: { ...prev[user.id] || DEFAULT_PERMS, notes: e.target.value }
                        }))}
                        className="text-sm"
                      />
                    </div>

                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <p className="text-xs text-muted-foreground w-full font-semibold">إعدادات سريعة:</p>
                      <button
                        onClick={() => setModPerms(prev => ({
                          ...prev,
                          [user.id]: {
                            can_approve_campaigns: true,
                            can_reject_campaigns: true,
                            can_delete_campaigns: false,
                            can_view_users: false,
                            can_verify_users: false,
                            can_toggle_donate: false,
                            can_toggle_create: false,
                            notes: perms.notes,
                          }
                        }))}
                        className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg font-semibold hover:bg-green-200 transition-colors"
                      >
                        مشرف حملات فقط
                      </button>
                      <button
                        onClick={() => setModPerms(prev => ({
                          ...prev,
                          [user.id]: {
                            can_approve_campaigns: false,
                            can_reject_campaigns: false,
                            can_delete_campaigns: false,
                            can_view_users: true,
                            can_verify_users: true,
                            can_toggle_donate: true,
                            can_toggle_create: true,
                            notes: perms.notes,
                          }
                        }))}
                        className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                      >
                        مشرف مستخدمين فقط
                      </button>
                      <button
                        onClick={() => setModPerms(prev => ({
                          ...prev,
                          [user.id]: {
                            can_approve_campaigns: true,
                            can_reject_campaigns: true,
                            can_delete_campaigns: true,
                            can_view_users: true,
                            can_verify_users: true,
                            can_toggle_donate: true,
                            can_toggle_create: true,
                            notes: perms.notes,
                          }
                        }))}
                        className="text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
                      >
                        صلاحيات كاملة
                      </button>
                      <button
                        onClick={() => setModPerms(prev => ({
                          ...prev,
                          [user.id]: { ...DEFAULT_PERMS, notes: perms.notes }
                        }))}
                        className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors"
                      >
                        إعادة تعيين
                      </button>
                    </div>

                    {/* Save */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveModeratorPerms(user.id)}
                        disabled={savingPerms === user.id}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                      >
                        {savingPerms === user.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Save className="w-4 h-4" />}
                        حفظ الصلاحيات
                      </Button>
                      <Button variant="outline" onClick={() => setExpandedUser(null)}>
                        إغلاق
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pb-4">
        {filtered.length} مستخدم • التغييرات تُطبَّق فوراً
      </p>
    </div>
  );
}
