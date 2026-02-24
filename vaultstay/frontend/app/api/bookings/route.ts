import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get("address");

        let results;
        if (address) {
            const addr = address.toLowerCase();
            results = await db.select().from(bookings).where(
                or(
                    eq(bookings.landlord, addr),
                    eq(bookings.tenant, addr)
                )
            );
        } else {
            results = await db.select().from(bookings);
        }

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("GET /api/bookings error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await db.insert(bookings).values({
            onchainId: body.onchainId,
            landlord: body.landlord.toLowerCase(),
            tenant: body.tenant.toLowerCase(),
            rentAmount: body.rentAmount,
            securityDeposit: body.securityDeposit,
            startDate: body.startDate,
            endDate: body.endDate,
            bookingType: body.bookingType || "ShortTerm",
            status: body.status || "Created",
            txHash: body.txHash || null,
            isShortTerm: body.isShortTerm ?? true,
        }).returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error: any) {
        console.error("POST /api/bookings error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
