import { useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { MapPin, Calendar, Coins } from "lucide-react";
import { EthAmount } from "./EthAmount";
import { resolveIPFS } from "../lib/ipfs";
import type { Rental } from "../lib/types";
import { createClient } from "../lib/supabase";

const STATE_CONFIG = [
  { label: "Available", color: "bg-surface text-text border border-border" },
  { label: "Booked", color: "bg-accent/20 text-accent border border-accent/30" },
  { label: "Active", color: "bg-accent2/20 text-accent2 border border-accent2/30" },
  { label: "Completed", color: "bg-green-500/20 text-green-400 border border-green-500/30" },
  { label: "Cancelled", color: "bg-danger/20 text-danger border border-danger/30" },
  { label: "Disputed", color: "bg-warning/20 text-warning border border-warning/30" },
];

interface SupabaseMeta {
  title: string;
  city: string | null;
  country: string | null;
  image_cid: string | null;
}

export const RentalCard = memo(function RentalCard({ rental }: { rental: Rental }) {
  const [meta, setMeta] = useState<SupabaseMeta | null>(null);
  const rentalId = Number(rental.id);

  useEffect(() => {
    if (!rentalId) return;
    let cancelled = false;

    createClient()
      .from("listings_metadata")
      .select("title, city, country, image_cid")
      .eq("rental_id", rentalId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) {
          setMeta(
            error || !data
              ? { title: rental.ipfsCID
                    ? `Property #${rentalId}`
                    : "Unnamed Property",
                  city: null, country: null, image_cid: null }
              : data
          );
        }
      });

    return () => { cancelled = true; };
  }, [rentalId]);

  const stateInfo = STATE_CONFIG[Number(rental.state)] ?? STATE_CONFIG[0];
  const startDate = new Date(Number(rental.startTimestamp) * 1000);
  const endDate = new Date(Number(rental.endTimestamp) * 1000);
  const nights = Math.ceil((Number(rental.endTimestamp) - Number(rental.startTimestamp)) / 86400);

  const imageUrl = meta?.image_cid
    ? resolveIPFS(meta.image_cid)
    : rental.ipfsCID
    ? resolveIPFS(rental.ipfsCID)
    : null;

  const title = meta?.title ?? "Loading...";
  const location = [meta?.city, meta?.country].filter(Boolean).join(", ");

  return (
    <div className="glass-card flex flex-col h-full group">
      {/* Image */}
      <div className="h-52 relative overflow-hidden rounded-t-xl flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-border/50 animate-pulse flex items-center justify-center">
            <span className="text-3xl opacity-30">🏠</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

        {/* State badge */}
        <div className="absolute top-3 left-3">
          <span className={`badge backdrop-blur-md ${stateInfo.color}`}>
            {stateInfo.label}
          </span>
        </div>

        {/* Night count badge */}
        {nights > 0 && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-black/50 text-white backdrop-blur-md border-0">
              {nights}n
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="font-display text-lg font-bold mb-1 truncate">{title}</h3>

        {location && (
          <div className="flex items-center gap-1 text-xs text-muted mb-3">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted mb-4">
          <Calendar size={11} className="flex-shrink-0" />
          <span>
            {format(startDate, "MMM d")} → {format(endDate, "MMM d, yyyy")}
          </span>
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-3 border-t border-border/50 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-0.5 flex items-center gap-1">
              <Coins size={9} />Rent
            </p>
            <EthAmount weiAmount={rental.rentAmount} className="text-accent2" />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted uppercase tracking-widest mb-0.5">Deposit</p>
            <EthAmount weiAmount={rental.depositAmount} />
          </div>
        </div>
      </div>

      <Link
        to={`/listings/${rental.id}`}
        className="block p-3.5 border-t border-border/50 bg-accent/5 hover:bg-accent/15 transition-colors text-center text-sm font-semibold text-accent rounded-b-xl"
      >
        View Escrow Details →
      </Link>
    </div>
  );
});
