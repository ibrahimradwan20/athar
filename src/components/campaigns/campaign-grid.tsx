import CampaignCard from "./campaign-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "@/types";

interface CampaignGridProps {
  campaigns: Campaign[];
  loading?: boolean;
  emptyMessage?: string;
}

function CampaignSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function CampaignGrid({ campaigns, loading, emptyMessage }: CampaignGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CampaignSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!campaigns.length) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-lg font-bold mb-2">لا توجد حملات</h3>
        <p className="text-muted-foreground text-sm">
          {emptyMessage || "لا توجد حملات متاحة حالياً"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
