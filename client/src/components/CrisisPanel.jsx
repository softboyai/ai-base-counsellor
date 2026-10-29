import { PhoneCall, AlertTriangle } from "lucide-react";

// These fall back to safe defaults; set VITE_HOSPITAL_PHONE in client/.env to override
const HOSPITAL_PHONE = "+250 000 000 000";
const EMERGENCY_PHONE = "112";

export function CrisisPanel({ onContinue }) {
  return (
    <div className="rounded-card border border-clay bg-clay-tint p-6 max-w-xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-clay flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={18} strokeWidth={1.5} className="text-white" />
        </div>
        <div>
          <h2 className="font-serif text-[20px] text-clay mb-2">We are here for you</h2>
          <p className="text-[14px] text-ink mb-4 leading-relaxed">
            It sounds like you may be going through a very difficult time right now. 
            Please reach out for immediate support before doing anything else. 
            You do not need to face this alone.
          </p>

          <div className="space-y-3">
            <a
              href={`tel:${HOSPITAL_PHONE.replace(/\s/g, "")}`}
              className="flex items-center gap-3 bg-white border border-clay/30 rounded-[10px] px-4 py-3 hover:bg-clay-tint transition-colors group"
            >
              <PhoneCall size={18} strokeWidth={1.5} className="text-clay shrink-0" />
              <div>
                <div className="text-[12px] text-muted">Baho Hospital</div>
                <div className="font-mono text-[14px] text-ink">{HOSPITAL_PHONE}</div>
              </div>
            </a>

            <a
              href={`tel:${EMERGENCY_PHONE}`}
              className="flex items-center gap-3 bg-white border border-clay/30 rounded-[10px] px-4 py-3 hover:bg-clay-tint transition-colors"
            >
              <PhoneCall size={18} strokeWidth={1.5} className="text-clay shrink-0" />
              <div>
                <div className="text-[12px] text-muted">Emergency services</div>
                <div className="font-mono text-[14px] text-ink">{EMERGENCY_PHONE}</div>
              </div>
            </a>
          </div>

          <p className="text-[12px] text-muted mt-4">
            If you are in immediate danger, please contact emergency services or go to your nearest hospital now.
          </p>

          {onContinue && (
            <button
              onClick={onContinue}
              className="mt-4 text-[13px] text-muted underline underline-offset-2 hover:text-ink"
            >
              I am safe. Continue to find a counsellor.
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
