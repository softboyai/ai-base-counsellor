import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api.js";
import { Input } from "../components/Input.jsx";
import { Button } from "../components/Button.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { Copy, Check } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null); // { resetToken, resetUrl }
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.forgotPassword(email);
      setResult(data);
      toast.success("Reset token generated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToken() {
    navigator.clipboard.writeText(result.resetToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-16 pb-24">
        <div className="max-w-sm mx-auto">
          <p className="step-label mb-4">Account access</p>
          <h1 className="font-serif text-[36px] text-ink mb-2">Forgot password</h1>
          <p className="text-[14px] text-muted mb-8 leading-relaxed">
            Enter your email address and we will generate a password reset token for you.
          </p>

          {!result && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              {error && (
                <p className="text-[13px] text-clay bg-clay-tint border border-clay/20 px-3 py-2 rounded-[10px]">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? "Sending ..." : "Send reset link"}
              </Button>
            </form>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-pine-tint border border-[#c4ddd5] rounded-card">
                <p className="text-[13px] font-medium text-pine mb-1">Token generated</p>
                <p className="text-[13px] text-muted leading-relaxed">
                  In production this token would arrive by email. For this demo, copy it below
                  and use it on the reset page.
                </p>
              </div>

              <div className="border border-line rounded-card p-4 bg-surface">
                <p className="step-label mb-2">Your reset token</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-[11px] text-ink bg-sunken border border-line rounded-[8px] px-3 py-2 break-all">
                    {result.resetToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="h-8 w-8 shrink-0 flex items-center justify-center border border-line rounded-[8px] text-muted hover:text-pine hover:border-pine transition-colors"
                    aria-label="Copy token"
                  >
                    {copied ? <Check size={14} strokeWidth={1.5} className="text-pine" /> : <Copy size={14} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <Link
                to={`/reset-password?token=${result.resetToken}&email=${encodeURIComponent(email)}`}
                className="block w-full h-10 bg-pine text-white text-[14px] font-medium rounded-[10px] flex items-center justify-center hover:bg-pine-hover transition-colors"
              >
                Continue to reset password
              </Link>

              <button
                onClick={() => { setResult(null); setEmail(""); }}
                className="w-full text-center text-[13px] text-muted hover:text-ink"
              >
                Use a different email
              </button>
            </div>
          )}

          <p className="text-[13px] text-muted mt-6 text-center">
            Remembered it?{" "}
            <Link to="/login" className="text-pine hover:underline underline-offset-2">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
