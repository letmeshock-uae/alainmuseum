"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SplashPage() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => router.push("/avatar-setup"), 3000);
        return () => clearTimeout(t);
    }, [router]);

    return (
        <main className="relative flex flex-col items-center justify-center min-h-svh overflow-hidden">
            {/* Gradient radial background */}
            <div
                className="absolute inset-0 -z-10"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 40%, #FAEDCD 0%, #E9EDC9 40%, #D4A373 100%)",
                }}
            />

            {/* Decorative floating circles */}
            <div className="absolute top-10 left-8 w-20 h-20 rounded-full bg-[var(--primary)] opacity-30 float" />
            <div className="absolute bottom-20 right-6 w-14 h-14 rounded-full bg-[var(--secondary)] opacity-40 float" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/3 right-4 w-8 h-8 rounded-full bg-[var(--accent)] opacity-50 float" style={{ animationDelay: "1.5s" }} />

            <motion.div
                className="flex flex-col items-center gap-6 px-8 text-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, mass: 1 }}
            >
                {/* Museum icon */}
                <motion.div
                    className="text-8xl drop-shadow-lg"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    🏛️
                </motion.div>

                <div>
                    <h1 className="text-4xl font-bold text-[var(--text-main)] leading-tight">
                        Al Ain Museum
                    </h1>
                    <p className="text-xl font-semibold text-[var(--primary)] mt-1">
                        Hall 7 Explorer
                    </p>
                </div>

                <p className="text-base text-[var(--text-soft)] max-w-xs">
                    Discover ancient wonders through augmented reality!
                </p>

                {/* Tap to start */}
                <motion.button
                    className="btn-primary pulse-glow mt-4"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => router.push("/avatar-setup")}
                >
                    ✨ Start Exploring
                </motion.button>

                <p className="text-xs text-[var(--text-soft)]">
                    Auto-starts in 3 seconds…
                </p>
            </motion.div>
        </main>
    );
}
