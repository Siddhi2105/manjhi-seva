import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // AI SUMMARY STATE
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch Patient
  async function fetchPatient() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return alert(error.message);
    setPatient(data);
  }

  // Fetch Health Records
  async function fetchHealthRecords() {
    const { data, error } = await supabase
      .from("health_records")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);
    setHealthRecords(data);
  }

  // Fetch Appointments
  async function fetchAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        department,
        appointment_date,
        appointment_time,
        status,
        doctors ( doctor_name )
      `)
      .eq("patient_id", id)
      .order("appointment_date", { ascending: false });

    if (error) return alert(error.message);
    setAppointments(data);
  }

  useEffect(() => {
    fetchPatient();
    fetchHealthRecords();
    fetchAppointments();
  }, [id]);

  // DELETE HEALTH RECORD
  async function deleteHealthRecord(recordId) {
    const confirmDelete = window.confirm("Delete this health record?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("health_records")
      .delete()
      .eq("id", recordId);

    if (error) return alert(error.message);
    setHealthRecords(healthRecords.filter((r) => r.id !== recordId));
  }

  // -----------------------------------------------
  // AI MEDICAL SUMMARY
  // -----------------------------------------------
  async function generateAISummary() {
    if (healthRecords.length === 0 && appointments.length === 0) {
      alert("No health records or appointments found for this patient.");
      return;
    }

    setSummaryLoading(true);
    setAiSummary(null);

    // Build a text summary of all health records to send to AI
    const recordsText = healthRecords.length === 0
      ? "No health records available."
      : healthRecords.map((r, i) => `
Record ${i + 1} (${new Date(r.created_at).toLocaleDateString()}):
- Temperature: ${r.temperature || "N/A"}
- BP: ${r.bp || "N/A"}
- Sugar: ${r.sugar || "N/A"}
- SpO2: ${r.spo2 || "N/A"}
- Pulse: ${r.pulse || "N/A"}
- Risk Level: ${r.risk_level || "N/A"}
- Notes: ${r.notes || "N/A"}
      `).join("\n");

    // Build appointments text
    const appointmentsText = appointments.length === 0
      ? "No appointments available."
      : appointments.map((a, i) => `
Appointment ${i + 1}:
- Date: ${a.appointment_date}
- Department: ${a.department}
- Doctor: ${a.doctors?.doctor_name || "Unknown"}
- Status: ${a.status}
      `).join("\n");

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are a senior medical AI assistant at Manjhi Seva, a rural Indian hospital. Analyze patient data and respond ONLY in valid JSON.",
              },
              {
                role: "user",
                content: `
Analyze this patient's complete medical history and generate a summary.

PATIENT INFORMATION:
- Name: ${patient.full_name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Reported Symptoms: ${patient.symptoms || "None"}

HEALTH RECORDS:
${recordsText}

APPOINTMENTS:
${appointmentsText}

Respond ONLY in this exact JSON format:
{
  "overallHealth": "Good" | "Fair" | "Poor" | "Critical",
  "summary": "2-3 sentence overall health summary",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "trends": "observed trends in the patient's health over time",
  "recommendations": ["recommendation1", "recommendation2"],
  "urgentConcerns": "any urgent concerns or NONE if none exist",
  "followUpSuggested": true | false
}
                `,
              },
            ],
            temperature: 0.3,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        alert(data.error.message);
        setSummaryLoading(false);
        return;
      }

      const text = data.choices[0].message.content;

      // Clean and parse JSON
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText);
      setAiSummary(parsed);

    } catch (error) {
      alert("Error generating summary: " + error.message);
    }

    setSummaryLoading(false);
  }

  // SAVE AI SUMMARY TO HEALTH RECORDS
  async function saveSummaryToRecord() {
    if (!aiSummary) return;

    const { error } = await supabase
      .from("health_records")
      .insert([{
        patient_id: id,
        notes: `
AI Medical Summary:

Overall Health: ${aiSummary.overallHealth}

Summary: ${aiSummary.summary}

Key Findings: ${aiSummary.keyFindings?.join(", ")}

Trends: ${aiSummary.trends}

Recommendations: ${aiSummary.recommendations?.join(", ")}

Urgent Concerns: ${aiSummary.urgentConcerns}
        `,
        risk_level: aiSummary.overallHealth === "Critical"
          ? "Emergency"
          : aiSummary.overallHealth === "Poor"
          ? "High"
          : aiSummary.overallHealth === "Fair"
          ? "Medium"
          : "Low",
      }]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("AI summary saved to health records!");
    fetchHealthRecords(); // refresh records list
    setAiSummary(null);
  }

  // RISK BORDER COLOR
  function riskBorder(level) {
    const colors = {
      Emergency: "2px solid red",
      High: "2px solid orange",
      Medium: "2px solid gold",
      Low: "2px solid green",
    };
    return colors[level] || "2px solid #ccc";
  }

  // OVERALL HEALTH COLOR
  function healthColor(status) {
    const colors = {
      Good: "#16a34a",
      Fair: "#d97706",
      Poor: "#dc2626",
      Critical: "#7c3aed",
    };
    return colors[status] || "#6b7280";
  }

  if (!patient) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading patient...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Patient Details</h1>

      {/* PATIENT CARD */}
      <div style={{
        border: "1px solid gray",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "500px",
      }}>
        <h2>{patient.full_name}</h2>
        <p><strong>Age:</strong> {patient.age}</p>
        <p><strong>Gender:</strong> {patient.gender}</p>
        <p><strong>Phone:</strong> {patient.phone}</p>
        <p><strong>Village:</strong> {patient.village}</p>
        <p><strong>Symptoms:</strong> {patient.symptoms}</p>
        <p><strong>Patient ID:</strong> {patient.id}</p>
      </div>

      <br />

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>

        <Link to={`/add-health-record?patient=${patient.id}`}>
          <button style={actionBtn}>Add Health Record</button>
        </Link>

        <Link to={`/book-appointment?patient=${patient.id}`}>
          <button style={actionBtn}>Book Appointment</button>
        </Link>

        <Link to={`/symptom-checker?patient=${patient.id}`}>
          <button style={actionBtn}>AI Symptom Checker</button>
        </Link>

        {/* AI SUMMARY BUTTON */}
        <button
          onClick={generateAISummary}
          disabled={summaryLoading}
          style={{
            ...actionBtn,
            backgroundColor: "#7c3aed",
            color: "white",
            border: "none",
          }}
        >
          {summaryLoading ? "Generating..." : " Generate AI Summary"}
        </button>

      </div>

      <br /><br />

      {/* AI SUMMARY RESULT */}
      {aiSummary && (
        <div style={{
          border: `2px solid ${healthColor(aiSummary.overallHealth)}`,
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "600px",
          marginBottom: "24px",
          backgroundColor: "#f9fafb",
        }}>
          <h2>🧠 AI Medical Summary</h2>

          {/* OVERALL HEALTH BADGE */}
          <div style={{
            display: "inline-block",
            backgroundColor: healthColor(aiSummary.overallHealth),
            color: "white",
            padding: "4px 16px",
            borderRadius: "20px",
            fontWeight: "bold",
            marginBottom: "16px",
          }}>
            {aiSummary.overallHealth} Health
          </div>

          <p><strong>Summary:</strong> {aiSummary.summary}</p>
          <p><strong>Trends:</strong> {aiSummary.trends}</p>
          <p>
            <strong>Urgent Concerns:</strong>{" "}
            <span style={{
              color: aiSummary.urgentConcerns === "NONE" ? "#16a34a" : "#dc2626"
            }}>
              {aiSummary.urgentConcerns}
            </span>
          </p>
          <p><strong>Follow-up Suggested:</strong> {aiSummary.followUpSuggested ? "Yes" : "No"}</p>

          {/* KEY FINDINGS */}
          {aiSummary.keyFindings?.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <strong>Key Findings:</strong>
              <ul style={{ marginTop: "6px" }}>
                {aiSummary.keyFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* RECOMMENDATIONS */}
          {aiSummary.recommendations?.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <strong>Recommendations:</strong>
              <ul style={{ marginTop: "6px" }}>
                {aiSummary.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SAVE BUTTON */}
          <button
            onClick={saveSummaryToRecord}
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
            Save Summary to Health Records
          </button>

        </div>
      )}

      {/* HEALTH RECORDS */}
      <h2>Health Records</h2>

      {healthRecords.length === 0 ? (
        <p>No health records added yet.</p>
      ) : (
        healthRecords.map((record) => (
          <div
            key={record.id}
            style={{
              border: riskBorder(record.risk_level),
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "10px",
              maxWidth: "500px",
            }}
          >
            <p><strong>Temperature:</strong> {record.temperature}</p>
            <p><strong>BP:</strong> {record.bp}</p>
            <p><strong>Sugar:</strong> {record.sugar}</p>
            <p><strong>SpO2:</strong> {record.spo2}</p>
            <p><strong>Pulse:</strong> {record.pulse}</p>
            <p><strong>Risk Level:</strong> {record.risk_level}</p>
            <p><strong>Notes:</strong> {record.notes}</p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(record.created_at).toLocaleString()}
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={() => navigate(`/health-record/edit/${record.id}`)}
                style={{
                  padding: "6px 14px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>

              <button
                onClick={() => deleteHealthRecord(record.id)}
                style={{
                  padding: "6px 14px",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>

          </div>
        ))
      )}

      <br />

      {/* APPOINTMENTS */}
      <h2>Appointments</h2>

      {appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment.id}
            style={{
              border: "1px solid #999",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "10px",
              maxWidth: "500px",
            }}
          >
            <p><strong>Department:</strong> {appointment.department}</p>
            <p>
              <strong>Doctor:</strong>{" "}
              {appointment.doctors?.doctor_name || "Unknown doctor"}
            </p>
            <p><strong>Date:</strong> {appointment.appointment_date}</p>
            <p><strong>Time:</strong> {appointment.appointment_time}</p>
            <p><strong>Status:</strong> {appointment.status}</p>
          </div>
        ))
      )}

    </div>
  );
}

const actionBtn = {
  padding: "10px 16px",
  fontSize: "14px",
  cursor: "pointer",
  borderRadius: "6px",
  border: "1px solid #e5e7eb",
};