import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AddHealthRecord() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");

  const [temperature, setTemperature] = useState("");
  const [bp, setBp] = useState("");
  const [sugar, setSugar] = useState("");
  const [spo2, setSpo2] = useState("");
  const [pulse, setPulse] = useState("");
  const [notes, setNotes] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [loading, setLoading] = useState(false);

  if (!patientId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <p className="text-slate-800 font-semibold text-lg mb-1">No Patient Selected</p>
          <p className="text-slate-500 text-sm mb-6">
            Please go to the Patients list and select a patient first.
          </p>
          <button
            onClick={() => navigate("/patients")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Go to Patients
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("health_records").insert([{
      patient_id: patientId,
      temperature, bp, sugar, spo2, pulse, notes,
      risk_level: riskLevel,
    }]);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    navigate(`/patient/${patientId}`);
  }

  const riskColors = {
    Low: "text-green-600",
    Medium: "text-yellow-600",
    High: "text-orange-500",
    Emergency: "text-red-600",
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/patient/${patientId}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to Patient
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Add Health Record</h1>
          <p className="text-slate-500 text-sm mt-1">Record vitals and clinical notes for this patient.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Vitals grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temperature</label>
                <input
                  type="text"
                  placeholder="e.g. 98.6 F"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sugar</label>
                <input
                  type="text"
                  placeholder="e.g. 110 mg/dL"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SpO2</label>
                <input
                  type="text"
                  placeholder="e.g. 97%"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pulse</label>
                <input
                  type="text"
                  placeholder="e.g. 82 bpm"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  required
                  className={`${inputClass} ${riskColors[riskLevel] || "text-slate-400"}`}
                >
                  <option value="">Select Risk Level</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                placeholder="Clinical observations, diagnosis notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Saving..." : "Save Health Record"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/patient/${patientId}`)}
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