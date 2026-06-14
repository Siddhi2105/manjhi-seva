import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DischargeSummary() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [patientId]);

  async function loadData() {
    setLoading(true);

    const [{ data: p }, { data: recs }, { data: appts }, { data: docs }] =
      await Promise.all([
        supabase.from("patients").select("*").eq("id", patientId).single(),
        supabase.from("health_records").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
        supabase.from("appointments").select("*, doctors(doctor_name, specialization)").eq("patient_id", patientId).order("appointment_date", { ascending: false }),
        supabase.from("patient_uploads").select("*").eq("patient_id", patientId),
      ]);

    setPatient(p);
    setHealthRecords(recs || []);
    setAppointments(appts || []);
    setUploads(docs || []);
    setLoading(false);
  }

  async function generateSummary() {
    if (!patient) return;
    setGenerating(true);
    setSummary(null);

    const recordsText = healthRecords.length === 0
      ? "No health records."
      : healthRecords.map((r, i) =>
          `Record ${i + 1} (${new Date(r.created_at).toLocaleDateString()}): Temp: ${r.temperature || "N/A"}, BP: ${r.bp || "N/A"}, Sugar: ${r.sugar || "N/A"}, SpO2: ${r.spo2 || "N/A"}, Pulse: ${r.pulse || "N/A"}, Risk: ${r.risk_level || "N/A"}, Notes: ${r.notes || "N/A"}`
        ).join("\n");

    const apptText = appointments.length === 0
      ? "No appointments."
      : appointments.map((a, i) =>
          `Appt ${i + 1}: ${a.appointment_date} — ${a.department} — Dr. ${a.doctors?.doctor_name || "Unknown"} — ${a.status} — Reason: ${a.reason || "N/A"}`
        ).join("\n");

    const prompt = `You are a senior hospital physician at Manjhi Seva, a rural Indian hospital. Generate a formal medical discharge summary.

Patient: ${patient.full_name}, Age: ${patient.age}, Gender: ${patient.gender}, Village: ${patient.village || "N/A"}
Initial Symptoms: ${patient.symptoms || "N/A"}

Health Records:
${recordsText}

Appointments:
${apptText}

Uploaded Documents: ${uploads.length} file(s) on record.

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
      setSummary(JSON.parse(clean));
    } catch (err) {
      alert("Failed to generate summary: " + err.message);
    }

    setGenerating(false);
  }

  function exportPDF() {
    if (!summary || !patient) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    // ── Header ──
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Manjhi Seva", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("AI-Powered Hospital Management System", 14, 19);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DISCHARGE SUMMARY", pageWidth - 14, 12, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${today}`, pageWidth - 14, 19, { align: "right" });

    // ── Condition badge ──
    const conditionColors = {
      Stable:                  [16, 185, 129],
      Recovered:               [5, 150, 105],
      Referred:                [245, 158, 11],
      "Against Medical Advice":[239, 68, 68],
    };
    const badgeColor = conditionColors[summary.discharge_condition] || [100, 116, 139];
    doc.setFillColor(...badgeColor);
    doc.roundedRect(14, 33, 60, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(summary.discharge_condition.toUpperCase(), 44, 38.5, { align: "center" });

    // ── Patient info ──
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(patient.full_name, 14, 50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Age: ${patient.age} · Gender: ${patient.gender} · Village: ${patient.village || "N/A"} · Phone: ${patient.phone || "N/A"}`, 14, 57);

    let y = 65;

    // ── Summary paragraph ──
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const summaryLines = doc.splitTextToSize(summary.summary_paragraph, pageWidth - 36);
    doc.text(summaryLines, 19, y + 6);
    y += 24;

    // ── Diagnosis ──
    autoTable(doc, {
      startY: y,
      head: [["Primary Diagnosis", "Secondary Diagnosis"]],
      body: [[summary.primary_diagnosis, summary.secondary_diagnosis || "None"]],
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── Treatment given ──
    autoTable(doc, {
      startY: y,
      head: [["Treatment Given"]],
      body: summary.treatment_given.map(t => [t]),
      headStyles: { fillColor: [37, 99, 235], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── Medications ──
    if (summary.medications_to_continue?.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Medication", "Dosage", "Duration"]],
        body: summary.medications_to_continue.map(m => [m.name, m.dosage, m.duration]),
        headStyles: { fillColor: [124, 58, 237], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    // ── Follow-up + Diet + Activity ──
    autoTable(doc, {
      startY: y,
      head: [["Follow-up", "Department", "Diet", "Activity"]],
      body: [[
        summary.follow_up_date,
        summary.follow_up_department,
        summary.diet_instructions,
        summary.activity_restrictions,
      ]],
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
      columnStyles: { 2: { cellWidth: 45 }, 3: { cellWidth: 45 } },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── Warning signs ──
    if (summary.warning_signs?.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["⚠ Warning Signs — Return Immediately If:"]],
        body: summary.warning_signs.map(s => [s]),
        headStyles: { fillColor: [220, 38, 38], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    // ── Doctor notes ──
    if (summary.doctor_notes) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Doctor's Notes:", 14, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const noteLines = doc.splitTextToSize(summary.doctor_notes, pageWidth - 28);
      doc.text(noteLines, 14, y + 10);
      y += 10 + noteLines.length * 5;
    }

    // ── Footer ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("CONFIDENTIAL — Manjhi Seva Hospital Management System", 14, doc.internal.pageSize.getHeight() - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
    }

    const filename = `${patient.full_name.replace(/\s+/g, "_")}_discharge_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  }

  const conditionColors = {
    Stable:                  "bg-emerald-100 text-emerald-700 border-emerald-200",
    Recovered:               "bg-green-100 text-green-700 border-green-200",
    Referred:                "bg-amber-100 text-amber-700 border-amber-200",
    "Against Medical Advice":"bg-red-100 text-red-700 border-red-200",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm animate-pulse">Loading patient data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <button
            onClick={() => navigate(`/patient/${patientId}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Patient
          </button>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Discharge Summary</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {patient?.full_name} · {patient?.age} yrs · {patient?.gender}
              </p>
            </div>
            {summary && (
              <button
                onClick={exportPDF}
                className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Download PDF
              </button>
            )}
          </div>
        </div>

        {/* ── Data snapshot ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Health Records", value: healthRecords.length, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Appointments",   value: appointments.length,  color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Documents",      value: uploads.length,       color: "text-slate-600", bg: "bg-slate-100" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Generate button ── */}
        {!summary && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center space-y-3">
            <p className="text-slate-700 text-sm">
              The AI agent will read all health records, appointments, and patient data to generate a complete clinical discharge summary.
            </p>
            <button
              onClick={generateSummary}
              disabled={generating}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              {generating ? "Agent is generating summary..." : "🤖 Generate Discharge Summary"}
            </button>
          </div>
        )}

        {/* ── Summary result ── */}
        {summary && (
          <div ref={summaryRef} className="space-y-4">

            {/* Condition + diagnosis */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${conditionColors[summary.discharge_condition] || "bg-slate-100 text-slate-600"}`}>
                  {summary.discharge_condition}
                </span>
                <h2 className="text-lg font-bold text-slate-800">{summary.primary_diagnosis}</h2>
              </div>
              {summary.secondary_diagnosis && (
                <p className="text-sm text-slate-500">Secondary: {summary.secondary_diagnosis}</p>
              )}
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-100 italic">
                {summary.summary_paragraph}
              </p>
            </div>

            {/* Treatment */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Treatment Given</h3>
              <ul className="space-y-1.5">
                {summary.treatment_given.map((t, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-blue-400 mt-0.5">•</span> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Medications */}
            {summary.medications_to_continue?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Medications to Continue</h3>
                <div className="space-y-2">
                  {summary.medications_to_continue.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                      <span className="text-sm font-medium text-slate-800">{m.name}</span>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>{m.dosage}</span>
                        <span>{m.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up + Diet + Activity */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Follow-up</p>
                <p className="text-sm font-medium text-slate-800">{summary.follow_up_date}</p>
                <p className="text-xs text-slate-500">{summary.follow_up_department}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Diet</p>
                <p className="text-sm text-slate-700">{summary.diet_instructions}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Activity</p>
                <p className="text-sm text-slate-700">{summary.activity_restrictions}</p>
              </div>
            </div>

            {/* Warning signs */}
            {summary.warning_signs?.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3">
                  ⚠ Warning Signs — Return Immediately If:
                </h3>
                <ul className="space-y-1.5">
                  {summary.warning_signs.map((s, i) => (
                    <li key={i} className="text-sm text-red-700 flex gap-2">
                      <span className="mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Doctor notes */}
            {summary.doctor_notes && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Doctor's Notes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{summary.doctor_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={exportPDF}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Download PDF
              </button>
              <button
                onClick={() => { setSummary(null); }}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Regenerate
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}