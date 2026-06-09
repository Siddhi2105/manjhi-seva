import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, doctors: 0, patients: 0, staff: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [{ data: profiles }, { data: doctors }, { data: patients }, { data: staff }] =
      await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("doctors").select("id"),
        supabase.from("patients").select("id"),
        supabase.from("staff").select("id"),
      ]);

    setUsers(profiles || []);
    setStats({
      users: profiles?.length || 0,
      doctors: doctors?.length || 0,
      patients: patients?.length || 0,
      staff: staff?.length || 0,
    });
    setLoading(false);
  }

  async function changeRole(userId, newRole) {
    setUpdatingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) alert("Failed to update role: " + error.message);
    else loadData();
    setUpdatingId(null);
  }

  const roleBadge = {
    admin:        "bg-purple-100 text-purple-700 border-purple-200",
    doctor:       "bg-blue-100 text-blue-700 border-blue-200",
    receptionist: "bg-cyan-100 text-cyan-700 border-cyan-200",
    sevak:        "bg-amber-100 text-amber-700 border-amber-200",
    patient:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const statCards = [
    { label: "Total Users",   value: stats.users,    color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Doctors",       value: stats.doctors,  color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Patients",      value: stats.patients, color: "text-emerald-600",bg: "bg-emerald-50"},
    { label: "Staff",         value: stats.staff,    color: "text-amber-600",  bg: "bg-amber-50"  },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage users, roles, and staff</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/add-staff")}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              + Add Staff
            </button>
            <button
              onClick={() => navigate("/add-doctor")}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 transition-colors cursor-pointer"
            >
              + Add Doctor
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} mb-3`}>
                <span className={`text-lg font-bold ${color}`}>{value}</span>
              </div>
              <p className="text-sm font-medium text-slate-700">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Users Table ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">All Users</h2>
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm text-center py-12 animate-pulse">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Name", "Phone", "Village", "Role", "Change Role"].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.full_name || "—"}</td>
                      <td className="px-6 py-4 text-slate-500">{u.phone || "—"}</td>
                      <td className="px-6 py-4 text-slate-500">{u.village || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${roleBadge[u.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          disabled={updatingId === u.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                        >
                          {["admin", "doctor", "receptionist", "sevak", "patient"].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {updatingId === u.id && (
                          <span className="ml-2 text-xs text-blue-500 animate-pulse">Saving...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}