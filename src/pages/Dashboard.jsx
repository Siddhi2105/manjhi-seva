import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ role }) {
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    fetchDashboardData();

    const patientsChannel = supabase
      .channel("dashboard-patients")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => fetchDashboardData())
      .subscribe();

    const appointmentsChannel = supabase
      .channel("dashboard-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(appointmentsChannel);
    };
  }, []);

  async function fetchDashboardData() {
    const today = new Date().toISOString().split("T")[0];

    const [{ data: patients }, { data: doctors }, { data: appointments }] =
      await Promise.all([
        supabase.from("patients").select("*").order("created_at", { ascending: false }),
        supabase.from("doctors").select("*"),
        supabase.from("appointments").select("*"),
      ]);

    setTotalPatients(patients?.length || 0);
    setTotalDoctors(doctors?.length || 0);
    setTotalAppointments(appointments?.length || 0);
    setRecentPatients(patients?.slice(0, 5) || []);
    setCompletedAppointments(appointments?.filter((a) => a.status === "Completed").length || 0);
    setPendingAppointments(appointments?.filter((a) => a.status === "Pending").length || 0);
    setTodayAppointments(appointments?.filter((a) => a.appointment_date === today).length || 0);
  }

  const isAdmin   = role === "admin";
  const isStaff   = ["admin", "doctor", "receptionist", "sevak"].includes(role);
  const isPatient = role === "patient";

  const StatCard = ({ value, label, color = "text-blue-600" }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          {isAdmin && "Admin Dashboard"}
          {role === "doctor" && "Doctor Dashboard"}
          {role === "receptionist" && "Receptionist Dashboard"}
          {role === "sevak" && "Sevak Dashboard"}
          {isPatient && "My Health Dashboard"}
        </h1>
        <p className="text-slate-500 mt-1">Welcome back — here's your overview for today.</p>
      </div>

      {/* ── Stats cards ── */}
      {isStaff && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard value={totalPatients} label="Total Patients" color="text-blue-600" />
          {isAdmin && <StatCard value={totalDoctors} label="Total Doctors" color="text-purple-600" />}
          <StatCard value={totalAppointments} label="Total Appointments" color="text-slate-700" />
          <StatCard value={todayAppointments} label="Today's Appointments" color="text-orange-500" />
          <StatCard value={completedAppointments} label="Completed" color="text-green-600" />
          <StatCard value={pendingAppointments} label="Pending" color="text-yellow-600" />
        </div>
      )}

      {/* ── Patient view ── */}
      {isPatient && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md shadow-sm">
          <p className="text-slate-600 text-sm">
            Use the AI Symptom Checker to check your symptoms, or contact your
            hospital staff to view your records.
          </p>
          <Link to="/symptom-checker">
            <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
              AI Symptom Checker
            </button>
          </Link>
        </div>
      )}

      {/* ── Recent patients table ── */}
      {isStaff && recentPatients.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Recent Patients</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Age</th>
                <th className="px-6 py-3">Gender</th>
                <th className="px-6 py-3">Village</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">{p.full_name}</td>
                  <td className="px-6 py-3 text-slate-600">{p.age}</td>
                  <td className="px-6 py-3 text-slate-600">{p.gender}</td>
                  <td className="px-6 py-3 text-slate-600">{p.village}</td>
                  <td className="px-6 py-3">
                    <Link to={`/patient/${p.id}`}>
                      <button className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition-colors cursor-pointer">
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Quick actions ── */}
      {isStaff && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {isAdmin && (
              <Link to="/doctors">
                <button className="px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                  Doctors
                </button>
              </Link>
            )}
            <Link to="/patients">
              <button className="px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                Patients
              </button>
            </Link>
            <Link to="/add-patient">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                + Add Patient
              </button>
            </Link>
            <Link to="/appointments">
              <button className="px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                Appointments
              </button>
            </Link>
            <Link to="/symptom-checker">
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                AI Symptom Checker
              </button>
            </Link>
            <Link to="/appointment-router">
              <button className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer">
                🤖 AI Router
              </button>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}