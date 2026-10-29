import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api.js";
import { Input } from "../components/Input.jsx";
import { Button } from "../components/Button.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { Check } from "lucide-react";

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const [token, setToken]       = useState(searchParams.get("token") || "");
  const [email, setEmail]       = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ email, token, password });
      setDone(true);
      toast.success("Password updated.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-content mx-auto px-5 pt-24 pb-24 flex justify-center">
          <div className="max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-pine-tint flex items-center justify-center mx-auto mb-6">
              <Check size={24} strokeWidth={1.5} className="text-pine" />
            </div>
            <h1 className="font-serif text-[32px] text-ink mb-3">Password updated</h1>
            <p className="text-[14px] text-muted mb-6">
              Your password has been changed. Redirecting you to login ...
            </p>
            <Link
              to="/login"
              className="h-10 px-6 bg-pine text-white text-[14px] rounded-[10px] inline-flex items-center hover:bg-pine-hover transition-colors"
            >
              Log in now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-16 pb-24">
        <div className="max-w-sm mx-auto">
          <p className="step-label mb-4">Account access</p>
          <h1 className="font-serif text-[36px] text-ink mb-2">Reset password</h1>
          <p className="text-[14px] text-muted mb-8">
            Enter your reset token and choose a new password.
          </p>

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
            <Input
              label="Reset token"
              type="text"
              placeholder="Paste your reset token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <Input
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="Type it again"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              error={confirm && password !== confirm ? "Passwords do not match." : ""}
            />

            {error && (
              <p className="text-[13px] text-clay bg-clay-tint border border-clay/20 px-3 py-2 rounded-[10px]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || (confirm.length > 0 && password !== confirm)}
            >
              {loading ? "Updating ..." : "Set new password"}
            </Button>
          </form>

          <p className="text-[13px] text-muted mt-6 text-center">
            No token yet?{" "}
            <Link to="/forgot-password" className="text-pine hover:underline underline-offset-2">
              Request one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
