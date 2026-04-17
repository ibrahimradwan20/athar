"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-black mb-3">حدث خطأ غير متوقع</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          نعتذر، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>إعادة المحاولة</Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
