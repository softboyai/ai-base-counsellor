import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { CounsellorCard, CounsellorCardSkeleton } from "../components/CounsellorCard.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { Search, SlidersHorizontal } from "lucide-react";

const SPECIALIZATIONS = ["anxiety", "depression", "trauma", "grief", "family and relationships", "addiction", "stress and burnout", "youth and adolescents", "couples"];
const LANGUAGES = ["Kinyarwanda", "English", "French", "Swahili"];
const MODES = ["in-person", "video", "phone"];

export default function Directory() {
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ specialization: "", language: "", mode: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = {};
    if (filters.specialization) params.specialization = filters.specialization;
    if (filters.language) params.language = filters.language;
    if (filters.mode) params.mode = filters.mode;

    setLoading(true);
    api.getCounsellors(params)
      .then(setCounsellors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const filtered = counsellors.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.specializations?.some((s) => s.toLowerCase().includes(q)) ||
      c.languages?.some((l) => l.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">

        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="step-label mb-2">Baho Hospital</p>
            <h1 className="font-serif text-[40px] text-ink">Our counsellors</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-9 px-3 border border-line rounded-[10px] text-[13px] text-muted hover:text-ink hover:bg-sunken transition-colors"
          >
            <SlidersHorizontal size={15} strokeWidth={1.5} />
            Filters
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search by name, specialisation or language ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 border border-line bg-surface rounded-[10px] text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition-colors"
          />
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-sunken border border-line rounded-card grid sm:grid-cols-3 gap-4">
            <div>
              <label className="step-label block mb-1.5">Specialisation</label>
              <select
                value={filters.specialization}
                onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                className="w-full h-9 px-2 border border-line bg-surface rounded-[10px] text-[13px] text-ink focus:outline-none focus:border-pine"
              >
                <option value="">All</option>
                {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="step-label block mb-1.5">Language</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full h-9 px-2 border border-line bg-surface rounded-[10px] text-[13px] text-ink focus:outline-none focus:border-pine"
              >
                <option value="">All</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="step-label block mb-1.5">Session mode</label>
              <select
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="w-full h-9 px-2 border border-line bg-surface rounded-[10px] text-[13px] text-ink focus:outline-none focus:border-pine"
              >
                <option value="">All</option>
                {MODES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <CounsellorCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="font-serif text-[22px] text-ink mb-2">No counsellors found</p>
            <p className="text-[14px] text-muted">Try clearing some filters.</p>
            <button
              onClick={() => { setFilters({ specialization: "", language: "", mode: "" }); setSearch(""); }}
              className="mt-4 text-[13px] text-pine hover:underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <p className="text-[13px] text-muted mb-4">{filtered.length} counsellor{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((c) => <CounsellorCard key={c._id} counsellor={c} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
