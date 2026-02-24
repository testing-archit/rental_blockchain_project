import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { bookings } from "./lib/db/schema";

async function seed() {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    console.log("🌱 Seeding mock bookings data...");

    // Clear existing data
    await db.delete(bookings);

    const now = Math.floor(Date.now() / 1000);
    const DAY = 86400;

    const mockBookings = [
        {
            onchainId: 1,
            landlord: "0xA1b2C3d4E5f6789012345678901234567890AbCd",
            tenant: "0xB2c3D4e5F6789012345678901234567890bCdEf1",
            rentAmount: "1000000000000000000", // 1 ETH
            securityDeposit: "500000000000000000", // 0.5 ETH
            startDate: now - DAY * 10,
            endDate: now - DAY * 5,
            bookingType: "ShortTerm",
            status: "Completed",
            txHash: "0xabc123def456789012345678901234567890abcdef1234567890abcdef12345678",
            isShortTerm: true,
        },
        {
            onchainId: 2,
            landlord: "0xC3d4E5f6789012345678901234567890CdEfA1B2",
            tenant: "0xD4e5F6789012345678901234567890dEfA1B2C3d4",
            rentAmount: "2000000000000000000", // 2 ETH
            securityDeposit: "750000000000000000", // 0.75 ETH
            startDate: now - DAY * 2,
            endDate: now + DAY * 5,
            bookingType: "ShortTerm",
            status: "Active",
            txHash: "0xdef456789012345678901234567890abcdef1234567890abcdef123456789012",
            isShortTerm: true,
        },
        {
            onchainId: 3,
            landlord: "0xE5f6789012345678901234567890EfA1B2C3d4E5",
            tenant: "0xF6789012345678901234567890fA1B2C3d4E5f678",
            rentAmount: "5000000000000000000", // 5 ETH
            securityDeposit: "1000000000000000000", // 1 ETH
            startDate: now + DAY * 3,
            endDate: now + DAY * 33,
            bookingType: "LongTerm",
            status: "Funded",
            txHash: "0x789012345678901234567890abcdef1234567890abcdef12345678901234567890",
            isShortTerm: false,
        },
        {
            onchainId: 4,
            landlord: "0xA1b2C3d4E5f6789012345678901234567890AbCd",
            tenant: "0x9012345678901234567890abcdef1234567890Ab12",
            rentAmount: "800000000000000000", // 0.8 ETH
            securityDeposit: "300000000000000000", // 0.3 ETH
            startDate: now + DAY * 7,
            endDate: now + DAY * 14,
            bookingType: "ShortTerm",
            status: "Created",
            txHash: null,
            isShortTerm: true,
        },
        {
            onchainId: 5,
            landlord: "0xB2c3D4e5F6789012345678901234567890bCdEf1",
            tenant: "0xC3d4E5f6789012345678901234567890CdEfA1B2",
            rentAmount: "3500000000000000000", // 3.5 ETH
            securityDeposit: "1500000000000000000", // 1.5 ETH
            startDate: now - DAY * 20,
            endDate: now - DAY * 15,
            bookingType: "ShortTerm",
            status: "Cancelled",
            txHash: "0x012345678901234567890abcdef1234567890abcdef1234567890abcdef123456",
            isShortTerm: true,
        },
        {
            onchainId: 6,
            landlord: "0xD4e5F6789012345678901234567890dEfA1B2C3d4",
            tenant: "0xE5f6789012345678901234567890EfA1B2C3d4E5",
            rentAmount: "10000000000000000000", // 10 ETH
            securityDeposit: "2000000000000000000", // 2 ETH
            startDate: now - DAY * 5,
            endDate: now + DAY * 25,
            bookingType: "LongTerm",
            status: "Active",
            txHash: "0x345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            isShortTerm: false,
        },
        {
            onchainId: 7,
            landlord: "0xF6789012345678901234567890fA1B2C3d4E5f678",
            tenant: "0xA1b2C3d4E5f6789012345678901234567890AbCd",
            rentAmount: "1500000000000000000", // 1.5 ETH
            securityDeposit: "600000000000000000", // 0.6 ETH
            startDate: now - DAY * 30,
            endDate: now - DAY * 25,
            bookingType: "ShortTerm",
            status: "Review",
            txHash: "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
            isShortTerm: true,
        },
        {
            onchainId: 8,
            landlord: "0x9012345678901234567890abcdef1234567890Ab12",
            tenant: "0xB2c3D4e5F6789012345678901234567890bCdEf1",
            rentAmount: "4200000000000000000", // 4.2 ETH
            securityDeposit: "1200000000000000000", // 1.2 ETH
            startDate: now + DAY * 1,
            endDate: now + DAY * 8,
            bookingType: "ShortTerm",
            status: "Funded",
            txHash: "0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
            isShortTerm: true,
        },
    ];

    await db.insert(bookings).values(mockBookings);

    console.log(`✅ Seeded ${mockBookings.length} mock bookings successfully!`);
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
