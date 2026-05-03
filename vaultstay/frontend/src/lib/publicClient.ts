/**
 * A dedicated read-only public client that always points at the local Hardhat node.
 * This is used for fetching on-chain state WITHOUT requiring the user's wallet to be
 * connected or on the right network — it always reads from the correct chain directly.
 */
import { createPublicClient, http } from "viem";
import { hardhat, sepolia } from "viem/chains";

const localRpc = import.meta.env.VITE_ANVIL_RPC_URL || "http://127.0.0.1:8545";
const sepoliaRpc = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com";
const useLocal = import.meta.env.VITE_USE_SEPOLIA !== "true";

export const readClient = createPublicClient({
  chain: useLocal ? hardhat : sepolia,
  transport: http(useLocal ? localRpc : sepoliaRpc),
});
