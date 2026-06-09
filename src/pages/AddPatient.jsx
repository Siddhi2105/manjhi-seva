import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddPatient() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please login first");
      navigate("/");
      return;
    }

    const { error } = await supabase
      .from("patients")
      .insert([{
        full_name: fullName,
        age: Number(age),
        gender,
        phone,
        village,
        symptoms,
        created_by: user.id,
      }]);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    navigate("/patients");
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/patients")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Patients
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Add New Patient</h1>
          <p className="text-slate-500 text-sm mt-1">Fill in the patient's details below.</p>
        </div>

        {/* ── Form Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Age</label>
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
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
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Village</label>
              <input
                type="text"
                placeholder="Village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Symptoms</label>
              <textarea
                placeholder="Describe symptoms..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
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
                {loading ? "Adding..." : "Add Patient"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/patients")}
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