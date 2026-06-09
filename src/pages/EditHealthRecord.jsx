import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditHealthRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState({
    temperature: "", bp: "", sugar: "",
    spo2: "", pulse: "", notes: "", risk_level: "",
  });
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => { fetchRecord(); }, [id]);

  async function fetchRecord() {
    const { data, error } = await supabase
      .from("health_records").select("*").eq("id", id).single();
    if (error) { alert(error.message); return; }
    setRecord(data);
    setPatientId(data.patient_id);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("health_records")
      .update({
        temperature: record.temperature, bp: record.bp,
        sugar: record.sugar, spo2: record.spo2,
        pulse: record.pulse, notes: record.notes,
        risk_level: record.risk_level,
      })
      .eq("id", id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    navigate(`/patient/${patientId}`);
  }

  const riskColors = {
    Low: "text-green-600", Medium: "text-yellow-600",
    High: "text-orange-500", Emergency: "text-red-600",
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <button
            onClick={() => navigate(`/patient/${patientId}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to Patient
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Edit Health Record</h1>
          <p className="text-slate-500 text-sm mt-1">Update vitals and clinical notes.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Temperature", key: "temperature", placeholder: "e.g. 98.6 F" },
                { label: "Blood Pressure", key: "bp", placeholder: "e.g. 120/80" },
                { label: "Sugar", key: "sugar", placeholder: "e.g. 110 mg/dL" },
                { label: "SpO2", key: "spo2", placeholder: "e.g. 97%" },
                { label: "Pulse", key: "pulse", placeholder: "e.g. 82 bpm" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={record[key]}
                    onChange={(e) => setRecord({ ...record, [key]: e.target.value })}
                    className={inputClass}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Risk Level</label>
                <select
                  value={record.risk_level}
                  onChange={(e) => setRecord({ ...record, risk_level: e.target.value })}
                  required
                  className={`${inputClass} ${riskColors[record.risk_level] || "text-slate-400"}`}
                >
                  <option value="">Select Risk Level</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                placeholder="Clinical observations, diagnosis notes..."
                value={record.notes}
                onChange={(e) => setRecord({ ...record, notes: e.target.value })}
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {saving ? "Saving..." : "Update Record"}
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