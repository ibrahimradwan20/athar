"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import type { Profile } from "@/types";
import { getRoleLabel } from "@/lib/utils";
import {
  LayoutDashboard, Heart, PlusCircle, History, Users,
  LogOut, ArrowDownToLine, Menu, X, Sun, Moon,
  Shield, User, ChevronLeft, Wallet
} from "lucide-react";
import ChatbotWidget from "@/components/chatbot/chatbot-widget";

const getNavLinks = (role: string, canCreate: boolean) => {
  const base = [
    { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم" },
    { href: "/dashboard/campaigns", icon: Heart, label: "حملاتي" },
  ];

  if (canCreate) {
    base.push({ href: "/dashboard/campaigns/new", icon: PlusCircle, label: "حملة جديدة" });
  }

  base.push({ href: "/dashboard/donations", icon: History, label: "سجل التبرعات" });
  base.push({ href: "/dashboard/withdrawals", icon: Wallet, label: "طلبات السحب" });
  base.push({ href: "/profile", icon: User, label: "الملف الشخصي" });

  if (role === "admin" || role === "moderator") {
    base.push({ href: "/dashboard/admin", icon: Shield, label: "لوحة الإدارة" });
  }
  if (role === "admin") {
    base.push({ href: "/dashboard/admin/users", icon: Users, label: "إدارة المستخدمين" });
    base.push({ href: "/dashboard/admin/withdrawals", icon: ArrowDownToLine, label: "طلبات السحب (أدمن)" });
  }

  return base;
};

// ✅ Singleton
const supabase = createClient();

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    

    // Use onAuthStateChange — avoids lock conflicts
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (!session?.user) {
          router.push("/auth/login");
          return;
        }

        // Fetch profile separately with a small delay to avoid lock conflicts
        setTimeout(async () => {
          if (!mountedRef.current) return;
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!error && data && mountedRef.current) {
            setProfile(data as Profile);
          }
          if (mountedRef.current) setLoading(false);
        }, 100);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navLinks = profile
    ? getNavLinks(profile.role, profile.can_create_campaign ?? false)
    : [];

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 right-0 bottom-0 w-64 bg-card border-l border-border z-50 flex flex-col transition-transform duration-300 shadow-xl ${
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-green-400 rounded-xl flex items-center justify-center shadow group-hover:shadow-md transition-shadow">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-black text-primary">أثر</span>
          </Link>
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile card */}
        {profile && (
          <div className="mx-3 mt-3 mb-1 p-3 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                  {profile.full_name?.[0] || "م"}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden flex-1">
                <p className="font-bold text-sm truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(profile.role)}</p>
              </div>
              {profile.is_verified && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                  ✓
                </span>
              )}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !profile && (
          <div className="mx-3 mt-3 mb-1 p-3 bg-muted rounded-2xl animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-muted-foreground/20 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                <div className="h-2.5 bg-muted-foreground/20 rounded w-1/2" />
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{link.label}</span>
                {isActive && <ChevronLeft className="w-3.5 h-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border space-y-0.5">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark"
              ? <><Sun className="w-4 h-4" />الوضع الفاتح</>
              : <><Moon className="w-4 h-4" />الوضع الداكن</>
            }
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="lg:mr-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-14 bg-card/80 backdrop-blur-sm border-b border-border flex items-center px-4 sm:px-5 gap-3 sticky top-0 z-30">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb-style title */}
          <div className="flex-1" />

          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <Heart className="w-3 h-3" />
            العودة للموقع
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
