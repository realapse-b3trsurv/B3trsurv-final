import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WalletButtonProps {
  isConnected: boolean;
  walletAddress?: string;
  anonymousId?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletButton({
  isConnected,
  walletAddress,
  anonymousId,
  onConnect,
  onDisconnect,
}: WalletButtonProps) {
  if (!isConnected) {
    return (
      <Button onClick={onConnect} data-testid="button-connect-wallet" className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" data-testid="button-wallet-menu" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline font-mono text-sm">
            {walletAddress && shortenAddress(walletAddress)}
          </span>
          <Badge variant="secondary" className="hidden md:inline-flex">
            Verified
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Wallet Address</span>
            <span className="font-mono text-xs" data-testid="text-wallet-address">
              {walletAddress}
            </span>
          </div>
          {anonymousId && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Anonymous ID</span>
              <span className="font-mono text-xs" data-testid="text-anonymous-id">
                #{anonymousId}
              </span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDisconnect} data-testid="button-disconnect-wallet">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
