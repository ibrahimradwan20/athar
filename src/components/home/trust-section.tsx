import { Shield, Lock, Eye, Award, Clock, HeartHandshake } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "حملات موثقة",
    description: "كل حملة تمر بمراجعة دقيقة من فريقنا قبل النشر",
  },
  {
    icon: Lock,
    title: "دفع آمن",
    description: "تشفير كامل للبيانات وحماية المعاملات المالية",
  },
  {
    icon: Eye,
    title: "شفافية كاملة",
    description: "تتبع كيفية إنفاق تبرعاتك لحظة بلحظة",
  },
  {
    icon: Award,
    title: "منظمات معتمدة",
    description: "شراكة مع منظمات حاصلة على اعتماد رسمي",
  },
  {
    icon: Clock,
    title: "دعم 24/7",
    description: "فريق دعم متواجد على مدار الساعة لمساعدتك",
  },
  {
    icon: HeartHandshake,
    title: "أثر مضمون",
    description: "نضمن وصول تبرعك إلى مستحقيه بالكامل",
  },
];

export default function TrustSection() {
  return (
    <section className="section-padding">
      <div className="container-max mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm mb-2 flex items-center justify-center gap-2">
            <span className="w-8 h-0.5 bg-primary inline-block" />
            ثقتك تهمنا
            <span className="w-8 h-0.5 bg-primary inline-block" />
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">
            لماذا تختار <span className="text-primary">أثر؟</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            نلتزم بأعلى معايير الأمان والشفافية لضمان وصول تبرعاتك إلى مستحقيها
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title}
              className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-base mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
