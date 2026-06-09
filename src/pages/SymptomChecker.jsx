import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  async function handleCheck(e) {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setLoading(true);
    setResult(null);
    setSaveMsg("");

    try {
<<<<<<< HEAD
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
              content: `You are a medical triage assistant for a rural Indian hospital. 
Analyze symptoms and respond ONLY in this JSON format:
=======
      console.log("GROQ KEY:",import.meta.env.VITE_GROQ_API_KEY);

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

>>>>>>> eadf8eb80290667a0d0a1cc2ff62e4933d9eb958
{
  "risk_level": "Low|Medium|High|Emergency",
  "department": "department name",
  "urgency": "brief urgency note",
  "possible_conditions": ["condition1", "condition2"],
  "advice": "plain English advice for patient",
  "notes": "clinical notes for staff"
}`,
            },
            { role: "user", content: `Patient symptoms: ${symptoms}` },
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (err) {
      setResult({ error: "Failed to analyze symptoms. Please try again." });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!result || !patientId.trim()) {
      setSaveMsg("Enter a Patient ID to save.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("health_records").insert({
      patient_id: patientId.trim(),
      notes: `AI Symptom Check — ${symptoms}\n\nAdvice: ${result.advice}\nConditions: ${result.possible_conditions?.join(", ")}\nUrgency: ${result.urgency}`,
      risk_level: result.risk_level || "Low",
    });
    setSaving(false);
    setSaveMsg(error ? `Error: ${error.message}` : "Saved to health records.");
  }

  const riskColors = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Emergency: "bg-red-50 text-red-700 border-red-200",
  };

  const riskBorder = {
    Low: "border-l-emerald-500",
    Medium: "border-l-amber-500",
    High: "border-l-orange-500",
    Emergency: "border-l-red-500",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">AI Symptom Checker</h1>
          <p className="text-slate-500 text-sm mt-1">
            Describe symptoms in plain language — get a triage assessment instantly.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Describe the symptoms
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Fever for 3 days, headache, body pain, no appetite..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              {loading ? "Analyzing..." : "Analyze Symptoms"}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {result && !result.error && (
          <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${riskBorder[result.risk_level] || "border-l-slate-400"} shadow-sm p-6 space-y-5`}>

            {/* Risk + Department */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${riskColors[result.risk_level] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                {result.risk_level} Risk
              </span>
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                → {result.department}
              </span>
            </div>

            {/* Urgency */}
            {result.urgency && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Urgency</p>
                <p className="text-sm text-slate-700">{result.urgency}</p>
              </div>
            )}

            {/* Possible Conditions */}
            {result.possible_conditions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Possible Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {result.possible_conditions.map((c, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Advice */}
            {result.advice && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Advice</p>
                <p className="text-sm text-slate-700 leading-relaxed">{result.advice}</p>
              </div>
            )}

            {/* Clinical Notes */}
            {result.notes && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Clinical Notes</p>
                <p className="text-sm text-slate-600 leading-relaxed">{result.notes}</p>
              </div>
            )}

            {/* Save to Health Record */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Save to Health Record</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Patient UUID"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
              {saveMsg && (
                <p className={`text-sm mt-2 ${saveMsg.startsWith("Error") ? "text-red-600" : "text-emerald-600"}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          </div>
        )}

        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {result.error}
          </div>
        )}
      </div>
    </div>
  );
}