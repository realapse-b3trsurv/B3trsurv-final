import { Link, useLocation } from "wouter";
import { WalletButton } from "./wallet-button";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Database, LayoutDashboard, Plus, User } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  walletAddress?: string;
  anonymousId?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header({
  isConnected,
  walletAddress,
  anonymousId,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">B3TRSURVE</span>
          </Link>

          {isConnected && (
            <nav className="hidden md:flex items-center gap-2">
              <Button
                asChild
                variant={location === "/marketplace" ? "secondary" : "ghost"}
                size="sm"
                data-testid="link-marketplace"
              >
                <Link href="/marketplace">Marketplace</Link>
              </Button>
              <Button
                asChild
                variant={location === "/dashboard" ? "secondary" : "ghost"}
                size="sm"
                data-testid="link-dashboard"
                className="gap-2"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant={location === "/create-survey" ? "secondary" : "ghost"}
                size="sm"
                data-testid="link-create-survey"
                className="gap-2"
              >
                <Link href="/create-survey">
                  <Plus className="h-4 w-4" />
                  Create Survey
                </Link>
              </Button>
              <Button
                asChild
                variant={location === "/profile" ? "secondary" : "ghost"}
                size="sm"
                data-testid="link-profile"
                className="gap-2"
              >
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <WalletButton
            isConnected={isConnected}
            walletAddress={walletAddress}
            anonymousId={anonymousId}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>
      </div>
    </header>
  );
}
