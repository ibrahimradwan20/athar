"use client";

import { useEffect, useState } from "react";
import { Heart, Users, Target, CheckCircle } from "lucide-react";

const stats = [
  { icon: Users, label: "متبرع مسجل", value: 52847, suffix: "+" },
  { icon: Heart, label: "تبرع تم", value: 1200000, suffix: " دولار", isCurrency: true },
  { icon: Target, label: "حملة ناجحة", value: 534, suffix: "+" },
  { icon: CheckCircle, label: "مستفيد استفاد", value: 28000, suffix: "+" },
];

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}

function StatCard({ icon: Icon, label, value, suffix, isCurrency, animate }: any) {
  const count = useCountUp(value, 2000, animate);

  const formatValue = (n: number) => {
    if (isCurrency) {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}م`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}ك`;
      return n.toLocaleString("ar-SA");
    }
    return n.toLocaleString("ar-SA");
  };

  return (
    <div className="text-center group">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <div className="text-3xl sm:text-4xl font-black text-primary mb-1">
        {formatValue(count)}{suffix}
      </div>
      <p className="text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

export default function StatsSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById("stats-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-section" className="section-padding bg-card border-y border-border">
      <div className="container-max mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} animate={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
