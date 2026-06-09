import generatePatientPDF from "../utils/generatePatientPDF";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("records");

  async function fetchPatient() {
    const { data, error } = await supabase
      .from("patients").select("*").eq("id", id).single();
    if (error) return alert(error.message);
    setPatient(data);
  }

  async function fetchHealthRecords() {
    const { data, error } = await supabase
      .from("health_records").select("*").eq("patient_id", id)
      .order("created_at", { ascending: false });
    if (error) return alert(error.message);
    setHealthRecords(data);
  }

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select(`id, department, appointment_date, appointment_time, status, reason, doctors ( doctor_name )`)
      .eq("patient_id", id)
      .order("appointment_date", { ascending: false });
    if (error) return alert(error.message);
    setAppointments(data);
  }

  async function fetchUploads() {
    const { data, error } = await supabase
      .from("patient_uploads").select("*").eq("patient_id", id)
      .order("created_at", { ascending: false });
    if (error) return;
    setUploads(data);
  }

  useEffect(() => {
    fetchPatient();
    fetchHealthRecords();
    fetchAppointments();
    fetchUploads();

    const healthChannel = supabase
      .channel(`health-records-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "health_records", filter: `patient_id=eq.${id}` }, () => fetchHealthRecords())
      .subscribe();

    const appointmentsChannel = supabase
      .channel(`appointments-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${id}` }, () => fetchAppointments())
      .subscribe();

    return () => {
      supabase.removeChannel(healthChannel);
      supabase.removeChannel(appointmentsChannel);
    };
  }, [id]);

  async function deleteHealthRecord(recordId) {
    if (!window.confirm("Delete this health record?")) return;
    const { error } = await supabase.from("health_records").delete().eq("id", recordId);
    if (error) return alert(error.message);
    setHealthRecords(healthRecords.filter((r) => r.id !== recordId));
  }

  async function generateAISummary() {
    if (healthRecords.length === 0 && appointments.length === 0) {
      alert("No health records or appointments found for this patient.");
      return;
    }
    setSummaryLoading(true);
    setAiSummary(null);

    const recordsText = healthRecords.length === 0 ? "No health records available."
      : healthRecords.map((r, i) => `
Record ${i + 1} (${new Date(r.created_at).toLocaleDateString()}):
- Temperature: ${r.temperature || "N/A"}, BP: ${r.bp || "N/A"}, Sugar: ${r.sugar || "N/A"}
- SpO2: ${r.spo2 || "N/A"}, Pulse: ${r.pulse || "N/A"}, Risk: ${r.risk_level || "N/A"}
- Notes: ${r.notes || "N/A"}`).join("\n");

    const appointmentsText = appointments.length === 0 ? "No appointments available."
      : appointments.map((a, i) => `
Appointment ${i + 1}: ${a.appointment_date} — ${a.department} — Dr. ${a.doctors?.doctor_name || "Unknown"} — ${a.status}`).join("\n");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a senior medical AI assistant at Manjhi Seva, a rural Indian hospital. Analyze patient data and respond ONLY in valid JSON." },
            { role: "user", content: `Analyze this patient's complete medical history.\n\nPATIENT: ${patient.full_name}, Age: ${patient.age}, Gender: ${patient.gender}, Symptoms: ${patient.symptoms || "None"}\n\nHEALTH RECORDS:\n${recordsText}\n\nAPPOINTMENTS:\n${appointmentsText}\n\nRespond ONLY in this JSON format:\n{"overallHealth":"Good|Fair|Poor|Critical","summary":"2-3 sentences","keyFindings":["f1","f2"],"trends":"trends text","recommendations":["r1","r2"],"urgentConcerns":"concerns or NONE","followUpSuggested":true}` }
          ],
          temperature: 0.3,
        }),
      });
      const data = await response.json();
      if (data.error) { alert(data.error.message); setSummaryLoading(false); return; }
      const text = data.choices[0].message.content;
      setAiSummary(JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim()));
    } catch (err) {
      alert("Error generating summary: " + err.message);
    }
    setSummaryLoading(false);
  }

  async function saveSummaryToRecord() {
    if (!aiSummary) return;
    const { error } = await supabase.from("health_records").insert([{
      patient_id: id,
      notes: `AI Medical Summary:\n\nOverall Health: ${aiSummary.overallHealth}\n\nSummary: ${aiSummary.summary}\n\nKey Findings: ${aiSummary.keyFindings?.join(", ")}\n\nTrends: ${aiSummary.trends}\n\nRecommendations: ${aiSummary.recommendations?.join(", ")}\n\nUrgent Concerns: ${aiSummary.urgentConcerns}`,
      risk_level: aiSummary.overallHealth === "Critical" ? "Emergency" : aiSummary.overallHealth === "Poor" ? "High" : aiSummary.overallHealth === "Fair" ? "Medium" : "Low",
    }]);
    if (error) { alert(error.message); return; }
    alert("AI summary saved to health records!");
    fetchHealthRecords();
    setAiSummary(null);
  }

  function riskColor(level) {
    return { Emergency: "border-red-500", High: "border-orange-400", Medium: "border-yellow-400", Low: "border-green-500" }[level] || "border-slate-200";
  }

  function riskBadgeColor(level) {
    return { Emergency: "bg-red-100 text-red-700", High: "bg-orange-100 text-orange-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700" }[level] || "bg-slate-100 text-slate-600";
  }

  function statusColor(status) {
    return { Booked: "bg-blue-100 text-blue-700", Pending: "bg-yellow-100 text-yellow-700", Completed: "bg-green-100 text-green-700", Cancelled: "bg-red-100 text-red-700" }[status] || "bg-slate-100 text-slate-600";
  }

  function healthColor(status) {
    return { Good: "#16a34a", Fair: "#d97706", Poor: "#dc2626", Critical: "#7c3aed" }[status] || "#6b7280";
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading patient...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* ── Back ── */}
        <button
          onClick={() => navigate("/patients")}
          className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 cursor-pointer"
        >
          ← Back to Patients
        </button>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{patient.full_name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {patient.age} years • {patient.gender} • {patient.village}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link to={`/edit-patient/${patient.id}`}>
              <button className="px-3 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium rounded-lg transition-colors cursor-pointer">
                Edit Patient
              </button>
            </Link>
            <button
              onClick={() => generatePatientPDF(patient, healthRecords, appointments, uploads)}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* ── Patient Info Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-slate-400 text-xs uppercase">Phone</span><p className="text-slate-800 font-medium mt-0.5">{patient.phone || "—"}</p></div>
            <div><span className="text-slate-400 text-xs uppercase">Village</span><p className="text-slate-800 font-medium mt-0.5">{patient.village || "—"}</p></div>
            <div><span className="text-slate-400 text-xs uppercase">Gender</span><p className="text-slate-800 font-medium mt-0.5">{patient.gender || "—"}</p></div>
            {patient.symptoms && (
              <div className="col-span-2 md:col-span-3">
                <span className="text-slate-400 text-xs uppercase">Symptoms</span>
                <p className="text-slate-800 font-medium mt-0.5">{patient.symptoms}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link to={`/add-health-record?patient=${patient.id}`}>
            <button className="px-4 py-2 text-sm bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer">
              + Health Record
            </button>
          </Link>
          <Link to={`/book-appointment?patient=${patient.id}`}>
            <button className="px-4 py-2 text-sm bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer">
              + Book Appointment
            </button>
          </Link>
          <Link to={`/symptom-checker?patient=${patient.id}`}>
            <button className="px-4 py-2 text-sm bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer">
              AI Symptom Checker
            </button>
          </Link>
          <button
            onClick={generateAISummary}
            disabled={summaryLoading}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            {summaryLoading ? "Generating..." : "Generate AI Summary"}
          </button>
        </div>

        {/* ── AI Summary Result ── */}
        {aiSummary && (
          <div
            className="bg-white rounded-xl border-2 shadow-sm p-6 mb-6"
            style={{ borderColor: healthColor(aiSummary.overallHealth) }}
          >
            <h2 className="text-lg font-bold text-slate-800 mb-3">🧠 AI Medical Summary</h2>
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white mb-4"
              style={{ backgroundColor: healthColor(aiSummary.overallHealth) }}
            >
              {aiSummary.overallHealth} Health
            </span>
            <p className="text-sm text-slate-700 mb-2"><strong>Summary:</strong> {aiSummary.summary}</p>
            <p className="text-sm text-slate-700 mb-2"><strong>Trends:</strong> {aiSummary.trends}</p>
            <p className="text-sm mb-2">
              <strong>Urgent Concerns:</strong>{" "}
              <span className={aiSummary.urgentConcerns === "NONE" ? "text-green-600" : "text-red-600"}>
                {aiSummary.urgentConcerns}
              </span>
            </p>
            <p className="text-sm text-slate-700 mb-3">
              <strong>Follow-up Suggested:</strong> {aiSummary.followUpSuggested ? "Yes" : "No"}
            </p>
            {aiSummary.keyFindings?.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-700 mb-1">Key Findings:</p>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  {aiSummary.keyFindings.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {aiSummary.recommendations?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-1">Recommendations:</p>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  {aiSummary.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={saveSummaryToRecord}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Save to Health Records
              </button>
              <button
                onClick={() => setAiSummary(null)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-lg transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {["records", "appointments", "documents"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer capitalize
                ${activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab === "records" && `Health Records (${healthRecords.length})`}
              {tab === "appointments" && `Appointments (${appointments.length})`}
              {tab === "documents" && `Documents (${uploads.length})`}
            </button>
          ))}
        </div>

        {/* ── Health Records Tab ── */}
        {activeTab === "records" && (
          <div className="space-y-3">
            {healthRecords.length === 0 ? (
              <p className="text-slate-400 text-sm">No health records added yet.</p>
            ) : (
              healthRecords.map((record) => (
                <div key={record.id} className={`bg-white rounded-xl border-l-4 ${riskColor(record.risk_level)} border border-slate-200 shadow-sm p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400">{new Date(record.created_at).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${riskBadgeColor(record.risk_level)}`}>
                      {record.risk_level}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-3">
                    <div><span className="text-slate-400 text-xs">Temp</span><p className="font-medium text-slate-800">{record.temperature || "—"}</p></div>
                    <div><span className="text-slate-400 text-xs">BP</span><p className="font-medium text-slate-800">{record.bp || "—"}</p></div>
                    <div><span className="text-slate-400 text-xs">Sugar</span><p className="font-medium text-slate-800">{record.sugar || "—"}</p></div>
                    <div><span className="text-slate-400 text-xs">SpO2</span><p className="font-medium text-slate-800">{record.spo2 || "—"}</p></div>
                    <div><span className="text-slate-400 text-xs">Pulse</span><p className="font-medium text-slate-800">{record.pulse || "—"}</p></div>
                  </div>
                  {record.notes && (
                    <p className="text-sm text-slate-600 mb-3"><strong>Notes:</strong> {record.notes}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/health-record/edit/${record.id}`)}
                      className="px-3 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteHealthRecord(record.id)}
                      className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Appointments Tab ── */}
        {activeTab === "appointments" && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-slate-400 text-sm">No appointments booked yet.</p>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-slate-800">{appt.department}</strong>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600"><strong>Doctor:</strong> {appt.doctors?.doctor_name || "—"}</p>
                  <p className="text-sm text-slate-600"><strong>Date:</strong> {appt.appointment_date}</p>
                  <p className="text-sm text-slate-600"><strong>Time:</strong> {appt.appointment_time}</p>
                  {appt.reason && <p className="text-sm text-slate-600"><strong>Reason:</strong> {appt.reason}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === "documents" && (
          <div className="space-y-3">
            {uploads.length === 0 ? (
              <p className="text-slate-400 text-sm">No documents uploaded by this patient.</p>
            ) : (
              uploads.map((file) => (
                <div key={file.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{file.file_name}</p>
                    {file.notes && <p className="text-xs text-slate-500 mt-0.5">{file.notes}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(file.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const { data, error } = await supabase.storage
                        .from("patient-documents")
                        .createSignedUrl(file.file_path, 60);
                      if (error) { alert(error.message); return; }
                      window.open(data.signedUrl, "_blank");
                    }}
                    className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}