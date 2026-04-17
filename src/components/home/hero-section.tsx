import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Star, Shield, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 pattern-bg opacity-30" />

      {/* Decorative circles */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      {/* Geometric decorations */}
      <div className="absolute top-20 right-20 w-20 h-20 border-2 border-white/10 rounded-2xl rotate-12 hidden lg:block" />
      <div className="absolute bottom-32 left-20 w-12 h-12 border-2 border-athar-gold/30 rounded-xl -rotate-6 hidden lg:block" />

      <div className="container-max mx-auto px-4 sm:px-6 relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="text-white text-center lg:text-right">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6 animate-fade-in">
              <Star className="w-4 h-4 text-athar-gold fill-athar-gold" />
              <span>المنصة الخيرية الأولى موثوقية</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 animate-fade-in">
              تبرّع وأحدث
              <span className="block text-athar-gold">أثراً</span>
              في حياة الآخرين
            </h1>

            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in">
              منصة أثر تربطك بالحملات الخيرية الموثوقة. ساهم في بناء مستقبل أفضل من خلال تبرعاتك.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl" asChild>
                <Link href="/campaigns">
                  <Heart className="w-5 h-5" />
                  تصفح الحملات
                </Link>
              </Button>
              <Button size="lg" variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary font-bold" asChild>
                <Link href="/auth/register">
                  ابدأ حملتك
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
              {[
                { icon: Shield, text: "منصة آمنة وموثوقة" },
                { icon: Users, text: "+50,000 متبرع" },
                { icon: Heart, text: "+500 حملة ناجحة" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/70 text-xs">
                  <Icon className="w-4 h-4 text-white/50" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Cards */}
          <div className="hidden lg:block relative">
            {/* Main card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-athar-gold/20 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-athar-gold" />
                </div>
                <div>
                  <p className="text-white font-bold">حملة علاج طفلة</p>
                  <p className="text-white/60 text-sm">محتاجة لعملية جراحية</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>85% مكتمل</span>
                  <span>85,000 / 100,000 دولار</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-athar-gold to-green-300 rounded-full" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "المتبرعون", value: "1,234" },
                  { label: "الأيام المتبقية", value: "12" },
                  { label: "الهدف (دولار)", value: "100K" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-2xl p-3 text-center">
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className="text-white/60 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating mini cards */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-xl flex items-center gap-2 animate-float">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm">✅</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">تبرع ناجح!</p>
                <p className="text-xs text-gray-500">500 دولار</p>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-3 shadow-xl" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1 space-x-reverse">
                  {["🧑", "👩", "👨"].map((emoji, i) => (
                    <div key={i} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm border-2 border-white">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">+23 متبرع اليوم</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}
