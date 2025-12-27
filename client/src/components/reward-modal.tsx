import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trophy, Coins, Info } from "lucide-react";
import { calculateConsumerFee } from "@shared/fee-config";

interface RewardSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  defaultToken: string;
  onConfirm: (selectedToken: string, tier: string) => void;
  isPending?: boolean;
}

export function RewardSelectionModal({
  open,
  onOpenChange,
  amount,
  defaultToken,
  onConfirm,
  isPending = false,
}: RewardSelectionModalProps) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const grossAmount = parseFloat(amount);
  const feeBreakdown = calculateConsumerFee(grossAmount);

  const tokens = [
    {
      id: "b3tr",
      name: "B3TR",
      token: "B3TR",
      amount: feeBreakdown.netAmount,
      description: "Native platform token with equivalent exchange rate",
      color: "border-blue-500/50 bg-blue-500/5",
      badgeClass: "bg-blue-500 text-blue-50",
    },
    {
      id: "vet",
      name: "VET",
      token: "VET",
      amount: feeBreakdown.netAmount,
      description: "VeChain token with equivalent exchange rate",
      color: "border-cyan-500/50 bg-cyan-500/5",
      badgeClass: "bg-cyan-500 text-cyan-50",
    },
    {
      id: "unity",
      name: "UNITY",
      token: "UNITY",
      amount: feeBreakdown.netAmount,
      description: "The currency of verified truth — VIP-180 token representing honest human contribution",
      color: "border-purple-500/50 bg-purple-500/5",
      badgeClass: "bg-purple-500 text-purple-50",
    },
  ];

  const handleConfirm = () => {
    if (selectedToken) {
      const token = tokens.find((t) => t.id === selectedToken);
      if (token) {
        onConfirm(token.token, token.id);
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="modal-reward-selection">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Survey Completed!</DialogTitle>
              <DialogDescription>
                Choose your preferred token to receive your reward
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <CheckCircle className="h-5 w-5 text-primary" />
            <p className="text-sm">
              Your response has been recorded on the VeChain blockchain
            </p>
          </div>

          <div className="grid gap-3">
            {tokens.map((token) => (
              <Card
                key={token.id}
                className={`cursor-pointer border-2 transition-all hover-elevate ${
                  selectedToken === token.id
                    ? token.color + " ring-2 ring-primary"
                    : "border-border"
                }`}
                onClick={() => setSelectedToken(token.id)}
                data-testid={`card-token-${token.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-muted-foreground" />
                        <Badge className={token.badgeClass}>{token.name}</Badge>
                      </div>
                      <div>
                        <p className="font-semibold text-lg font-mono">
                          {token.amount.toFixed(2)} {token.token}
                        </p>
                        <p className="text-sm text-muted-foreground">{token.description}</p>
                      </div>
                    </div>
                    {selectedToken === token.id && (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              <span>Reward Breakdown</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Survey Reward:</span>
                <span className="font-mono">{feeBreakdown.grossAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee ({feeBreakdown.feePercentage}%):</span>
                <span className="font-mono text-muted-foreground">-{feeBreakdown.feeAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between font-semibold">
                <span>You Receive:</span>
                <span className="font-mono text-primary">{feeBreakdown.netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Rewards are distributed instantly from the weekly token pool
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!selectedToken || isPending}
            className="w-full"
            size="lg"
            data-testid="button-claim-reward"
          >
            {isPending ? "Submitting..." : "Claim Reward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
