import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="section-padding bg-muted/40">
      <div className="container-max mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-athar-green to-athar-green-light rounded-3xl p-10 sm:p-16 text-center text-white">
          {/* Pattern overlay */}
          <div className="absolute inset-0 pattern-bg opacity-20" />

          {/* Decorations */}
          <div className="absolute top-8 right-8 w-16 h-16 border-2 border-white/20 rounded-2xl rotate-12" />
          <div className="absolute bottom-8 left-8 w-10 h-10 border-2 border-white/20 rounded-xl -rotate-6" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black mb-4">
              ابدأ رحلة العطاء اليوم
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              انضم إلى آلاف المتبرعين الذين يحدثون أثراً حقيقياً في حياة الآخرين
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl" asChild>
                <Link href="/auth/register">
                  إنشاء حساب مجاني
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline"
                className="border-white text-white hover:bg-white/10 font-bold" asChild>
                <Link href="/campaigns">
                  <Heart className="w-5 h-5" />
                  تصفح الحملات
                </Link>
              </Button>
            </div>

            <p className="text-white/50 text-sm mt-6">
              مجاني تمامًا • لا بطاقة ائتمانية • انضم الآن
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
