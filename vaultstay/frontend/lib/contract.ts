"use client";

import { useWriteContract, useAccount } from "wagmi";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "./constants";
import { parseEther } from "viem";

export function useEscrowContract() {
    const { writeContractAsync } = useWriteContract();
    const { address } = useAccount();

    const createAgreement = async (
        tenant: string,
        rentETH: string,
        depositETH: string,
        startDate: number,
        endDate: number,
        isShortTerm: boolean
    ) => {
        return await writeContractAsync({
            address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: "createAgreement",
            args: [tenant, parseEther(rentETH), parseEther(depositETH), startDate, endDate, isShortTerm],
        });
    };

    const depositFunds = async (id: number, valueETH: string) => {
        return await writeContractAsync({
            address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: "depositFunds",
            args: [id],
            value: parseEther(valueETH),
        });
    };

    const confirmCheckIn = async (id: number) => {
        return await writeContractAsync({
            address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: "confirmCheckIn",
            args: [id],
        });
    };

    const cancelBooking = async (id: number) => {
        return await writeContractAsync({
            address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: "cancelBooking",
            args: [id],
        });
    };

    const completeAgreement = async (id: number) => {
        return await writeContractAsync({
            address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: "completeAgreement",
            args: [id],
        });
    };

    const refundDeposit = async (id: number) => {
        return await writeContractAsync({
            address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: "refundDeposit",
            args: [id],
        });
    };

    return {
        createAgreement,
        depositFunds,
        confirmCheckIn,
        cancelBooking,
        completeAgreement,
        refundDeposit,
        address,
    };
}
