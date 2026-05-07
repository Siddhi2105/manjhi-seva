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

  if (!patientId) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>No Patient Selected</h1>
        <p>Please go to Patients List and select a patient first.</p>

        <button onClick={() => navigate("/patients")}>
          Go to Patients
        </button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("health_records")
      .insert([
        {
          patient_id: patientId,
          temperature,
          bp,
          sugar,
          spo2,
          pulse,
          notes,
          risk_level: riskLevel,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Health record added successfully!");
    navigate(`/patient/${patientId}`);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Add Health Record</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Temperature e.g. 98.6 F"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
        />

        <br /><br />

        <input
          type="text"
          placeholder="Blood Pressure e.g. 120/80"
          value={bp}
          onChange={(e) => setBp(e.target.value)}
        />

        <br /><br />

        <input
          type="text"
          placeholder="Sugar e.g. 110"
          value={sugar}
          onChange={(e) => setSugar(e.target.value)}
        />

        <br /><br />

        <input
          type="text"
          placeholder="SpO2 e.g. 97%"
          value={spo2}
          onChange={(e) => setSpo2(e.target.value)}
        />

        <br /><br />

        <input
          type="text"
          placeholder="Pulse e.g. 82"
          value={pulse}
          onChange={(e) => setPulse(e.target.value)}
        />

        <br /><br />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <br /><br />

        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          required
        >
          <option value="">Select Risk Level</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Emergency">Emergency</option>
        </select>

        <br /><br />

        <button type="submit">
          Save Health Record
        </button>
      </form>
    </div>
  );
}