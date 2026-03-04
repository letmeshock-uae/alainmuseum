"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";

const ARTIFACT_DATA: Record<string, {
    label: string; emoji: string; era: string; description: string;
}> = {
    "falcon-statue": {
        label: "Falcon Statue",
        emoji: "🦅",
        era: "3rd century BCE",
        description:
            "The falcon was a sacred symbol in the ancient Arabian Peninsula. This bronze statue was used in ceremonial rituals and is one of the finest examples of early Gulf metallurgy.",
    },
    "ancient-pottery": {
        label: "Ancient Pottery",
        emoji: "🏺",
        era: "1st millennium BCE",
        description:
            "Crafted by the Hafeet period settlers, this pottery reveals sophisticated kiln techniques. The geometric patterns represent celestial bodies and agricultural cycles.",
    },
    "brass-astrolabe": {
        label: "Brass Astrolabe",
        emoji: "⚙️",
        era: "12th century CE",
        description:
            "An astronomical instrument used for navigation and timekeeping. Al Ain traders used astrolabes like this one to navigate ancient trade routes across the desert.",
    },
    "palm-leaf-script": {
        label: "Palm Leaf Script",
        emoji: "📜",
        era: "15th century CE",
        description:
            "Written on treated palm leaves, this manuscript contains poetry and records of the falaj irrigation system. It's one of the oldest written documents found in the UAE.",
    },
};

export default function ArtifactPage() {
    const { artifactId } = useParams<{ artifactId: string }>();
    const router = useRouter();
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const info = ARTIFACT_DATA[artifactId] ?? {
        label: artifactId,
        emoji: "🔍",
        era: "Unknown",
        description: "This artifact is currently being catalogued. Check back soon!",
    };

    function toggleAudio() {
        // In production, play a real audio URL. For PoC we use a TTS-style mock.
        setPlaying((v) => !v);
    }

    return (
        <main
            className="flex flex-col min-h-svh"
            style={{ background: "linear-gradient(180deg, #FEFAE0 0%, #E9EDC9 100%)" }}
        >
            {/* Back button */}
            <div className="px-4 pt-5 pb-2">
                <motion.button
                    className="glass rounded-full px-4 py-2 text-sm font-bold text-[var(--text-main)] flex items-center gap-2"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => router.back()}
                >
                    ← Hall 7
                </motion.button>
            </div>

            {/* Hero */}
            <motion.div
                className="flex flex-col items-center justify-center pt-10 pb-6 px-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
            >
                <motion.span
                    className="text-8xl mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    {info.emoji}
                </motion.span>
                <h1 className="text-3xl font-bold text-[var(--text-main)] text-center">
                    {info.label}
                </h1>
                <span className="mt-2 px-3 py-1 glass rounded-full text-xs font-semibold text-[var(--text-soft)]">
                    ⏳ {info.era}
                </span>
            </motion.div>

            {/* Description card */}
            <motion.div
                className="glass mx-4 rounded-3xl p-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            >
                <p className="text-base text-[var(--text-main)] leading-relaxed font-medium">
                    {info.description}
                </p>

                {/* Audio narration */}
                <motion.button
                    className="mt-5 flex items-center gap-3 w-full glass-dark rounded-2xl px-4 py-3"
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleAudio}
                >
                    <motion.span
                        className="text-2xl"
                        animate={playing ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}
                    >
                        {playing ? "🔊" : "🎧"}
                    </motion.span>
                    <div className="text-left">
                        <p className="text-white font-bold text-sm">
                            {playing ? "Playing narration…" : "Listen to the story"}
                        </p>
                        <p className="text-white/60 text-xs">Audio guide by curator</p>
                    </div>
                    {playing && (
                        <div className="ml-auto flex gap-1 items-end h-4">
                            {[0, 0.2, 0.4].map((delay) => (
                                <motion.div
                                    key={delay}
                                    className="w-1 bg-[var(--primary)] rounded-full"
                                    animate={{ height: [4, 14, 4] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                                />
                            ))}
                        </div>
                    )}
                </motion.button>
            </motion.div>

            {/* Fun fact */}
            <motion.div
                className="mx-4 mt-4 rounded-3xl px-5 py-4"
                style={{ background: "linear-gradient(135deg, #D4A37340, #FAEDCD90)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-1">
                    ✨ Fun Fact
                </p>
                <p className="text-sm text-[var(--text-main)] font-medium">
                    Al Ain is a UNESCO World Heritage Site, home to the oldest known human
                    settlements in the UAE, dating back over 5,000 years!
                </p>
            </motion.div>

            {/* Take photo CTA */}
            <div className="flex-1" />
            <div className="px-4 pb-8">
                <motion.button
                    className="btn-primary w-full"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/tour/hall-7`)}
                >
                    📷 Take a Photo with {info.emoji}
                </motion.button>
            </div>
        </main>
    );
}
