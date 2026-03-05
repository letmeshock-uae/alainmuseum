"use client";

import { useEffect, useRef, useState } from "react";

interface SparkViewerProps {
    url?: string;
    className?: string;
    onLoad?: () => void;
    pois?: { id: string; position: [number, number, number] }[];
    onPoiUpdate?: (poiCoords: Record<string, { x: number, y: number, z: number }>) => void;
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
    onLoad,
    pois = [],
    onPoiUpdate,
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

                // Initial position
                // NOTE: This scene uses Z as its vertical axis (up/down).
                // The museum floor is the XY plane. We lock camera.position.z.
                const initialCameraZ = -0.07325761080600836;
                camera.position.set(0.00010143054113285909, 4.156316503962698, initialCameraZ);
                camera.lookAt(0, 0, 0);

                // ── Custom FPS & Touch Controls ──────────────────────────────
                const initialQuaternion = camera.quaternion.clone();
                let yawDelta = 0;
                let pitchDelta = 0;

                // Cache initial horizontal forward direction (Z=0 guaranteed — floor is XY plane).
                // Rotating a Z=0 vector around the Z axis keeps Z=0.
                const _initFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(initialQuaternion);
                _initFwd.z = 0;
                if (_initFwd.length() > 0.001) _initFwd.normalize();
                const initialHorizontalForward = _initFwd;

                const moveState = { forward: false, backward: false, left: false, right: false };
                const moveSpeed = 1.5;
                const touchSensitivity = 0.005;

                const onKeyDown = (e: KeyboardEvent) => {
                    switch (e.code) {
                        case 'KeyW': case 'ArrowUp': moveState.forward = true; break;
                        case 'KeyS': case 'ArrowDown': moveState.backward = true; break;
                        case 'KeyA': case 'ArrowLeft': moveState.left = true; break;
                        case 'KeyD': case 'ArrowRight': moveState.right = true; break;
                    }
                };
                const onKeyUp = (e: KeyboardEvent) => {
                    switch (e.code) {
                        case 'KeyW': case 'ArrowUp': moveState.forward = false; break;
                        case 'KeyS': case 'ArrowDown': moveState.backward = false; break;
                        case 'KeyA': case 'ArrowLeft': moveState.left = false; break;
                        case 'KeyD': case 'ArrowRight': moveState.right = false; break;
                    }
                };
                window.addEventListener('keydown', onKeyDown);
                window.addEventListener('keyup', onKeyUp);
                disposals.push(() => {
                    window.removeEventListener('keydown', onKeyDown);
                    window.removeEventListener('keyup', onKeyUp);
                });

                let isDragging = false;
                let previousTouch: { x: number, y: number } | null = null;
                let initialPinchDist: number | null = null;

                const domElem = renderer.domElement;

