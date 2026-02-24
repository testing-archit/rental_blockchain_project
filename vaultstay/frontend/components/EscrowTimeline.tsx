"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, PlayCircle, Lock } from "lucide-react";
import clsx from "clsx";

export type EscrowStatus = 0 | 1 | 2 | 3 | 4; // Created, Funded, Active, Completed, Cancelled

const STAGES = [
    { label: "Created", icon: Clock },
    { label: "Funded", icon: Lock },
    { label: "Active", icon: PlayCircle },
    { label: "Completed", icon: CheckCircle2 },
];

export default function EscrowTimeline({ status }: { status: EscrowStatus }) {
    if (status === 4) {
        return (
            <div className="w-full py-4 text-center text-error font-semibold glass-panel rounded-xl">
                Booking Cancelled
            </div>
        );
    }

    // Active status mappings:
    // 0: Created -> Step 0 (0 steps complete)
    // 1: Funded -> Step 1 (1 step complete, lock active)
    // 2: Active -> Step 2 (2 steps complete, stay active)
    // 3: Completed -> Step 3 (all complete)

    const currentStep = status;

    return (
        <div className="w-full max-w-3xl mx-auto py-6">
            <div className="relative flex justify-between items-center">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0"></div>

                {/* Animated Progress Bar Fill */}
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary to-secondary rounded-full z-0"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(currentStep / (STAGES.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />

                {STAGES.map((stage, i) => {
                    const isCompleted = i <= currentStep;
                    const isActive = i === currentStep;
                    const Icon = stage.icon;

                    return (
                        <div key={stage.label} className="relative z-10 flex flex-col items-center gap-2">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    opacity: isCompleted ? 1 : 0.4,
                                    backgroundColor: isCompleted ? "#141420" : "#0A0A0F"
                                }}
                                className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500",
                                    isCompleted ? "border-secondary text-secondary shadow-[0_0_15px_rgba(0,245,212,0.4)]" : "border-white/20 text-white/40"
                                )}
                            >
                                <Icon size={18} />
                            </motion.div>
                            <span className={clsx(
                                "text-xs md:text-sm font-medium tracking-wide transition-colors duration-500",
                                isCompleted ? "text-white" : "text-white/40"
                            )}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
