import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { PlusCircle, TrendingUp, Lock } from "lucide-react";
import { useAllListings, usePendingWithdrawal, useWithdraw } from "../hooks/useVaultStay";
import { RentalCard } from "../components/RentalCard";
import { Navbar } from "../components/Navbar";
import { WalletConnectButton } from "../components/WalletConnectButton";
import { EthAmount } from "../components/EthAmount";
import type { Rental } from "../lib/types";

export default function DashboardPage() {
  const { data: listings, isLoading } = useAllListings();
  const { address } = useAccount();
  const [tab, setTab] = useState<"LISTINGS" | "BOOKINGS">("LISTINGS");

  const { data: pendingWei } = usePendingWithdrawal(address);
  const { withdraw, isPending: isWithdrawing } = useWithdraw();
  const pendingBalance = pendingWei ?? 0n;

  if (!address) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
          <div className="text-6xl mb-2">🔐</div>
          <h2 className="font-display text-3xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted max-w-sm">
            Connect your wallet to view your listings, bookings, and pending withdrawals.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  const allListings = listings ?? [];
  const normalizedViewer = address.toLowerCase();

  const myListings = allListings.filter(
    (l) => l.landlord.toLowerCase() === normalizedViewer
  );
  const myBookings = allListings.filter(
    (l) =>
      l.tenant !== "0x0000000000000000000000000000000000000000" &&
      l.tenant.toLowerCase() === normalizedViewer
  );

  const activeDisplay = tab === "LISTINGS" ? myListings : myBookings;

  const lockedWei = activeDisplay
    .filter((l) => l.state === 1 || l.state === 2)
    .reduce<bigint>((acc, l) => acc + l.rentAmount + l.depositAmount, 0n);

  const totalEarned = myListings
    .filter((l) => l.state === 3) // Completed
    .reduce<bigint>((acc, l) => acc + l.rentAmount, 0n);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-1">My Dashboard</h1>
            <p className="text-muted">Manage your properties and active bookings.</p>
          </div>
          <Link to="/create" className="btn-primary flex items-center gap-2 w-fit">
            <PlusCircle size={16} /> New Listing
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Properties</p>
              <p className="font-display text-2xl font-bold">{myListings.length}</p>
            </div>
          </div>
          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent2/10 flex items-center justify-center flex-shrink-0">
              <Lock size={18} className="text-accent2" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">ETH Locked</p>
              <EthAmount weiAmount={lockedWei} className="text-accent2 text-xl" />
            </div>
          </div>
          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 text-lg">✓</span>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Total Earned</p>
              <EthAmount weiAmount={totalEarned} className="text-green-400 text-xl" />
            </div>
          </div>
        </div>

        {/* Withdrawal Banner */}
        {pendingBalance > 0n && (
          <div className="mb-10 glass-panel p-5 md:p-6 border-accent2/30 bg-accent2/5 flex flex-col md:flex-row items-center justify-between gap-5 animate-in">
            <div>
              <h3 className="font-display text-lg font-bold text-accent2 mb-1">
                💰 Funds Available for Withdrawal
              </h3>
              <p className="text-sm text-muted">
                From completed or cancelled rentals — ready to claim.
              </p>
            </div>
            <div className="flex items-center gap-5 flex-shrink-0">
              <EthAmount weiAmount={pendingBalance} className="text-3xl font-mono text-text" />
              <button
                onClick={() => withdraw()}
                disabled={isWithdrawing}
                className="px-6 py-2.5 bg-accent2 hover:bg-accent2/90 text-background font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,212,170,0.3)] disabled:opacity-50 text-sm"
              >
                {isWithdrawing ? "Processing..." : "Withdraw ETH"}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-border mb-8">
          <div className="flex gap-0">
            {(["LISTINGS", "BOOKINGS"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-bold transition-all relative ${
                  tab === t ? "text-accent" : "text-muted hover:text-text"
                }`}
              >
                {t === "LISTINGS" ? `My Listings (${myListings.length})` : `My Bookings (${myBookings.length})`}
                {tab === t && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 glass-panel animate-pulse bg-surface/30" />
            ))}
          </div>
        ) : activeDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl">
            <span className="text-5xl mb-4">{tab === "LISTINGS" ? "🏠" : "🗝️"}</span>
            <h3 className="font-display text-xl font-bold mb-2">
              {tab === "LISTINGS" ? "No properties listed" : "No bookings found"}
            </h3>
            <p className="text-muted mb-6 max-w-xs">
              {tab === "LISTINGS"
                ? "You haven't listed any properties yet."
                : "You haven't booked any properties yet."}
            </p>
            {tab === "LISTINGS" ? (
              <Link to="/create" className="btn-primary flex items-center gap-2">
                <PlusCircle size={16} /> Create Listing
              </Link>
            ) : (
              <Link to="/listings" className="btn-primary">Browse Listings</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeDisplay.map((rental: Rental) => (
              <RentalCard key={rental.id.toString()} rental={rental} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
