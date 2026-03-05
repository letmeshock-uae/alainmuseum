"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useRef } from "react";
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
    { id: "falcon-statue", label: "Falcon Statue", emoji: "🦅", position: [0, 4.0, -3] as [number, number, number] }, // Front
    { id: "ancient-pottery", label: "Ancient Pottery", emoji: "🏺", position: [3, 4.0, 0] as [number, number, number] }, // Right
    { id: "brass-astrolabe", label: "Brass Astrolabe", emoji: "⚙️", position: [0, 4.0, 3] as [number, number, number] }, // Back
    { id: "palm-leaf-script", label: "Palm Leaf Script", emoji: "📜", position: [-3, 4.0, 0] as [number, number, number] }, // Left
];

export default function HallPage() {
    const avatar = useAvatarStore((s) => s.type);
    const router = useRouter();
    const [showHotspots, setShowHotspots] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [poiCoords, setPoiCoords] = useState<Record<string, { x: number, y: number, z: number }>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const avatarEmoji = avatar === "BOY" ? "👦" : avatar === "GIRL" ? "👧" : "🧒";

    return (
        <main className="relative flex flex-col h-svh overflow-hidden bg-black">
            {/* ── Hidden File Input for Native AR/Camera ── */}
            <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
            />

            {/* ── 3DGS Viewer (full screen) ───────────────────── */}
            <div className="absolute inset-0">
                <SparkViewer
                    url="/models/AlAinMuseum_test_Hall7.sog"
                    className="w-full h-full"
                    onLoad={() => setIsLoaded(true)}
                    pois={ARTIFACTS}
                    onPoiUpdate={setPoiCoords}
                />
            </div>

            {/* ── Top bar ──────────────────────────────────────── */}
            <AnimatePresence>
                {isLoaded && (
                    <motion.div
                        className="relative z-20 flex items-center justify-between px-4 pt-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Artifact Hotspots ────────────────────────────── */}
            <AnimatePresence>
                {isLoaded && showHotspots &&
                    ARTIFACTS.map((art, i) => {
                        const coords = poiCoords[art.id];
                        // Only show if we have coordinates and it's physically in front of the camera (z < 1)
                        if (!coords || coords.z > 1) return null;

                        return (
                            <motion.button
                                key={art.id}
                                className="absolute z-20 glass rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg w-max"
                                style={{
                                    left: `${coords.x}px`,
                                    top: `${coords.y}px`,
                                }}
                                initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
                                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                                exit={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
                                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.push(`/tour/hall-7/${art.id}`)}
                            >
                                <span className="text-xl pulse-glow rounded-full shrink-0">{art.emoji}</span>
                                <span className="text-xs font-bold text-[var(--text-main)] max-w-[90px] leading-tight text-left">
                                    {art.label}
                                </span>
                            </motion.button>
                        );
                    })}
            </AnimatePresence>

            {/* ── Bottom action bar ────────────────────────────── */}
            <AnimatePresence>
                {isLoaded && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6">
                        <motion.div
                            className="glass rounded-3xl px-5 py-4 flex items-center justify-between"
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        >
                            <div>
                                <p className="text-xs text-[var(--text-soft)] font-semibold">Hall 7 — Al Ain</p>
                                <p className="text-sm font-bold text-[var(--text-main)]">Drag to explore 360°</p>
                            </div>
                            <motion.button
                                className="btn-primary text-sm px-4 py-2 !rounded-2xl"
                                whileTap={{ scale: 0.93 }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                📷 Open AR
                            </motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
