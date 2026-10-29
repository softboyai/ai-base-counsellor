import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Download, Users, CalendarDays, Star, Plus, Trash2, Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { api, downloadBlob } from "../lib/api.js";
import { Navbar } from "../components/Navbar.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Textarea } from "../components/Input.jsx";
import { statusDot, statusColor, formatDate, formatRWF, initials } from "../lib/utils.js";
import { toast as sonnerToast } from "sonner";

// ---- helpers ----
function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="border border-line rounded-card bg-surface p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="step-label">{label}</p>
        <Icon size={16} strokeWidth={1.5} className="text-muted" />
      </div>
      <p className="font-mono text-[36px] text-ink leading-none">{value}</p>
      {sub && <p className="text-[12px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

const SPECIALIZATIONS = [
  "anxiety","depression","trauma","grief","family and relationships",
  "addiction","stress and burnout","youth and adolescents","couples",
];
const APPROACHES = ["CBT","trauma-focused","family therapy","supportive counselling"];
const LANGUAGES  = ["Kinyarwanda","English","French","Swahili"];
const MODES      = ["in-person","video","phone"];

// ---- Create Counsellor Form ----
function CreateCounsellorForm({ onCreated }) {
  const [step, setStep] = useState(1); // 1=account, 2=profile
  const [accountData, setAccountData] = useState({ name:"", email:"", phone:"", password:"" });
  const [profileData, setProfileData] = useState({
    title:"", bio:"", yearsExperience:"", sessionFeeRWF:"",
    gender:"", specializations:[], approaches:[], languages:[], sessionModes:[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdUserId, setCreatedUserId] = useState(null);

  function toggleArr(field, val, setter) {
    setter((prev) => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter((x) => x !== val)
        : [...prev[field], val],
    }));
  }

  async function handleAccountSubmit(e) {
    e.preventDefault();
    setError("");
    if (accountData.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    try {
      // Register the counsellor account via admin endpoint
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("baho_token"),
        },
        body: JSON.stringify({ ...accountData, role: "counsellor" }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Registration failed.");
      setCreatedUserId(data.user.id);
      toast.success("Account created. Now fill in the counsellor profile.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setError("");
    if (!profileData.specializations.length) { setError("Select at least one specialisation."); return; }
    if (!profileData.languages.length)       { setError("Select at least one language."); return; }
    if (!profileData.sessionModes.length)    { setError("Select at least one session mode."); return; }
    setSubmitting(true);
    try {
      await api.createCounsellor({
        ...profileData,
        fullName: accountData.name,
        yearsExperience: parseInt(profileData.yearsExperience, 10) || 0,
        sessionFeeRWF:   parseInt(profileData.sessionFeeRWF, 10) || 0,
        email: accountData.email,
        availability: [],
        acceptingNewClients: true,
      });
      toast.success("Counsellor profile created. They can now log in.");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const chip = (label, active, onClick) => (
    <button
      key={label} type="button" onClick={onClick}
      className={`text-[12px] px-3 py-1 rounded-full border transition-colors capitalize ${
        active ? "border-pine bg-pine-tint text-pine" : "border-line bg-surface text-muted hover:border-pine/50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-xl">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[12px] border ${
              step === n ? "bg-pine border-pine text-white" : step > n ? "bg-pine-tint border-pine text-pine" : "border-line text-muted"
            }`}>{n}</div>
            <span className={`text-[13px] ${step === n ? "text-ink font-medium" : "text-muted"}`}>
              {n === 1 ? "Login account" : "Counsellor profile"}
            </span>
            {n < 2 && <span className="text-line mx-1">...</span>}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-[13px] text-clay bg-clay-tint border border-clay/20 px-3 py-2 rounded-[10px] mb-4">
          {error}
        </p>
      )}

      {step === 1 && (
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <p className="text-[13px] text-muted mb-2">
            Create a login account for the counsellor. They will use this email and password to access their dashboard.
          </p>
          <Input label="Full name" value={accountData.name} onChange={(e) => setAccountData({...accountData, name: e.target.value})} required placeholder="e.g. Dr. Marie Uwimana" />
          <Input label="Email" type="email" value={accountData.email} onChange={(e) => setAccountData({...accountData, email: e.target.value})} required placeholder="counsellor@baho.rw" />
          <Input label="Phone (optional)" value={accountData.phone} onChange={(e) => setAccountData({...accountData, phone: e.target.value})} placeholder="+250 78 000 0000" />
          <Input label="Password" type="password" value={accountData.password} onChange={(e) => setAccountData({...accountData, password: e.target.value})} required placeholder="At least 8 characters" />
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account and continue"}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <p className="text-[13px] text-muted mb-2">
            Fill in the counsellor profile. This appears on the public directory.
          </p>
          <Input label="Professional title" value={profileData.title} onChange={(e) => setProfileData({...profileData, title: e.target.value})} required placeholder="e.g. Clinical Psychologist" />
          <Textarea label="Bio" value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} required placeholder="A short description of their background and approach..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Years of experience" type="number" min="0" value={profileData.yearsExperience} onChange={(e) => setProfileData({...profileData, yearsExperience: e.target.value})} required />
            <Input label="Session fee (RWF)" type="number" min="0" value={profileData.sessionFeeRWF} onChange={(e) => setProfileData({...profileData, sessionFeeRWF: e.target.value})} required />
          </div>
          <div>
            <label className="text-[13px] font-medium text-ink mb-1.5 block">Gender</label>
            <div className="flex gap-2">
              {["male","female","other"].map((g) => chip(g, profileData.gender === g, () => setProfileData({...profileData, gender: g})))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-ink mb-1.5 block">Specialisations</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((s) => chip(s, profileData.specializations.includes(s), () => toggleArr("specializations", s, setProfileData)))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-ink mb-1.5 block">Therapeutic approaches</label>
            <div className="flex flex-wrap gap-2">
              {APPROACHES.map((a) => chip(a, profileData.approaches.includes(a), () => toggleArr("approaches", a, setProfileData)))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-ink mb-1.5 block">Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => chip(l, profileData.languages.includes(l), () => toggleArr("languages", l, setProfileData)))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-ink mb-1.5 block">Session modes</label>
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => chip(m, profileData.sessionModes.includes(m), () => toggleArr("sessionModes", m, setProfileData)))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
              {submitting ? "Creating profile..." : "Create counsellor profile"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---- Manage Counsellors ----
function ManageCounsellors({ onRefresh }) {
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  function load() {
    setLoading(true);
    api.getCounsellors().then(setCounsellors).catch(() => toast.error("Could not load counsellors.")).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.deleteCounsellor(id);
      toast.success("Counsellor removed.");
      load();
      onRefresh && onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleEdit(c) {
    setEditingId(c._id);
    setEditData({
      sessionFeeRWF: c.sessionFeeRWF,
      acceptingNewClients: c.acceptingNewClients,
      yearsExperience: c.yearsExperience,
    });
  }

  async function saveEdit(id) {
    try {
      await api.updateCounsellor(id, editData);
      toast.success("Profile updated.");
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-card"/>)}</div>;

  if (counsellors.length === 0) {
    return (
      <div className="text-center py-12 border border-line rounded-card bg-surface">
        <Users size={24} strokeWidth={1.5} className="text-muted mx-auto mb-3" />
        <p className="text-[14px] text-muted">No counsellors yet. Create one above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {counsellors.map((c) => (
        <div key={c._id} className="border border-line rounded-card bg-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-pine-tint flex items-center justify-center shrink-0">
                <span className="font-serif text-[16px] text-pine">{initials(c.fullName)}</span>
              </div>
              <div>
                <p className="font-serif text-[17px] text-ink">{c.fullName}</p>
                <p className="text-[12px] text-muted">{c.title}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(c.specializations || []).slice(0,3).map((s) => (
                    <span key={s} className="text-[10px] bg-sunken border border-line text-muted px-2 py-0.5 rounded-full capitalize">{s}</span>
                  ))}
                  {(c.languages || []).map((l) => (
                    <span key={l} className="text-[10px] bg-pine-tint border border-[#c4ddd5] text-pine px-2 py-0.5 rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`flex items-center gap-1 text-[12px] ${c.acceptingNewClients ? "text-pine" : "text-muted"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.acceptingNewClients ? "bg-pine" : "bg-muted"}`} />
                {c.acceptingNewClients ? "Open" : "Closed"}
              </span>
              <span className="font-mono text-[12px] text-muted">{formatRWF(c.sessionFeeRWF)}</span>
              <Link to={`/counsellors/${c._id}`} className="h-7 w-7 flex items-center justify-center border border-line rounded-[8px] text-muted hover:text-pine hover:border-pine transition-colors" title="View profile">
                <Eye size={13} strokeWidth={1.5} />
              </Link>
              <button onClick={() => editingId === c._id ? setEditingId(null) : handleEdit(c)} className="h-7 w-7 flex items-center justify-center border border-line rounded-[8px] text-muted hover:text-pine hover:border-pine transition-colors" title="Quick edit">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => handleDelete(c._id, c.fullName)} disabled={deleting === c._id} className="h-7 w-7 flex items-center justify-center border border-line rounded-[8px] text-muted hover:text-clay hover:border-clay transition-colors" title="Remove counsellor">
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Inline quick-edit */}
          {editingId === c._id && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="step-label mb-3">Quick edit</p>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <Input
                  label="Session fee (RWF)"
                  type="number"
                  value={editData.sessionFeeRWF}
                  onChange={(e) => setEditData({...editData, sessionFeeRWF: parseInt(e.target.value,10)||0})}
                />
                <Input
                  label="Years experience"
                  type="number"
                  value={editData.yearsExperience}
                  onChange={(e) => setEditData({...editData, yearsExperience: parseInt(e.target.value,10)||0})}
                />
                <div>
                  <label className="text-[13px] font-medium text-ink mb-1.5 block">Accepting clients</label>
                  <div className="flex gap-2">
                    {[true, false].map((v) => (
                      <button key={String(v)} type="button"
                        onClick={() => setEditData({...editData, acceptingNewClients: v})}
                        className={`h-9 px-3 text-[13px] border rounded-[10px] transition-colors ${
                          editData.acceptingNewClients === v ? "border-pine bg-pine-tint text-pine" : "border-line text-muted hover:bg-sunken"
                        }`}
                      >
                        {v ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => saveEdit(c._id)}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- All Appointments (admin view) ----
function AllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all");

  function load() {
    setLoading(true);
    api.allAppointments()
      .then(setAppointments)
      .catch(() => toast.error("Could not load appointments."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.updateStatus(id, status);
      toast.success("Status updated.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  if (loading) return <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-card"/>)}</div>;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["all","pending","confirmed","completed","cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`h-8 px-3 text-[12px] border rounded-[8px] capitalize transition-colors ${
              filter === s ? "border-pine bg-pine-tint text-pine" : "border-line text-muted hover:bg-sunken"
            }`}
          >
            {s} {s === "all" ? `(${appointments.length})` : `(${appointments.filter(a=>a.status===s).length})`}
          </button>
        ))}
        <button onClick={load} className="ml-auto h-8 w-8 flex items-center justify-center border border-line rounded-[8px] text-muted hover:text-pine hover:border-pine transition-colors" title="Refresh">
          <RefreshCw size={14} strokeWidth={1.5} />
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 border border-line rounded-card bg-surface">
          <p className="text-[14px] text-muted">No {filter === "all" ? "" : filter} appointments.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((a) => (
          <div key={a._id} className="border border-line rounded-card bg-surface px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${statusDot(a.status)}`} />
                  <span className={`font-mono text-[11px] uppercase ${statusColor(a.status)}`}>{a.status}</span>
                </div>
                <p className="text-[14px] text-ink">
                  <span className="font-medium">{a.clientName}</span>
                  <span className="text-muted mx-2">with</span>
                  <span className="font-medium">{a.counsellorName}</span>
                </p>
                <p className="font-mono text-[12px] text-muted">
                  {formatDate(a.date)} at {a.timeSlot} ({a.mode})
                </p>
              </div>

              <div className="flex gap-2 flex-wrap shrink-0">
                {a.status === "pending" && (
                  <>
                    <Button size="sm" variant="primary" onClick={() => updateStatus(a._id, "confirmed")} disabled={updatingId === a._id}>
                      <CheckCircle size={13} strokeWidth={1.5} /> Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a._id, "cancelled")} disabled={updatingId === a._id}>
                      <XCircle size={13} strokeWidth={1.5} /> Cancel
                    </Button>
                  </>
                )}
                {a.status === "confirmed" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(a._id, "completed")} disabled={updatingId === a._id}>
                    <CheckCircle size={13} strokeWidth={1.5} /> Complete
                  </Button>
                )}
                {(a.status === "completed" || a.status === "cancelled") && (
                  <span className="text-[12px] text-muted italic">No actions</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Overview / Stats ----
function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminStats()
      .then(setStats)
      .catch(() => toast.error("Could not load stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-24 rounded-card"/>)}</div>
      <div className="skeleton h-48 rounded-card"/>
    </div>
  );

  if (!stats) return <p className="text-muted text-[14px]">Could not load statistics.</p>;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard label="Total appointments" value={stats.totalAppointments} icon={CalendarDays} />
        <StatCard label="Counsellors"        value={stats.totalCounsellors}  icon={Users} />
        <StatCard label="Clients"            value={stats.totalClients}      icon={Users} />
        <StatCard label="Reviews"            value={stats.totalReviews}      icon={Star} />
      </div>

      {stats.timeline?.length > 1 && (
        <div className="border border-line rounded-card bg-surface p-5">
          <p className="step-label mb-4">Appointments over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.timeline} margin={{top:0,right:0,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="pineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1E5B47" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1E5B47" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:10,fill:"var(--muted)",fontFamily:"Geist Mono"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:"var(--muted)",fontFamily:"Geist Mono"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--line)",borderRadius:10,fontSize:12,fontFamily:"Onest"}} labelStyle={{color:"var(--ink)"}} itemStyle={{color:"var(--pine)"}}/>
              <Area type="monotone" dataKey="count" name="Appointments" stroke="#1E5B47" strokeWidth={1.5} fill="url(#pineGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.demandBySpecialization?.length > 0 && (
        <div className="border border-line rounded-card bg-surface p-5">
          <p className="step-label mb-4">Demand by specialisation</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.demandBySpecialization} layout="vertical" margin={{top:0,right:20,left:0,bottom:0}}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:10,fill:"var(--muted)",fontFamily:"Geist Mono"}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"var(--muted)",fontFamily:"Onest"}} axisLine={false} tickLine={false} width={140}/>
              <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--line)",borderRadius:10,fontSize:12}}/>
              <Bar dataKey="count" name="Appointments" radius={[0,4,4,0]}>
                {stats.demandBySpecialization.map((_,idx)=>(
                  <Cell key={idx} fill={idx===0?"#1E5B47":"#DCE9E1"}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.statusBreakdown && (
        <div className="border border-line rounded-card bg-surface p-5">
          <p className="step-label mb-3">Status breakdown</p>
          <div className="flex flex-wrap gap-5">
            {Object.entries(stats.statusBreakdown).map(([s,count])=>(
              <div key={s} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusDot(s)}`}/>
                <span className="text-[13px] text-ink capitalize">{s}</span>
                <span className="font-mono text-[13px] text-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Reports ----
function Reports() {
  const [dateRange, setDateRange]   = useState({from:"",to:""});
  const [reportFormat, setFormat]   = useState("pdf");
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const tid = toast.loading("Generating report...");
    try {
      const params = {format: reportFormat};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to)   params.to   = dateRange.to;
      const blob = await api.adminReport(params);
      downloadBlob(blob, `baho-admin-report.${reportFormat}`);
      toast.success("Report downloaded.", {id: tid});
    } catch (err) {
      toast.error(err.message, {id: tid});
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-md space-y-5">
      <div className="border border-line rounded-card bg-surface p-5 space-y-4">
        <p className="step-label">Admin report</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="From" type="date" value={dateRange.from} onChange={(e)=>setDateRange({...dateRange,from:e.target.value})}/>
          <Input label="To"   type="date" value={dateRange.to}   onChange={(e)=>setDateRange({...dateRange,to:e.target.value})}/>
        </div>
        <div>
          <label className="text-[13px] font-medium text-ink mb-1.5 block">Format</label>
          <div className="flex gap-2">
            {["pdf","csv"].map((f)=>(
              <button key={f} onClick={()=>setFormat(f)}
                className={`px-4 h-9 border rounded-[10px] text-[13px] uppercase font-mono transition-colors ${
                  reportFormat===f ? "border-pine bg-pine-tint text-pine" : "border-line text-muted hover:bg-sunken"
                }`}
              >{f}</button>
            ))}
          </div>
        </div>
        <Button onClick={handleDownload} disabled={downloading} className="w-full">
          <Download size={14} strokeWidth={1.5}/>
          {downloading ? "Generating..." : "Download report"}
        </Button>
      </div>
    </div>
  );
}

// ---- Main AdminDashboard ----
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    {id:"overview",     label:"Overview"},
    {id:"counsellors",  label:"Counsellors"},
    {id:"appointments", label:"Appointments"},
    {id:"reports",      label:"Reports"},
  ];

  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">

        <div className="mb-8">
          <p className="step-label mb-2">Baho Hospital</p>
          <h1 className="font-serif text-[40px] text-ink">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line mb-8">
          {tabs.map((t) => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`h-10 px-4 text-[14px] border-b-2 transition-colors ${
                activeTab===t.id ? "border-pine text-pine font-medium" : "border-transparent text-muted hover:text-ink"
              }`}
            >{t.label}</button>
          ))}
        </div>

        {activeTab === "overview"     && <Overview key={refreshKey}/>}
        {activeTab === "appointments" && <AllAppointments/>}
        {activeTab === "reports"      && <Reports/>}

        {activeTab === "counsellors" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[14px] text-muted">Add, edit and remove counsellor profiles.</p>
              <Button
                variant={showCreateForm ? "ghost" : "primary"}
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "Cancel" : <><Plus size={15} strokeWidth={1.5}/> Add counsellor</>}
              </Button>
            </div>

            {showCreateForm && (
              <div className="border border-pine/20 bg-pine-tint/30 rounded-card p-5 mb-6">
                <p className="step-label mb-4">New counsellor</p>
                <CreateCounsellorForm
                  onCreated={() => {
                    setShowCreateForm(false);
                    setRefreshKey((k) => k + 1);
                  }}
                />
              </div>
            )}

            <ManageCounsellors key={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)}/>
          </div>
        )}
      </div>
    </div>
  );
}
