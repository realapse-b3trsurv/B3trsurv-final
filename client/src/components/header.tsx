import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isConnected: boolean;
  walletAddress: string | null;
  anonymousId: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header({ isConnected, walletAddress, onConnect, onDisconnect }: HeaderProps) {
  
  // Helper to shorten address (e.g. 0x123...abc)
  const shortenAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* LOGO */}
        <Link href="/">
          <a className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer hover:opacity-80 transition-opacity">
            <span className="hidden sm:inline">B3TRSURVE</span>
            <span className="sm:hidden">B3TR</span>
          </a>
        </Link>

        {/* NAVIGATION & WALLET */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 max-w-[150px] sm:max-w-none">
                  <Wallet className="h-4 w-4 shrink-0" />
                  {/* Truncate address on mobile, show full on desktop */}
                  <span className="truncate">
                    {shortenAddress(walletAddress)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={onDisconnect}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={onConnect} className="gap-2">
              <Wallet className="h-4 w-4" />
              Connect
            </Button>
          )}

          {/* MOBILE MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href="/create-survey">
                <DropdownMenuItem className="cursor-pointer">Create Survey</DropdownMenuItem>
              </Link>
              <Link href="/marketplace">
                <DropdownMenuItem className="cursor-pointer">Marketplace</DropdownMenuItem>
              </Link>
              <Link href="/dashboard">
                <DropdownMenuItem className="cursor-pointer">Dashboard</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
