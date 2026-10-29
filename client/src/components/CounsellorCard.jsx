import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { initials, formatRWF, cn } from "../lib/utils.js";

function MatchRing({ percent, isBest }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;

  return (
    <div className="match-ring flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke={isBest ? "#F0D79B" : "var(--line)"} strokeWidth="3" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={isBest ? "#F0D79B" : "var(--pine)"}
          strokeWidth="3"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-mono text-[11px] font-medium", isBest ? "text-[#b38a28]" : "text-pine")}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

export function CounsellorCard({ counsellor, matchPercent, reason, breakdown, isBest, earliestSlot }) {
  const showMatch = matchPercent !== undefined;

  return (
    <div
      className={cn(
        "relative rounded-card border bg-surface p-5 transition-shadow hover:shadow-sm",
        isBest ? "border-[#F0D79B]" : "border-line"
      )}
    >
      {isBest && (
        <span className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-widest bg-butter text-[#7a5a0f] px-2 py-0.5 rounded-full">
          Best match
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-pine-tint flex items-center justify-center shrink-0">
          <span className="font-serif text-[18px] text-pine">{initials(counsellor.fullName)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-[18px] text-ink leading-snug">{counsellor.fullName}</h3>
              <p className="text-[13px] text-muted">{counsellor.title}</p>
            </div>
            {showMatch && <MatchRing percent={matchPercent} isBest={isBest} />}
          </div>

          {/* Specialization chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(counsellor.specializations || []).slice(0, 4).map((s) => (
              <span key={s} className="text-[11px] bg-sunken text-muted px-2 py-0.5 rounded-full capitalize border border-line">
                {s}
              </span>
            ))}
          </div>

          {/* Language chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(counsellor.languages || []).map((l) => (
              <span key={l} className="text-[11px] bg-pine-tint text-pine px-2 py-0.5 rounded-full border border-[#c4ddd5]">
                {l}
              </span>
            ))}
          </div>

          {/* Fee and slot */}
          <div className="flex items-center gap-4 mt-3">
            <span className="font-mono text-[13px] text-ink">{formatRWF(counsellor.sessionFeeRWF)}</span>
            {earliestSlot && (
              <span className="text-[12px] text-muted flex items-center gap-1">
                <MapPin size={12} strokeWidth={1.5} />
                Next: {earliestSlot}
              </span>
            )}
            <span className="flex items-center gap-1 text-[12px] text-muted">
              <Star size={12} strokeWidth={1.5} />
              {(counsellor.avgRating || 0).toFixed(1)}
            </span>
          </div>

          {/* Why this match */}
          {reason && (
            <div className="mt-3 pt-3 border-t border-line">
              <p className="step-label mb-1.5">Why this match</p>
              <p className="text-[13px] text-muted">{reason}</p>
              {breakdown && (
                <div className="flex gap-4 mt-2">
                  {[
                    { label: "Content", val: breakdown.content },
                    { label: "Collaborative", val: breakdown.collaborative },
                    { label: "Quality", val: breakdown.quality },
                  ].map((b) => (
                    <div key={b.label} className="flex flex-col">
                      <span className="font-mono text-[11px] text-pine">{b.val}%</span>
                      <span className="text-[10px] text-muted">{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Link
              to={`/counsellors/${counsellor._id}`}
              className="h-8 px-3 flex items-center text-[13px] border border-line rounded-[10px] text-muted hover:text-ink hover:bg-sunken transition-colors"
            >
              View profile
            </Link>
            {counsellor.acceptingNewClients && (
              <Link
                to={`/book/${counsellor._id}`}
                className="h-8 px-3 flex items-center text-[13px] bg-pine text-white rounded-[10px] hover:bg-pine-hover transition-colors"
              >
                Book session
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CounsellorCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-start gap-4">
        <div className="skeleton w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-4 w-32" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
          <div className="skeleton h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
