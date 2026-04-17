import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); return true; }
  if (limit.count >= 30) return false;
  limit.count++;
  return true;
}

const SYSTEM_PROMPT = `أنت مساعد ذكي لمنصة "أثر" للتبرعات الخيرية الفلسطينية. أجب فقط بالعربية وفقط عن المنصة. كن موجزاً.
معلومات المنصة:
- منصة أثر: تبرعات خيرية فلسطينية، USDT (TRC20) أو PayPal
- التحقق USDT: تلقائي عبر شبكة TRON - Transaction Hash
- التحقق PayPal: Transaction ID أو PayPal.me
- أنواع الحسابات: متبرع، مؤسسة، مستفيد
- السحب: من لوحة التحكم عبر USDT أو PayPal، معالجة 24-48 ساعة
- التواصل: lithi.palistin@gmail.com | +970567972555`;

const FALLBACKS: [string, string][] = [
  ["سحب", "لسحب الأموال: لوحة التحكم ← طلبات السحب، اختر USDT أو PayPal وأدخل عنوانك. تتم المعالجة خلال 24-48 ساعة."],
  ["usdt", "التبرع بـ USDT: انسخ عنوان محفظة TRC20، أرسل المبلغ، أدخل Transaction Hash للتحقق التلقائي من البلوكشين."],
  ["paypal", "التبرع بـ PayPal: استخدم رابط PayPal.me أو أرسل للبريد. احتفظ بـ Transaction ID للتأكيد."],
  ["تبرع", "اذهب لأي حملة واضغط 'تبرع الآن'، اختر USDT أو PayPal واتبع الخطوات."],
  ["حملة", "سجّل كمؤسسة أو مستفيد، ثم لوحة التحكم ← حملة جديدة. حملات المؤسسات تحتاج موافقة إدارية."],
  ["تسجيل", "اضغط 'إنشاء حساب'، اختر نوع الحساب، أكمل البيانات، وفعّل حسابك عبر البريد الإلكتروني."],
  ["مرحب", "مرحباً بك في منصة أثر! 🌿 يمكنني مساعدتك في التبرع، الحملات، والسحب. كيف أساعدك؟"],
];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) return NextResponse.json({ error: "تجاوزت الحد المسموح" }, { status: 429 });

  const { messages } = await req.json();
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (GROQ_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-8)],
          max_tokens: 400, temperature: 0.6,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ message: data.choices?.[0]?.message?.content || "عذراً، حاول مرة أخرى." });
      }
    } catch (e) { console.error("Groq:", e); }
  }

  // Smart fallback
  for (const [key, val] of FALLBACKS) {
    if (lastMsg.includes(key)) return NextResponse.json({ message: val });
  }
  return NextResponse.json({ message: "مرحباً! أنا مساعد منصة أثر 🌿 يمكنني مساعدتك في التبرع، الحملات، والسحب. ماذا تريد؟" });
}
