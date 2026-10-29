import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.js";
import { Navbar } from "../components/Navbar.jsx";
import { CounsellorCard } from "../components/CounsellorCard.jsx";
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Shield, Clock, Users } from "lucide-react";

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Tell us what you need",
      body: "Complete a short, private intake in about three minutes. Your responses shape the match and are never shared without your consent.",
    },
    {
      num: "02",
      title: "See your matches",
      body: "The system compares your needs with each counsellor's specialisations, languages, availability and fee, and explains why each match was suggested.",
    },
    {
      num: "03",
      title: "Book your session",
      body: "Choose a counsellor and book directly. Sessions can be in-person at Baho Hospital, or by video or phone.",
    },
  ];

  return (
    <section className="py-16 border-t border-line">
      <div className="max-w-content mx-auto px-5">
        <p className="step-label mb-4">How it works</p>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num}>
              <span className="font-mono text-[32px] text-pine-tint leading-none">{s.num}</span>
              <h3 className="font-serif text-[20px] text-ink mt-2 mb-2">{s.title}</h3>
              <p className="text-[14px] text-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  return (
    <section className="py-14 bg-sunken border-y border-line">
      <div className="max-w-content mx-auto px-5">
        <p className="step-label mb-4">Privacy and confidentiality</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Your data is yours",
              body: "Intake responses are encrypted and visible only to you and the counsellor you book.",
            },
            {
              icon: Clock,
              title: "Consent before everything",
              body: "You give explicit consent before any personal information is processed. You can request deletion at any time.",
            },
            {
              icon: Users,
              title: "No diagnosis, no clinical advice",
              body: "Baho Counselling matches you with a professional. It does not diagnose conditions or recommend treatments.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-pine-tint flex items-center justify-center shrink-0 mt-0.5">
                <item.icon size={15} strokeWidth={1.5} className="text-pine" />
              </div>
              <div>
                <h4 className="font-medium text-[14px] text-ink mb-1">{item.title}</h4>
                <p className="text-[13px] text-muted leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.getCounsellors({ accepting: "true" }).then((list) => setFeatured(list.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="max-w-content mx-auto px-5 pt-20 pb-16">
        <div className="max-w-xl">
          <p className="step-label mb-6">Baho Hospital, AI-Based Counsellor Recommendation System ,Kigali</p>
          <h1 className="font-serif text-[52px] md:text-[68px] leading-[1.05] text-ink mb-6">
            The right counsellor, <em className="not-italic italic">for you</em>
          </h1>
          <p className="text-[16px] text-muted leading-relaxed mb-8 max-w-md">
            Baho Counselling uses a careful matching process to connect you with a mental health professional who fits your language, schedule and needs.
          </p>
          <div className="flex items-center gap-3">
            {user?.role === "client" ? (
              <Link to="/find" className="h-11 px-6 bg-pine text-white font-medium text-[15px] rounded-[10px] inline-flex items-center hover:bg-pine-hover transition-colors">
                Find your counsellor
              </Link>
            ) : (
              <Link to="/register" className="h-11 px-6 bg-pine text-white font-medium text-[15px] rounded-[10px] inline-flex items-center hover:bg-pine-hover transition-colors">
                Get started
              </Link>
            )}
            <Link to="/directory" className="h-11 px-4 border border-line text-[14px] text-muted rounded-[10px] inline-flex items-center hover:bg-sunken hover:text-ink transition-colors">
              Browse counsellors
            </Link>
          </div>
        </div>
      </section>

      <HowItWorks />
      <PrivacySection />

      {/* Featured counsellors */}
      {featured.length > 0 && (
        <section className="py-16 max-w-content mx-auto px-5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="step-label mb-1">Our team</p>
              <h2 className="font-serif text-[32px] text-ink">Featured counsellors</h2>
            </div>
            <Link to="/directory" className="text-[13px] text-pine hover:underline underline-offset-2">
              View all
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((c) => (
              <CounsellorCard key={c._id} counsellor={c} />
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-line py-8">
        <div className="max-w-content mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-[16px] text-ink">Baho Counselling</p>
          <p className="text-[12px] text-muted text-center">
            Baho Hospital,AI-based recommendation sytem, Kigali, Rwanda. This service suggests counsellors only and is not a substitute for clinical advice.
          </p>
          <p className="font-mono text-[11px] text-muted">{new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
