import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState({
    doctor_name: "", specialization: "", phone: "", availability: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchDoctor(); }, [id]);

  async function fetchDoctor() {
    const { data, error } = await supabase
      .from("doctors").select("*").eq("id", id).single();
    if (error) { alert(error.message); return; }
    setDoctor(data);
  }

  async function updateDoctor(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("doctors")
      .update({
        doctor_name: doctor.doctor_name,
        specialization: doctor.specialization,
        phone: doctor.phone,
        availability: doctor.availability,
      })
      .eq("id", id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    navigate("/doctors");
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto">

        <div className="mb-6">
          <button
            onClick={() => navigate("/doctors")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to Doctors
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Edit Doctor</h1>
          <p className="text-slate-500 text-sm mt-1">Update doctor information.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={updateDoctor} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
              <input
                type="text" placeholder="Doctor Name"
                value={doctor.doctor_name}
                onChange={(e) => setDoctor({ ...doctor, doctor_name: e.target.value })}
                required className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <input
                type="text" placeholder="Specialization"
                value={doctor.specialization}
                onChange={(e) => setDoctor({ ...doctor, specialization: e.target.value })}
                required className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text" placeholder="Phone"
                value={doctor.phone}
                onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
              <select
                value={doctor.availability}
                onChange={(e) => setDoctor({ ...doctor, availability: e.target.value })}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {saving ? "Saving..." : "Update Doctor"}
              </button>
              <button
                type="button" onClick={() => navigate("/doctors")}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
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