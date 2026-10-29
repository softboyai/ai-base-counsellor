import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api.js";
import { CrisisPanel } from "../components/CrisisPanel.jsx";
import { Button } from "../components/Button.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { CRISIS_KEYWORDS } from "../lib/utils.js";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CONCERNS = [
  "anxiety", "depression", "trauma", "grief", "family and relationships",
  "addiction", "stress and burnout", "youth and adolescents", "couples",
  "I am in crisis",
];

const LANGUAGES = ["Kinyarwanda", "English", "French", "Swahili"];
const GENDERS = ["No preference", "Female", "Male"];
const MODES = ["In-person", "Video", "Phone"];
const URGENCIES = [
  { value: "routine", label: "No rush", sub: "I can wait a few weeks" },
  { value: "soon", label: "Soon", sub: "Within the next week or two" },
  { value: "urgent", label: "As soon as possible", sub: "I need support quickly" },
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BUDGETS = [
  { value: 10000, label: "RWF 10,000 or less" },
  { value: 15000, label: "Up to RWF 15,000" },
  { value: 20000, label: "Up to RWF 20,000" },
  { value: 30000, label: "Up to RWF 30,000" },
  { value: 0, label: "No preference" },
];

const STEPS = [
  { id: "consent", title: "Before we begin" },
  { id: "concerns", title: "What would you like support with?" },
  { id: "language", title: "Which language do you prefer?" },
  { id: "mode", title: "How would you like to meet?" },
  { id: "urgency", title: "How soon do you need support?" },
  { id: "days", title: "Which days work for you?" },
  { id: "budget", title: "What is your session budget?" },
  { id: "gender", title: "Do you have a gender preference?" },
];

function ProgressBar({ step, total }) {
  return (
    <div className="h-0.5 bg-sunken w-full mb-8 rounded-full overflow-hidden">
      <div
        className="h-full bg-pine transition-all duration-300 ease-out rounded-full"
        style={{ width: `${((step + 1) / total) * 100}%` }}
      />
    </div>
  );
}

function OptionRow({ label, sub, selected, onSelect, hint }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center justify-between px-4 py-3.5 rounded-[10px] border transition-colors duration-150 ${
        selected ? "border-pine bg-pine-tint" : "border-line bg-surface hover:bg-sunken"
      }`}
    >
      <div>
        <span className="text-[15px] text-ink font-medium">{label}</span>
        {sub && <p className="text-[12px] text-muted mt-0.5">{sub}</p>}
      </div>
      {hint && <span className="font-mono text-[11px] text-muted">{hint}</span>}
    </button>
  );
}

export default function FindCounsellor() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [concerns, setConcerns] = useState([]);
  const [language, setLanguage] = useState("");
  const [mode, setMode] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [days, setDays] = useState([]);
  const [budget, setBudget] = useState(0);
  const [gender, setGender] = useState("no preference");
  const [loading, setLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);

  const hasCrisis =
    concerns.includes("I am in crisis") ||
    concerns.some((c) => CRISIS_KEYWORDS.includes(c.toLowerCase()));

  function toggleConcern(c) {
    if (c === "I am in crisis") {
      setConcerns(["I am in crisis"]);
      setShowCrisis(true);
      return;
    }
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev.filter((x) => x !== "I am in crisis"), c]
    );
    setShowCrisis(false);
  }

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function canAdvance() {
    if (step === 0) return consentGiven;
    if (step === 1) return concerns.length > 0;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const payload = {
        concerns: concerns.filter((c) => c !== "I am in crisis"),
        preferredLanguage: language || undefined,
        preferredGender: gender || "no preference",
        sessionMode: mode ? mode.toLowerCase() : undefined,
        urgency,
        budgetMax: budget || undefined,
        preferredDays: days,
        previousCounselling: false,
        consentGiven: true,
      };
      const { intakeId } = await api.recommend(payload);
      navigate(`/results/${intakeId}`);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  }

  function next() {
    if (step === STEPS.length - 1) { handleSubmit(); return; }
    setStep((s) => s + 1);
  }

  function back() { setStep((s) => Math.max(0, s - 1)); }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">
        <div className="max-w-lg mx-auto">
          <ProgressBar step={step} total={STEPS.length} />

          <p className="step-label mb-3">
            {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </p>

          <h1 className="font-serif text-[32px] md:text-[40px] text-ink mb-6 leading-tight">
            {currentStep.title}
          </h1>

          {/* Crisis panel shown above everything when triggered */}
          {showCrisis && hasCrisis && (
            <div className="mb-6">
              <CrisisPanel onContinue={() => { setShowCrisis(false); setConcerns([]); }} />
            </div>
          )}

          {/* Step content */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-[14px] text-muted leading-relaxed">
                Baho Counselling matches you with a counsellor based on your needs and preferences. 
                Your responses are private and are only shared with the counsellor you choose to book.
              </p>
              <p className="text-[14px] text-muted leading-relaxed">
                This system suggests counsellors only. It does not diagnose conditions or provide clinical advice.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-pine"
                />
                <span className="text-[14px] text-ink leading-relaxed">
                  I understand and consent to my intake responses being used to find a matching counsellor.
                </span>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <p className="text-[13px] text-muted mb-3">Select all that apply. Only you and your counsellor will see this.</p>
              {CONCERNS.map((c, i) => (
                <OptionRow
                  key={c}
                  label={c.charAt(0).toUpperCase() + c.slice(1)}
                  selected={concerns.includes(c)}
                  onSelect={() => toggleConcern(c)}
                  hint={`${i + 1}`}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              {LANGUAGES.map((l, i) => (
                <OptionRow
                  key={l}
                  label={l}
                  selected={language === l}
                  onSelect={() => setLanguage(l)}
                  hint={`${i + 1}`}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {MODES.map((m, i) => (
                <OptionRow
                  key={m}
                  label={m}
                  selected={mode === m}
                  onSelect={() => setMode(m)}
                  hint={`${i + 1}`}
                />
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              {URGENCIES.map((u, i) => (
                <OptionRow
                  key={u.value}
                  label={u.label}
                  sub={u.sub}
                  selected={urgency === u.value}
                  onSelect={() => setUrgency(u.value)}
                  hint={`${i + 1}`}
                />
              ))}
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="text-[13px] text-muted mb-3">Select all days that work. Optional.</p>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((d) => (
                  <OptionRow
                    key={d}
                    label={d}
                    selected={days.includes(d)}
                    onSelect={() => toggleDay(d)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-2">
              <p className="text-[13px] text-muted mb-3">This helps filter counsellors to those within your range. Optional.</p>
              {BUDGETS.map((b, i) => (
                <OptionRow
                  key={b.value}
                  label={b.label}
                  selected={budget === b.value}
                  onSelect={() => setBudget(b.value)}
                  hint={`${i + 1}`}
                />
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-2">
              <p className="text-[13px] text-muted mb-3">Optional. All counsellors are qualified regardless of gender.</p>
              {GENDERS.map((g, i) => (
                <OptionRow
                  key={g}
                  label={g}
                  selected={gender.toLowerCase() === g.toLowerCase() || (gender === "no preference" && g === "No preference")}
                  onSelect={() => setGender(g.toLowerCase() === "no preference" ? "no preference" : g.toLowerCase())}
                  hint={`${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ChevronLeft size={16} strokeWidth={1.5} />
              Back
            </Button>
            <Button
              variant="primary"
              onClick={next}
              disabled={!canAdvance() || loading || (showCrisis && hasCrisis)}
            >
              {step === STEPS.length - 1 ? (loading ? "Finding matches ..." : "See my matches") : "Continue"}
              {step < STEPS.length - 1 && <ChevronRight size={16} strokeWidth={1.5} />}
            </Button>
          </div>

          {[2, 3, 5, 6, 7].includes(step) && (
            <button
              className="w-full mt-3 text-center text-[13px] text-muted hover:text-ink"
              onClick={next}
            >
              Skip this question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
