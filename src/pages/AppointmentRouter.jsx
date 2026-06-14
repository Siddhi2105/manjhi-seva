import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AppointmentRouter() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchPatients();
  }, []);

  async function fetchDoctors() {
    const { data } = await supabase
      .from("doctors")
      .select("id, doctor_name, specialization, availability")
      .eq("availability", "Available");
    setDoctors(data || []);
  }

  async function fetchPatients() {
    const { data } = await supabase
      .from("patients")
      .select("id, full_name");
    setPatients(data || []);
  }

  async function runAgent() {
    if (!symptoms.trim()) return;
    setLoading(true);
    setResult(null);

    // Build doctor list for AI context
    const doctorList = doctors.map((d, i) =>
      `${i + 1}. ID: ${d.id}, Name: ${d.doctor_name}, Specialization: ${d.specialization}`
    ).join("\n");

    const prompt = `You are an intelligent medical appointment routing agent at Manjhi Seva, a rural Indian hospital.

A patient reports these symptoms: "${symptoms}"

Available doctors:
${doctorList}

Your job:
1. Analyze the symptoms carefully
2. Determine which medical specialization is most appropriate
3. Select the best matching doctor from the list above
4. Determine urgency level
5. Suggest appointment date (within next 7 days from today: ${new Date().toISOString().split("T")[0]})

Respond ONLY in this exact JSON format:
{
  "recommended_doctor_id": <number>,
  "recommended_doctor_name": "<string>",
  "specialization": "<string>",
  "department": "<string>",
  "urgency": "Immediate" | "Within 24 hours" | "Within 3 days" | "Within a week",
  "risk_level": "Low" | "Medium" | "High" | "Emergency",
  "reasoning": "<explain why this doctor was chosen>",
  "suggested_date": "<YYYY-MM-DD>",
  "suggested_time": "<HH:MM>",
  "pre_diagnosis": "<brief possible conditions>",
  "advice": "<immediate advice for patient>"
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
      setResult(JSON.parse(clean));
    } catch (err) {
      alert("Agent failed: " + err.message);
    }

    setLoading(false);
  }

  function handleBookNow() {
    if (!result || !selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    // Navigate to book appointment with pre-filled data
    navigate(
      `/book-appointment?patient=${selectedPatient}&doctor=${result.recommended_doctor_id}&department=${encodeURIComponent(result.department)}&date=${result.suggested_date}&time=${result.suggested_time}&reason=${encodeURIComponent(result.pre_diagnosis)}`
    );
  }

  const riskColors = {
    Low:       "bg-emerald-100 text-emerald-700 border-emerald-200",
    Medium:    "bg-amber-100 text-amber-700 border-amber-200",
    High:      "bg-orange-100 text-orange-700 border-orange-200",
    Emergency: "bg-red-100 text-red-700 border-red-200",
  };

  const urgencyColors = {
    "Immediate":       "text-red-600",
    "Within 24 hours": "text-orange-600",
    "Within 3 days":   "text-amber-600",
    "Within a week":   "text-green-600",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl"></span>
            <h1 className="text-2xl font-bold text-slate-800">AI Appointment Router</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Describe symptoms and the AI agent will find the best available doctor and suggest an appointment.
          </p>
        </div>

        {/* ── Input Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient Symptoms
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Patient has been having chest pain for 2 days, shortness of breath, and mild fever..."
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Patient (for booking)
            </label>
            <select
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select a patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          {/* Available doctors count */}
          <p className="text-xs text-slate-400">
            {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} currently available
          </p>

          <button
            onClick={runAgent}
            disabled={loading || !symptoms.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
          >
            {loading ? "Agent is thinking..." : " Find Best Doctor"}
          </button>
        </div>

        {/* ── Agent Result ── */}
        {result && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Result header */}
            <div className="bg-slate-800 px-6 py-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Agent Recommendation</p>
              <h2 className="text-lg font-bold text-white">{result.recommended_doctor_name}</h2>
              <p className="text-slate-300 text-sm">{result.specialization} · {result.department}</p>
            </div>

            <div className="p-6 space-y-5">

              {/* Risk + Urgency */}
              <div className="flex gap-3 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${riskColors[result.risk_level]}`}>
                  {result.risk_level} Risk
                </span>
                <span className={`text-xs font-semibold ${urgencyColors[result.urgency]}`}>
                  ⏱ {result.urgency}
                </span>
              </div>

              {/* Reasoning */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                  Why this doctor?
                </p>
                <p className="text-sm text-blue-800">{result.reasoning}</p>
              </div>

              {/* Pre-diagnosis */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Possible Conditions
                </p>
                <p className="text-sm text-slate-700">{result.pre_diagnosis}</p>
              </div>

              {/* Advice */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Immediate Advice
                </p>
                <p className="text-sm text-slate-700">{result.advice}</p>
              </div>

              {/* Suggested appointment */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Suggested Appointment
                </p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">Date</span>
                    <p className="font-semibold text-slate-800">{result.suggested_date}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Time</span>
                    <p className="font-semibold text-slate-800">{result.suggested_time}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Department</span>
                    <p className="font-semibold text-slate-800">{result.department}</p>
                  </div>
                </div>
              </div>

              {/* Book button */}
              <button
                onClick={handleBookNow}
                disabled={!selectedPatient}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                {selectedPatient ? "✅ Book This Appointment" : "Select a patient to book"}
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}