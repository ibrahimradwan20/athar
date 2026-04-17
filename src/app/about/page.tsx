import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Target, Eye, Shield, Users, Award } from "lucide-react";

const teamMembers = [
  { name: "أحمد العلي", role: "المدير التنفيذي", emoji: "👨‍💼" },
  { name: "فاطمة الزهراء", role: "مديرة العمليات", emoji: "👩‍💼" },
  { name: "محمد الصالح", role: "مدير التقنية", emoji: "👨‍💻" },
  { name: "نورة السعد", role: "مديرة الشراكات", emoji: "👩‍🤝‍👨" },
];

const values = [
  { icon: Shield, title: "الأمانة والشفافية", desc: "نلتزم بالشفافية التامة في كل عمليات التبرع وإدارة الحملات" },
  { icon: Heart, title: "التعاطف والرحمة", desc: "نؤمن بالعطاء من القلب وأثر الدعم الإنساني الحقيقي" },
  { icon: Target, title: "الكفاءة والفعالية", desc: "نضمن وصول كل دولار من تبرعاتك إلى مستحقيه بأقصى كفاءة" },
  { icon: Users, title: "بناء المجتمع", desc: "نبني جسور التواصل بين المتبرعين والمحتاجين في مجتمع واحد" },
];

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <div className="hero-gradient text-white py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-20" />
        <div className="container-max mx-auto relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">من نحن</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            منصة أثر — رحلة العطاء تبدأ هنا
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="section-padding">
        <div className="container-max mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-card rounded-2xl border border-border p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-black mb-3">رسالتنا</h2>
              <p className="text-muted-foreground leading-relaxed">
                تمكين المجتمعات من مساعدة بعضها البعض من خلال منصة تبرعات موثوقة وشفافة، تربط قلوب المحسنين بحاجات المستحقين في كل مكان.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-8">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-black mb-3">رؤيتنا</h2>
              <p className="text-muted-foreground leading-relaxed">
                أن نكون المنصة الأولى في العالم العربي للتبرعات الخيرية الموثوقة، وأن نحدث أثراً ملموساً في حياة ملايين الأسر المحتاجة.
              </p>
            </div>
          </div>

          {/* Story */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black mb-6">قصتنا</h2>
            <div className="text-muted-foreground leading-loose text-base space-y-4">
              <p>
                بدأت منصة أثر من فكرة بسيطة: كيف يمكننا تسهيل التبرع وجعله أكثر شفافية؟ رأينا كيف يرغب كثير من الناس في المساعدة، لكنهم يفتقرون إلى وسيلة موثوقة للوصول إلى المحتاجين.
              </p>
              <p>
                في عام 2026 أطلقنا أثر بهدف واحد: أن نكون الجسر الذي يربط قلوب المحسنين بأيدي المحتاجين. منذ ذلك الحين، نمت منصتنا لتضم أكثر من 50,000 متبرع وأكثر من 500 حملة ناجحة.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-black text-center mb-8">قيمنا</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => (
                <div key={v.title} className="text-center p-6 bg-card rounded-2xl border border-border hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="mb-16">
            <h2 className="text-3xl font-black text-center mb-8">فريقنا</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member) => (
                <div key={member.name} className="text-center p-6 bg-card rounded-2xl border border-border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    {member.emoji}
                  </div>
                  <h3 className="font-bold mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-primary/5 rounded-2xl border border-primary/20 p-10">
            <h2 className="text-2xl font-black mb-3">انضم إلينا اليوم</h2>
            <p className="text-muted-foreground mb-6">كن جزءاً من مجتمع العطاء وساهم في صنع الفرق</p>
            <Button size="lg" asChild>
              <Link href="/auth/register">
                <Heart className="w-5 h-5" /> إنشاء حساب مجاني
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
