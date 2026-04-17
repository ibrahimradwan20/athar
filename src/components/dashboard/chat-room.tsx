"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/components/providers/lang-provider";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Send, Loader2, Lock, Image as ImageIcon,
  Users, X, Megaphone, Pin, CheckCircle2,
  Play, DollarSign, ShieldCheck,
} from "lucide-react";

const supabase = createClient();

interface Message {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  sender_id: string;
  sender: { full_name: string; avatar_url?: string; role: string };
}

interface Member {
  user_id: string;
  role: string;
  user: { full_name: string; avatar_url?: string };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  media_urls: string[];
  media_types: string[];
  amount_documented: number;
  is_pinned: boolean;
  created_at: string;
  sender: { full_name: string; avatar_url?: string };
}

interface Props {
  roomId: string;
  roomName: string;
  isLocked?: boolean;
  currentUserId: string;
  isAdmin?: boolean;
  isSupervisor?: boolean;
  campaignTarget?: number;
  campaignRaised?: number;
}

export default function ChatRoom({
  roomId, roomName, isLocked, currentUserId, isAdmin, isSupervisor,
  campaignTarget, campaignRaised,
}: Props) {
  const { t } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [locked, setLocked] = useState(isLocked ?? false);
  const [activeTab, setActiveTab] = useState<"chat" | "announcements">("chat");
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annAmount, setAnnAmount] = useState("");
  const [annFiles, setAnnFiles] = useState<File[]>([]);
  const [annUploading, setAnnUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const annFileRef = useRef<HTMLInputElement>(null);

  const canModerate = isAdmin || isSupervisor;

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    fetchAnnouncements();

    const channel = supabase.channel(`chat-${roomId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        supabase.from("chat_messages")
          .select("*, sender:profiles(full_name, avatar_url, role)")
          .eq("id", payload.new.id).single()
          .then(({ data }) => { if (data) setMessages(prev => [...prev, data as Message]); });
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "campaign_announcements",
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        supabase.from("campaign_announcements")
          .select("*, sender:profiles(full_name, avatar_url)")
          .eq("id", payload.new.id).single()
          .then(({ data }) => { if (data) setAnnouncements(prev => [data as Announcement, ...prev]); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (activeTab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const fetchMessages = async () => {
    const { data } = await supabase.from("chat_messages")
      .select("*, sender:profiles(full_name, avatar_url, role)")
      .eq("room_id", roomId).eq("is_deleted", false)
      .order("created_at", { ascending: true }).limit(100);
    setMessages((data || []) as unknown as Message[]);
  };

  const fetchMembers = async () => {
    const { data } = await supabase.from("chat_members")
      .select("user_id, role, user:profiles(full_name, avatar_url)").eq("room_id", roomId);
    setMembers((data || []) as unknown as Member[]);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("campaign_announcements")
      .select("*, sender:profiles(full_name, avatar_url)").eq("room_id", roomId)
      .order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
    setAnnouncements((data || []) as unknown as Announcement[]);
  };

  const sendMessage = async () => {
    if (!text.trim() || locked) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId, sender_id: currentUserId, content: text.trim(),
    });
    if (!error) setText(""); else toast.error(t("error"));
    setSending(false);
  };

  const uploadMedia = async (file: File) => {
    if (locked) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${roomId}/${Date.now()}.${ext}`;
    const isVideo = file.type.startsWith("video/");
    const { error: uploadErr } = await supabase.storage.from("chat-media").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error("فشل رفع الملف"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);
    await supabase.from("chat_messages").insert({
      room_id: roomId, sender_id: currentUserId, content: null,
      media_url: publicUrl, media_type: isVideo ? "video" : "image",
    });
    setUploading(false);
  };

  const submitAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim()) return;
    setAnnUploading(true);
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];
    for (const file of annFiles) {
      const ext = file.name.split(".").pop();
      const path = `${roomId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const isVideo = file.type.startsWith("video/");
      const { error } = await supabase.storage.from("announcement-media").upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("announcement-media").getPublicUrl(path);
        mediaUrls.push(publicUrl);
        mediaTypes.push(isVideo ? "video" : "image");
      }
    }
    const { error } = await supabase.from("campaign_announcements").insert({
      room_id: roomId, sender_id: currentUserId,
      title: annTitle.trim(), content: annContent.trim(),
      media_urls: mediaUrls, media_types: mediaTypes,
      amount_documented: parseFloat(annAmount) || 0,
    });
    if (!error) {
      toast.success("تم نشر التوثيق بنجاح ✅");
      setAnnTitle(""); setAnnContent(""); setAnnAmount(""); setAnnFiles([]);
      setShowAnnForm(false);
    } else { toast.error("حدث خطأ أثناء النشر"); }
    setAnnUploading(false);
  };

  const toggleLock = async () => {
    await supabase.from("chat_rooms").update({ is_locked: !locked }).eq("id", roomId);
    setLocked(!locked);
    toast.success(!locked ? "تم قفل الدردشة" : "تم فتح الدردشة");
  };

  const togglePin = async (annId: string, current: boolean) => {
    await supabase.from("campaign_announcements").update({ is_pinned: !current }).eq("id", annId);
    setAnnouncements(prev => prev.map(a => a.id === annId ? { ...a, is_pinned: !current } : a));
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from("chat_messages").update({ is_deleted: true }).eq("id", msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const progress = campaignTarget && campaignRaised
    ? Math.min(100, Math.round((campaignRaised / campaignTarget) * 100)) : null;

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{roomName}</h3>
          <p className="text-xs text-muted-foreground">{members.length} {t("members")}</p>
        </div>
        {progress !== null && (
          <div className="hidden sm:flex items-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-xl px-3 py-1.5">
            <DollarSign className="w-3.5 h-3.5 text-green-600" />
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1.5 bg-green-100 dark:bg-green-900 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] font-bold text-green-700 dark:text-green-400">{progress}%</span>
              </div>
              <p className="text-[10px] text-green-600">{formatCurrency(campaignRaised!)} / {formatCurrency(campaignTarget!)}</p>
            </div>
          </div>
        )}
        {locked && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" />{t("chat_locked")}
          </span>
        )}
        <button onClick={() => setShowMembers(!showMembers)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <Users className="w-4 h-4 text-muted-foreground" />
        </button>
        {canModerate && (
          <button onClick={toggleLock}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${locked ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"}`}>
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/30">
        <button onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === "chat" ? "text-primary border-b-2 border-primary bg-card" : "text-muted-foreground hover:text-foreground"}`}>
          💬 الرسائل
        </button>
        <button onClick={() => setActiveTab("announcements")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${activeTab === "announcements" ? "text-primary border-b-2 border-primary bg-card" : "text-muted-foreground hover:text-foreground"}`}>
          <Megaphone className="w-3 h-3" />
          توثيق الحملة
          {announcements.length > 0 && (
            <span className="bg-primary text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{announcements.length}</span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <p className="text-3xl mb-2">💬</p><p>{t("no_messages")}</p>
                </div>
              ) : messages.map(msg => {
                const mine = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex gap-2 group ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine && (
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url} />
                        <AvatarFallback className="text-[10px]">{msg.sender?.full_name?.[0] || "م"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {!mine && (
                        <span className="text-[10px] text-muted-foreground px-1">
                          {msg.sender?.full_name}
                          {msg.sender?.role === "admin" && <span className="text-primary mr-1">👑</span>}
                          {msg.sender?.role === "moderator" && <ShieldCheck className="w-3 h-3 inline text-blue-500 mr-1" />}
                        </span>
                      )}
                      <div className={`rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-white rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                        {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                        {msg.media_url && msg.media_type === "image" && <Image src={msg.media_url} alt="" className="max-w-full rounded-xl max-h-64 object-cover"
                width={800}
                height={600}
                unoptimized/>}
                        {msg.media_url && msg.media_type === "video" && <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-48" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {new Date(msg.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {(canModerate || mine) && (
                      <button onClick={() => deleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-muted flex items-center justify-center self-center transition-opacity">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {!locked ? (
              <div className="p-3 border-t border-border flex gap-2">
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f); e.target.value = ""; }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                </button>
                <Input value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={t("send_message")} className="flex-1 h-9" disabled={sending} />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage} disabled={sending || !text.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <div className="p-3 border-t border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" /> {t("chat_locked")}
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === "announcements" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {canModerate && (
              <div className="p-3 border-b border-border">
                {!showAnnForm ? (
                  <button onClick={() => setShowAnnForm(true)}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                    <Megaphone className="w-4 h-4" /> نشر توثيق جديد للحملة
                  </button>
                ) : (
                  <div className="space-y-3 bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4" /> توثيق جديد
                      </p>
                      <button onClick={() => setShowAnnForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                    <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                      placeholder="عنوان التوثيق (مثال: تم شراء 50 خيمة)" className="text-sm" />
                    <Textarea value={annContent} onChange={e => setAnnContent(e.target.value)}
                      placeholder="تفاصيل التوثيق..." rows={3} className="text-sm resize-none" />
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input value={annAmount} onChange={e => setAnnAmount(e.target.value)}
                          placeholder="المبلغ الموثق ($)" type="number" className="text-sm pr-8" />
                      </div>
                      <input ref={annFileRef} type="file" accept="image/*,video/*" multiple className="hidden"
                        onChange={e => setAnnFiles(Array.from(e.target.files || []))} />
                      <button onClick={() => annFileRef.current?.click()}
                        className="px-3 h-9 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {annFiles.length > 0 ? `${annFiles.length} ملف` : "إرفاق"}
                      </button>
                    </div>
                    {annFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {annFiles.map((f, i) => (
                          <span key={i} className="text-[10px] bg-muted rounded px-2 py-1 flex items-center gap-1">
                            {f.type.startsWith("video") ? <Play className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                            {f.name.slice(0, 15)}
                            <button onClick={() => setAnnFiles(prev => prev.filter((_, j) => j !== i))}><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <Button onClick={submitAnnouncement} disabled={annUploading || !annTitle.trim() || !annContent.trim()} className="w-full h-9 text-sm">
                      {annUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> جاري الرفع...</> : "نشر التوثيق ✅"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا يوجد توثيق بعد</p>
                  <p className="text-xs mt-1 opacity-70">سينشر المدير هنا تفاصيل إنفاق التبرعات</p>
                </div>
              ) : announcements.map(ann => (
                <div key={ann.id} className={`rounded-2xl border overflow-hidden ${ann.is_pinned ? "border-primary/40" : "border-border"}`}>
                  {ann.is_pinned && (
                    <div className="px-4 py-1.5 bg-primary/10 flex items-center gap-1.5">
                      <Pin className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-primary">مثبّت</span>
                    </div>
                  )}
                  <div className="p-4 bg-card">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={ann.sender?.avatar_url} />
                          <AvatarFallback className="text-[10px]">{ann.sender?.full_name?.[0] || "م"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold flex items-center gap-1">
                            {ann.sender?.full_name}
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(ann.created_at).toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => togglePin(ann.id, ann.is_pinned)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${ann.is_pinned ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}>
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h4 className="font-bold text-sm mb-1.5">{ann.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{ann.content}</p>
                    {ann.amount_documented > 0 && (
                      <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 rounded-xl px-3 py-2 mb-3">
                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-bold text-green-700 dark:text-green-400">
                          تم توثيق إنفاق: {formatCurrency(ann.amount_documented)}
                        </span>
                      </div>
                    )}
                    {ann.media_urls && ann.media_urls.length > 0 && (
                      <div className={`grid gap-2 ${ann.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {ann.media_urls.map((url, i) => (
                          ann.media_types?.[i] === "video" ? (
                            <video key={i} src={url} controls className="w-full rounded-xl max-h-52 object-cover bg-black" />
                          ) : (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <Image src={url} alt="" className="w-full rounded-xl object-cover max-h-52 hover:opacity-90 transition-opacity cursor-zoom-in"
                width={800}
                height={600}
                unoptimized/>
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members sidebar */}
        {showMembers && (
          <div className="w-52 border-r border-border bg-muted/30 overflow-y-auto">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground">{t("members")} ({members.length})</p>
            </div>
            <div className="p-2 space-y-1">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarFallback className="text-[10px]">{m.user?.full_name?.[0] || "م"}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate flex-1">{m.user?.full_name}</span>
                  {m.role === "admin" && <span className="text-primary text-[10px]">👑</span>}
                  {m.role === "moderator" && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
