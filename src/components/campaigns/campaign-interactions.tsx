"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLang } from "@/components/providers/lang-provider";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Heart, Share2, MessageCircle, Lock, Unlock,
  EyeOff, Eye, Trash2, Loader2, Send,
  Copy, Twitter, Facebook
} from "lucide-react";

const supabase = createClient();

interface Comment {
  id: string;
  content: string;
  is_hidden: boolean;
  created_at: string;
  user_id: string;
  user: { full_name: string; avatar_url?: string; role: string };
}

interface Props {
  campaignId: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  commentsLocked?: boolean;
}

export default function CampaignInteractions({
  campaignId, isAdmin, isModerator, commentsLocked: initialLocked,
}: Props) {
  const { t, isRTL } = useLang();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [locked, setLocked] = useState(initialLocked ?? false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const canManage = isAdmin || isModerator;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
    fetchComments();
    fetchReactions();

    const channel = supabase.channel(`comments-${campaignId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "campaign_comments",
        filter: `campaign_id=eq.${campaignId}`
      }, () => fetchComments())
      .subscribe();

    const handleClickOutside = (e: MouseEvent) => {
      if (!shareRef.current?.contains(e.target as Node)) setShowShareMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("campaign_comments")
      .select("*, user:profiles(full_name, avatar_url, role)")
      .eq("campaign_id", campaignId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    setComments((data || []) as Comment[]);
    setLoading(false);
  };

  const fetchReactions = async () => {
    const { count } = await supabase
      .from("campaign_reactions")
      .select("id", { count: "exact" })
      .eq("campaign_id", campaignId);
    setLikeCount(count || 0);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from("campaign_reactions")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("user_id", session.user.id)
        .maybeSingle();
      setLiked(!!data);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    if (!userId) { toast.error(t("login_to_comment")); return; }
    setPosting(true);
    const { error } = await supabase.from("campaign_comments").insert({
      campaign_id: campaignId,
      user_id: userId,
      content: newComment.trim(),
    });
    if (!error) {
      setNewComment("");
      fetchComments();
    } else {
      toast.error(t("error"));
    }
    setPosting(false);
  };

  const toggleLike = async () => {
    if (!userId) { toast.error(t("login_to_comment")); return; }
    if (liked) {
      await supabase.from("campaign_reactions")
        .delete().eq("campaign_id", campaignId).eq("user_id", userId);
      setLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from("campaign_reactions")
        .insert({ campaign_id: campaignId, user_id: userId, type: "like" });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("link_copied"));
    setShowShareMenu(false);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
    setShowShareMenu(false);
  };

  const hideComment = async (id: string, currentHidden: boolean) => {
    await supabase.from("campaign_comments")
      .update({ is_hidden: !currentHidden }).eq("id", id);
    fetchComments();
    toast.success(!currentHidden ? "تم إخفاء التعليق" : "تم إظهار التعليق");
  };

  const deleteComment = async (id: string) => {
    await supabase.from("campaign_comments")
      .update({ is_deleted: true }).eq("id", id);
    fetchComments();
    toast.success("تم حذف التعليق");
  };

  const toggleCommentsLock = async () => {
    await supabase.from("campaigns")
      .update({ comments_locked: !locked }).eq("id", campaignId);
    setLocked(!locked);
    toast.success(!locked ? "تم قفل التعليقات" : "تم فتح التعليقات");
  };

  const visibleComments = comments.filter(c =>
    !c.is_hidden || canManage || c.user_id === userId
  );

  return (
    <div className="space-y-6">
      {/* ── Reactions Bar ────────────────────────────────── */}
      <div className="flex items-center gap-3 py-4 border-y border-border flex-wrap">
        {/* Like */}
        <button onClick={toggleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            liked ? "bg-red-100 text-red-600 dark:bg-red-900/20" : "bg-muted hover:bg-red-50 hover:text-red-500"
          }`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
          {t("like")}
          {likeCount > 0 && (
            <span className={`font-black min-w-[20px] text-center rounded-full text-xs px-1.5 py-0.5 ${
              liked ? "bg-red-200 text-red-700" : "bg-muted-foreground/10"
            }`}>{likeCount}</span>
          )}
        </button>

        {/* Share with dropdown */}
        <div className="relative" ref={shareRef}>
          <button onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-muted hover:bg-blue-50 hover:text-blue-600 transition-all">
            <Share2 className="w-4 h-4" />
            {t("share")}
          </button>
          {showShareMenu && (
            <div className={`absolute top-full mt-2 w-44 bg-card rounded-2xl shadow-xl border border-border py-2 z-50 animate-scale-in ${isRTL ? "right-0" : "left-0"}`}>
              <button onClick={copyLink}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                <Copy className="w-4 h-4 text-muted-foreground" /> {t("copy_link")}
              </button>
              <button onClick={shareWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                <span className="text-base">📱</span> {t("share_whatsapp")}
              </button>
              <button onClick={shareTwitter}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                <Twitter className="w-4 h-4 text-sky-500" /> {t("share_twitter")}
              </button>
              <button onClick={shareFacebook}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                <Facebook className="w-4 h-4 text-blue-600" /> {t("share_facebook")}
              </button>
            </div>
          )}
        </div>

        {/* Comment count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
          <MessageCircle className="w-4 h-4" />
          {visibleComments.length} {t("comments")}
        </div>

        {/* Admin: lock/unlock */}
        {canManage && (
          <button onClick={toggleCommentsLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              locked ? "bg-green-100 text-green-700 dark:bg-green-900/20" : "bg-amber-100 text-amber-700 dark:bg-amber-900/20"
            }`}>
            {locked
              ? <><Unlock className="w-3.5 h-3.5" />{t("unlock_comments")}</>
              : <><Lock className="w-3.5 h-3.5" />{t("lock_comments")}</>
            }
          </button>
        )}
      </div>

      {/* ── Comments Section ─────────────────────────────── */}
      <div>
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          {t("comments")}
          {locked && (
            <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> {t("comments_locked")}
            </span>
          )}
        </h3>

        {/* Comment input */}
        {!locked ? (
          userId ? (
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t("add_comment")}
                  rows={2}
                  className="resize-none"
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) postComment(); }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{t("comment_hint")}</p>
              </div>
              <Button onClick={postComment} disabled={posting || !newComment.trim()} size="icon" className="h-10 w-10 self-start">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-xl">
              {t("login_to_comment")}
            </p>
          )
        ) : !canManage ? (
          <p className="text-sm text-muted-foreground mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" /> {t("comments_locked")}
          </p>
        ) : null}

        {/* Comments list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleComments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">{t("no_comments")}</p>
        ) : (
          <div className="space-y-4">
            {visibleComments.map(comment => (
              <div key={comment.id}
                className={`flex gap-3 group ${comment.is_hidden ? "opacity-50" : ""}`}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={comment.user?.avatar_url} />
                  <AvatarFallback className="text-xs">{comment.user?.full_name?.[0] || "م"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{comment.user?.full_name || "مستخدم"}</span>
                    {comment.user?.role === "admin" && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">👑 مدير</span>
                    )}
                    {comment.is_hidden && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {t("hidden_badge")}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed bg-muted rounded-xl px-3 py-2">{comment.content}</p>
                </div>

                {/* Admin actions */}
                {canManage && (
                  <div className={`flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button
                      onClick={() => hideComment(comment.id, comment.is_hidden)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                      title={comment.is_hidden ? t("show_comment") : t("hide_comment")}>
                      {comment.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                      title={t("delete_comment")}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
