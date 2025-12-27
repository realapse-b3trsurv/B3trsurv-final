import { useEffect, useState } from "react";
import { Badge as BadgeType, UserBadge } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Award, Trophy, Medal, Crown, Sparkles } from "lucide-react";

interface BadgeNotificationProps {
  badge: BadgeType | null;
  onClose: () => void;
}

const BADGE_ICONS = {
  star: Star,
  award: Award,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
};

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (badge) {
      setOpen(true);
    }
  }, [badge]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  if (!badge) return null;

  const Icon = BADGE_ICONS[badge.icon as keyof typeof BADGE_ICONS] || Star;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-badge-notification">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            New Badge Unlocked!
          </DialogTitle>
          <DialogDescription>
            Congratulations! You've earned a new achievement badge.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/30">
            <Icon className="h-12 w-12 text-primary" data-testid={`icon-earned-badge-${badge.icon}`} />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold" data-testid="text-earned-badge-name">
              {badge.name}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-earned-badge-description">
              {badge.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Tier: <span className="font-semibold capitalize">{badge.tier}</span>
            </p>
          </div>
        </div>
        <Button onClick={handleClose} className="w-full" data-testid="button-close-badge-notification">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
