// app/api/agents/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getUserAgents } from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const agents = await getUserAgents(user.id);

        return NextResponse.json({ agents });
    } catch (error: any) {
        console.error("Error fetching agents:", error);
        return NextResponse.json(
            { error: "Failed to fetch agents", details: error.message },
            { status: 500 }
        );
    }
}

