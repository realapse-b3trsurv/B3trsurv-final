import { Badge as BadgeType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Trophy, Medal, Crown, Lock } from "lucide-react";

interface BadgeCardProps {
  badge: BadgeType;
  earned?: boolean;
  earnedAt?: Date;
}

const BADGE_ICONS = {
  star: Star,
  award: Award,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
};

const TIER_COLORS = {
  bronze: "bg-amber-700/20 border-amber-700/30",
  silver: "bg-slate-400/20 border-slate-400/30",
  gold: "bg-yellow-500/20 border-yellow-500/30",
};

export function BadgeCard({ badge, earned = false, earnedAt }: BadgeCardProps) {
  const Icon = BADGE_ICONS[badge.icon as keyof typeof BADGE_ICONS] || Star;
  const tierColor = TIER_COLORS[badge.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;

  return (
    <Card 
      className={`relative transition-all ${earned ? tierColor : 'opacity-50 grayscale'}`}
      data-testid={`card-badge-${badge.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-full ${earned ? tierColor : 'bg-muted'}`}>
            {earned ? (
              <Icon className="h-6 w-6" data-testid={`icon-badge-${badge.icon}`} />
            ) : (
              <Lock className="h-6 w-6 text-muted-foreground" data-testid="icon-badge-locked" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold truncate" data-testid={`text-badge-name-${badge.id}`}>
                {badge.name}
              </h3>
              <Badge variant="outline" className="shrink-0" data-testid={`badge-tier-${badge.tier}`}>
                {badge.tier}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2" data-testid={`text-badge-description-${badge.id}`}>
              {badge.description}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`text-badge-requirement-${badge.id}`}>
              {earned 
                ? `Earned ${earnedAt ? new Date(earnedAt).toLocaleDateString() : 'recently'}`
                : `Complete ${badge.requiredSurveys} surveys to unlock`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
