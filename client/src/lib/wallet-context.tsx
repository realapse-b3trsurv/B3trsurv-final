import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { useWallet as useVeChainWallet, useWalletModal } from "@vechain/dapp-kit-react";

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | undefined;
  anonymousId: string | undefined;
  user: User | undefined;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [localWalletAddress, setLocalWalletAddress] = useState<string | undefined>();
  const { toast } = useToast();
  const { account } = useVeChainWallet();
  const { open } = useWalletModal();

  // Use VeWorld account if available, otherwise use local state
  const walletAddress = account || localWalletAddress;

  // Automatically connect to backend when VeWorld wallet connects
  useEffect(() => {
    if (account && account !== localWalletAddress) {
      apiRequest("POST", "/api/auth/connect", { walletAddress: account })
        .then((data: any) => {
          setLocalWalletAddress(account);
          localStorage.setItem("walletAddress", account);
          queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
          toast({
            title: "Wallet Connected",
            description: "Your VeChain wallet has been connected successfully",
          });
        })
        .catch((error) => {
          console.error("Failed to connect wallet:", error);
          toast({
            title: "Connection Failed",
            description: error.message,
            variant: "destructive",
          });
        });
    }
  }, [account, localWalletAddress, toast]);

  // Try to reconnect on page load if wallet was previously connected
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress && !account) {
      // If VeWorld is not connected but we have a saved address, try to reconnect
      apiRequest("POST", "/api/auth/connect", { walletAddress: savedAddress })
        .then((data: any) => {
          setLocalWalletAddress(savedAddress);
          queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        })
        .catch((error) => {
          console.error("Failed to reconnect wallet:", error);
          localStorage.removeItem("walletAddress");
        });
    }
  }, [account]);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user/me"],
    enabled: !!walletAddress,
  });

  const connect = () => {
    // Open VeWorld modal
    open();
  };

  const disconnect = () => {
    setLocalWalletAddress(undefined);
    localStorage.removeItem("walletAddress");
    queryClient.clear();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!walletAddress,
        walletAddress,
        anonymousId: user?.anonymousId,
        user,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
