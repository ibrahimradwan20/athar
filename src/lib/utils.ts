import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ Fix 1: Currency changed to USD
export function formatCurrency(amount: number) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("ar-SA").format(num);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function getCampaignProgress(raised: number, target: number) {
  if (target === 0) return 0;
  return Math.min(Math.round((raised / target) * 100), 100);
}

export function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    health: "الصحة",
    education: "التعليم",
    food: "الغذاء",
    shelter: "المأوى",
    emergency: "الطوارئ",
    orphans: "الأيتام",
    water: "المياه",
    other: "أخرى",
  };
  return labels[category] || category;
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "قيد المراجعة",
    approved: "مُعتمدة",
    rejected: "مرفوضة",
    active: "نشطة",
    completed: "مكتملة",
  };
  return labels[status] || status;
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "مدير النظام",
    moderator: "مشرف",
    donor: "متبرع",
    organization: "مؤسسة",
    beneficiary: "مستفيد",
  };
  return labels[role] || role;
}
