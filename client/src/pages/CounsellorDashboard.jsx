import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, CalendarDays, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { api, downloadBlob } from "../lib/api.js";
import { Navbar } from "../components/Navbar.jsx";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../lib/auth.js";
import { statusDot, statusColor, formatDate, formatRWF } from "../lib/utils.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const STATUS_LABELS = {
  pending:   { dot: "bg-amber-400",  text: "text-amber-700",  label: "Pending"   },
  confirmed: { dot: "bg-pine",       text: "text-pine",       label: "Confirmed" },
  completed: { dot: "bg-muted",      text: "text-muted",      label: "Completed" },
  cancelled: { dot: "bg-clay",       text: "text-clay",       label: "Cancelled" },
};

export default function CounsellorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile]         = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [editingAvail, setEditingAvail] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [saving, setSaving]           = useState(false);
  const [updatingId, setUpdatingId]   = useState(null);
  const [activeTab, setActiveTab]     = useState("appointments");

  function load() {
    setLoading(true);
    Promise.all([api.myCounsellorProfile(), api.myAppointments()])
      .then(([p, a]) => {
        setProfile(p);
        setAppointments(a);
        setAvailability(p.availability || []);
      })
      .catch((e) => toast.error("Could not load dashboard: " + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.updateStatus(id, status);
      toast.success("Status updated to " + status + ".");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveAvailability() {
    setSaving(true);
    try {
      await api.updateCounsellor(profile._id, { availability });
      toast.success("Availability saved.");
      setEditingAvail(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleTimeSlot(day, time) {
    setAvailability((prev) => {
      const existing = prev.find((a) => a.day === day);
      if (existing) {
        const newSlots = existing.timeSlots.includes(time)
          ? existing.timeSlots.filter((t) => t !== time)
          : [...existing.timeSlots, time].sort();
        if (newSlots.length === 0) return prev.filter((a) => a.day !== day);
        return prev.map((a) => (a.day === day ? { ...a, timeSlots: newSlots } : a));
      }
      return [...prev, { day, timeSlots: [time] }];
    });
  }

  async function toggleAccepting() {
    try {
      const updated = await api.updateCounsellor(profile._id, {
        acceptingNewClients: !profile.acceptingNewClients,
      });
      setProfile(updated);
      toast.success(updated.acceptingNewClients ? "Now accepting new clients." : "No longer accepting new clients.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDownload(format) {
    setDownloading(true);
    const tid = toast.loading("Preparing schedule...");
    try {
      const blob = await api.scheduleReport({ format });
      downloadBlob(blob, `baho-schedule.${format}`);
      toast.success("Downloaded.", { id: tid });
    } catch (err) {
      toast.error(err.message, { id: tid });
    } finally {
      setDownloading(false);
    }
  }

  const pending   = appointments.filter((a) => a.status === "pending");
  const confirmed = appointments.filter((a) => a.status === "confirmed");
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");
  const upcoming  = [...pending, ...confirmed].sort((a, b) => new Date(a.date) - new Date(b.date));
  const past      = [...completed, ...cancelled].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-content mx-auto px-5 pt-10 space-y-4">
          <div className="skeleton h-8 w-64 rounded-card" />
          <div className="skeleton h-4 w-40 rounded-card" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-card" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-content mx-auto px-5 pt-16 text-center">
          <p className="font-serif text-[28px] text-ink mb-3">Profile not linked</p>
          <p className="text-[14px] text-muted max-w-md mx-auto">
            Your account is marked as a counsellor but no counsellor profile is linked to it yet.
            Please ask an administrator to link your profile.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "appointments", label: "Appointments", count: upcoming.length },
    { id: "availability", label: "Availability" },
    { id: "profile",      label: "My Profile" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="step-label mb-1">Counsellor Dashboard</p>
            <h1 className="font-serif text-[40px] text-ink leading-tight">
              Welcome, <em className="italic">{profile.fullName.split(" ")[0]}</em>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-[12px] text-muted">{profile.sessionsCount} sessions</span>
              <span className="font-mono text-[12px] text-muted">{formatRWF(profile.sessionFeeRWF)}/session</span>
              <button
                onClick={toggleAccepting}
                className={`flex items-center gap-1.5 text-[12px] px-2 py-0.5 rounded-full border transition-colors ${
                  profile.acceptingNewClients
                    ? "border-pine/30 bg-pine-tint text-pine hover:bg-pine hover:text-white"
                    : "border-line bg-sunken text-muted hover:border-pine hover:text-pine"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${profile.acceptingNewClients ? "bg-pine" : "bg-muted"}`} />
                {profile.acceptingNewClients ? "Accepting clients" : "Not accepting"}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload("pdf")} disabled={downloading}>
              <Download size={14} strokeWidth={1.5} /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload("csv")} disabled={downloading}>
              <Download size={14} strokeWidth={1.5} /> CSV
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Pending",   value: pending.length,   color: "text-amber-600" },
            { label: "Confirmed", value: confirmed.length, color: "text-pine" },
            { label: "Completed", value: completed.length, color: "text-muted" },
            { label: "Cancelled", value: cancelled.length, color: "text-clay" },
          ].map((s) => (
            <div key={s.label} className="border border-line rounded-card bg-surface p-4">
              <p className="step-label mb-1">{s.label}</p>
              <p className={`font-mono text-[32px] leading-none ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`h-10 px-4 text-[14px] border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === t.id
                  ? "border-pine text-pine font-medium"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="font-mono text-[11px] bg-pine-tint text-pine px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <div className="space-y-6">

            {/* Upcoming */}
            <div>
              <p className="step-label mb-3">Upcoming ({upcoming.length})</p>
              {upcoming.length === 0 && (
                <div className="border border-line rounded-card bg-surface px-5 py-10 text-center">
                  <CalendarDays size={24} strokeWidth={1.5} className="text-muted mx-auto mb-3" />
                  <p className="text-[14px] text-muted">No upcoming appointments.</p>
                </div>
              )}
              <div className="space-y-3">
                {upcoming.map((a) => {
                  const st = STATUS_LABELS[a.status] || STATUS_LABELS.pending;
                  return (
                    <div key={a._id} className="border border-line rounded-card bg-surface p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5">
                            <User size={16} strokeWidth={1.5} className="text-muted" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                              <span className={`font-mono text-[11px] uppercase tracking-wide ${st.text}`}>
                                {st.label}
                              </span>
                            </div>
                            <p className="font-medium text-[15px] text-ink">{a.clientName}</p>
                            <p className="text-[13px] text-muted">
                              {formatDate(a.date)} at <span className="font-mono">{a.timeSlot}</span>
                              <span className="mx-1.5 text-line">|</span>
                              {a.mode}
                            </p>
                            {a.notes && (
                              <p className="text-[12px] text-muted mt-1 italic">Note: {a.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Status actions */}
                        <div className="flex gap-2 flex-wrap shrink-0">
                          {a.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => updateStatus(a._id, "confirmed")}
                                disabled={updatingId === a._id}
                              >
                                <CheckCircle size={14} strokeWidth={1.5} />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(a._id, "cancelled")}
                                disabled={updatingId === a._id}
                              >
                                <XCircle size={14} strokeWidth={1.5} />
                                Decline
                              </Button>
                            </>
                          )}
                          {a.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateStatus(a._id, "completed")}
                              disabled={updatingId === a._id}
                            >
                              <CheckCircle size={14} strokeWidth={1.5} />
                              Mark completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="step-label mb-3">Past sessions ({past.length})</p>
                <div className="space-y-2">
                  {past.map((a) => {
                    const st = STATUS_LABELS[a.status] || STATUS_LABELS.completed;
                    return (
                      <div key={a._id} className="flex items-center justify-between border border-line rounded-[10px] bg-sunken px-4 py-3">
                        <div>
                          <p className="text-[14px] text-ink font-medium">{a.clientName}</p>
                          <p className="font-mono text-[12px] text-muted">
                            {formatDate(a.date)} {a.timeSlot}
                          </p>
                        </div>
                        <span className={`flex items-center gap-1.5 font-mono text-[11px] uppercase ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {activeTab === "availability" && (
          <div className="max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] text-ink font-medium">Set your available days and times</p>
              {!editingAvail ? (
                <Button size="sm" variant="secondary" onClick={() => setEditingAvail(true)}>
                  Edit availability
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingAvail(false); setAvailability(profile.availability || []); }}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={saveAvailability} disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              )}
            </div>

            {!editingAvail ? (
              <div className="space-y-3">
                {availability.length === 0 && (
                  <p className="text-[14px] text-muted">No availability set. Click Edit to add your schedule.</p>
                )}
                {availability.map((slot) => (
                  <div key={slot.day} className="border border-line rounded-[10px] bg-surface px-4 py-3">
                    <p className="text-[13px] font-medium text-ink mb-2">{slot.day}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {slot.timeSlots.map((t) => (
                        <span key={t} className="font-mono text-[11px] bg-pine-tint border border-[#c4ddd5] text-pine px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const daySlots = availability.find((a) => a.day === day)?.timeSlots || [];
                  return (
                    <div key={day} className="border border-line rounded-[10px] bg-surface px-4 py-3">
                      <p className="text-[13px] font-medium text-ink mb-2">{day}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TIMES.map((t) => (
                          <button
                            key={t}
                            onClick={() => toggleTimeSlot(day, t)}
                            className={`font-mono text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                              daySlots.includes(t)
                                ? "bg-pine-tint border-pine text-pine"
                                : "bg-sunken border-line text-muted hover:border-pine/50 hover:text-pine"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="max-w-lg space-y-4">
            <div className="border border-line rounded-card bg-surface p-5">
              <p className="step-label mb-3">Your profile details</p>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between py-2 border-b border-line">
                  <span className="text-muted">Full name</span>
                  <span className="text-ink font-medium">{profile.fullName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line">
                  <span className="text-muted">Title</span>
                  <span className="text-ink">{profile.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line">
                  <span className="text-muted">Experience</span>
                  <span className="text-ink font-mono">{profile.yearsExperience} years</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line">
                  <span className="text-muted">Session fee</span>
                  <span className="text-ink font-mono">{formatRWF(profile.sessionFeeRWF)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line">
                  <span className="text-muted">Average rating</span>
                  <span className="text-ink font-mono">{(profile.avgRating || 0).toFixed(1)} / 5</span>
                </div>
                <div className="py-2">
                  <span className="text-muted block mb-1">Specialisations</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.specializations || []).map((s) => (
                      <span key={s} className="text-[11px] bg-pine-tint border border-[#c4ddd5] text-pine px-2 py-0.5 rounded-full capitalize">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="py-2">
                  <span className="text-muted block mb-1">Languages</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.languages || []).map((l) => (
                      <span key={l} className="text-[11px] bg-sunken border border-line text-muted px-2 py-0.5 rounded-full">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[12px] text-muted">
              To update your bio, fee or specialisations, contact your administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
