import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.js";
import { Moon, Sun, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils.js";

function useDark() {
  const [dark, setDark] = useState(() => localStorage.getItem("baho_dark") === "1");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("baho_dark", dark ? "1" : "0");
  }, [dark]);
  return [dark, setDark];
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useDark();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const navLinks = user
    ? user.role === "admin"
      ? [{ to: "/admin", label: "Dashboard" }, { to: "/directory", label: "Counsellors" }, { to: "/appointments", label: "Appointments" }]
      : user.role === "counsellor"
      ? [{ to: "/counsellor", label: "Dashboard" }, { to: "/appointments", label: "Sessions" }]
      : [{ to: "/find", label: "Find a Counsellor" }, { to: "/directory", label: "Directory" }, { to: "/appointments", label: "My Appointments" }]
    : [{ to: "/directory", label: "Our Counsellors" }];

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="max-w-content mx-auto px-5 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-[22px] text-ink leading-none">Baho</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted pt-0.5">Counselling</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "px-3 h-8 flex items-center text-[13px] rounded-[8px] transition-colors",
                location.pathname === l.to
                  ? "bg-pine-tint text-pine font-medium"
                  : "text-muted hover:text-ink hover:bg-sunken"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className="h-8 w-8 flex items-center justify-center rounded-[8px] text-muted hover:text-ink hover:bg-sunken transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[13px] text-muted">{user.name?.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="h-8 w-8 flex items-center justify-center rounded-[8px] text-muted hover:text-clay hover:bg-clay-tint transition-colors"
                aria-label="Log out"
              >
                <LogOut size={16} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Link to="/login" className="h-8 px-3 flex items-center text-[13px] text-muted hover:text-ink rounded-[8px] hover:bg-sunken transition-colors">Log in</Link>
              <Link to="/register" className="h-8 px-3 flex items-center text-[13px] bg-pine text-white rounded-[10px] hover:bg-pine-hover transition-colors">Register</Link>
            </div>
          )}

          <button
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-[8px] text-muted hover:text-ink hover:bg-sunken"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-line bg-surface px-5 py-4 flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="h-10 flex items-center text-[14px] text-ink px-2 rounded-[8px] hover:bg-sunken"
            >
              {l.label}
            </Link>
          ))}
          <hr className="hr-line my-2" />
          {user ? (
            <button onClick={() => { handleLogout(); setOpen(false); }} className="h-10 flex items-center text-[14px] text-clay px-2">
              Log out
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="h-10 flex items-center text-[14px] text-ink px-2">Log in</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="h-10 flex items-center text-[14px] text-pine px-2 font-medium">Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export function Sidebar({ links }) {
  const location = useLocation();
  return (
    <aside className="w-52 shrink-0 hidden md:flex flex-col gap-1 pt-4">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={cn(
            "h-9 px-3 flex items-center gap-2.5 text-[13px] rounded-[8px] transition-colors",
            location.pathname === l.to
              ? "bg-pine-tint text-pine font-medium"
              : "text-muted hover:text-ink hover:bg-sunken"
          )}
        >
          {l.icon && <l.icon size={16} strokeWidth={1.5} />}
          {l.label}
        </Link>
      ))}
    </aside>
  );
}
