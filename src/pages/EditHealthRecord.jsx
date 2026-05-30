import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditHealthRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState({
    temperature: "",
    bp: "",
    sugar: "",
    spo2: "",
    pulse: "",
    notes: "",
    risk_level: "",
  });

  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  async function fetchRecord() {
    const { data, error } = await supabase
      .from("health_records")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setRecord(data);
    setPatientId(data.patient_id); // ← save patient_id so we can navigate back
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("health_records")
      .update({
        temperature: record.temperature,
        bp: record.bp,
        sugar: record.sugar,
        spo2: record.spo2,
        pulse: record.pulse,
        notes: record.notes,
        risk_level: record.risk_level,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Health record updated successfully!");
    navigate(`/patient/${patientId}`); // ← go back to that patient's page
  }

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Edit Health Record</h2>

      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: "1rem" }}>
          <label>Temperature</label>
          <input
            value={record.temperature}
            onChange={(e) => setRecord({ ...record, temperature: e.target.value })}
            placeholder="e.g. 98.6 F"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Blood Pressure</label>
          <input
            value={record.bp}
            onChange={(e) => setRecord({ ...record, bp: e.target.value })}
            placeholder="e.g. 120/80"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Sugar</label>
          <input
            value={record.sugar}
            onChange={(e) => setRecord({ ...record, sugar: e.target.value })}
            placeholder="e.g. 110"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>SpO2</label>
          <input
            value={record.spo2}
            onChange={(e) => setRecord({ ...record, spo2: e.target.value })}
            placeholder="e.g. 97%"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Pulse</label>
          <input
            value={record.pulse}
            onChange={(e) => setRecord({ ...record, pulse: e.target.value })}
            placeholder="e.g. 82"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Notes</label>
          <textarea
            value={record.notes}
            onChange={(e) => setRecord({ ...record, notes: e.target.value })}
            rows={4}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Risk Level</label>
          <select
            value={record.risk_level}
            onChange={(e) => setRecord({ ...record, risk_level: e.target.value })}
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          >
            <option value="">Select Risk Level</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Update Record"}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}`)}
            style={{ background: "none", border: "1px solid #ccc", padding: "8px 16px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}