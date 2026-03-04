import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al Ain Museum — Hall 7 Explorer",
  description:
    "An interactive WebAR experience for children. Explore the wonders of Hall 7 at Al Ain Museum.",
  openGraph: {
    title: "Al Ain Museum — Hall 7 Explorer",
    description: "Scan artifacts, meet your avatar guide, and share your adventure!",
    siteName: "Al Ain Museum",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Import map: load three.js + spark.js from CDN, bypassing webpack */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.178.0/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.178.0/examples/jsm/",
                "@sparkjsdev/spark":
                  "https://sparkjs.dev/releases/spark/0.1.10/spark.module.js",
              },
            }),
          }}
        />
      </head>
      <body>
        <div id="mobile-wrapper">{children}</div>
      </body>
    </html>
  );
}
