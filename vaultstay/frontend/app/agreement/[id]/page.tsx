"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/lib/constants";
import { useEscrowContract } from "@/lib/contract";
import { formatEther } from "viem";
import EscrowTimeline, { EscrowStatus } from "@/components/EscrowTimeline";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Clock, Banknote, Shield, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const STATUS_LABELS: Record<number, string> = {
    0: "Created", 1: "Funded", 2: "Active", 3: "Completed", 4: "Cancelled"
};

export default function AgreementDetail({ params }: { params: { id: string } }) {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { depositFunds, confirmCheckIn, cancelBooking, completeAgreement, refundDeposit } = useEscrowContract();

    const [agreement, setAgreement] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(false);
    const [txMsg, setTxMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const id = parseInt(params.id);

    const fetchAgreement = async () => {
        if (!publicClient) return;
        setLoading(true);
        try {
            const d = await publicClient.readContract({
                address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
                abi: ESCROW_ABI as any,
                functionName: "agreements",
                args: [id],
            }) as any;
            setAgreement({
                landlord: d[0],
                tenant: d[1],
                rent: d[2].toString(),
                deposit: d[3].toString(),
                startDate: Number(d[4]),
                endDate: Number(d[5]),
                isShortTerm: d[6] as boolean,
                status: Number(d[7]),
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAgreement(); }, [id]);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!agreement || agreement.landlord === "0x0000000000000000000000000000000000000000") {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-white/50">
                <span className="text-6xl">🔍</span>
                <p className="text-xl font-display">Agreement #{id} not found</p>
                <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
            </div>
        );
    }

    const role = agreement.landlord.toLowerCase() === address?.toLowerCase() ? "Landlord"
        : agreement.tenant.toLowerCase() === address?.toLowerCase() ? "Tenant"
            : "Observer";

    const rentETH = formatEther(BigInt(agreement.rent));
    const depositETH = formatEther(BigInt(agreement.deposit));

    const handleAction = async (fn: () => Promise<any>, msg: string) => {
        setTxLoading(true);
        setTxMsg(null);
        try {
            await fn();
            setTxMsg({ text: msg, type: "success" });
            setTimeout(() => fetchAgreement(), 2000);
        } catch (e: any) {
            setTxMsg({ text: e.shortMessage || e.message || "Transaction failed", type: "error" });
        } finally {
            setTxLoading(false);
        }
    };

    const now = Math.floor(Date.now() / 1000);
    const canCancelEarly = agreement.status === 1 && now < agreement.startDate - 86400;
    const canCheckIn = agreement.status === 1 && now >= agreement.startDate && role === "Tenant";
    const canDeposit = agreement.status === 0 && role === "Tenant";
    const canComplete = agreement.status === 2 && now >= agreement.endDate;
    const canRefund = agreement.status === 3 && role === "Tenant";
    const canCancelActive = agreement.status === 2 && role === "Tenant";

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="glass-panel rounded-2xl p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-display font-bold mb-2">Agreement #{id}</h1>
                            <span className={clsx(
                                "text-sm px-4 py-1 rounded-full font-semibold",
                                agreement.status === 0 && "bg-white/10 text-white",
                                agreement.status === 1 && "bg-secondary/20 text-secondary border border-secondary/30",
                                agreement.status === 2 && "bg-primary/20 text-primary border border-primary/30",
                                agreement.status === 3 && "bg-green-500/20 text-green-400 border border-green-500/30",
                                agreement.status === 4 && "bg-red-500/20 text-red-400 border border-red-500/30",
                            )}>
                                {STATUS_LABELS[agreement.status]}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-secondary">{parseFloat(rentETH).toFixed(4)} Ξ</div>
                            <div className="text-sm text-white/40">Rent</div>
                        </div>
                    </div>

                    <EscrowTimeline status={agreement.status as EscrowStatus} />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    {/* Parties */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Parties</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-white/40 mb-1">Landlord</div>
                                <a href={`https://sepolia.etherscan.io/address/${agreement.landlord}`}
                                    target="_blank" rel="noreferrer"
                                    className="text-sm font-mono text-white/80 hover:text-secondary transition-colors flex items-center gap-1 break-all">
                                    {agreement.landlord} <ExternalLink size={12} />
                                </a>
                                {agreement.landlord.toLowerCase() === address?.toLowerCase() && (
                                    <span className="text-xs text-purple-400 mt-1 block">← You</span>
                                )}
                            </div>
                            <div>
                                <div className="text-xs text-white/40 mb-1">Tenant</div>
                                <a href={`https://sepolia.etherscan.io/address/${agreement.tenant}`}
                                    target="_blank" rel="noreferrer"
                                    className="text-sm font-mono text-white/80 hover:text-secondary transition-colors flex items-center gap-1 break-all">
                                    {agreement.tenant} <ExternalLink size={12} />
                                </a>
                                {agreement.tenant.toLowerCase() === address?.toLowerCase() && (
                                    <span className="text-xs text-cyan-400 mt-1 block">← You</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Financials</h2>
                        <div className="space-y-3">
                            {[
                                { label: "Rent Amount", value: `${parseFloat(rentETH).toFixed(6)} ETH`, icon: Banknote },
                                { label: "Security Deposit", value: `${parseFloat(depositETH).toFixed(6)} ETH`, icon: Shield },
                                { label: "Total Locked", value: `${(parseFloat(rentETH) + parseFloat(depositETH)).toFixed(6)} ETH`, icon: Shield },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <span className="text-sm text-white/50 flex items-center gap-2">
                                        <item.icon size={14} /> {item.label}
                                    </span>
                                    <span className="text-sm font-semibold text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="glass-panel rounded-2xl p-6 md:col-span-2">
                        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Booking Timeline</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: "Start Date", value: new Date(agreement.startDate * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: Clock },
                                { label: "End Date", value: new Date(agreement.endDate * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: Clock },
                                { label: "Booking Type", value: agreement.isShortTerm ? "Short Term" : "Long Term", icon: Clock },
                            ].map(item => (
                                <div key={item.label} className="text-center p-4 bg-black/20 rounded-xl border border-white/5">
                                    <div className="text-xs text-white/40 mb-2">{item.label}</div>
                                    <div className="font-semibold text-sm">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Panel */}
                {txMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "flex items-center gap-3 p-4 rounded-xl mb-4 text-sm font-medium",
                            txMsg.type === "success"
                                ? "bg-green-500/10 border border-green-500/30 text-green-300"
                                : "bg-red-500/10 border border-red-500/30 text-red-300"
                        )}
                    >
                        {txMsg.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {txMsg.text}
                    </motion.div>
                )}

                <div className="glass-panel rounded-2xl p-6 space-y-3">
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Actions</h2>
                    {canDeposit && (
                        <button disabled={txLoading} onClick={() =>
                            handleAction(() => depositFunds(id, (parseFloat(rentETH) + parseFloat(depositETH)).toFixed(18)), "Funds deposited! Agreement is Funded.")
                        } className="w-full py-3 rounded-xl bg-secondary text-black font-bold hover:bg-secondary/90 transition-all disabled:opacity-50">
                            {txLoading ? "Processing..." : "💰 Deposit Funds (Rent + Deposit)"}
                        </button>
                    )}
                    {canCheckIn && (
                        <button disabled={txLoading} onClick={() =>
                            handleAction(() => confirmCheckIn(id), "Check-in confirmed! Stay is now Active.")
                        } className="w-full py-3 rounded-xl bg-primary font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
                            {txLoading ? "Processing..." : "✅ Confirm Check-In"}
                        </button>
                    )}
                    {canComplete && (
                        <button disabled={txLoading} onClick={() =>
                            handleAction(() => completeAgreement(id), "Stay completed! You can now claim your deposit.")
                        } className="w-full py-3 rounded-xl bg-green-600 font-bold hover:bg-green-600/90 transition-all disabled:opacity-50">
                            {txLoading ? "Processing..." : "🏁 Complete Stay"}
                        </button>
                    )}
                    {canRefund && (
                        <button disabled={txLoading} onClick={() =>
                            handleAction(() => refundDeposit(id), "Deposit refunded to your wallet!")
                        } className="w-full py-3 rounded-xl bg-cyan-600 font-bold hover:bg-cyan-600/90 transition-all disabled:opacity-50">
                            {txLoading ? "Processing..." : "🔁 Claim Deposit Refund"}
                        </button>
                    )}
                    {(canCancelEarly || (agreement.status === 1 && role === "Landlord")) && (
                        <button disabled={txLoading} onClick={() =>
                            handleAction(() => cancelBooking(id), "Booking cancelled. Funds returned to tenant.")
                        } className="w-full py-3 rounded-xl bg-red-600/80 font-bold hover:bg-red-600 transition-all disabled:opacity-50">
                            {txLoading ? "Processing..." : "❌ Cancel Booking"}
                        </button>
                    )}
                    {canCancelActive && (
                        <button disabled={txLoading} onClick={() =>
                            handleAction(() => cancelBooking(id), "Cancelled after check-in. Rent kept, partial deposit refund applied.")
                        } className="w-full py-3 rounded-xl bg-orange-600/80 font-bold hover:bg-orange-600 transition-all disabled:opacity-50">
                            {txLoading ? "Processing..." : "⚠️ Cancel Active Booking (Partial Refund)"}
                        </button>
                    )}
                    {role === "Observer" && (
                        <p className="text-center text-white/40 text-sm py-2">You are not a party to this agreement.</p>
                    )}
                    {["Landlord", "Tenant"].includes(role) && !canDeposit && !canCheckIn && !canComplete && !canRefund && !canCancelEarly && !canCancelActive && agreement.status < 3 && (
                        <p className="text-center text-white/40 text-sm py-2">No actions available at this time.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
