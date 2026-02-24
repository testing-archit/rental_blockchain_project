"use client";

import { useState } from "react";
import { useEscrowContract } from "@/lib/contract";
import { motion } from "framer-motion";
import { Calendar, Wallet, CheckSquare, Banknote } from "lucide-react";

export default function CreateBooking() {
    const { createAgreement } = useEscrowContract();

    const [tenant, setTenant] = useState("");
    const [rent, setRent] = useState("");
    const [deposit, setDeposit] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [type, setType] = useState<boolean>(true); // true = Short Term, false = Long Term
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

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
        <div className="max-w-2xl mx-auto px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 rounded-3xl"
            >
                <h2 className="text-3xl font-display font-bold mb-2">Create New Booking</h2>
                <p className="text-white/60 mb-8">Deploy a trustless escrow agreement on the blockchain.</p>

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

                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-2 gap-4">
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
