"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Lock, Globe, CheckCircle2, XCircle, BrainCircuit, Code2, Network, Coins, Users, Cpu, GraduationCap } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col pt-32 pb-20">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>

      {/* ─── Hero Section ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-16 mb-32">
        <motion.div
          className="flex-1 space-y-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-primary/30 text-secondary text-sm font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse block"></span>
            Decentralized Escrow Live on Sepolia
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
            Trustless Rentals. <br />
            <span className="text-gradient">Automated Escrow.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl font-sans font-light leading-relaxed">
            VaultStay is the next-generation protocol for short stays and long-term leases. Eliminate custodial middlemen and let smart contracts unconditionally secure your funds.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all neon-glow flex items-center justify-center gap-2">
                Launch DApp <ArrowRight size={20} />
              </button>
            </Link>
            <Link href="#comparisons" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel-hover font-semibold transition-all flex items-center justify-center gap-2 text-white/80 hover:text-white">
                Why VaultStay?
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="flex-1 w-full max-w-xl relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-xl opacity-20 animate-pulse-slow"></div>
          <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
            <Image
              src="/images/hero.png"
              alt="VaultStay Cyberpunk Hero"
              fill
              className="object-cover opacity-90 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass-panel rounded-2xl p-6 backdrop-blur-xl bg-black/40 border-t border-l border-white/20">
                <h3 className="text-xl font-display font-semibold mb-2 flex items-center gap-2">
                  <Lock className="text-secondary" size={20} /> Cryptographically Secured
                </h3>
                <p className="text-sm text-white/60">Rent and Security deposits are locked safely on the blockchain until programmatic conditions are met.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Bento Grid Features ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 mb-32" id="features">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-display font-bold mb-6">The VaultStay Advantage</h2>
          <p className="text-lg text-white/50">Designed around strict Web3 principles, our protocol redefines how peers handle high-stakes rental agreements securely.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 auto-rows-[300px]">
          {/* Large Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-2 md:row-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden group border border-white/5 hover:border-primary/30 transition-colors"
          >
            <div className="relative z-10 h-full flex flex-col justify-end max-w-sm">
              <ShieldCheck className="text-primary mb-4" size={32} />
              <h3 className="text-3xl font-display font-bold mb-4">Immutable Execution</h3>
              <p className="text-white/60 leading-relaxed text-lg">
                Centralized platforms arbitrarily control payouts, deposits, and dispute resolutions. VaultStay executes unconditionally. No human intervention. No delayed refunds.
              </p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-40 group-hover:opacity-70 transition-opacity duration-500 mask-image-gradient">
              <Image src="/images/security.png" alt="Smart Contract Security" fill className="object-cover" />
            </div>
          </motion.div>

          {/* Smaller Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="glass-panel rounded-3xl p-8 flex flex-col justify-between border border-white/5 hover:border-secondary/30 transition-colors relative overflow-hidden"
          >
            <Zap className="text-secondary relative z-10" size={32} />
            <div className="relative z-10">
              <h3 className="text-xl font-display font-bold mb-2">Instant Payouts</h3>
              <p className="text-sm text-white/50">Upon checkout, smart contracts automatically disperse the rent to the landlord and return the deposit to the tenant within blocks.</p>
            </div>
          </motion.div>

          {/* Smaller Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="glass-panel rounded-3xl p-8 flex flex-col justify-between border border-white/5 hover:border-primary/30 transition-colors relative overflow-hidden group"
          >
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
              <Image src="/images/network.png" alt="Global Network" fill className="object-cover" />
            </div>
            <Globe className="text-white relative z-10" size={32} />
            <div className="relative z-10">
              <h3 className="text-xl font-display font-bold mb-2">Border-less Access</h3>
              <p className="text-sm text-white/50">Connecting Landlords and Tenants worldwide using neutral ETH as the standard mechanism of exchange.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Competitor Comparison ─── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 mb-20" id="comparisons">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold mb-6">VaultStay vs Competitors</h2>
          <p className="text-lg text-white/50">Why decentralized smart contracts beat the legacy hospitality industry.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-6 text-white/40 font-medium border-b border-white/10 w-1/3">Feature</th>
                <th className="p-6 font-display font-bold text-xl border-b border-white/10 bg-primary/10 rounded-t-xl text-white">VaultStay</th>
                <th className="p-6 font-display font-bold text-xl border-b border-white/10 text-white/50">Centralized OTA (e.g. Airbnb, Booking)</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-6 border-b border-white/5 font-medium">Custody of Funds</td>
                <td className="p-6 border-b border-white/5 bg-primary/5 text-primary"><span className="flex items-center gap-2"><CheckCircle2 size={16} /> Trustless Smart Contract</span></td>
                <td className="p-6 border-b border-white/5"><span className="flex items-center gap-2"><XCircle size={16} className="text-red-400" /> Held by 3rd Party Corporation</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-6 border-b border-white/5 font-medium">Service Fees</td>
                <td className="p-6 border-b border-white/5 bg-primary/5 text-primary"><span className="flex items-center gap-2"><CheckCircle2 size={16} /> ~0% (Only Gas Fees)</span></td>
                <td className="p-6 border-b border-white/5"><span className="flex items-center gap-2"><XCircle size={16} className="text-red-400" /> 15-20% Host + Guest Fees</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-6 border-b border-white/5 font-medium">Payout Speed</td>
                <td className="p-6 border-b border-white/5 bg-primary/5 text-primary"><span className="flex items-center gap-2"><CheckCircle2 size={16} /> Instant (Block Confirmation)</span></td>
                <td className="p-6 border-b border-white/5"><span className="flex items-center gap-2"><XCircle size={16} className="text-red-400" /> 3-5 Business Days</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-6 border-b border-white/5 font-medium">Account Access</td>
                <td className="p-6 border-b border-white/5 bg-primary/5 text-primary rounded-b-xl"><span className="flex items-center gap-2"><CheckCircle2 size={16} /> Non-Custodial Wallet</span></td>
                <td className="p-6 border-b border-white/5"><span className="flex items-center gap-2"><XCircle size={16} className="text-red-400" /> Can be banned at any time</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── Academic Problem Analysis & Design ─── */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 mb-32" id="academic">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-white/10 text-white/70 text-sm font-medium tracking-wide mb-6">
              <GraduationCap size={16} className="text-primary" /> Academic Research Framework
            </div>
            <h2 className="text-4xl font-display font-bold mb-6">Problem Analysis & System Design</h2>
            <p className="text-lg text-white/50">Addressing core inefficiencies in centralized hospitality through algorithmic decentralization.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Problem Domain */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-red-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div>
              <BrainCircuit className="text-red-400 mb-6" size={36} />
              <h3 className="text-2xl font-display font-bold mb-4 text-white">Problem Domain</h3>
              <ul className="space-y-4 text-white/60">
                <li className="flex items-start gap-3"><span className="text-red-400 font-bold mt-1">•</span> <p><strong>Custodial Risk:</strong> Platforms hold both renter deposit and host revenue, creating severe single-point-of-failure risks.</p></li>
                <li className="flex items-start gap-3"><span className="text-red-400 font-bold mt-1">•</span> <p><strong>High Friction:</strong> Monopolies extract 15-20% service fees while delaying payouts by 3-5 business days.</p></li>
                <li className="flex items-start gap-3"><span className="text-red-400 font-bold mt-1">•</span> <p><strong>Opaque Resolution:</strong> Dispute handling relies on arbitrary human intervention rather than transparent logic.</p></li>
              </ul>
            </motion.div>

            {/* Card 2: Methodology */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
              <Network className="text-primary mb-6" size={36} />
              <h3 className="text-2xl font-display font-bold mb-4 text-white">Objectives & Methodology</h3>
              <ul className="space-y-4 text-white/60">
                <li className="flex items-start gap-3"><span className="text-primary font-bold mt-1">1.</span> <p><strong>Smart Contracts:</strong> Encoding the rental agreement (Rent, Deposit, Dates) immutably on the Ethereum Sepolia network.</p></li>
                <li className="flex items-start gap-3"><span className="text-primary font-bold mt-1">2.</span> <p><strong>State Machine:</strong> Escrow lifecycle moves strictly through <code className="text-primary/80 bg-primary/10 px-1 rounded border border-primary/20 mt-1 inline-block">Created/Funded/Active/Completed</code>.</p></li>
                <li className="flex items-start gap-3"><span className="text-primary font-bold mt-1">3.</span> <p><strong>Non-Custodial Frontend:</strong> A Next.js dApp interacting directly with RPC nodes, isolating funds from developers.</p></li>
              </ul>
            </motion.div>

            {/* Card 3: Algorithms */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-secondary/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full blur-2xl group-hover:bg-secondary/20 transition-colors"></div>
              <Code2 className="text-secondary mb-6" size={36} />
              <h3 className="text-2xl font-display font-bold mb-4 text-white">Algorithmic Relevance</h3>
              <ul className="space-y-4 text-white/60">
                <li className="flex items-start gap-3"><span className="text-secondary font-bold mt-1">•</span> <p><strong>Time-Locked Hooks:</strong> Using <code className="text-secondary/80 bg-secondary/10 px-1 rounded border border-secondary/20">block.timestamp</code> to compute cancellation eligibility bounds atomically.</p></li>
                <li className="flex items-start gap-3"><span className="text-secondary font-bold mt-1">•</span> <p><strong>CEI Pattern:</strong> Enforcing Checks-Effects-Interactions and <code className="text-secondary/80 bg-secondary/10 px-1 rounded border border-secondary/20">ReentrancyGuard</code> to zero ledgers before invoking external calls.</p></li>
                <li className="flex items-start gap-3"><span className="text-secondary font-bold mt-1">•</span> <p><strong>Atomic execution:</strong> Rent distribution and deposit unlocking execute in a single, unbreakable block.</p></li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* ─── Business Model ─── */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 mb-32" id="business">
          <div className="glass-panel border border-white/10 rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

            <div className="relative z-10 flex flex-col xl:flex-row gap-12 lg:gap-24 items-center">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">Business Model Canvas</div>
                <h2 className="text-4xl md:text-5xl font-display font-bold">Disrupting a <span className="text-gradient drop-shadow-[0_0_20px_rgba(108,92,231,0.5)]"> $100B Market</span></h2>
                <p className="text-xl text-white/60 font-light leading-relaxed">
                  VaultStay replaces the high-overhead corporate hospitality model with hyper-efficient computational architecture, enabling 0% base fees for a massive competitive advantage.
                </p>
              </div>

              <div className="flex-[1.5] grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-primary/50 transition-colors shadow-2xl">
                  <Coins className="text-primary mb-5" size={32} />
                  <h4 className="text-xl font-display font-bold mb-3 text-white">Revenue Strategy</h4>
                  <p className="text-sm text-white/60 leading-relaxed"><strong>Freemium Protocol:</strong> Flat 0% omission fee on rent. Monetized via premium up-sells like ZK-Proof Reputation Passports and 1% fiat credit-card onramps.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-secondary/50 transition-colors shadow-2xl">
                  <Users className="text-secondary mb-5" size={32} />
                  <h4 className="text-xl font-display font-bold mb-3 text-white">Target Audience</h4>
                  <p className="text-sm text-white/60 leading-relaxed"><strong>Crypto-Native Nomads</strong> wanting seamless Web3 rentals, and <strong>Independent Landlords</strong> exhausted by 20% platform take-rates and delayed fiat payouts.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="sm:col-span-2 bg-gradient-to-r from-primary/20 to-secondary/10 backdrop-blur-xl rounded-2xl p-8 border border-primary/30 hover:border-primary/60 transition-colors flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-[0_0_30px_rgba(108,92,231,0.1)]">
                  <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center shrink-0 border border-white/10">
                    <Cpu className="text-white" size={32} />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-xl font-display font-bold mb-2 text-white">Hyper-Deflationary Cost Structure</h4>
                    <p className="text-sm text-white/70 leading-relaxed">Near-zero infrastructure costs. By hosting state directly on the Ethereum Virtual Machine (EVM), heavy server arrays and database maintenance overhead is entirely bypassed, allowing margins impossibl for Web2 competitors.</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <Link href="/dashboard">
            <button className="px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-white/90 transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Start Hosting / Renting Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
