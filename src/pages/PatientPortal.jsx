import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

const LANGUAGES = [
  { code: "hindi", label: "हिंदी (Hindi)" },
  { code: "marathi", label: "मराठी (Marathi)" },
  { code: "bengali", label: "বাংলা (Bengali)" },
  { code: "tamil", label: "தமிழ் (Tamil)" },
  { code: "telugu", label: "తెలుగు (Telugu)" },
  { code: "kannada", label: "ಕನ್ನಡ (Kannada)" },
  { code: "malayalam", label: "മലയാളം (Malayalam)" },
  { code: "gujarati", label: "ગુજરાતી (Gujarati)" },
  { code: "punjabi", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "odia", label: "ଓଡ଼ିଆ (Odia)" },
];

export default function PatientPortal() {
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("health");

  const [symptoms, setSymptoms] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [summaryResult, setSummaryResult] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const fileInputRef = useRef(null);

  // Agent 2 state
  const [selectedLanguage, setSelectedLanguage] = useState("hindi");
  const [hindiSummary, setHindiSummary] = useState(null);
  const [hindiLoading, setHindiLoading] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  async function loadPortalData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!patientData) { setLoading(false); return; }
    setPatient(patientData);

    const pid = patientData.id;

    const [{ data: recs }, { data: appts }, { data: docs }] = await Promise.all([
      supabase.from("health_records").select("*").eq("patient_id", pid).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*, doctors(doctor_name, specialization)").eq("patient_id", pid).order("appointment_date", { ascending: false }),
      supabase.from("patient_uploads").select("*").eq("patient_id", pid).order("created_at", { ascending: false }),
    ]);

    setRecords(recs || []);
    setAppointments(appts || []);
    setUploads(docs || []);
    setLoading(false);
  }

  // ── Agent 2 — Multilingual Health Summary ──
  async function runAgent2() {
    if (!patient) return;
    setHindiLoading(true);
    setHindiSummary(null);

    const langLabel = LANGUAGES.find(l => l.code === selectedLanguage)?.label || "Hindi";

    const latestRecord = records[0];
    const nextAppointment = appointments.find(a => a.status === "Booked");
    const lastAppointment = appointments.find(a => a.status === "Completed");

    const recordsText = records.length === 0
      ? "No health records."
      : records.slice(0, 3).map((r, i) =>
          `Record ${i + 1}: BP: ${r.bp || "N/A"}, Sugar: ${r.sugar || "N/A"}, SpO2: ${r.spo2 || "N/A"}, Pulse: ${r.pulse || "N/A"}, Temp: ${r.temperature || "N/A"}, Risk: ${r.risk_level || "N/A"}, Notes: ${r.notes || "N/A"}`
        ).join("\n");

    const apptText = appointments.length === 0
      ? "No appointments."
      : appointments.slice(0, 3).map(a =>
          `${a.appointment_date} — ${a.department} — ${a.status} — Reason: ${a.reason || "N/A"}`
        ).join("\n");

    const prompt = `You are a compassionate village health worker explaining a patient's health to them in simple, warm, everyday ${selectedLanguage} language.

IMPORTANT RULES:
- Write EVERYTHING in ${selectedLanguage} script only. Not English. Not transliteration.
- Use simple words a village person would understand. No medical jargon.
- Be warm, caring, and reassuring like a trusted family doctor.
- Keep it short — 4 to 6 sentences total.
- Address the patient by name: ${patient.full_name}

Patient details:
Name: ${patient.full_name}
Age: ${patient.age}, Gender: ${patient.gender}, Village: ${patient.village || "N/A"}
Symptoms at registration: ${patient.symptoms || "Not mentioned"}

Recent Health Records:
${recordsText}

Appointments:
${apptText}

Write a simple health update message for this patient in ${selectedLanguage} that covers:
1. A warm greeting using their name
2. How their health looks overall (good/needs attention)
3. One or two important things to watch (BP, sugar, etc) if needed
4. Their next appointment if any
5. One simple piece of advice (eat well, rest, take medicine on time)

Respond ONLY with the message text in ${selectedLanguage} script. No JSON. No English. No headings.`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
        }),
      });
      const data = await res.json();
      const text = data.choices[0].message.content.trim();
      setHindiSummary(text);
    } catch (err) {
      setHindiSummary("सारांश उत्पन्न करने में विफल। कृपया पुनः प्रयास करें।");
    }

    setHindiLoading(false);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !patient) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { alert("Only PDF, JPEG, PNG, or WebP files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("File must be under 10MB."); return; }

    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session.user.id;
    const filePath = `${userId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage.from("patient-documents").upload(filePath, file);
    if (uploadError) { alert("Upload failed: " + uploadError.message); setUploading(false); return; }

    await supabase.from("patient_uploads").insert({
      patient_id: patient.id,
      uploaded_by: userId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      notes: uploadNote,
    });

    setUploadNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    loadPortalData();
  }

  async function viewFile(filePath) {
    const { data, error } = await supabase.storage.from("patient-documents").createSignedUrl(filePath, 60);
    if (error) { alert("Could not open file."); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function deleteFile(doc) {
    if (!window.confirm("Delete this document?")) return;

    const { error: storageError } = await supabase.storage
      .from("patient-documents")
      .remove([doc.file_path]);

    if (storageError) console.error("Storage error:", storageError);

    const { error: dbError } = await supabase
      .from("patient_uploads")
      .delete()
      .eq("id", doc.id);

    if (dbError) { alert(dbError.message); return; }
    loadPortalData();
  }

  async function runSymptomChecker() {
    if (!symptoms.trim()) return;
    setAiLoading(true);
    setAiResult(null);

    const prompt = `You are a medical assistant AI. A patient reports: "${symptoms}". 
Respond ONLY as valid JSON with these fields:
{
  "risk_level": "Low" | "Medium" | "High" | "Emergency",
  "department": string,
  "urgency": string,
  "possible_conditions": string[],
  "advice": string
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });
      const data = await res.json();
      const raw = data.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, "").trim();
      setAiResult(JSON.parse(clean));
    } catch {
      setAiResult({ error: "AI analysis failed. Please try again." });
    }
    setAiLoading(false);
  }

  async function runAiSummary() {
    if (!patient) return;
    setSummaryLoading(true);
    setSummaryResult(null);

    const recordsText = records.map(r =>
      `Date: ${new Date(r.created_at).toLocaleDateString()}, BP: ${r.bp}, Sugar: ${r.sugar}, SpO2: ${r.spo2}, Pulse: ${r.pulse}, Temp: ${r.temperature}, Risk: ${r.risk_level}, Notes: ${r.notes}`
    ).join("\n");

    const apptText = appointments.map(a =>
      `Date: ${a.appointment_date}, Dept: ${a.department}, Status: ${a.status}, Reason: ${a.reason}`
    ).join("\n");

    const prompt = `You are a medical AI assistant. Analyze this patient's health data and return ONLY valid JSON:
Patient: ${patient.full_name}, Age: ${patient.age}, Gender: ${patient.gender}
Health Records:\n${recordsText || "None"}
Appointments:\n${apptText || "None"}

Respond with:
{
  "overall_health": string,
  "key_findings": string[],
  "trends": string,
  "recommendations": string[]
}`;

    try {
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
      setSummaryResult(JSON.parse(clean));
    } catch {
      setSummaryResult({ error: "Summary generation failed. Please try again." });
    }
    setSummaryLoading(false);
  }

  const riskColors = {
    Low:       "bg-emerald-100 text-emerald-700 border-emerald-200",
    Medium:    "bg-amber-100 text-amber-700 border-amber-200",
    High:      "bg-orange-100 text-orange-700 border-orange-200",
    Emergency: "bg-red-100 text-red-700 border-red-200",
  };

  const riskBorder = {
    Low:       "border-l-emerald-400",
    Medium:    "border-l-amber-400",
    High:      "border-l-orange-400",
    Emergency: "border-l-red-500",
  };

  const statusColors = {
    Booked:    "bg-blue-100 text-blue-700",
    Pending:   "bg-amber-100 text-amber-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  const tabs = [
    { id: "health",   label: "Health Records" },
    { id: "appts",    label: "Appointments" },
    { id: "docs",     label: "Documents" },
    { id: "mylang",   label: "🌐 मेरी भाषा" },
    { id: "ai",       label: "AI Checker" },
    { id: "summary",  label: "AI Summary" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm animate-pulse">Loading your portal...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-sm">
          <p className="text-slate-800 font-medium mb-1">No patient record found</p>
          <p className="text-slate-500 text-sm">Your account hasn't been linked to a patient record yet. Contact the hospital reception.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Patient Info Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{patient.full_name}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {patient.age} yrs · {patient.gender} · {patient.village || "—"}
              </p>
              {patient.phone && (
                <p className="text-slate-400 text-xs mt-0.5">{patient.phone}</p>
              )}
            </div>
            <div className="flex gap-2 text-xs font-medium flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {records.length} Records
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                {appointments.length} Appointments
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {uploads.length} Documents
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer
                  ${activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── Health Records ── */}
            {activeTab === "health" && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Health Records</h2>
                {records.length === 0 ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No health records yet.</p>
                ) : (
                  records.map(r => (
                    <div
                      key={r.id}
                      className={`bg-white rounded-lg border border-l-4 ${riskBorder[r.risk_level] || "border-l-slate-300"} border-slate-200 p-4`}
                    >
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${riskColors[r.risk_level] || "bg-slate-100 text-slate-600"}`}>
                          {r.risk_level}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
                        {[
                          { label: "Temp", value: r.temperature },
                          { label: "BP", value: r.bp },
                          { label: "Sugar", value: r.sugar },
                          { label: "SpO₂", value: r.spo2 },
                          { label: "Pulse", value: r.pulse },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                            <p className="text-sm font-semibold text-slate-800">{value || "—"}</p>
                          </div>
                        ))}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                          {r.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Appointments ── */}
            {activeTab === "appts" && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Appointments</h2>
                {appointments.length === 0 ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No appointments scheduled.</p>
                ) : (
                  appointments.map(a => (
                    <div key={a.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {a.doctors?.doctor_name || "Doctor"} · <span className="font-normal text-slate-500">{a.doctors?.specialization}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {a.appointment_date} at {a.appointment_time} · {a.department}
                        </p>
                        {a.reason && <p className="text-xs text-slate-500 mt-1">{a.reason}</p>}
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[a.status] || "bg-slate-100 text-slate-600"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Documents ── */}
            {activeTab === "docs" && (
              <div className="space-y-5">
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-slate-700">Upload a Document</h2>
                  <p className="text-xs text-slate-400">PDF, JPEG, PNG, or WebP — max 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Add a note (optional)"
                    value={uploadNote}
                    onChange={e => setUploadNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {uploading && <p className="text-xs text-blue-600 animate-pulse">Uploading...</p>}
                </div>

                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Your Documents</h2>
                  {uploads.length === 0 ? (
                    <p className="text-slate-400 text-sm py-6 text-center">No documents uploaded yet.</p>
                  ) : (
                    uploads.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0">
                            {doc.file_type === "application/pdf" ? "📄" : "🖼️"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{doc.file_name}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(doc.created_at).toLocaleDateString()}
                              {doc.notes && ` · ${doc.notes}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => viewFile(doc.file_path)}
                            className="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 font-medium transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteFile(doc)}
                            className="text-sm px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Agent 2 — Multilingual Summary ── */}
            {activeTab === "mylang" && (
              <div className="space-y-5 max-w-2xl">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 mb-1">अपनी भाषा में स्वास्थ्य जानकारी</h2>
                  <p className="text-xs text-slate-400">Get your health summary in your local language- simple words, no medical jargon.</p>
                </div>

                {/* Language selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">अपनी भाषा चुनें / Choose your language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      setHindiSummary(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={runAgent2}
                  disabled={hindiLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {hindiLoading ? "generating..." : "🌐 Generate in " + (LANGUAGES.find(l => l.code === selectedLanguage)?.label || "Hindi")}
                </button>

                {/* Summary output */}
                {hindiSummary && (
                  <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🏥</span>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        {LANGUAGES.find(l => l.code === selectedLanguage)?.label} — Health Update
                      </p>
                    </div>
                    <p className="text-base text-slate-800 leading-relaxed whitespace-pre-line">
                      {hindiSummary}
                    </p>
                    <button
                      onClick={() => setHindiSummary(null)}
                      className="mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Regenerate ↺
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── AI Symptom Checker ── */}
            {activeTab === "ai" && (
              <div className="space-y-5 max-w-2xl">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 mb-1">AI Symptom Checker</h2>
                  <p className="text-xs text-slate-400">Describe your symptoms in plain words. This is not a diagnosis.</p>
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. I have a fever since 2 days, headache, and mild chest discomfort..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />

                <button
                  onClick={runSymptomChecker}
                  disabled={aiLoading || !symptoms.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {aiLoading ? "Analysing..." : "Check Symptoms"}
                </button>

                {aiResult && !aiResult.error && (
                  <div className={`rounded-xl border-l-4 border border-slate-200 p-5 space-y-3 ${riskBorder[aiResult.risk_level] || "border-l-slate-300"}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${riskColors[aiResult.risk_level] || "bg-slate-100 text-slate-600"}`}>
                        {aiResult.risk_level} Risk
                      </span>
                      <span className="text-xs text-slate-500">
                        See: <strong>{aiResult.department}</strong> · {aiResult.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{aiResult.advice}</p>
                    {aiResult.possible_conditions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {aiResult.possible_conditions.map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {aiResult?.error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{aiResult.error}</p>
                )}
              </div>
            )}

            {/* ── AI Summary ── */}
            {activeTab === "summary" && (
              <div className="space-y-5 max-w-2xl">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 mb-1">AI Health Summary</h2>
                  <p className="text-xs text-slate-400">Generates a summary based on your health records and appointments.</p>
                </div>

                <button
                  onClick={runAiSummary}
                  disabled={summaryLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {summaryLoading ? "Generating..." : "Generate Summary"}
                </button>

                {summaryResult && !summaryResult.error && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Overall Health</p>
                      <p className="text-sm text-slate-800">{summaryResult.overall_health}</p>
                    </div>
                    {summaryResult.key_findings?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Key Findings</p>
                        <ul className="space-y-1">
                          {summaryResult.key_findings.map((f, i) => (
                            <li key={i} className="text-sm text-slate-700 flex gap-2">
                              <span className="text-blue-400 mt-0.5">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summaryResult.trends && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Trends</p>
                        <p className="text-sm text-slate-700">{summaryResult.trends}</p>
                      </div>
                    )}
                    {summaryResult.recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {summaryResult.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-slate-700 flex gap-2">
                              <span className="text-emerald-500 mt-0.5">✓</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {summaryResult?.error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{summaryResult.error}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}