import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Navbar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  const canSee = {
    patients:      ["admin", "receptionist", "sevak"],
    doctors:       ["admin"],
    appointments:  ["admin", "receptionist", "sevak"],
    aiChecker:     ["admin", "doctor", "receptionist", "sevak", "patient"],
    doctorPortal:  ["doctor"],
    patientPortal: ["patient"],
    adminPanel:    ["admin"],
  };

  const navLink = (path, label) => (
    <Link
      to={path}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150
        ${isActive(path)
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:text-white hover:bg-slate-700"
        }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between">

      {/* ── Brand ── */}
      <Link
        to={
          role === "patient" ? "/my-portal" :
          role === "doctor" ? "/doctor-portal" :
          "/dashboard"
        }
        className="text-white font-bold text-lg tracking-tight hover:text-blue-400 transition-colors"
      >
        Manjhi Seva
      </Link>

      {/* ── Nav Links ── */}
      <div className="flex items-center gap-1">
        {["admin", "receptionist", "sevak"].includes(role) && navLink("/dashboard", "Dashboard")}
        {canSee.patientPortal.includes(role) && navLink("/my-portal", "My Portal")}
        {canSee.doctorPortal.includes(role) && navLink("/doctor-portal", "My Portal")}
        {canSee.patients.includes(role) && navLink("/patients", "Patients")}
        {canSee.doctors.includes(role) && navLink("/doctors", "Doctors")}
        {canSee.appointments.includes(role) && navLink("/appointments", "Appointments")}
        {canSee.aiChecker.includes(role) && navLink("/symptom-checker", "AI Checker")}
        {canSee.adminPanel.includes(role) && navLink("/admin", "Admin Panel")}
      </div>

      {/* ── Right side: role badge + logout ── */}
      <div className="flex items-center gap-3">
        <span className="text-xs px-3 py-1 rounded-full bg-slate-700 text-slate-300 capitalize font-medium">
          {role || "..."}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>

    </nav>
  );
}