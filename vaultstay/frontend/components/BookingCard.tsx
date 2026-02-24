import { EscrowStatus } from "./EscrowTimeline";
import EscrowTimeline from "./EscrowTimeline";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import clsx from "clsx";

interface BookingCardProps {
    id: number;
    role: "Tenant" | "Landlord";
    rent: string;
    deposit: string;
    startDate: string;
    endDate: string;
    type: string;
    status: EscrowStatus;
    txHash?: string;
    onAction?: () => void;
    actionLabel?: string;
    isLoading?: boolean;
    landlordAddress?: string;
    tenantAddress?: string;
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
    0: { label: "Created", color: "bg-white/10 text-white" },
    1: { label: "Funded", color: "bg-secondary/20 text-secondary border border-secondary/30" },
    2: { label: "Active", color: "bg-primary/20 text-primary border border-primary/30" },
    3: { label: "Completed", color: "bg-green-500/20 text-green-400 border border-green-500/30" },
    4: { label: "Cancelled", color: "bg-red-500/20 text-red-400 border border-red-500/30" },
};

function truncate(addr: string) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}

export default function BookingCard(props: BookingCardProps) {
    const { id, role, rent, deposit, startDate, endDate, type, status, txHash,
        onAction, actionLabel, isLoading, landlordAddress, tenantAddress } = props;

    const badge = STATUS_LABELS[status] ?? STATUS_LABELS[0];

    return (
        <div className="glass-panel-hover rounded-2xl p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-display font-bold text-white">Agreement #{id}</h3>
                        <span className={clsx("px-3 py-0.5 rounded-full text-xs font-semibold", badge.color)}>
                            {badge.label}
                        </span>
                    </div>
                    <span className={clsx(
                        "text-xs px-3 py-1 rounded-lg font-medium",
                        role === "Landlord" ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/20 text-cyan-300"
                    )}>
                        {role}
                    </span>
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-secondary">{parseFloat(rent).toFixed(4)} Ξ</span>
                    <span className="text-xs text-white/40">+ {parseFloat(deposit).toFixed(4)} Ξ deposit</span>
                </div>
            </div>

            {/* Dates & Type */}
            <div className="grid grid-cols-3 gap-3 bg-black/20 rounded-xl p-4 border border-white/5 text-sm">
                <div>
                    <span className="text-xs text-white/40 block mb-1">Start</span>
                    <span className="font-medium">{startDate}</span>
                </div>
                <div>
                    <span className="text-xs text-white/40 block mb-1">End</span>
                    <span className="font-medium">{endDate}</span>
                </div>
                <div>
                    <span className="text-xs text-white/40 block mb-1">Type</span>
                    <span className={clsx(
                        "text-xs font-semibold px-2 py-0.5 rounded-md",
                        type === "Short Term" ? "bg-cyan-500/15 text-cyan-300" : "bg-purple-500/15 text-purple-300"
                    )}>
                        {type}
                    </span>
                </div>
            </div>

            {/* Addresses */}
            {(landlordAddress || tenantAddress) && (
                <div className="grid grid-cols-2 gap-3 text-xs text-white/50">
                    {landlordAddress && (
                        <div>
                            <span className="block text-white/30 mb-1">Landlord</span>
                            <a href={`https://sepolia.etherscan.io/address/${landlordAddress}`}
                                target="_blank" rel="noreferrer"
                                className="text-white/60 hover:text-secondary transition-colors flex items-center gap-1">
                                {truncate(landlordAddress)} <ExternalLink size={10} />
                            </a>
                        </div>
                    )}
                    {tenantAddress && (
                        <div>
                            <span className="block text-white/30 mb-1">Tenant</span>
                            <a href={`https://sepolia.etherscan.io/address/${tenantAddress}`}
                                target="_blank" rel="noreferrer"
                                className="text-white/60 hover:text-secondary transition-colors flex items-center gap-1">
                                {truncate(tenantAddress)} <ExternalLink size={10} />
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline */}
            <div className="py-1">
                <EscrowTimeline status={status} />
            </div>

            {/* TX Hash */}
            {txHash && (
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
                    className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                    <ExternalLink size={11} /> View on Etherscan: {txHash.slice(0, 14)}...
                </a>
            )}

            {/* Action Button */}
            {actionLabel && status !== 3 && status !== 4 && (
                <button
                    onClick={onAction}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 transition-all font-semibold shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : actionLabel}
                </button>
            )}

            {/* View Detail Link */}
            <Link href={`/agreement/${id}`} className="text-center text-xs text-white/30 hover:text-white/60 transition-colors">
                View full agreement details →
            </Link>
        </div>
    );
}
