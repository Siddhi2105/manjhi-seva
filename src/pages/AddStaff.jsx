import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AddStaff() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    village: "",
    role: "receptionist",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      alert("Name and phone are required.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("staff").insert({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      village: form.village.trim() || null,
      role: form.role,
    });

    if (error) {
      alert("Failed to add staff: " + error.message);
      setLoading(false);
      return;
    }

    navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-lg space-y-6">

        {/* ── Header ── */}
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Admin Panel
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Add Staff</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create a receptionist or sevak account. They'll sign up using this phone number.
          </p>
        </div>

        {/* ── Form Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                placeholder="e.g. Rekha Devi"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-400 mt-1">
                Staff must sign up with this exact phone number to be auto-linked.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Village</label>
              <input
                type="text"
                name="village"
                placeholder="e.g. Rampur"
                value={form.village}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
              >
                <option value="receptionist">Receptionist</option>
                <option value="sevak">Sevak</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Adding..." : "Add Staff Member"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

        {/* ── Info box ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">How staff signup works</p>
          <p className="text-xs text-amber-600">
            After you create this record, the staff member signs up on the Signup page using the same phone number. The system will auto-link their account to this staff record and assign the correct role.
          </p>
        </div>

      </div>
    </div>
  );
}