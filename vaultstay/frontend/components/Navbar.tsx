"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Navbar() {
    const { isConnected } = useAccount();

    return (
        <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <span className="text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
                        <span className="text-primary neon-glow rounded-full w-3 h-3 block" />
                        VaultStay
                    </span>
                </Link>

                {isConnected && (
                    <div className="hidden md:flex gap-6 ml-8 text-sm font-medium text-white/70">
                        <Link href="/dashboard" className="hover:text-secondary transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/create-booking" className="hover:text-secondary transition-colors">
                            New Booking
                        </Link>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <ConnectButton
                    accountStatus="address"
                    chainStatus="icon"
                    showBalance={false}
                />
            </div>
        </nav>
    );
}
