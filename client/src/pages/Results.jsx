import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { api, downloadBlob } from "../lib/api.js";
import { CounsellorCard, CounsellorCardSkeleton } from "../components/CounsellorCard.jsx";
import { CrisisPanel } from "../components/CrisisPanel.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { Button } from "../components/Button.jsx";

export default function Results() {
  const { intakeId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.getIntake(intakeId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [intakeId]);

  async function handleDownload() {
    setDownloading(true);
    const toastId = toast.loading("Preparing your report ...");
    try {
      const blob = await api.recommendationReport(intakeId);
      downloadBlob(blob, `baho-my-results.pdf`);
      toast.success("Report downloaded.", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setDownloading(false);
    }
  }

  const hasCrisis = data?.intake?.concerns?.includes("I am in crisis");

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">
        <div className="max-w-2xl">

          {hasCrisis && (
            <div className="mb-8">
              <CrisisPanel />
            </div>
          )}

          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="step-label mb-2">Your results</p>
              <h1 className="font-serif text-[40px] text-ink leading-tight">
                Counsellors matched <em className="italic">for you</em>
              </h1>
              <p className="text-[14px] text-muted mt-2">
                Based on your responses, here are the counsellors we think could help.
                This is a suggestion only and is not clinical advice.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="shrink-0 mt-1">
              <Download size={15} strokeWidth={1.5} />
              Download
            </Button>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <CounsellorCardSkeleton key={i} />)}
            </div>
          )}

          {error && (
            <div className="border border-clay/30 bg-clay-tint rounded-card p-4 text-[14px] text-clay">
              {error}
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">
              {data.results.length === 0 && (
                <div className="text-center py-16 text-muted">
                  <p className="font-serif text-[22px] text-ink mb-2">No matches found</p>
                  <p className="text-[14px]">Try adjusting your preferences, especially language or budget.</p>
                  <Link to="/find" className="mt-4 inline-flex h-10 px-4 bg-pine text-white rounded-[10px] items-center text-[14px] hover:bg-pine-hover transition-colors">
                    Start again
                  </Link>
                </div>
              )}
              {data.results.map((r, idx) => (
                <CounsellorCard
                  key={r.counsellor._id}
                  counsellor={r.counsellor}
                  matchPercent={r.matchPercent}
                  reason={r.reason}
                  breakdown={r.breakdown}
                  earliestSlot={r.earliestSlot}
                  isBest={idx === 0}
                />
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-sunken border border-line rounded-card text-[13px] text-muted leading-relaxed">
            Baho Counselling suggests counsellors based on your stated preferences. 
            It does not diagnose mental health conditions or recommend clinical treatments. 
            For immediate support, contact Baho Hospital directly.
          </div>
        </div>
      </div>
    </div>
  );
}
