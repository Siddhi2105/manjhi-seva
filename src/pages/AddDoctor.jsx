import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddDoctor() {
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAddDoctor(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("doctors").insert([{
      doctor_name: doctorName, specialization, phone, availability,
    }]);
    if (error) { alert(error.message); setLoading(false); return; }
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
          <h1 className="text-2xl font-bold text-slate-800">Add Doctor</h1>
          <p className="text-slate-500 text-sm mt-1">Register a new doctor to the system.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleAddDoctor} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
              <input
                type="text" placeholder="e.g. Dr. Arjun Sharma"
                value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
                required className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <input
                type="text" placeholder="e.g. Cardiology"
                value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                required className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text" placeholder="e.g. 9876543210"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                required className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
              <select
                value={availability} onChange={(e) => setAvailability(e.target.value)}
                required className={inputClass}
              >
                <option value="">Select Availability</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Adding..." : "Add Doctor"}
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