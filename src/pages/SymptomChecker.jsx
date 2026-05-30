import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function SymptomChecker() {

  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const patientId = searchParams.get("patient");

  async function analyzeSymptoms(e) {

    e.preventDefault();

    setLoading(true);

    setResult(null);

    try {
      console.log(import.meta.env.VITE_GROQ_API_KEY);

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${
              import.meta.env.VITE_GROQ_API_KEY
            }`,
          },

          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",

            messages: [
              {
                role: "system",

                content:
                  "You are an AI medical triage assistant for a rural Indian hospital called Manjhi Seva. Always respond ONLY in valid JSON.",
              },

              {
                role: "user",

                content: `
Analyze these symptoms:

"${symptoms}"

Respond ONLY in this JSON format:

{
  "riskLevel": "Low" | "Medium" | "High" | "Emergency",
  "department": "suggested hospital department",
  "advice": "simple patient advice",
  "possibleConditions": ["condition1", "condition2"],
  "urgency": "brief urgency explanation"
}
`,
              },
            ],

            temperature: 0.3,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      // HANDLE API ERRORS
      if (data.error) {

        alert(data.error.message);

        setLoading(false);

        return;
      }

      // SAFETY CHECK
      if (!data.choices || data.choices.length === 0) {

        alert("No AI response received");

        setLoading(false);

        return;
      }

      // EXTRACT AI RESPONSE
      const text = data.choices[0].message.content;

      console.log(text);

      // CLEAN JSON IF AI RETURNS ```json
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // PARSE JSON
      const parsed = JSON.parse(cleanedText);

      setResult(parsed);

    } catch (error) {

      console.log(error);

      alert("Error analyzing symptoms: " + error.message);
    }

    setLoading(false);
  }

  async function saveToHealthRecord() {

    if (!patientId || !result) {

      alert("No patient selected or no result generated.");

      return;
    }

    const { error } = await supabase
      .from("health_records")
      .insert([
        {
          patient_id: patientId,

          notes: `
AI Symptom Analysis: ${symptoms}

Advice: ${result.advice}

Suggested Department: ${result.department}

Possible Conditions: ${result.possibleConditions?.join(", ")}
          `,

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

  // RISK COLORS
  function riskColor(level) {

    const colors = {
      Low: "#16a34a",
      Medium: "#d97706",
      High: "#dc2626",
      Emergency: "#7c3aed",
    };

    return colors[level] || "#6b7280";
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "2rem auto",
        padding: "0 1rem",
      }}
    >

      <h1>AI Symptom Checker</h1>

      <p style={{ color: "#6b7280" }}>
        Powered by Groq + Llama 3 AI
      </p>

      {/* WARNING */}
      {!patientId && (
        <p
          style={{
            color: "#d97706",
            backgroundColor: "#fef9c3",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          No patient selected. Open this from Patient
          Details to save the result.
        </p>
      )}

      {/* FORM */}
      <form onSubmit={analyzeSymptoms}>

        <textarea
          placeholder="Describe symptoms in detail..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          required
          style={{
            width: "100%",
            height: "150px",
            padding: "12px",
            fontSize: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            resize: "vertical",
          }}
        />

        <br />
        <br />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Analyzing..."
            : "Analyze Symptoms"}
        </button>

      </form>

      {/* RESULT */}
      {result && (
        <div
          style={{
            marginTop: "24px",

            border: `2px solid ${riskColor(
              result.riskLevel
            )}`,

            padding: "20px",

            borderRadius: "10px",

            backgroundColor: "#f9fafb",
          }}
        >

          <h2>🩺 Analysis Result</h2>

          {/* RISK BADGE */}
          <div
            style={{
              display: "inline-block",

              backgroundColor: riskColor(
                result.riskLevel
              ),

              color: "white",

              padding: "4px 16px",

              borderRadius: "20px",

              fontWeight: "bold",

              marginBottom: "16px",
            }}
          >
            {result.riskLevel} Risk
          </div>

          <p>
            <strong>Suggested Department:</strong>{" "}
            {result.department}
          </p>

          <p>
            <strong>Urgency:</strong>{" "}
            {result.urgency}
          </p>

          <p>
            <strong>Advice:</strong>{" "}
            {result.advice}
          </p>

          {/* CONDITIONS */}
          {result.possibleConditions?.length > 0 && (
            <div>

              <strong>Possible Conditions:</strong>

              <ul style={{ marginTop: "6px" }}>
                {result.possibleConditions.map(
                  (condition, index) => (
                    <li key={index}>
                      {condition}
                    </li>
                  )
                )}
              </ul>

            </div>
          )}

          {/* SAVE BUTTON */}
          {patientId && (
            <button
              onClick={saveToHealthRecord}
              style={{
                marginTop: "16px",

                padding: "10px 20px",

                backgroundColor: "#16a34a",

                color: "white",

                border: "none",

                borderRadius: "6px",

                cursor: "pointer",
              }}
            >
              Save to Patient Health Record
            </button>
          )}

        </div>
      )}

    </div>
  );
}