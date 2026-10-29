import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { api, downloadBlob } from "../lib/api.js";
import { Navbar } from "../components/Navbar.jsx";
import { Button } from "../components/Button.jsx";
import { useAuth } from "../lib/auth.js";
import { statusColor, statusDot, formatDate } from "../lib/utils.js";

const STATUS_OPTIONS = ["confirmed", "completed", "cancelled"];

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  function fetchAppts() {
    setLoading(true);
    api.myAppointments()
      .then(setAppointments)
      .catch(() => toast.error("Could not load appointments."))
      .finally(() => setLoading(false));
  }

  useEffect(fetchAppts, []);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.updateStatus(id, status);
      toast.success("Status updated.");
      fetchAppts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDownload(format = "pdf") {
    setDownloading(true);
    const toastId = toast.loading("Preparing schedule ...");
    try {
      const blob = await api.scheduleReport({ format });
      downloadBlob(blob, `baho-schedule.${format}`);
      toast.success("Schedule downloaded.", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="step-label mb-2">
              {user?.role === "counsellor" ? "Sessions" : user?.role === "admin" ? "All Appointments" : "My Appointments"}
            </p>
            <h1 className="font-serif text-[40px] text-ink">
              {user?.role === "counsellor" ? "Your sessions" : user?.role === "admin" ? "All appointments" : "My appointments"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload("pdf")} disabled={downloading}>
              <Download size={15} strokeWidth={1.5} />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload("csv")} disabled={downloading}>
              <Download size={15} strokeWidth={1.5} />
              CSV
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-card" />
            ))}
          </div>
        )}

        {!loading && appointments.length === 0 && (
          <div className="text-center py-20">
            <p className="font-serif text-[24px] text-ink mb-2">No appointments yet</p>
            <p className="text-[14px] text-muted mb-6">Find a counsellor to book your first session.</p>
            {user?.role === "client" && (
              <Link to="/find" className="h-10 px-5 bg-pine text-white text-[14px] rounded-[10px] inline-flex items-center hover:bg-pine-hover transition-colors">
                Find a counsellor
              </Link>
            )}
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt._id} className="border border-line rounded-card bg-surface p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${statusDot(appt.status)}`} />
                      <span className={`font-mono text-[11px] uppercase tracking-wide ${statusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="font-medium text-[14px] text-ink">
                      {user?.role === "client" ? appt.counsellorName : appt.clientName}
                    </p>
                    <p className="text-[13px] text-muted">
                      {formatDate(appt.date)} at {appt.timeSlot} ({appt.mode})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Client can cancel pending */}
                    {user?.role === "client" && appt.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appt._id, "cancelled")}
                        disabled={updatingId === appt._id}
                      >
                        Cancel
                      </Button>
                    )}

                    {/* Counsellor/admin can update status */}
                    {(user?.role === "counsellor" || user?.role === "admin") && (
                      <select
                        className="h-8 px-2 border border-line rounded-[8px] text-[12px] text-ink bg-surface focus:outline-none focus:border-pine"
                        value={appt.status}
                        onChange={(e) => updateStatus(appt._id, e.target.value)}
                        disabled={updatingId === appt._id}
                      >
                        {["pending", ...STATUS_OPTIONS].map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    )}

                    {/* Client can leave review after completed */}
                    {user?.role === "client" && appt.status === "completed" && (
                      <Link
                        to={`/review/${appt._id}?counsellorId=${appt.counsellorId}`}
                        className="h-8 px-3 flex items-center text-[13px] border border-pine text-pine rounded-[10px] hover:bg-pine-tint transition-colors"
                      >
                        Leave review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
