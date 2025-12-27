  const disconnect = async () => {
    try {
      // 1. Tell VeChain to disconnect
      if (walletHook.disconnect) {
        await walletHook.disconnect();
      }
      // 2. Clear Local Storage (Hard Reset)
      localStorage.removeItem("user_wallet");
      localStorage.removeItem("walletconnect"); // Clears WC session
      
      // 3. Reset State
      setAddress(null);
      setIsConnected(false);
      
      toast({
        title: "Wallet Disconnected",
        description: "You have been logged out securely.",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };
