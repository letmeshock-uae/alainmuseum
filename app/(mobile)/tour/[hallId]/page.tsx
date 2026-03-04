"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useAvatarStore } from "@/features/avatar/useAvatarStore";

// Dynamic import prevents spark.js from running server-side
const SparkViewer = dynamic(() => import("@/components/3d/SparkViewer"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
            <span className="text-4xl float">🏛️</span>
        </div>
    ),
});

const ARTIFACTS = [
    { id: "falcon-statue", label: "Falcon Statue", emoji: "🦅", pos: { top: "30%", left: "20%" } },
    { id: "ancient-pottery", label: "Ancient Pottery", emoji: "🏺", pos: { top: "55%", left: "65%" } },
    { id: "brass-astrolabe", label: "Brass Astrolabe", emoji: "⚙️", pos: { top: "20%", left: "70%" } },
    { id: "palm-leaf-script", label: "Palm Leaf Script", emoji: "📜", pos: { top: "70%", left: "35%" } },
];

export default function HallPage() {
    const avatar = useAvatarStore((s) => s.type);
    const router = useRouter();
    const [showHotspots, setShowHotspots] = useState(true);

    const avatarEmoji = avatar === "BOY" ? "👦" : avatar === "GIRL" ? "👧" : "🧒";

    return (
        <main className="relative flex flex-col h-svh overflow-hidden bg-black">
            {/* ── 3DGS Viewer (full screen) ───────────────────── */}
            <div className="absolute inset-0">
                <SparkViewer url="/models/AlAinMuseum_test_Hall7.sog" className="w-full h-full" />
            </div>

            {/* ── Top bar ──────────────────────────────────────── */}
            <div className="relative z-20 flex items-center justify-between px-4 pt-4">
                <Link href="/avatar-setup">
                    <motion.button
                        className="glass-dark rounded-full px-4 py-2 text-white text-sm font-bold flex items-center gap-2"
                        whileTap={{ scale: 0.93 }}
                    >
                        ← Back
                    </motion.button>
                </Link>

                <motion.div
                    className="glass rounded-2xl px-4 py-2 flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span className="text-xl">{avatarEmoji}</span>
                    <span className="text-sm font-bold text-[var(--text-main)]">Hall 7</span>
                </motion.div>

                <motion.button
                    className="glass-dark rounded-full px-3 py-2 text-white text-sm font-bold"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setShowHotspots((v) => !v)}
                >
                    {showHotspots ? "👁 Hide" : "👁 Show"}
                </motion.button>
            </div>

            {/* ── Artifact Hotspots ────────────────────────────── */}
            <AnimatePresence>
                {showHotspots &&
                    ARTIFACTS.map((art, i) => (
                        <motion.button
                            key={art.id}
                            className="absolute z-20 glass rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg"
                            style={art.pos as React.CSSProperties}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ delay: i * 0.1, type: "spring", stiffness: 280 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(`/tour/hall-7/${art.id}`)}
                        >
                            <span className="text-xl pulse-glow rounded-full">{art.emoji}</span>
                            <span className="text-xs font-bold text-[var(--text-main)] max-w-[80px] leading-tight text-left">
                                {art.label}
                            </span>
                        </motion.button>
                    ))}
            </AnimatePresence>

            {/* ── Bottom action bar ────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6">
                <motion.div
                    className="glass rounded-3xl px-5 py-4 flex items-center justify-between"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                    <div>
                        <p className="text-xs text-[var(--text-soft)] font-semibold">Hall 7 — Al Ain</p>
                        <p className="text-sm font-bold text-[var(--text-main)]">Drag to explore 360°</p>
                    </div>
                    <motion.button
                        className="btn-primary text-sm px-4 py-2"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => router.push("/tour/hall-7/ar")}
                    >
                        📷 Open AR
                    </motion.button>
                </motion.div>
            </div>
        </main>
    );
}
