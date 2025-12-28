import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWallet as useDAppKitWallet } from "@vechain/dapp-kit-react";
import { useToast } from "@/hooks/use-toast";

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  anonymousId: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { account, connect: dAppConnect, disconnect: dAppDisconnect } = useDAppKitWallet();
  const [address, setAddress] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Sync local state with VeChain kit
    setAddress(account || null);
  }, [account]);

  // --- FORCE CONNECT FIX ---
  const handleConnect = async () => {
    try {
      // If we are stuck, try to disconnect first
      if (!account) {
        localStorage.removeItem("walletconnect"); 
      }
      if (dAppConnect) {
        dAppConnect();
      }
    } catch (e) {
      console.error("Connect failed:", e);
    }
  };

  // --- HARD DISCONNECT FIX ---
  const handleDisconnect = async () => {
    try {
      if (dAppDisconnect) {
        await dAppDisconnect();
      }
      // Wipe storage to ensure clean state
      localStorage.removeItem("user_wallet");
      localStorage.removeItem("walletconnect");
      setAddress(null);
      
      toast({
        title: "Wallet Disconnected",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!address,
        walletAddress: address,
        anonymousId: address ? `anon-${address.slice(-4)}` : null,
        connect: handleConnect, // Use our safe connect function
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