                // Mouse Drag to Look
                domElem.addEventListener('mousedown', (e: MouseEvent) => {
                    isDragging = true;
                    previousTouch = { x: e.clientX, y: e.clientY };
                });
                const onMouseUp = () => { isDragging = false; previousTouch = null; };
                window.addEventListener('mouseup', onMouseUp);
                const onMouseMove = (e: MouseEvent) => {
                    if (!isDragging || !previousTouch) return;
                    const dx = e.clientX - previousTouch.x;
                    const dy = e.clientY - previousTouch.y;

                    yawDelta -= dx * touchSensitivity;
                    pitchDelta -= dy * touchSensitivity;
                    pitchDelta = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitchDelta));

                    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawDelta);
                    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchDelta);
                    camera.quaternion.copy(initialQuaternion).multiply(qYaw).multiply(qPitch);

                    previousTouch = { x: e.clientX, y: e.clientY };
                };
                window.addEventListener('mousemove', onMouseMove);
                disposals.push(() => {
                    window.removeEventListener('mouseup', onMouseUp);
                    window.removeEventListener('mousemove', onMouseMove);
                });

                // Touch: 1 finger to look, 2 fingers to move forward/backward (pinch)
                const onTouchStart = (e: TouchEvent) => {
                    if (e.touches.length === 1) {
                        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    } else if (e.touches.length === 2) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        initialPinchDist = Math.hypot(dx, dy);
                    }
                };
                domElem.addEventListener('touchstart', onTouchStart, { passive: false });

                const onTouchMove = (e: TouchEvent) => {
                    e.preventDefault(); // Prevents page scrolling when interacting with canvas
                    if (e.touches.length === 1 && previousTouch) {
                        const dx = e.touches[0].clientX - previousTouch.x;
                        const dy = e.touches[0].clientY - previousTouch.y;

                        yawDelta -= dx * touchSensitivity;
                        pitchDelta -= dy * touchSensitivity;
                        pitchDelta = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitchDelta));

                        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawDelta);
                        const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchDelta);
                        camera.quaternion.copy(initialQuaternion).multiply(qYaw).multiply(qPitch);

                        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    } else if (e.touches.length === 2 && initialPinchDist !== null) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        const dist = Math.hypot(dx, dy);
                        const deltaDist = dist - initialPinchDist;

                        // Derive horizontal forward from yaw only — around Z axis (scene up).
                        // Rotating a Z=0 vector around Z axis keeps Z=0 guaranteed.
                        const qYawOnly = new THREE.Quaternion().setFromAxisAngle(
                            new THREE.Vector3(0, 0, 1), yawDelta
                        );
                        const pinchDir = initialHorizontalForward.clone().applyQuaternion(qYawOnly);
                        // pinchDir.z is guaranteed 0 — no vertical movement possible.

                        camera.position.addScaledVector(pinchDir, deltaDist * 0.08);
                        // Lock Z (scene vertical axis)
                        camera.position.z = initialCameraZ;
                        initialPinchDist = dist;
                    }
                };
                domElem.addEventListener('touchmove', onTouchMove, { passive: false });

                const onTouchEnd = (e: TouchEvent) => {
                    if (e.touches.length < 2) initialPinchDist = null;
                    if (e.touches.length === 0) previousTouch = null;
                    if (e.touches.length === 1) {
                        previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    }
                };
                domElem.addEventListener('touchend', onTouchEnd);
                domElem.addEventListener('touchcancel', onTouchEnd);

                (window as any).debugCamera = camera;

                // ── Render loop ──────────────────────────────────
                const clock = new THREE.Clock();
                // Map to store POI Vector3 objects so we aren't creating them every frame
                const poiVectors = pois.map(p => ({
                    id: p.id,
                    vec: new THREE.Vector3(...p.position)
                }));

                const animate = () => {
                    animId = requestAnimationFrame(animate);
                    const delta = Math.min(clock.getDelta(), 0.1);
                    const currentSpeed = moveSpeed * delta;

                    // Get horizontal forward direction (floor = XY plane, Z is up)
                    const forwardDir = new THREE.Vector3();
                    camera.getWorldDirection(forwardDir);
                    forwardDir.z = 0; // zero the vertical (Z) component
                    if (forwardDir.length() > 0.001) forwardDir.normalize();

                    // Get horizontal right direction (cross: up(Z) × forward = right)
                    const rightDir = new THREE.Vector3();
                    rightDir.crossVectors(new THREE.Vector3(0, 0, 1), forwardDir).normalize();

                    if (moveState.forward) camera.position.addScaledVector(forwardDir, currentSpeed);
                    if (moveState.backward) camera.position.addScaledVector(forwardDir, -currentSpeed);
                    if (moveState.right) camera.position.addScaledVector(rightDir, currentSpeed);
                    if (moveState.left) camera.position.addScaledVector(rightDir, -currentSpeed);

                    // Lock Z (scene vertical axis) — enforce floor level
                    camera.position.z = initialCameraZ;

                    renderer.render(scene, camera);

                    // Project POIs to 2D Screen Space
                    if (onPoiUpdate && poiVectors.length > 0) {
                        const newCoords: Record<string, { x: number, y: number, z: number }> = {};

                        const w = container.clientWidth;
                        const h = container.clientHeight;
                        const w2 = w / 2;
                        const h2 = h / 2;

                        for (const p of poiVectors) {
                            // Clone the world position
                            const pos = p.vec.clone();
                            // Project puts the position into normalized device coordinates (-1 to +1)
                            pos.project(camera);

                            // Map NDC to pixel coordinates relative to the container
                            newCoords[p.id] = {
                                x: (pos.x * w2) + w2,
                                y: -(pos.y * h2) + h2,
                                z: pos.z // if z > 1, it's behind the camera near plane
                            };
                        }

                        onPoiUpdate(newCoords);
                    }
                };
                animate();

                // ── Progress polling ─────────────────────────────
                let fakeProgress = 5;
                const poll = setInterval(() => {
                    try {
                        let p = 0;
                        const ps = splatMesh.packedSplats;
                        if (ps && typeof ps.loadProgress === "number") p = ps.loadProgress;
                        else if (typeof splatMesh.loadProgress === "number") p = splatMesh.loadProgress;
                        else if (splatMesh.numSplats > 0) p = 1;

                        if (p >= 1) {
                            setProgress(100);
                            clearInterval(poll);
                            setLoaded(true);
                            onLoad?.();
                        } else {
                            // Asymptotically approach 95% if there's no real progress value
                            fakeProgress += (95 - fakeProgress) * 0.1;
                            // If p is reporting realistically (>0), use it, otherwise use fake smooth progress
                            const activeProgress = p > 0 ? p * 100 : fakeProgress;
                            setProgress(Math.max(5, Math.round(activeProgress)));
                        }
                    } catch { /* silent */ }
                }, 100);
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
