"use client";

import { useEffect, useRef, useState } from "react";

interface SparkViewerProps {
    url?: string;
    className?: string;
}

// Use Function constructor to prevent webpack from statically analyzing
// these CDN imports — they are resolved by the browser importmap at runtime
async function dynamicImport(specifier: string): Promise<any> {
    // eslint-disable-next-line no-new-func
    return new Function(`return import("${specifier}")`)();
}

export default function SparkViewer({
    url = "/models/AlAinMuseum_test_Hall7.sog",
    className = "",
}: SparkViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(5);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // WebGL2 check
        const testCanvas = document.createElement("canvas");
        if (!testCanvas.getContext("webgl2")) {
            setError("WebGL2 is not supported on this device.");
            return;
        }

        let animId: number;
        let rendererInst: any;
        let roInst: ResizeObserver;
        const disposals: Array<() => void> = [];

        const runViewer = async () => {
            try {
                // Import via Function() so webpack can't intercept —
                // the browser resolves these from the importmap in layout.tsx
                const THREE = await dynamicImport("three");
                const { SplatMesh, SparkRenderer } = await dynamicImport("@sparkjsdev/spark");

                // ── Renderer ─────────────────────────────────────
                // Optimized for 3D Gaussian Splatting: antialiasing is turned OFF,
                // and pixel ratio is locked at 1. 3DGS is extremely fill-rate heavy
                // and already appears "soft", so AA/high res is a massive waste of GPU.
                const renderer = new THREE.WebGLRenderer({ antialias: false });
                renderer.setPixelRatio(1);
                renderer.setSize(container.clientWidth, container.clientHeight);
                Object.assign(renderer.domElement.style, {
                    position: "absolute", inset: "0", width: "100%", height: "100%",
                });
                container.appendChild(renderer.domElement);
                rendererInst = renderer;
                disposals.push(() => {
                    renderer.dispose();
                    if (container.contains(renderer.domElement))
                        container.removeChild(renderer.domElement);
                });

                // ── Scene & Camera ────────────────────────────────
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(
                    60, container.clientWidth / container.clientHeight, 0.1, 1000
                );
                scene.add(camera);

                // ── SparkRenderer (add as child of camera per docs) ─
                const spark = new SparkRenderer({ renderer });
                camera.add(spark);
                spark.newViewpoint({ camera, autoUpdate: true });

                // ── Load the SOG splat ──────────────────────────
                const splatMesh = new SplatMesh({ url });
                scene.add(splatMesh);

                // ── FlyControls ──────────────────────────────
                const { FlyControls } = await dynamicImport("three/addons/controls/FlyControls.js");
                const controls = new FlyControls(camera, renderer.domElement);
                controls.movementSpeed = 1.0; // Adjust for reasonable walking speed
                controls.rollSpeed = Math.PI / 12;
                controls.autoForward = false;
                controls.dragToLook = true; // Allows looking around by dragging

                // Initial position
                camera.position.set(0.00010143054113285909, 4.156316503962698, -0.07325761080600836);

                // Keep the target by setting the initial rotation to look at it
                camera.lookAt(0, 0, 0);

                (window as any).debugCamera = camera;
                (window as any).debugControls = controls;

                // ── Render loop ──────────────────────────────────
                const clock = new THREE.Clock();
                const animate = () => {
                    animId = requestAnimationFrame(animate);
                    const delta = clock.getDelta();
                    controls.update(delta);
                    renderer.render(scene, camera);
                };
                animate();

                // ── Progress polling ─────────────────────────────
                const poll = setInterval(() => {
                    try {
                        let p = 0;
                        const ps = splatMesh.packedSplats;
                        if (ps && typeof ps.loadProgress === "number") p = ps.loadProgress;
                        else if (typeof splatMesh.loadProgress === "number") p = splatMesh.loadProgress;
                        else if (splatMesh.numSplats > 0) p = 1;

                        setProgress(Math.max(5, Math.round(p * 100)));

                        if (p >= 1) {
                            clearInterval(poll);
                            setLoaded(true);
                        }
                    } catch { /* silent */ }
                }, 300);
                disposals.push(() => clearInterval(poll));

                // ── Resize ───────────────────────────────────────
                roInst = new ResizeObserver(() => {
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(container.clientWidth, container.clientHeight);
                });
                roInst.observe(container);
                disposals.push(() => roInst.disconnect());

            } catch (err: any) {
                console.error("SparkViewer:", err);
                setError(`3D scene error: ${err?.message ?? String(err)}`);
            }
        };

        runViewer();

        return () => {
            cancelAnimationFrame(animId);
            disposals.forEach((f) => f());
        };
    }, [url]);

    return (
        <div ref={containerRef} className={`relative w-full h-full ${className}`}>
            {!loaded && !error && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--background)]">
                    <div className="mb-6 flex flex-col items-center gap-3">
                        <div className="text-5xl float">🏛️</div>
                        <p className="text-lg font-bold text-[var(--text-main)]">Loading Hall 7…</p>
                    </div>
                    <div className="w-56 h-3 rounded-full bg-[var(--secondary)] overflow-hidden">
                        <div
                            className="h-full rounded-full loading-shimmer transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-soft)] font-semibold">{progress}%</p>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--background)] text-center px-8 gap-3">
                    <div className="text-6xl">🖼️</div>
                    <h2 className="text-xl font-bold text-[var(--text-main)]">Viewer Unavailable</h2>
                    <p className="text-[var(--text-soft)] text-sm">{error}</p>
                </div>
            )}
        </div>
    );
}
