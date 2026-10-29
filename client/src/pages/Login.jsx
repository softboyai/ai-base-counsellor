import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth.js";
import { api } from "../lib/api.js";
import { Input } from "../components/Input.jsx";
import { Button } from "../components/Button.jsx";
import { Navbar } from "../components/Navbar.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.login(form);
      login(token, user);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}.`);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "counsellor") navigate("/counsellor");
      else navigate("/find");
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
          <p className="step-label mb-4">Welcome back</p>
          <h1 className="font-serif text-[36px] text-ink mb-8">Log in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-[13px] text-clay bg-clay-tint border border-clay/20 px-3 py-2 rounded-[10px]">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Logging in ..." : "Log in"}
            </Button>
          </form>

          <p className="text-[13px] text-muted mt-4 text-center">
            <Link to="/forgot-password" className="text-pine hover:underline underline-offset-2">
              Forgot your password?
            </Link>
          </p>

          <p className="text-[13px] text-muted mt-6 text-center">
            No account?{" "}
            <Link to="/register" className="text-pine hover:underline underline-offset-2">
              Register here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
