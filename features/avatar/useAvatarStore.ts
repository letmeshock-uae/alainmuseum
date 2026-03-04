import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AvatarType = "BOY" | "GIRL" | "NEUTRAL";

interface AvatarState {
    type: AvatarType | null;
    sessionId: string;
    setAvatar: (type: AvatarType) => void;
}

export const useAvatarStore = create<AvatarState>()(
    persist(
        (set) => ({
            type: null,
            sessionId: crypto.randomUUID(),
            setAvatar: (type) => set({ type }),
        }),
        { name: "alain-museum-avatar" }
    )
);
