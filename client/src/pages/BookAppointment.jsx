import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api.js";
import { Navbar } from "../components/Navbar.jsx";
import { Button } from "../components/Button.jsx";
import { Input } from "../components/Input.jsx";
import { initials, formatRWF } from "../lib/utils.js";

export default function BookAppointment() {
  const { counsellorId } = useParams();
  const navigate = useNavigate();
  const [counsellor, setCounsellor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: "", timeSlot: "", mode: "", notes: "" });
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    api.getCounsellor(counsellorId)
      .then(setCounsellor)
      .catch(() => toast.error("Could not load counsellor."))
      .finally(() => setLoading(false));
  }, [counsellorId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.date || !form.timeSlot || !form.mode) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.bookAppointment({ counsellorId, ...form });
      toast.success("Session booked. You will receive confirmation shortly.");
      navigate("/appointments");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen"><Navbar /><div className="max-w-content mx-auto px-5 pt-10"><div className="skeleton h-10 w-64" /></div></div>;
  }

  if (!counsellor) {
    return <div className="min-h-screen"><Navbar /><div className="max-w-content mx-auto px-5 pt-10 text-muted">Counsellor not found.</div></div>;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">
        <div className="max-w-lg">
          <p className="step-label mb-2">Book a session</p>
          <h1 className="font-serif text-[36px] text-ink mb-6">Schedule your appointment</h1>

          {/* Counsellor summary */}
          <div className="flex items-center gap-4 p-4 border border-line rounded-card bg-surface mb-8">
            <div className="w-12 h-12 rounded-full bg-pine-tint flex items-center justify-center shrink-0">
              <span className="font-serif text-[18px] text-pine">{initials(counsellor.fullName)}</span>
            </div>
            <div>
              <p className="font-serif text-[18px] text-ink">{counsellor.fullName}</p>
              <p className="text-[13px] text-muted">{counsellor.title}</p>
              <p className="font-mono text-[12px] text-ink mt-0.5">{formatRWF(counsellor.sessionFeeRWF)} per session</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Availability week ribbon */}
            <div>
              <label className="text-[13px] font-medium text-ink mb-2 block">Select a day</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(counsellor.availability || []).map((slot) => (
                  <button
                    key={slot.day}
                    type="button"
                    onClick={() => { setSelectedDay(slot.day); setForm({ ...form, timeSlot: "" }); }}
                    className={`shrink-0 px-3 py-2 border rounded-[10px] text-[13px] transition-colors ${
                      selectedDay === slot.day
                        ? "border-pine bg-pine-tint text-pine"
                        : "border-line bg-surface text-muted hover:bg-sunken"
                    }`}
                  >
                    {slot.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            {selectedDay && (
              <div>
                <label className="text-[13px] font-medium text-ink mb-2 block">Select a time</label>
                <div className="flex flex-wrap gap-2">
                  {(counsellor.availability.find((a) => a.day === selectedDay)?.timeSlots || []).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, timeSlot: t })}
                      className={`font-mono text-[13px] px-3 py-1.5 border rounded-[8px] transition-colors ${
                        form.timeSlot === t
                          ? "border-pine bg-pine-tint text-pine"
                          : "border-line bg-surface text-muted hover:bg-sunken"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />

            <div>
              <label className="text-[13px] font-medium text-ink mb-1.5 block">Session mode</label>
              <div className="flex gap-2">
                {(counsellor.sessionModes || []).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, mode: m })}
                    className={`px-3 py-1.5 border rounded-[10px] text-[13px] capitalize transition-colors ${
                      form.mode === m
                        ? "border-pine bg-pine-tint text-pine"
                        : "border-line bg-surface text-muted hover:bg-sunken"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Notes for your counsellor (optional)"
              type="text"
              placeholder="Anything you would like them to know beforehand"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            {error && (
              <p className="text-[13px] text-clay bg-clay-tint border border-clay/20 px-3 py-2 rounded-[10px]">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? "Booking ..." : "Confirm booking"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
