import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth.js";
import { api } from "../lib/api.js";
import { Input } from "../components/Input.jsx";
import { Button } from "../components/Button.jsx";
import { Navbar } from "../components/Navbar.jsx";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "client" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.register(form);
      login(token, user);
      toast.success(`Welcome, ${user.name.split(" ")[0]}. Your account is ready.`);
      navigate("/find");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-16 pb-24">
        <div className="max-w-sm mx-auto">
          <p className="step-label mb-4">Create an account</p>
          <h1 className="font-serif text-[36px] text-ink mb-2">Register</h1>
          <p className="text-[14px] text-muted mb-8">Start finding the right counsellor for your needs.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+250 78 000 0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              autoComplete="tel"
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
            />

            {error && (
              <p className="text-[13px] text-clay bg-clay-tint border border-clay/20 px-3 py-2 rounded-[10px]">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Creating account ..." : "Create account"}
            </Button>
          </form>

          <p className="text-[13px] text-muted mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-pine hover:underline underline-offset-2">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
