import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();

        const result = await db
            .update(bookings)
            .set({
                status: body.status,
                txHash: body.txHash || undefined,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error(`PATCH /api/bookings/${params.id} error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const result = await db.select().from(bookings).where(eq(bookings.id, id));

        if (result.length === 0) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error(`GET /api/bookings/${params.id} error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
