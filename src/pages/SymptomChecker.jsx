import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");

  function analyzeSymptoms(e) {
    e.preventDefault();

    const text = symptoms.toLowerCase();

    let riskLevel = "Low";
    let department = "General Medicine";
    let advice = "Monitor symptoms and drink enough water.";

    if (
      text.includes("chest pain") ||
      text.includes("breathless") ||
      text.includes("breathing problem") ||
      text.includes("unconscious")
    ) {
      riskLevel = "Emergency";
      department = "Emergency / Cardiology";
      advice = "Immediate medical attention required.";
    } else if (
      text.includes("high fever") ||
      text.includes("severe pain") ||
      text.includes("vomiting") ||
      text.includes("blood")
    ) {
      riskLevel = "High";
      department = "General Medicine";
      advice = "Book a doctor appointment as soon as possible.";
    } else if (
      text.includes("fever") ||
      text.includes("cough") ||
      text.includes("cold") ||
      text.includes("headache")
    ) {
      riskLevel = "Medium";
      department = "General Medicine";
      advice = "Consult a doctor if symptoms continue for more than 2 days.";
    }

    setResult({
      riskLevel,
      department,
      advice,
    });
  }

  async function saveToHealthRecord() {
    if (!patientId || !result) {
      alert("No patient selected or no result generated.");
      return;
    }

    const { error } = await supabase.from("health_records").insert([
      {
        patient_id: patientId,
        temperature: "",
        bp: "",
        sugar: "",
        spo2: "",
        pulse: "",
        notes: `AI Symptom Analysis: ${symptoms}. Advice: ${result.advice}. Suggested Department: ${result.department}`,
        risk_level: result.riskLevel,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("AI result saved to health record!");
    navigate(`/patient/${patientId}`);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Symptom Checker</h1>

      {!patientId && (
        <p style={{ color: "orange" }}>
          No patient selected. Open this from Patient Details to save the result.
        </p>
      )}

      <form onSubmit={analyzeSymptoms}>
        <textarea
          placeholder="Enter symptoms..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          style={{
            width: "400px",
            height: "120px",
            padding: "10px",
          }}
          required
        />

        <br /><br />

        <button type="submit">Analyze Symptoms</button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid gray",
            padding: "15px",
            borderRadius: "10px",
            maxWidth: "500px",
          }}
        >
          <h2>Result</h2>

          <p>
            <strong>Risk Level:</strong> {result.riskLevel}
          </p>

          <p>
            <strong>Suggested Department:</strong> {result.department}
          </p>

          <p>
            <strong>Advice:</strong> {result.advice}
          </p>

          {patientId && (
            <>
              <br />

              <button onClick={saveToHealthRecord}>
                Save to Patient Health Record
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}