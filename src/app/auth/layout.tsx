import Link from "next/link";
import { Heart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: decorative */}
      <div className="hidden lg:flex flex-col relative hero-gradient overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-20" />
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center h-full px-14 text-white">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <span className="text-3xl font-black">أثر</span>
              <p className="text-xs text-white/60">منصة التبرعات الخيرية</p>
            </div>
          </Link>

          <h2 className="text-4xl font-black mb-4 leading-tight">
            تبرّع وأحدث<br />
            <span className="text-athar-gold">أثراً حقيقياً</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            انضم إلى مجتمع المتبرعين وكن سبباً في تغيير حياة الآخرين نحو الأفضل.
          </p>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              &ldquo;من خلال منصة أثر، تمكنت من المساهمة في علاج طفلة وأنا في بيتي. الشفافية والسهولة رائعتان.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">م</div>
              <div>
                <p className="text-white font-semibold text-sm">محمد الأحمد</p>
                <p className="text-white/50 text-xs">متبرع منذ 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black text-primary">أثر</span>
        </Link>

        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
