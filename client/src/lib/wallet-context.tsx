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
    setAddress(account || null);
  }, [account]);

  // --- THE AGGRESSIVE CONNECT FIX ---
  const handleConnect = () => {
    try {
      // 1. Force clear any "ghost" sessions that might be blocking the modal
      if (!account) {
        localStorage.removeItem("walletconnect");
      }
      
      // 2. Open the modal immediately
      if (dAppConnect) {
        dAppConnect();
      } else {
        console.error("Connect function unavailable");
      }
    } catch (e) {
      console.error("Connect failed:", e);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (dAppDisconnect) {
        await dAppDisconnect();
      }
      localStorage.removeItem("user_wallet");
      localStorage.removeItem("walletconnect");
      setAddress(null);
      toast({ title: "Disconnected", description: "Wallet disconnected successfully." });
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
        connect: handleConnect,
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
