import { pgTable, serial, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const bookings = pgTable("bookings", {
    id: serial("id").primaryKey(),
    onchainId: integer("onchain_id"),
    landlord: text("landlord").notNull(),
    tenant: text("tenant").notNull(),
    rentAmount: numeric("rent_amount", { precision: 30, scale: 0 }).notNull(),
    securityDeposit: numeric("security_deposit", { precision: 30, scale: 0 }).notNull(),
    startDate: integer("start_date").notNull(),
    endDate: integer("end_date").notNull(),
    bookingType: text("booking_type").notNull().default("ShortTerm"),
    status: text("status").notNull().default("Created"),
    txHash: text("tx_hash"),
    isShortTerm: boolean("is_short_term").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
