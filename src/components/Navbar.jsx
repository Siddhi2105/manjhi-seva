import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <nav className="topbar">
      <Link to="/dashboard" className="brand">
        Manjhi Seva
      </Link>

      <div className="nav-links">
        <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
          Dashboard
        </Link>
        <Link to="/patients" className={`nav-link ${isActive("/patients") ? "active" : ""}`}>
          Patients
        </Link>
        <Link to="/doctors" className={`nav-link ${isActive("/doctors") ? "active" : ""}`}>
          Doctors
        </Link>
        <Link to="/appointments" className={`nav-link ${isActive("/appointments") ? "active" : ""}`}>
          Appointments
        </Link>
        <Link to="/symptom-checker" className={`nav-link ${isActive("/symptom-checker") ? "active" : ""}`}>
          AI Checker
        </Link>
      </div>

      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </nav>
  );
}
