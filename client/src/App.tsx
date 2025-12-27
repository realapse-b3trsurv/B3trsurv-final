import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider, useWallet } from "@/lib/wallet-context";
import { DAppKitProvider } from "@vechain/dapp-kit-react";
import type { WalletConnectOptions } from "@vechain/dapp-kit";
import { Header } from "@/components/header";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import Home from "@/pages/home";
import Marketplace from "@/pages/marketplace";
import CreateSurvey from "@/pages/create-survey";
import TakeSurvey from "@/pages/take-survey";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { isConnected, walletAddress, connect } = useWallet();

  return (
    <Switch>
      <Route path="/" component={() => <Home isConnected={isConnected} onConnect={connect} />} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/create-survey" component={CreateSurvey} />
      <Route path="/survey/:id" component={TakeSurvey} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={() => <Profile walletAddress={walletAddress} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isConnected, walletAddress, anonymousId, connect, disconnect } = useWallet();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        isConnected={isConnected}
        walletAddress={walletAddress}
        anonymousId={anonymousId}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <main className="flex-1">
        <Router />
      </main>
      <PWAInstallPrompt />
    </div>
  );
}

export default function App() {
  // WalletConnect configuration for mobile wallet support
  const walletConnectOptions: WalletConnectOptions = {
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8848d6c1b95de0d4e1e8e7e8c8a8f8b5',
    metadata: {
      name: 'B3TRSURVE',
      description: 'Blockchain-verified survey platform with token rewards',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://b3trsurve.com',
      icons: [typeof window !== 'undefined' ? `${window.location.origin}/icon-192.png` : 'https://b3trsurve.com/icon-192.png'],
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <DAppKitProvider
            node="https://mainnet.vechain.org/"
            usePersistence={true}
            logLevel="DEBUG"
            walletConnectOptions={walletConnectOptions}
          >
            <WalletProvider>
              <AppContent />
            </WalletProvider>
          </DAppKitProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
