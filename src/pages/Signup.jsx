import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [symptoms, setSymptoms] = useState("");       // ← fixed: own state
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function runAgent1(patientId, symptoms, patientName) {
    const { data: doctors } = await supabase
      .from("doctors").select("id, doctor_name, specialization").eq("availability", "Available");

    if (!doctors || doctors.length === 0) return;

    const doctorList = doctors.map((d, i) =>
      `${i + 1}. ID: ${d.id}, Name: ${d.doctor_name}, Specialization: ${d.specialization}`
    ).join("\n");

    const prompt = `You are an intelligent medical appointment routing agent at Manjhi Seva, a rural Indian hospital.

A new patient just signed up. Patient: ${patientName}, Symptoms: ${symptoms || "Not specified"}

Available doctors:
${doctorList}

Today's date: ${new Date().toISOString().split("T")[0]}

Respond ONLY in this exact JSON:
{
  "recommended_doctor_id": <number>,
  "recommended_doctor_name": "<string>",
  "department": "<string>",
  "urgency": "Immediate" | "Within 24 hours" | "Within 3 days" | "Within a week",
  "risk_level": "Low" | "Medium" | "High" | "Emergency",
  "reasoning": "<string>",
  "suggested_date": "<YYYY-MM-DD>",
  "suggested_time": "<HH:MM>",
  "pre_diagnosis": "<string>"
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
      const result = JSON.parse(clean);

      await supabase.from("pipeline_logs").insert({
        patient_id: patientId,
        agent: "Agent 1 — Appointment Router",
        status: "completed",
        input: { symptoms, patient_name: patientName },
        output: result,
      });

      await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: result.recommended_doctor_id,
        department: result.department,
        appointment_date: result.suggested_date,
        appointment_time: result.suggested_time,
        reason: result.pre_diagnosis,
        status: "Booked",
      });

    } catch (err) {
      console.error("Agent 1 pipeline error:", err);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);

    const safeRole = role === "admin" ? "receptionist" : role;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { alert(error.message); setLoading(false); return; }

    const user = data.user;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([{ id: user.id, full_name: fullName, phone, village, role: safeRole }]);
    if (profileError) { alert(profileError.message); setLoading(false); return; }

    if (safeRole === "patient") {
      const { data: patientRow, error: patientError } = await supabase
        .from("patients")
        .insert([{ full_name: fullName, phone, village, age: parseInt(age), gender, symptoms, user_id: user.id }])
        .select().single();
      if (patientError) { alert(patientError.message); setLoading(false); return; }

      await runAgent1(patientRow.id, symptoms, fullName);   // ← fixed: passes symptoms correctly
    }

    if (safeRole === "doctor") {
      const { data: doctorRow, error: findError } = await supabase
        .from("doctors").select("id").eq("phone", phone).single();
      if (findError || !doctorRow) {
        alert("No doctor record found with this phone number. Please ask admin to create your doctor profile first.");
        setLoading(false); return;
      }
      const { error: linkError } = await supabase
        .from("doctors").update({ user_id: user.id }).eq("id", doctorRow.id);
      if (linkError) { alert(linkError.message); setLoading(false); return; }
    }

    if (safeRole === "receptionist" || safeRole === "sevak") {
      const { data: staffRow, error: findError } = await supabase
        .from("staff").select("id").eq("phone", phone).eq("role", safeRole).single();
      if (findError || !staffRow) {
        alert(`No ${safeRole} record found with this phone number. Please ask admin to register you first.`);
        setLoading(false); return;
      }
      const { error: linkError } = await supabase
        .from("staff").update({ user_id: user.id }).eq("id", staffRow.id);
      if (linkError) { alert(linkError.message); setLoading(false); return; }
    }

    alert("Signup successful! Your appointment has been auto-scheduled.");
    navigate("/my-portal");
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const selectClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Manjhi Seva</h1>
          <p className="text-slate-500 mt-2 text-sm">AI-Powered Hospital Management System</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Create your account</h2>
          <p className="text-slate-500 text-sm mb-6">Get started with Manjhi Seva in a few quick steps.</p>

          <form onSubmit={handleSignup} className="space-y-4">

            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" placeholder="Full Name" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" placeholder="Phone number" value={phone}
                onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Village</label>
              <input type="text" placeholder="Village" value={village}
                onChange={(e) => setVillage(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
                <option value="patient">Patient</option>
                <option value="sevak">Sevak</option>
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {role === "patient" && (
              <>
                <div>
                  <label className={labelClass}>Age</label>
                  <input type="number" placeholder="Age" value={age}
                    onChange={(e) => setAge(e.target.value)} required className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Symptoms</label>
                  <textarea
                    placeholder="Describe your symptoms (e.g. fever, chest pain, headache...)"
                    value={symptoms}                                  // ← fixed
                    onChange={(e) => setSymptoms(e.target.value)}     // ← fixed
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Manjhi Seva — Empowering Rural Healthcare
        </p>

      </div>
    </div>
  );
}