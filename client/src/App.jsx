import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthProvider, useAuth } from "./lib/auth.js";

// Pages
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import FindCounsellor from "./pages/FindCounsellor.jsx";
import Results from "./pages/Results.jsx";
import Directory from "./pages/Directory.jsx";
import CounsellorProfile from "./pages/CounsellorProfile.jsx";
import BookAppointment from "./pages/BookAppointment.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import LeaveReview from "./pages/LeaveReview.jsx";
import CounsellorDashboard from "./pages/CounsellorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function AuthGate({ children, roles }) {
  const auth = useAuth();
  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted font-mono text-sm">Loading ...</div>
      </div>
    );
  }
  if (!auth.user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(auth.user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/counsellors/:id" element={<CounsellorProfile />} />

        <Route path="/find" element={<AuthGate roles={["client"]}><FindCounsellor /></AuthGate>} />
        <Route path="/results/:intakeId" element={<AuthGate roles={["client"]}><Results /></AuthGate>} />
        <Route path="/book/:counsellorId" element={<AuthGate roles={["client"]}><BookAppointment /></AuthGate>} />
        <Route path="/appointments" element={<AuthGate roles={["client", "counsellor", "admin"]}><MyAppointments /></AuthGate>} />
        <Route path="/review/:appointmentId" element={<AuthGate roles={["client"]}><LeaveReview /></AuthGate>} />

        <Route path="/counsellor" element={<AuthGate roles={["counsellor"]}><CounsellorDashboard /></AuthGate>} />
        <Route path="/admin" element={<AuthGate roles={["admin"]}><AdminDashboard /></AuthGate>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
