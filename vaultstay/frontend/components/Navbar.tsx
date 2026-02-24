"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const { isConnected } = useAccount();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5 py-3 sm:py-4 section-padding">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/" onClick={() => setMobileOpen(false)}>
                        <span className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
                            <span className="text-primary neon-glow rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 block" />
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

                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <ConnectButton
                            accountStatus="address"
                            chainStatus="icon"
                            showBalance={false}
                        />
                    </div>
                    <div className="sm:hidden">
                        <ConnectButton
                            accountStatus="avatar"
                            chainStatus="none"
                            showBalance={false}
                        />
                    </div>

                    {/* Mobile hamburger */}
                    {isConnected && (
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile dropdown */}
            <AnimatePresence>
                {mobileOpen && isConnected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden overflow-hidden"
                    >
                        <div className="pt-4 pb-2 flex flex-col gap-3 max-w-7xl mx-auto">
                            <Link
                                href="/dashboard"
                                onClick={() => setMobileOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors text-sm font-medium"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/create-booking"
                                onClick={() => setMobileOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors text-sm font-medium"
                            >
                                New Booking
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
