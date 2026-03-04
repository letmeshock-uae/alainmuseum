"use client";

import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAvatarStore, type AvatarType } from "@/features/avatar/useAvatarStore";

const avatars = [
    { type: "BOY" as AvatarType, emoji: "👦", label: "Explorer", color: "#D4A373" },
    { type: "GIRL" as AvatarType, emoji: "👧", label: "Dreamer", color: "#E9EDC9" },
    { type: "NEUTRAL" as AvatarType, emoji: "🧒", label: "Adventurer", color: "#FAEDCD" },
];

const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};
const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 18 } },
};

export default function AvatarSetupPage() {
    const [selected, setSelected] = useState<AvatarType | null>(null);
    const setAvatar = useAvatarStore((s) => s.setAvatar);
    const router = useRouter();

    function confirm() {
        if (!selected) return;
        setAvatar(selected);
        router.push("/tour/hall-7");
    }

    return (
        <main className="flex flex-col items-center justify-between min-h-svh px-6 py-10"
            style={{ background: "radial-gradient(ellipse at 50% 20%, #FAEDCD 0%, #FEFAE0 70%)" }}>

            <motion.div
                className="w-full flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-[var(--text-main)]">Choose Your Guide</h1>
                <p className="text-[var(--text-soft)] text-sm">Who will explore Hall 7 with you?</p>
            </motion.div>

            <motion.div
                className="flex flex-col gap-4 w-full max-w-sm mt-8"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {avatars.map((av) => (
                    <motion.button
                        key={av.type}
                        className={`glass rounded-2xl p-5 flex items-center gap-5 text-left transition-all duration-200 border-2 ${selected === av.type
                            ? "border-[var(--primary)] scale-[1.02] shadow-xl"
                            : "border-transparent"
                            }`}
                        variants={item}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelected(av.type)}
                    >
                        <span className="text-5xl">{av.emoji}</span>
                        <div>
                            <p className="text-xl font-bold text-[var(--text-main)]">{av.label}</p>
                            <p className="text-sm text-[var(--text-soft)]">
                                {av.type === "BOY" && "Bold and curious, loves adventures"}
                                {av.type === "GIRL" && "Creative and imaginative storyteller"}
                                {av.type === "NEUTRAL" && "Free spirit, sees the world differently"}
                            </p>
                        </div>
                        {selected === av.type && (
                            <motion.span
                                className="ml-auto text-2xl"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                ✅
                            </motion.span>
                        )}
                    </motion.button>
                ))}
            </motion.div>

            <motion.button
                className="btn-primary w-full max-w-sm mt-8"
                style={{ opacity: selected ? 1 : 0.45 }}
                whileTap={{ scale: selected ? 0.96 : 1 }}
                onClick={confirm}
                aria-disabled={!selected}
            >
                {selected ? "🚀 Explore Hall 7!" : "Select an avatar first"}
            </motion.button>
        </main>
    );
}
