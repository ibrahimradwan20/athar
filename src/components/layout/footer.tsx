import Link from "next/link";
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-athar-green-dark dark:bg-gray-950 text-white mt-auto">
      {/* Main footer */}
      <div className="container-max mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <span className="text-2xl font-black">أثر</span>
                <p className="text-xs text-white/60 -mt-1">منصة التبرعات الخيرية</p>
              </div>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              منصة أثر تربط المتبرعين بالحملات الخيرية الموثوقة، لنحدث معاً أثراً حقيقياً في حياة المحتاجين.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-base mb-4 text-white/90">روابط سريعة</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "الرئيسية" },
                { href: "/campaigns", label: "الحملات" },
                { href: "/about", label: "من نحن" },
                { href: "/donate", label: "تبرع الآن" },
                { href: "/auth/login", label: "تسجيل الدخول" },
                { href: "/auth/register", label: "إنشاء حساب" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-base mb-4 text-white/90">تصنيفات الحملات</h3>
            <ul className="space-y-2.5">
              {[
                "الصحة والعلاج",
                "التعليم",
                "الغذاء",
                "المأوى",
                "الطوارئ",
                "الأيتام",
                "المياه",
              ].map((cat) => (
                <li key={cat}>
                  <Link href={`/campaigns?category=${cat}`}
                    className="text-white/60 hover:text-white text-sm transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-base mb-4 text-white/90">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Mail className="w-4 h-4 text-white/50 shrink-0" />
                <span>info@athar.ps</span>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Phone className="w-4 h-4 text-white/50 shrink-0" />
                <span dir="ltr">+970567972555</span>
              </li>
              <li className="flex items-start gap-3 text-white/70 text-sm">
                <MapPin className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                <span>فلسطين، غزة</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-white/10 rounded-xl">
              <p className="text-xs text-white/70 leading-relaxed">
                <span className="text-white font-semibold block mb-1">رقم الترخيص</span>
                منصة معتمدة ومرخصة من وزارة الموارد البشرية والتنمية الاجتماعية
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-max mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/50">
          <p>© {new Date().getFullYear()} منصة أثر. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
            <Link href="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
