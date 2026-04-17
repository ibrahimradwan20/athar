"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useLang } from "@/components/providers/lang-provider";
import ChatRoom from "@/components/dashboard/chat-room";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MessageCircle, Users, Lock, ShieldCheck, Plus,
  X, Search, UserPlus, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";

const supabase = createClient();

interface Room {
  id: string;
  name: string;
  type: string;
  is_locked: boolean;
  campaign?: { title: string; raised_amount: number; target_amount: number };
}

interface Supervisor {
  supervisor_id: string;
  can_send: boolean;
  can_moderate: boolean;
  supervisor: { full_name: string; avatar_url?: string; email: string };
}

interface ModeratorUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

export default function ChatsPage() {
  const { profile } = useProfile();
  const { t } = useLang();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  // Admin: supervisor management
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [moderators, setModerators] = useState<ModeratorUser[]>([]);
  const [showSupervisorPanel, setShowSupervisorPanel] = useState(false);
  const [modSearch, setModSearch] = useState("");
  const [addingMod, setAddingMod] = useState<string | null>(null);
  // Supervisor check
  const [supervisorRoomIds, setSupervisorRoomIds] = useState<string[]>([]);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      // Load rooms user is a member of
      const { data: memberData } = await supabase
        .from("chat_members")
        .select("room:chat_rooms(id, name, type, is_locked, campaign:campaigns(title, raised_amount, target_amount))")
        .eq("user_id", profile.id);

      // Load rooms where user is supervisor
      const { data: supervisorData } = await supabase
        .from("room_supervisors")
        .select("room_id, room:chat_rooms(id, name, type, is_locked, campaign:campaigns(title, raised_amount, target_amount))")
        .eq("supervisor_id", profile.id)
        .eq("can_send", true);

      const memberRooms = (memberData || []).map((d: any) => d.room).filter(Boolean) as Room[];
      const supRooms = (supervisorData || []).map((d: any) => d.room).filter(Boolean) as Room[];
      const supRoomIds = (supervisorData || []).map((d: any) => d.room_id as string);

      // Merge without duplicates
      const allRoomsMap = new Map<string, Room>();
      [...memberRooms, ...supRooms].forEach(r => allRoomsMap.set(r.id, r));
      const roomList = Array.from(allRoomsMap.values());

      setSupervisorRoomIds(supRoomIds);
      setRooms(roomList);
      if (roomList.length > 0) setActiveRoom(roomList[0]);
      setLoading(false);

      // Admin: load moderators
      if (isAdmin) {
        const { data: mods } = await supabase.from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .in("role", ["moderator", "admin"])
          .neq("id", profile.id);
        setModerators((mods || []) as ModeratorUser[]);
      }
    };
    load();
  }, [profile?.id, isAdmin]);

  const loadSupervisors = async (roomId: string) => {
    const { data } = await supabase.from("room_supervisors")
      .select("supervisor_id, can_send, can_moderate, supervisor:profiles(full_name, avatar_url, email)")
      .eq("room_id", roomId);
    setSupervisors((data || []) as unknown as Supervisor[]);
  };

  const openSupervisorPanel = async (room: Room) => {
    setActiveRoom(room);
    setShowSupervisorPanel(true);
    await loadSupervisors(room.id);
  };

  const addSupervisor = async (modId: string) => {
    if (!activeRoom) return;
    setAddingMod(modId);
    const { error } = await supabase.from("room_supervisors").insert({
      room_id: activeRoom.id,
      supervisor_id: modId,
      granted_by: profile!.id,
      can_send: true,
      can_moderate: false,
    });
    if (!error) {
      toast.success("تم إضافة المشرف للقروب ✅");
      await loadSupervisors(activeRoom.id);
    } else {
      toast.error("حدث خطأ");
    }
    setAddingMod(null);
  };

  const removeSupervisor = async (supId: string) => {
    if (!activeRoom) return;
    await supabase.from("room_supervisors")
      .delete().eq("room_id", activeRoom.id).eq("supervisor_id", supId);
    setSupervisors(prev => prev.filter(s => s.supervisor_id !== supId));
    toast.success("تم إزالة المشرف");
  };

  const isSupervisor = (roomId: string) => supervisorRoomIds.includes(roomId);

  const filteredMods = moderators.filter(m =>
    m.full_name.toLowerCase().includes(modSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(modSearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-muted-foreground">
        <MessageCircle className="w-10 h-10 mx-auto mb-2 animate-pulse" />
        <p>{t("loading")}</p>
      </div>
    </div>
  );

  if (rooms.length === 0) return (
    <div className="text-center py-16 bg-card rounded-2xl border border-border animate-fade-in">
      <MessageCircle className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-bold mb-2">{t("my_chats")}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t("no_chats")}</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1">{t("my_chats")}</h1>
          <p className="text-muted-foreground text-sm">{rooms.length} محادثة نشطة</p>
        </div>
        {isAdmin && activeRoom && (
          <Button onClick={() => openSupervisorPanel(activeRoom)} variant="outline" size="sm"
            className="flex items-center gap-2 text-xs h-8">
            <ShieldCheck className="w-3.5 h-3.5" />
            إدارة المشرفين
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 h-[660px]">
        {/* Room list */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <p className="font-semibold text-sm text-muted-foreground">المجموعات ({rooms.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.map(room => (
              <div key={room.id} className="relative group">
                <button onClick={() => { setActiveRoom(room); setShowSupervisorPanel(false); }}
                  className={`w-full text-right p-4 border-b border-border transition-colors flex items-start gap-3 ${
                    activeRoom?.id === room.id && !showSupervisorPanel ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted"
                  }`}>
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    {room.is_locked ? <Lock className="w-4 h-4 text-amber-500" /> : <Users className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{room.name}</p>
                    {room.campaign && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(room.campaign.raised_amount)} من {formatCurrency(room.campaign.target_amount)}
                      </p>
                    )}
                    {isSupervisor(room.id) && !isAdmin && (
                      <span className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> مشرف
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                </button>
                {/* Admin: manage supervisors button */}
                {isAdmin && (
                  <button onClick={() => openSupervisorPanel(room)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-all">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main area: chat or supervisor panel */}
        <div className="lg:col-span-2">
          {showSupervisorPanel && activeRoom && isAdmin ? (
            /* Supervisor Management Panel */
            <div className="h-full bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">إدارة مشرفي القروب</h3>
                  <p className="text-xs text-muted-foreground truncate">{activeRoom.name}</p>
                </div>
                <button onClick={() => setShowSupervisorPanel(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Current supervisors */}
                <div className="w-1/2 border-l border-border flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-bold text-muted-foreground">المشرفون الحاليون ({supervisors.length})</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {supervisors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">لا يوجد مشرفون بعد</p>
                      </div>
                    ) : supervisors.map(s => (
                      <div key={s.supervisor_id} className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={s.supervisor?.avatar_url} />
                          <AvatarFallback className="text-xs">{s.supervisor?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{s.supervisor?.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{s.supervisor?.email}</p>
                        </div>
                        <button onClick={() => removeSupervisor(s.supervisor_id)}
                          className="w-6 h-6 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add supervisors */}
                <div className="w-1/2 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-bold text-muted-foreground mb-2">إضافة مشرف</p>
                    <div className="relative">
                      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input value={modSearch} onChange={e => setModSearch(e.target.value)}
                        placeholder="بحث عن مشرف..." className="h-8 text-xs pr-8" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredMods.map(mod => {
                      const alreadyAdded = supervisors.some(s => s.supervisor_id === mod.id);
                      return (
                        <div key={mod.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={mod.avatar_url} />
                            <AvatarFallback className="text-xs">{mod.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{mod.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{mod.role === "admin" ? "مدير" : "مشرف"}</p>
                          </div>
                          {alreadyAdded ? (
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> مضاف
                            </span>
                          ) : (
                            <button onClick={() => addSupervisor(mod.id)} disabled={!!addingMod}
                              className="w-7 h-7 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center justify-center transition-colors">
                              {addingMod === mod.id ? <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border">
                <Button onClick={() => setShowSupervisorPanel(false)} variant="outline" size="sm" className="w-full text-xs h-8">
                  العودة للدردشة
                </Button>
              </div>
            </div>
          ) : activeRoom && profile ? (
            <ChatRoom
              roomId={activeRoom.id}
              roomName={activeRoom.name}
              isLocked={activeRoom.is_locked}
              currentUserId={profile.id}
              isAdmin={isAdmin}
              isSupervisor={isSupervisor(activeRoom.id)}
              campaignTarget={activeRoom.campaign?.target_amount}
              campaignRaised={activeRoom.campaign?.raised_amount}
            />
          ) : (
            <div className="h-full bg-card rounded-2xl border border-border flex items-center justify-center text-muted-foreground">
              اختر محادثة للبدء
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
