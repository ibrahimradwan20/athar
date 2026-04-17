"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import LangToggle from "@/components/ui/lang-toggle";
import { useLang } from "@/components/providers/lang-provider";
import { Sun, Moon, Menu, X, Heart, LayoutDashboard, User, LogOut, ChevronDown } from "lucide-react";

const supabase = createClient();

export default function Navbar() {
  const { t, isRTL } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const mountedRef = useRef(true);

  // Nav links built from t() — re-renders automatically when locale changes
  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/campaigns", label: t("campaigns") },
    { href: "/about", label: t("about") },
    { href: "/donate", label: t("donate") },
  ];

  useEffect(() => {
    mountedRef.current = true;

    const loadProfile = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, is_verified")
        .eq("id", uid)
        .single();
      if (data && mountedRef.current) setProfile(data as Profile);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mountedRef.current) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mountedRef.current) return;
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    const handleScroll = () => { if (mountedRef.current) setScrolled(window.scrollY > 20); };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-dropdown]")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setProfile(null);
    setDropdownOpen(false);
    setMobileOpen(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-background/95 backdrop-blur-md shadow-md border-b border-border" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-green-400 rounded-xl flex items-center justify-center shadow group-hover:shadow-md transition-shadow">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <span className="text-xl font-black text-primary">أثر</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5 hidden sm:block">Athar</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <LangToggle />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {profile ? (
              <div className="relative" data-dropdown>
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-xs font-bold">{profile.full_name?.[0] || "م"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold max-w-[100px] truncate">{profile.full_name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className={`absolute mt-2 w-52 bg-card rounded-2xl shadow-xl border border-border py-2 z-50 animate-scale-in ${isRTL ? "left-0" : "right-0"}`}>
                    <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-primary" />{t("dashboard")}
                    </Link>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <User className="w-4 h-4 text-primary" />{t("profile")}
                    </Link>
                    <hr className="my-1 border-border" />
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                      <LogOut className="w-4 h-4" />{t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link href="/auth/login">{t("login")}</Link></Button>
                <Button size="sm" asChild><Link href="/auth/register">{t("register")}</Link></Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden w-9 h-9 rounded-xl border border-border flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-border mt-1 animate-fade-in">
            <div className="flex flex-col gap-0.5">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-border" />
              {profile ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted">
                    <LayoutDashboard className="w-4 h-4" />{t("dashboard")}
                  </Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted">
                    <User className="w-4 h-4" />{t("profile")}
                  </Link>
                  <button onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/5">
                    <LogOut className="w-4 h-4" />{t("logout")}
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4 pt-1">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href="/auth/register" onClick={() => setMobileOpen(false)}>{t("register")}</Link>
                  </Button>
                </div>
              )}
              <div className="px-4 pt-2 flex items-center gap-2">
                <LangToggle />
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted text-muted-foreground">
                  {theme === "dark" ? <><Sun className="w-4 h-4" />{isRTL ? "الوضع الفاتح" : "Light Mode"}</> : <><Moon className="w-4 h-4" />{isRTL ? "الوضع الداكن" : "Dark Mode"}</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
