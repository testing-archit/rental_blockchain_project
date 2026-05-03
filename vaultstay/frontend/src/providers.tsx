import * as React from "react";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const sepoliaRpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia.publicnode.com";

const localRpcUrl =
  import.meta.env.VITE_ANVIL_RPC_URL || "http://127.0.0.1:8545";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "b7f45c2e8d1a9f6e3b0c7d4a2e5f8b1c";

const useLocal = import.meta.env.VITE_USE_SEPOLIA !== "true";

const wagmiConfig = getDefaultConfig({
  appName: "VaultStay",
  projectId,
  chains: useLocal ? [hardhat] : [sepolia],
  transports: {
    [hardhat.id]: http(localRpcUrl),
    [sepolia.id]: http(sepoliaRpcUrl),
  },
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      retry: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#6C5CE7",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
