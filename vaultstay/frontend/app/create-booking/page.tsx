"use client";

import { useState } from "react";
import { useEscrowContract } from "@/lib/contract";
import { motion } from "framer-motion";
import { Calendar, Wallet, CheckSquare, Banknote, Fuel, RefreshCw } from "lucide-react";
import { usePublicClient } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/lib/constants";

export default function CreateBooking() {
    const { createAgreement, address } = useEscrowContract();
    const publicClient = usePublicClient();

    const [tenant, setTenant] = useState("");
    const [rent, setRent] = useState("");
    const [deposit, setDeposit] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [type, setType] = useState<boolean>(true); // true = Short Term, false = Long Term
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const [gasEstimate, setGasEstimate] = useState<string | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);

    const handleEstimateGas = async () => {
        if (!tenant || !rent || !deposit || !startDate || !endDate || !publicClient || !address) {
            alert("Please fill in all fields to estimate gas.");
            return;
        }
        try {
            setIsEstimating(true);
            setGasEstimate(null);

            const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
            const endUnix = Math.floor(new Date(endDate).getTime() / 1000);

            const gas = await publicClient.estimateContractGas({
                address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
                abi: ESCROW_ABI,
                functionName: "createAgreement",
                args: [tenant, parseEther(rent), parseEther(deposit), startUnix, endUnix, type],
                account: address as `0x${string}`,
            });

            const gasPriceVal = await publicClient.getGasPrice();
            const totalCostWei = gas * gasPriceVal;

            setGasEstimate(Number(formatEther(totalCostWei)).toFixed(6));
        } catch (error: any) {
            console.error(error);
            alert("Estimation failed. Make sure the tenant address is valid.");
        } finally {
            setIsEstimating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMsg("");

        try {
            const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
            const endUnix = Math.floor(new Date(endDate).getTime() / 1000);

            const tx = await createAgreement(tenant, rent, deposit, startUnix, endUnix, type);
            setSuccessMsg(`Booking created successfully! Tx: ${tx}`);
        } catch (error: any) {
            console.error(error);
            alert("Error: " + (error.shortMessage || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto section-padding py-8 sm:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl"
            >
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Create New Booking</h2>
                <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base">Deploy a trustless escrow agreement on the blockchain.</p>

                {successMsg && (
                    <div className="bg-success/20 border border-success/50 p-4 rounded-xl text-success mb-6">
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <Wallet size={16} /> Tenant Wallet Address
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="0x..."
                            value={tenant}
                            onChange={(e) => setTenant(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                <Banknote size={16} /> Total Rent (ETH)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                required
                                placeholder="0.5"
                                value={rent}
                                onChange={(e) => setRent(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                <CheckSquare size={16} /> Security Deposit (ETH)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                required
                                placeholder="0.1"
                                value={deposit}
                                onChange={(e) => setDeposit(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                <Calendar size={16} /> Start Date
                            </label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                <Calendar size={16} /> End Date
                            </label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Booking Type</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className={`flex-1 py-3 rounded-xl border transition-all ${type === true ? "border-primary bg-primary/20 text-white" : "border-white/10 text-white/50 hover:bg-white/5"}`}
                                onClick={() => setType(true)}
                            >
                                Short Term (1-7 Days)
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-3 rounded-xl border transition-all ${type === false ? "border-primary bg-primary/20 text-white" : "border-white/10 text-white/50 hover:bg-white/5"}`}
                                onClick={() => setType(false)}
                            >
                                Long Term (30+ Days)
                            </button>
                        </div>
                    </div>

                    {/* Gas Estimation Box */}
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
                                <Fuel size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/80">Estimated Network Fee</p>
                                <p className="text-xs text-white/50">
                                    {gasEstimate ? `~ ${gasEstimate} ETH` : "Not calculated yet"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleEstimateGas}
                            disabled={isEstimating || !tenant || !rent || !deposit || !startDate || !endDate}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isEstimating ? <RefreshCw size={14} className="animate-spin" /> : "Estimate"}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 mt-4 bg-primary hover:bg-primary/90 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(108,92,231,0.3)] disabled:opacity-50"
                    >
                        {isLoading ? "Signing Transaction..." : "Deploy Agreement"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
