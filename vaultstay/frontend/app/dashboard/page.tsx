"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/lib/constants";
import { useEscrowContract } from "@/lib/contract";
import { formatEther } from "viem";
import BookingCard from "@/components/BookingCard";
import { motion, AnimatePresence } from "framer-motion";
import { EscrowStatus } from "@/components/EscrowTimeline";
import { CheckCircle, XCircle, Loader2, LayoutDashboard, Home, Users } from "lucide-react";

// ─── Toast ──────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "loading";
interface Toast { id: number; msg: string; type: ToastType; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
    return (
        <div className="fixed top-24 right-6 z-[999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl glass-panel border text-sm font-medium shadow-2xl
                            ${t.type === "success" ? "border-green-500/40 text-green-300" :
                                t.type === "error" ? "border-red-500/40 text-red-300" :
                                    "border-primary/40 text-white/80"}`}
                    >
                        {t.type === "success" && <CheckCircle size={18} className="text-green-400 shrink-0" />}
                        {t.type === "error" && <XCircle size={18} className="text-red-400 shrink-0" />}
                        {t.type === "loading" && <Loader2 size={18} className="animate-spin text-primary shrink-0" />}
                        {t.msg}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ─── Stats Banner ────────────────────────────────────────────────────────────
function StatsBanner({ agreements, userAddress }: { agreements: any[]; userAddress: string }) {
    const asLandlord = agreements.filter(a => a.landlord.toLowerCase() === userAddress.toLowerCase());
    const asTenant = agreements.filter(a => a.tenant.toLowerCase() === userAddress.toLowerCase());
    const active = agreements.filter(a => a.status === 2);
    const totalVolume = agreements.reduce((acc, a) => acc + parseFloat(formatEther(BigInt(a.rent))), 0);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
                { label: "As Landlord", value: asLandlord.length, icon: Home },
                { label: "As Tenant", value: asTenant.length, icon: Users },
                { label: "Active Stays", value: active.length, icon: LayoutDashboard },
                { label: "Total Volume", value: `${totalVolume.toFixed(3)} Ξ`, icon: LayoutDashboard },
            ].map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-2xl p-5 flex flex-col gap-1"
                >
                    <span className="text-xs text-white/40 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-2xl font-display font-bold text-white">{stat.value}</span>
                </motion.div>
            ))}
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { depositFunds, confirmCheckIn, cancelBooking, completeAgreement, refundDeposit } = useEscrowContract();

    const [agreements, setAgreements] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "landlord" | "tenant">("all");
    const [toasts, setToasts] = useState<Toast[]>([]);
    let toastId = 0;

    const addToast = useCallback((msg: string, type: ToastType, duration = 4000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, msg, type }]);
        if (type !== "loading") setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
        return id;
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // ── Read agreementCount then fan out multicall ────────────────────────────
    const { data: rawCount, refetch: refetchCount } = useReadContract({
        address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "agreementCount",
    });

    const fetchAgreements = useCallback(async () => {
        if (!rawCount || !address || !publicClient) return;
        setIsFetching(true);
        try {
            const count = Number(rawCount);
            if (count === 0) { setAgreements([]); return; }

            const calls = Array.from({ length: count }, (_, i) => ({
                address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
                abi: ESCROW_ABI as any,
                functionName: "agreements",
                args: [i + 1],
            }));

            const results = await publicClient.multicall({ contracts: calls });

            const fetchedAgreements = results
                .map((r, i) => {
                    if (r.status !== "success") return null;
                    const d = r.result as any;
                    return {
                        id: i + 1,
                        landlord: d[0],
                        tenant: d[1],
                        rent: d[2].toString(),
                        deposit: d[3].toString(),
                        startDate: Number(d[4]),
                        endDate: Number(d[5]),
                        isShortTerm: d[6] as boolean,
                        status: Number(d[7]),
                    };
                })
                .filter(Boolean)
                .filter(a =>
                    a!.landlord.toLowerCase() === address.toLowerCase() ||
                    a!.tenant.toLowerCase() === address.toLowerCase()
                );

            setAgreements(fetchedAgreements as any[]);
        } catch (err) {
            console.error("Error fetching agreements:", err);
        } finally {
            setIsFetching(false);
        }
    }, [rawCount, address, publicClient]);

    useEffect(() => { fetchAgreements(); }, [fetchAgreements]);

    if (!isConnected) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-display text-white/60">Connect your wallet to view your dashboard</h2>
            </div>
        );
    }

    const handleAction = async (id: number, status: number, role: string, rentInfo: string, depositInfo: string) => {
        const loadingId = addToast("Waiting for wallet signature...", "loading");
        try {
            if (status === 0 && role === "Tenant") {
                const total = (parseFloat(rentInfo) + parseFloat(depositInfo)).toFixed(18);
                await depositFunds(id, total);
                addToast("Funds deposited successfully!", "success");
            } else if (status === 1 && role === "Tenant") {
                await confirmCheckIn(id);
                addToast("Check-in confirmed! Booking is now Active.", "success");
            } else if (status === 2 && role === "Tenant") {
                await completeAgreement(id);
                addToast("Stay completed! Claiming deposit refund...", "loading");
                await refundDeposit(id);
                addToast("Deposit refunded. Agreement complete!", "success");
            } else if (status === 1 && role === "Landlord") {
                await cancelBooking(id);
                addToast("Booking cancelled. Funds returned to tenant.", "success");
            } else if (status === 3 && role === "Tenant") {
                await refundDeposit(id);
                addToast("Deposit refunded to your wallet!", "success");
            }
            removeToast(loadingId);
            refetchCount();
            setTimeout(() => fetchAgreements(), 2000);
        } catch (e: any) {
            removeToast(loadingId);
            addToast("Transaction failed: " + (e.shortMessage || e.message || "Unknown error"), "error");
        }
    };

    const getActionLabel = (status: number, role: string) => {
        if (status === 0 && role === "Tenant") return "Deposit Funds";
        if (status === 1 && role === "Tenant") return "Confirm Check-In";
        if (status === 1 && role === "Landlord") return "Cancel Booking";
        if (status === 2 && role === "Tenant") return "Complete Stay & Get Refund";
        if (status === 3 && role === "Tenant") return "Claim Deposit";
        return "";
    };

    const filtered = agreements.filter(a => {
        if (activeTab === "landlord") return a.landlord.toLowerCase() === address?.toLowerCase();
        if (activeTab === "tenant") return a.tenant.toLowerCase() === address?.toLowerCase();
        return true;
    });

    return (
        <>
            <ToastContainer toasts={toasts} />
            <div className="max-w-6xl mx-auto px-6 py-12">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold">Dashboard</h1>
                    <p className="text-white/50 mt-1 text-sm">Manage all your escrow agreements</p>
                </motion.div>

                {agreements.length > 0 && <StatsBanner agreements={agreements} userAddress={address!} />}

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-black/30 rounded-xl p-1 w-fit">
                    {(["all", "landlord", "tenant"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "text-white/50 hover:text-white"
                                }`}
                        >
                            {tab === "all" ? "All Agreements" : tab === "landlord" ? "My Listings" : "My Stays"}
                        </button>
                    ))}
                </div>

                {isFetching ? (
                    <div className="flex items-center justify-center py-24 gap-3 text-white/50">
                        <Loader2 className="animate-spin" size={24} />
                        <span>Loading agreements from chain...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {filtered.map((a, i) => {
                                const role = a.landlord.toLowerCase() === address?.toLowerCase() ? "Landlord" : "Tenant";
                                const rentETH = formatEther(BigInt(a.rent));
                                const depositETH = formatEther(BigInt(a.deposit));
                                return (
                                    <motion.div
                                        key={a.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.07 }}
                                    >
                                        <BookingCard
                                            id={a.id}
                                            role={role}
                                            rent={rentETH}
                                            deposit={depositETH}
                                            startDate={new Date(a.startDate * 1000).toLocaleDateString()}
                                            endDate={new Date(a.endDate * 1000).toLocaleDateString()}
                                            type={a.isShortTerm ? "Short Term" : "Long Term"}
                                            status={a.status as EscrowStatus}
                                            actionLabel={getActionLabel(a.status, role)}
                                            onAction={() => handleAction(a.id, a.status, role, rentETH, depositETH)}
                                            landlordAddress={a.landlord}
                                            tenantAddress={a.tenant}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {filtered.length === 0 && !isFetching && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-2 py-16 text-center text-white/40 glass-panel rounded-2xl flex flex-col items-center gap-4"
                            >
                                <span className="text-5xl">📭</span>
                                <p className="font-display text-lg">No agreements found</p>
                                <p className="text-sm">Create a new agreement or switch tabs to view your role as Tenant or Landlord.</p>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
