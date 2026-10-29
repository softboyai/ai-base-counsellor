import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, MapPin, Clock, Languages, Briefcase } from "lucide-react";
import { api } from "../lib/api.js";
import { Navbar } from "../components/Navbar.jsx";
import { initials, formatRWF } from "../lib/utils.js";
import { useAuth } from "../lib/auth.js";

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.5}
          className={n <= Math.round(rating) ? "fill-pine text-pine" : "text-line"}
        />
      ))}
    </div>
  );
}

export default function CounsellorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [counsellor, setCounsellor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCounsellor(id), api.getReviews(id)])
      .then(([c, r]) => { setCounsellor(c); setReviews(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-content mx-auto px-5 pt-10">
          <div className="skeleton h-10 w-48 mb-4" />
          <div className="skeleton h-6 w-32 mb-8" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!counsellor) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="max-w-content mx-auto px-5 pt-16 text-center">
          <p className="font-serif text-[28px] text-ink">Counsellor not found</p>
          <Link to="/directory" className="mt-4 text-pine hover:underline text-[14px] inline-block">Back to directory</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">
        <div className="grid md:grid-cols-[1fr_280px] gap-10">

          {/* Main */}
          <div>
            <div className="flex items-start gap-5 mb-8">
              <div className="w-16 h-16 rounded-full bg-pine-tint flex items-center justify-center shrink-0">
                <span className="font-serif text-[24px] text-pine">{initials(counsellor.fullName)}</span>
              </div>
              <div>
                <h1 className="font-serif text-[36px] text-ink leading-tight">{counsellor.fullName}</h1>
                <p className="text-[15px] text-muted">{counsellor.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <StarRow rating={counsellor.avgRating || 0} />
                  <span className="font-mono text-[12px] text-muted">{(counsellor.avgRating || 0).toFixed(1)} ({counsellor.sessionsCount || 0} sessions)</span>
                </div>
              </div>
            </div>

            <hr className="hr-line mb-6" />

            <p className="step-label mb-2">About</p>
            <p className="text-[14px] text-muted leading-relaxed mb-8">{counsellor.bio}</p>

            <hr className="hr-line mb-6" />

            <p className="step-label mb-3">Specialisations</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {(counsellor.specializations || []).map((s) => (
                <span key={s} className="bg-pine-tint border border-[#c4ddd5] text-pine text-[12px] px-3 py-1 rounded-full capitalize">
                  {s}
                </span>
              ))}
            </div>

            <p className="step-label mb-3">Approaches</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {(counsellor.approaches || []).map((a) => (
                <span key={a} className="bg-sunken border border-line text-muted text-[12px] px-3 py-1 rounded-full">
                  {a}
                </span>
              ))}
            </div>

            <hr className="hr-line mb-6" />

            <p className="step-label mb-3">Availability</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {(counsellor.availability || []).map((slot) => (
                <div key={slot.day} className="border border-line rounded-[10px] px-3 py-2">
                  <p className="text-[12px] font-medium text-ink mb-1.5">{slot.day}</p>
                  <div className="flex flex-wrap gap-1">
                    {(slot.timeSlots || []).map((t) => (
                      <span key={t} className="font-mono text-[11px] bg-sunken border border-line px-2 py-0.5 rounded-full text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Reviews */}
            <hr className="hr-line mb-6" />
            <p className="step-label mb-4">Client reviews ({reviews.length})</p>
            {reviews.length === 0 && (
              <p className="text-[14px] text-muted">No reviews yet.</p>
            )}
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="border border-line rounded-card p-4 bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-ink">{r.clientName}</span>
                    </div>
                    <StarRow rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-[13px] text-muted">{r.comment}</p>}
                  <p className="font-mono text-[11px] text-muted mt-2">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="border border-line rounded-card p-4 bg-surface">
              <p className="step-label mb-3">Session details</p>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase size={15} strokeWidth={1.5} className="text-muted" />
                  <span className="text-[13px] text-muted">{counsellor.yearsExperience} years experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} strokeWidth={1.5} className="text-muted" />
                  <span className="font-mono text-[13px] text-ink">{formatRWF(counsellor.sessionFeeRWF)} per session</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={15} strokeWidth={1.5} className="text-muted mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {(counsellor.sessionModes || []).map((m) => (
                      <span key={m} className="text-[12px] bg-sunken border border-line px-2 py-0.5 rounded-full text-muted capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Languages size={15} strokeWidth={1.5} className="text-muted mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {(counsellor.languages || []).map((l) => (
                      <span key={l} className="text-[12px] bg-pine-tint border border-[#c4ddd5] px-2 py-0.5 rounded-full text-pine">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border border-line rounded-[10px] bg-sunken">
              <div className={`w-2 h-2 rounded-full ${counsellor.acceptingNewClients ? "bg-pine" : "bg-muted"}`} />
              <span className="text-[13px] text-muted">
                {counsellor.acceptingNewClients ? "Accepting new clients" : "Not currently available"}
              </span>
            </div>

            {user?.role === "client" && counsellor.acceptingNewClients && (
              <Link
                to={`/book/${counsellor._id}`}
                className="block w-full h-10 bg-pine text-white text-[14px] font-medium rounded-[10px] flex items-center justify-center hover:bg-pine-hover transition-colors"
              >
                Book a session
              </Link>
            )}

            {!user && (
              <Link
                to="/register"
                className="block w-full h-10 border border-pine text-pine text-[14px] font-medium rounded-[10px] flex items-center justify-center hover:bg-pine-tint transition-colors"
              >
                Register to book
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
