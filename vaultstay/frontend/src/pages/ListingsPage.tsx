import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { RentalCard } from "../components/RentalCard";
import { useAllListings } from "../hooks/useVaultStay";
import { createClient } from "../lib/supabase";

const FILTER_OPTIONS = ["ALL", "AVAILABLE", "BOOKED", "ACTIVE", "COMPLETED"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

type TitleMap = Record<number, string>;

export default function ListingsPage() {
  const { data: listings, isLoading } = useAllListings();
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [search, setSearch] = useState("");
  const [titleMap, setTitleMap] = useState<TitleMap>({});

  useEffect(() => {
    createClient()
      .from("listings_metadata")
      .select("rental_id, title")
      .then(({ data }) => {
        if (data) {
          const map: TitleMap = {};
          data.forEach((row) => { map[row.rental_id] = row.title; });
          setTitleMap(map);
        }
      });
  }, []);

  const allListings = listings ?? [];

  const filteredListings = useMemo(() => {
    return allListings.filter((listing) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "AVAILABLE" && listing.state === 0) ||
        (filter === "BOOKED" && listing.state === 1) ||
        (filter === "ACTIVE" && listing.state === 2) ||
        (filter === "COMPLETED" && listing.state === 3);

      const term = search.toLowerCase();
      const title = (titleMap[Number(listing.id)] ?? "").toLowerCase();
      const matchesSearch =
        !term || title.includes(term) || listing.ipfsCID.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [allListings, filter, search, titleMap]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">Explore Escrows</h1>
            <p className="text-muted">
              {allListings.length > 0
                ? `${allListings.length} smart-contract rental${allListings.length !== 1 ? "s" : ""} on-chain`
                : "Browse decentralized smart-contract rentals."}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                id="search-listings"
                placeholder="Search by property name..."
                className="input-field pl-9 py-2.5 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border w-fit">
              <SlidersHorizontal size={13} className="text-muted ml-2 mr-1 flex-shrink-0" />
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    filter === f
                      ? "bg-accent text-white shadow-sm"
                      : "text-muted hover:text-text hover:bg-border/50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-96 glass-panel animate-pulse bg-surface/30" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center border border-dashed border-border rounded-2xl">
            <span className="text-5xl mb-4">🏜️</span>
            <h3 className="text-xl font-display font-bold mb-2">No properties found</h3>
            <p className="text-muted mb-8 max-w-sm">
              {search
                ? `No listings match "${search}". Try a different search term.`
                : "There are currently no listings matching your filter."}
            </p>
            <Link to="/create" className="btn-primary flex items-center gap-2">
              Create the First Listing
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted mb-4">
              Showing {filteredListings.length} of {allListings.length} listings
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredListings.map((rental) => (
                <RentalCard key={rental.id.toString()} rental={rental} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
