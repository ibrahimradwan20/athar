import { UserPlus, Search, CreditCard, Smile } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "سجّل حسابك",
    description: "أنشئ حسابًا مجانيًا كمتبرع أو مؤسسة أو مستفيد في دقائق معدودة",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
  },
  {
    icon: Search,
    step: "02",
    title: "اختر حملتك",
    description: "تصفح المئات من الحملات الموثوقة في مختلف المجالات الإنسانية",
    color: "bg-green-50 text-green-600 dark:bg-green-900/20",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "تبرّع بأمان",
    description: "ادفع بأمان تام عبر PayPal أو USDT، وستصل تبرعاتك فوراً",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
  },
  {
    icon: Smile,
    step: "04",
    title: "تابع الأثر",
    description: "تابع تأثير تبرعك ورحلة الحملة من خلال لوحة التحكم الشخصية",
    color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-muted/40">
      <div className="container-max mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm mb-2 flex items-center justify-center gap-2">
            <span className="w-8 h-0.5 bg-primary inline-block" />
            سهل وسريع
            <span className="w-8 h-0.5 bg-primary inline-block" />
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">
            كيف تعمل <span className="text-primary">منصة أثر؟</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            أربع خطوات بسيطة تفصلك عن إحداث أثر حقيقي في حياة من يحتاجون
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-border z-0" />

          {steps.map((step, index) => (
            <div key={step.step} className="relative z-10 text-center group">
              {/* Step number */}
              <div className="relative inline-block mb-5">
                <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 duration-300 border border-border shadow-sm`}>
                  <step.icon className="w-9 h-9" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-black">{String(index + 1).padStart(2, "0")}</span>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
