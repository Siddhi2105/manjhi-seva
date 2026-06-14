import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

async function runAgent3(patientId, appointmentData) {
  try {
    // Fetch all data needed for discharge summary
    const [{ data: patient }, { data: healthRecords }, { data: appointments }] =
      await Promise.all([
        supabase.from("patients").select("*").eq("id", patientId).single(),
        supabase.from("health_records").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
        supabase.from("appointments").select("*, doctors(doctor_name, specialization)").eq("patient_id", patientId).order("appointment_date", { ascending: false }),
      ]);

    if (!patient) return;

    const recordsText = !healthRecords?.length
      ? "No health records."
      : healthRecords.map((r, i) =>
          `Record ${i + 1} (${new Date(r.created_at).toLocaleDateString()}): Temp: ${r.temperature || "N/A"}, BP: ${r.bp || "N/A"}, Sugar: ${r.sugar || "N/A"}, SpO2: ${r.spo2 || "N/A"}, Pulse: ${r.pulse || "N/A"}, Risk: ${r.risk_level || "N/A"}, Notes: ${r.notes || "N/A"}`
        ).join("\n");

    const apptText = !appointments?.length
      ? "No appointments."
      : appointments.map((a, i) =>
          `Appt ${i + 1}: ${a.appointment_date} — ${a.department} — Dr. ${a.doctors?.doctor_name || "Unknown"} — ${a.status} — Reason: ${a.reason || "N/A"}`
        ).join("\n");

    const prompt = `You are a senior hospital physician at Manjhi Seva, a rural Indian hospital. Generate a formal medical discharge summary.

Patient: ${patient.full_name}, Age: ${patient.age}, Gender: ${patient.gender}, Village: ${patient.village || "N/A"}
Initial Symptoms: ${patient.symptoms || "N/A"}
Completed Appointment: ${appointmentData.appointment_date} — ${appointmentData.department} — Reason: ${appointmentData.reason || "N/A"}

Health Records:
${recordsText}

All Appointments:
${apptText}

Respond ONLY in this exact JSON format:
{
  "discharge_condition": "Stable" | "Recovered" | "Referred" | "Against Medical Advice",
  "primary_diagnosis": "string",
  "secondary_diagnosis": "string or null",
  "treatment_given": ["item1", "item2"],
  "medications_to_continue": [{"name": "string", "dosage": "string", "duration": "string"}],
  "follow_up_date": "YYYY-MM-DD or Within X days",
  "follow_up_department": "string",
  "diet_instructions": "string",
  "activity_restrictions": "string",
  "warning_signs": ["sign1", "sign2"],
  "doctor_notes": "string",
  "summary_paragraph": "2-3 sentence clinical summary"
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    const raw = data.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    // Log to pipeline_logs
    await supabase.from("pipeline_logs").insert({
      patient_id: patientId,
      agent: "Agent 3 — Discharge Summary",
      status: "completed",
      input: {
        patient_name: patient.full_name,
        appointment_date: appointmentData.appointment_date,
        department: appointmentData.department,
      },
      output: result,
    });

    // Save summary as a health record note
    await supabase.from("health_records").insert({
      patient_id: patientId,
      notes: `DISCHARGE SUMMARY — ${result.primary_diagnosis}. ${result.summary_paragraph} Follow-up: ${result.follow_up_date} at ${result.follow_up_department}.`,
      risk_level: result.discharge_condition === "Against Medical Advice" ? "High" :
                  result.discharge_condition === "Referred" ? "Medium" : "Low",
    });

    console.log("Agent 3 completed for patient:", patientId);

  } catch (err) {
    console.error("Agent 3 error:", err);
  }
}

export default function EditAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState({
    patient_id: "", doctor_id: "", department: "",
    appointment_date: "", appointment_time: "", reason: "", status: "",
  });
  const [originalStatus, setOriginalStatus] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);

  useEffect(() => { fetchAppointment(); fetchDoctors(); fetchPatients(); }, [id]);

  async function fetchAppointment() {
    const { data, error } = await supabase
      .from("appointments").select("*").eq("id", id).single();
    if (error) { alert(error.message); return; }
    setAppointment(data);
    setOriginalStatus(data.status);  // ← track original status
  }

  async function fetchDoctors() {
    const { data, error } = await supabase
      .from("doctors").select("id, doctor_name, specialization").order("doctor_name");
    if (!error) setDoctors(data);
  }

  async function fetchPatients() {
    const { data, error } = await supabase
      .from("patients").select("id, full_name").order("full_name");
    if (!error) setPatients(data);
  }

  async function updateAppointment(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("appointments")
      .update({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        department: appointment.department,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        reason: appointment.reason,
        status: appointment.status,
      })
      .eq("id", id);

    setSaving(false);
    if (error) { alert(error.message); return; }

    // ── Trigger Agent 3 if status just changed to Completed ──
    if (appointment.status === "Completed" && originalStatus !== "Completed") {
      setAgentRunning(true);
      await runAgent3(appointment.patient_id, appointment);
      setAgentRunning(false);
    }

    navigate("/appointments");
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  const statusColors = {
    Booked: "text-blue-600", Pending: "text-yellow-600",
    Completed: "text-green-600", Cancelled: "text-red-600",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <button
            onClick={() => navigate("/appointments")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to Appointments
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Edit Appointment</h1>
          <p className="text-slate-500 text-sm mt-1">Update appointment details or status.</p>
        </div>

        {/* Agent running banner */}
        {agentRunning && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium flex items-center gap-2">
            <span className="animate-pulse">🤖</span>
            Agent 3 is generating discharge summary...
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={updateAppointment} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
              <select
                value={appointment.patient_id}
                onChange={(e) => setAppointment({ ...appointment, patient_id: e.target.value })}
                required className={inputClass}
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
              <select
                value={appointment.doctor_id}
                onChange={(e) => setAppointment({ ...appointment, doctor_id: e.target.value })}
                required className={inputClass}
              >
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.doctor_name} — {d.specialization}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input
                value={appointment.department}
                onChange={(e) => setAppointment({ ...appointment, department: e.target.value })}
                placeholder="Department" className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date" value={appointment.appointment_date}
                  onChange={(e) => setAppointment({ ...appointment, appointment_date: e.target.value })}
                  required className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <input
                  type="time" value={appointment.appointment_time}
                  onChange={(e) => setAppointment({ ...appointment, appointment_time: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <textarea
                value={appointment.reason}
                onChange={(e) => setAppointment({ ...appointment, reason: e.target.value })}
                rows={3} placeholder="Reason for visit..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={appointment.status}
                onChange={(e) => setAppointment({ ...appointment, status: e.target.value })}
                className={`${inputClass} ${statusColors[appointment.status] || "text-slate-800"}`}
              >
                <option value="Booked">Booked</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {appointment.status === "Completed" && originalStatus !== "Completed" && (
                <p className="text-xs text-purple-600 mt-1.5 flex items-center gap-1">
                  🤖 Agent 3 will auto-generate a discharge summary when saved.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={saving || agentRunning}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {saving ? "Saving..." : agentRunning ? "Running Agent 3..." : "Update Appointment"}
              </button>
              <button
                type="button" onClick={() => navigate("/appointments")}
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