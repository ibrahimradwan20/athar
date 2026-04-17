import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary/20 mb-4">٤٠٤</div>
        <h2 className="text-2xl font-black mb-3">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground mb-6">
          عذراً، لا يمكن العثور على الصفحة التي تبحث عنها.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">العودة للرئيسية</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/campaigns">تصفح الحملات</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
