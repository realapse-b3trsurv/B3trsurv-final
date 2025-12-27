import React, { Component, ErrorInfo, ReactNode } from "react";
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
import { AlertCircle } from "lucide-react";

// --- SAFETY NET (Prevents White Screen) ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-card border border-destructive/20 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
             <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground h-10 rounded-md font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- ROUTER ---
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
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

// --- MAIN ---
export default function App() {
  const walletConnectOptions: WalletConnectOptions = {
    projectId: 'a0c810d797170887e14d87272895f472',
    metadata: {
      name: 'B3TRSURVE',
      description: 'Verifiable Market Research',
      // CRITICAL FIX: This URL tells the wallet you are a real app
      url: 'https://b3trsurve-final.vercel.app', 
      icons: ['https://b3trsurve-final.vercel.app/icon-192.png'],
    },
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <DAppKitProvider
              node="https://mainnet.vechain.org/"
              usePersistence={true}
              logLevel="ERROR" 
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
    </ErrorBoundary>
  );
}
