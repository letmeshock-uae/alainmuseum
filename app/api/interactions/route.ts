import { NextResponse } from "next/server";

// Phase 1 stub: stores in-memory. Replace with Drizzle insert when DB is ready.
const log: Array<{ sessionId: string; artifactId: string; actionType: string; ts: string }> = [];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sessionId, artifactId, actionType } = body;
        if (!sessionId || !artifactId || !actionType) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const entry = { sessionId, artifactId, actionType, ts: new Date().toISOString() };
        log.push(entry);
        console.log("[interaction]", entry);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
}

export async function GET() {
    return NextResponse.json(log);
}
