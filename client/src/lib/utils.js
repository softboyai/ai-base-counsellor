export function formatRWF(amount) {
  if (!amount && amount !== 0) return "RWF -";
  return `RWF ${Number(amount).toLocaleString("en-RW")}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

export function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function statusColor(status) {
  const map = {
    pending: "text-amber-600",
    confirmed: "text-pine",
    completed: "text-muted",
    cancelled: "text-clay",
  };
  return map[status] || "text-muted";
}

export function statusDot(status) {
  const map = {
    pending: "bg-amber-400",
    confirmed: "bg-pine",
    completed: "bg-muted",
    cancelled: "bg-clay",
  };
  return map[status] || "bg-muted";
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const CRISIS_KEYWORDS = [
  "crisis", "suicidal", "suicide", "self-harm", "self harm", "end my life",
  "kill myself", "hopeless", "harm myself", "cannot go on", "want to die",
];

export function detectCrisis(concerns = [], notes = "") {
  const text = [...concerns, notes].join(" ").toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => text.includes(kw));
}
