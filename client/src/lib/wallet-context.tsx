import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWallet as useDAppKitWallet } from "@vechain/dapp-kit-react";
import { useToast } from "@/hooks/use-toast";

// 1. Define the shape of our wallet tools
interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  anonymousId: string | null;
  connect: () => void;
  disconnect: () => void;
}

// 2. Create the Context
const WalletContext = createContext<WalletContextType | null>(null);

// 3. Create the Provider (The Engine)
export function WalletProvider({ children }: { children: ReactNode }) {
  const { account, connect, disconnect: dAppKitDisconnect } = useDAppKitWallet();
  const [address, setAddress] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync with VeChain Kit
  useEffect(() => {
    if (account) {
      setAddress(account);
    } else {
      setAddress(null);
    }
  }, [account]);

  // --- THE HARD DISCONNECT FIX ---
  const handleDisconnect = async () => {
    try {
      // 1. Tell VeChain to disconnect
      if (dAppKitDisconnect) {
        await dAppKitDisconnect();
      }
      // 2. Clear Local Storage (Hard Reset)
      localStorage.removeItem("user_wallet");
      localStorage.removeItem("walletconnect"); // Clears WalletConnect session
      
      // 3. Wipe State
      setAddress(null);
      
      toast({
        title: "Wallet Disconnected",
        description: "You have been logged out securely.",
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
        connect,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// 4. THE EXPORT (This was missing and caused the crash!)
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
