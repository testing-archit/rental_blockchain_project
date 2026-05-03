import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { VaultStayEscrowABI } from "../lib/abi";
import { CONTRACT_ADDRESS } from "../lib/constants";
import { parseEther } from "viem";
import type { Rental, RawRental } from "../lib/types";
import { normalizeRental } from "../lib/types";
import { readClient } from "../lib/publicClient";

// ─── Read Hooks ─────────────────────────────────────────────────────────────────

/**
 * useAllListings — reads directly from the configured RPC using a standalone
 * viem public client. This BYPASSES wagmi's wallet-connection requirement so
 * listings always show even when no wallet is connected or the user is on the
 * wrong network inside their wallet.
 */
export function useAllListings() {
  return useQuery({
    queryKey: ["all-listings", CONTRACT_ADDRESS],
    queryFn: async (): Promise<Rental[]> => {
      const data = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: VaultStayEscrowABI,
        functionName: "getAllListings",
      });
      return data ? (data as RawRental[]).map(normalizeRental) : [];
    },
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function useListing(id?: number) {
  const enabled = typeof id === "number" && Number.isFinite(id) && id > 0;
  return useQuery({
    queryKey: ["listing", CONTRACT_ADDRESS, id],
    queryFn: async (): Promise<Rental | undefined> => {
      if (!enabled || id == null) return undefined;
      const data = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: VaultStayEscrowABI,
        functionName: "getListing",
        args: [BigInt(id)],
      });
      return data ? normalizeRental(data as RawRental) : undefined;
    },
    enabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function usePendingWithdrawal(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VaultStayEscrowABI,
    functionName: "pendingWithdrawals",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  });
}

// ─── Write Hooks ─────────────────────────────────────────────────────────────────

const toBigIntId = (id: number | bigint) =>
  typeof id === "bigint" ? id : BigInt(id);

function useWriteWithInvalidation() {
  const queryClient = useQueryClient();
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      // Invalidate the direct-client query keys
      queryClient.invalidateQueries({ queryKey: ["all-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing"] });
    }
  }, [isConfirmed, queryClient]);

  return { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt };
}

export function useCreateListing() {
  const { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt } =
    useWriteWithInvalidation();

  const create = (
    rent: string,
    deposit: string,
    start: number,
    end: number,
    cid: string
  ) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: VaultStayEscrowABI,
      functionName: "createListing",
      args: [parseEther(rent), parseEther(deposit), BigInt(start), BigInt(end), cid],
    });

  return { create, hash, isPending, isConfirming, isConfirmed, receipt };
}

export function useFundRental() {
  const { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt } =
    useWriteWithInvalidation();

  const fund = (id: number | bigint, valueETH: string) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: VaultStayEscrowABI,
      functionName: "fundRental",
      args: [toBigIntId(id)],
      value: parseEther(valueETH),
    });

  return { fund, hash, isPending, isConfirming, isConfirmed, receipt };
}

export function useActivateRental() {
  const { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt } =
    useWriteWithInvalidation();

  const activate = (id: number | bigint) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: VaultStayEscrowABI,
      functionName: "activateRental",
      args: [toBigIntId(id)],
    });

  return { activate, hash, isPending, isConfirming, isConfirmed, receipt };
}

export function useConfirmCompletion() {
  const { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt } =
    useWriteWithInvalidation();

  const confirm = (id: number | bigint) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: VaultStayEscrowABI,
      functionName: "confirmCompletion",
      args: [toBigIntId(id)],
    });

  return { confirm, hash, isPending, isConfirming, isConfirmed, receipt };
}

export function useCancelRental() {
  const { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt } =
    useWriteWithInvalidation();

  const cancel = (id: number | bigint) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: VaultStayEscrowABI,
      functionName: "cancelRental",
      args: [toBigIntId(id)],
    });

  return { cancel, hash, isPending, isConfirming, isConfirmed, receipt };
}

export function useRaiseDispute() {
  const { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt } =
    useWriteWithInvalidation();

  const dispute = (id: number | bigint) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: VaultStayEscrowABI,
      functionName: "raiseDispute",
      args: [toBigIntId(id)],
    });

  return { dispute, hash, isPending, isConfirming, isConfirmed, receipt };
}

export function useWithdraw() {
  const { writeContractAsync, hash, isPending, isConfirming, isConfirmed, receipt } =
    useWriteWithInvalidation();

  const withdraw = () =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: VaultStayEscrowABI,
      functionName: "withdraw",
      args: [],
    });

  return { withdraw, hash, isPending, isConfirming, isConfirmed, receipt };
}

// Re-export Rental type for convenience
export type { Rental };
