import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "VaultStay | Trustless Rentals",
  description: "Automated Escrow System for Long-term and Short-term Stays.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-background text-white min-h-screen selection:bg-primary/30">
        <Providers>
          <Navbar />
          <main className="pt-24 min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
