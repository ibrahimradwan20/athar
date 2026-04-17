"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "مرحباً بك في منصة أثر! 👋\n\nأنا مساعدك الذكي. يمكنني مساعدتك في:\n• كيفية التبرع\n• إنشاء حملة\n• معلومات عن المنصة\n• أي سؤال آخر!\n\nكيف يمكنني مساعدتك؟",
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!res.ok) throw new Error("فشل الاتصال");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-destructive hover:bg-destructive/90 rotate-90"
            : "bg-primary hover:bg-primary/90 animate-float"
        }`}
        aria-label="فتح المساعد الذكي"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-athar-green to-athar-green-light p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">مساعد أثر الذكي</p>
                <p className="text-xs text-white/70">متاح الآن للمساعدة</p>
              </div>
              <div className="mr-auto w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-muted text-foreground rounded-tr-sm"
                      : "bg-primary text-white rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-primary/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {["كيف أتبرع؟", "كيف أنشئ حملة؟", "هل المنصة موثوقة؟"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="اكتب سؤالك..."
              className="flex-1 h-9 text-sm rounded-xl"
              disabled={loading}
            />
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
