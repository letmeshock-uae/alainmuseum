import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hall 7 — Al Ain Museum",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
