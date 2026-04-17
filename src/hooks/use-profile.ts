"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

// ✅ Use the singleton client
const supabase = createClient();

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const fetchProfile = async (uid: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .single();
        if (!error && data && mountedRef.current) {
          setProfile(data as Profile);
        }
      } finally {
        fetchingRef.current = false;
        if (mountedRef.current) setLoading(false);
      }
    };

    // ✅ Use getSession (no lock) instead of getUser
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      if (session?.user) {
        setUserId(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;
        if (session?.user) {
          setUserId(session.user.id);
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setUserId(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return { profile, userId, loading };
}

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // ✅ getSession — no lock, no network request needed
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return userId;
}
