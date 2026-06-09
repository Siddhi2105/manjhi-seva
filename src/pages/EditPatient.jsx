import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState({
    full_name: "",
    age: "",
    gender: "",
    phone: "",
    village: "",
    symptoms: "",
  });

  useEffect(() => {
    fetchPatient();
  }, []);

  async function fetchPatient() {
    const { data, error } = await supabase
      .from("patients").select("*").eq("id", id).single();
    if (error) { alert(error.message); return; }
    setPatient(data);
  }

  async function updatePatient(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("patients").update(patient).eq("id", id);

    if (error) { alert(error.message); setLoading(false); return; }
    navigate(`/patient/${id}`);
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/patient/${id}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Patient
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Edit Patient</h1>
          <p className="text-slate-500 text-sm mt-1">Update the patient's details below.</p>
        </div>

        {/* ── Form Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={updatePatient} className="space-y-4">

            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={patient.full_name}
                onChange={(e) => setPatient({ ...patient, full_name: e.target.value })}
                placeholder="Full Name"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Age</label>
                <input
                  type="number"
                  value={patient.age}
                  onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                  placeholder="Age"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select
                  value={patient.gender}
                  onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                  className={inputClass + " bg-white"}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="text"
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                placeholder="Phone number"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Village</label>
              <input
                type="text"
                value={patient.village}
                onChange={(e) => setPatient({ ...patient, village: e.target.value })}
                placeholder="Village"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Symptoms</label>
              <textarea
                value={patient.symptoms}
                onChange={(e) => setPatient({ ...patient, symptoms: e.target.value })}
                placeholder="Describe symptoms..."
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/patient/${id}`)}
                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}