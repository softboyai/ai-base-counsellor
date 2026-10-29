const BASE = "/api";

function getToken() {
  return localStorage.getItem("baho_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }

  // Handle blob (PDF/CSV downloads)
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf") || contentType.includes("text/csv")) {
    return res.blob();
  }

  return res.json();
}

export const api = {
  // Auth
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (body) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),

  // Counsellors
  getCounsellors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/counsellors${qs ? "?" + qs : ""}`);
  },
  getCounsellor: (id) => request(`/counsellors/${id}`),
  createCounsellor: (body) => request("/counsellors", { method: "POST", body: JSON.stringify(body) }),
  updateCounsellor: (id, body) => request(`/counsellors/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCounsellor: (id) => request(`/counsellors/${id}`, { method: "DELETE" }),
  myCounsellorProfile: () => request("/counsellors/me/profile"),

  // Recommendations
  recommend: (body) => request("/recommendations", { method: "POST", body: JSON.stringify(body) }),
  getIntake: (id) => request(`/recommendations/${id}`),

  // Appointments
  bookAppointment: (body) => request("/appointments", { method: "POST", body: JSON.stringify(body) }),
  myAppointments: () => request("/appointments/my"),
  allAppointments: () => request("/appointments/all"),
  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  // Reviews
  leaveReview: (body) => request("/reviews", { method: "POST", body: JSON.stringify(body) }),
  getReviews: (counsellorId) => request(`/reviews/${counsellorId}`),

  // Admin
  adminStats: () => request("/admin/stats"),

  // Reports (returns blob)
  adminReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/admin${qs ? "?" + qs : ""}`);
  },
  recommendationReport: (intakeId) => request(`/reports/recommendation/${intakeId}`),
  scheduleReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/my-appointments${qs ? "?" + qs : ""}`);
  },
};

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
