import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">جاري التحميل...</p>
      </div>
    </div>
  );
}
