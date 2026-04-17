import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/types";
import { getCampaignProgress, getCategoryLabel, formatCurrency } from "@/lib/utils";
import { Heart, Users, MapPin, Target, Calendar } from "lucide-react";

interface CampaignCardProps {
  campaign: Campaign;
  compact?: boolean;
}

export default function CampaignCard({ campaign, compact = false }: CampaignCardProps) {
  const progress = getCampaignProgress(campaign.raised_amount, campaign.target_amount);
  const daysLeft = campaign.end_date
    ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden card-hover flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9] shrink-0">
        <Image
          src={campaign.images?.[0] || `https://picsum.photos/seed/${campaign.id}/800/450`}
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
                width={800}
                height={600}
                unoptimized/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary/90 text-white border-0 text-xs shadow-sm backdrop-blur-sm">
            {getCategoryLabel(campaign.category)}
          </Badge>
        </div>

        {/* Days left */}
        {daysLeft !== null && daysLeft <= 30 && (
          <div className="absolute top-3 left-3">
            <Badge variant={daysLeft <= 7 ? "destructive" : "warning"} className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {daysLeft === 0 ? "ينتهي اليوم" : `${daysLeft} يوم`}
            </Badge>
          </div>
        )}

        {/* Location */}
        {campaign.location && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full">
            <MapPin className="w-3 h-3" />
            {campaign.location}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Owner */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
            {campaign.owner?.full_name?.[0] || "م"}
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate">
            {campaign.owner?.full_name || "جهة خيرية"}
          </span>
          {campaign.owner?.is_verified && (
            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold">✓</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
          {campaign.title}
        </h3>

        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {campaign.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3 mt-auto">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-bold text-primary">{formatCurrency(campaign.raised_amount)}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {(campaign.donors_count || 0).toLocaleString("ar-SA")} متبرع
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" />
              الهدف: {formatCurrency(campaign.target_amount)}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button asChild className="w-full h-9 text-xs rounded-xl gap-1.5">
          <Link href={`/campaigns/${campaign.id}`}>
            <Heart className="w-3.5 h-3.5" />
            تبرع الآن
          </Link>
        </Button>
      </div>
    </div>
  );
}
