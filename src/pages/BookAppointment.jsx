import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";

async function runAgent4(form, doctors, appointments) {
  try {
    const appointmentsOnDate = appointments.filter(
      (a) => a.appointment_date === form.appointment_date
    );

    const doctorLoad = doctors.map((d) => ({
      id: d.id,
      name: d.doctor_name,
      specialization: d.specialization,
      count: appointmentsOnDate.filter((a) => String(a.doctor_id) === String(d.id)).length,
    }));

    const currentDoctorLoad = doctorLoad.find(d => String(d.id) === String(form.doctor_id));

    const doctorListText = doctorLoad.map((d, i) =>
      `${i + 1}. ID: ${d.id}, Name: ${d.name}, Specialization: ${d.specialization}, Appointments on ${form.appointment_date}: ${d.count}`
    ).join("\n");

    const prompt = `You are a doctor workload balancer at Manjhi Seva, a rural Indian hospital.

A new appointment needs to be booked. Balance the load fairly across available doctors.

Appointment Details:
- Department: ${form.department}
- Reason: ${form.reason || "Not specified"}
- Date: ${form.appointment_date}

Currently selected doctor: ID ${form.doctor_id}, Name: ${currentDoctorLoad?.name || "Unknown"}, Appointments today: ${currentDoctorLoad?.count ?? 0}

All Doctor Workloads on ${form.appointment_date}:
${doctorListText}

Rules:
1. Find the doctor with the LEAST appointments on this date.
2. If the currently selected doctor does NOT have the least appointments, set is_same_as_selected to false and recommend the one with least load.
3. If the currently selected doctor DOES have the least appointments (or tied for least), set is_same_as_selected to true.
4. Prefer doctors whose specialization matches the department/reason.
5. Never recommend a doctor from a completely unrelated specialization.

Respond ONLY in this exact JSON:
{
  "recommended_doctor_id": <number>,
  "recommended_doctor_name": "<string>",
  "reason": "<string — why this doctor was picked>",
  "current_load": <number>,
  "is_same_as_selected": <true | false>
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
        temperature: 0.2,
      }),
    });

    const data = await res.json();
    const raw = data.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    console.log("Agent 4 workload result:", result);
    console.log("Doctor loads:", doctorLoad);
    console.log("Current doctor load:", currentDoctorLoad);

    return result;

  } catch (err) {
    console.error("Agent 4 error:", err);
    return null;
  }
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    patient_id: "", department: "", doctor_id: "",
    appointment_date: "", appointment_time: "", reason: "", status: "Booked",
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isAgentPrefilled, setIsAgentPrefilled] = useState(false);

  const [balancerResult, setBalancerResult] = useState(null);
  const [balancerLoading, setBalancerLoading] = useState(false);
  const [balancerChecked, setBalancerChecked] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchPatients();
    fetchAllAppointments();
  }, []);

  useEffect(() => {
    if (doctors.length === 0 || patients.length === 0) return;

    const patient    = searchParams.get("patient");
    const doctor     = searchParams.get("doctor");
    const department = searchParams.get("department");
    const date       = searchParams.get("date");
    const time       = searchParams.get("time");
    const reason     = searchParams.get("reason");

    if (patient || doctor) {
      setForm(prev => ({
        ...prev,
        patient_id:       patient    || prev.patient_id,
        doctor_id:        doctor     || prev.doctor_id,
        department:       department || prev.department,
        appointment_date: date       || prev.appointment_date,
        appointment_time: time       || prev.appointment_time,
        reason:           reason     || prev.reason,
      }));
      setIsAgentPrefilled(true);
    }
  }, [doctors, patients]);

  // Auto-trigger Agent 4 when date + doctor + department are all filled
  useEffect(() => {
    if (
      form.appointment_date &&
      form.doctor_id &&
      form.department &&
      !balancerChecked &&
      doctors.length > 0
    ) {
      checkWorkloadBalance();
    }
  }, [form.appointment_date, form.doctor_id, form.department, doctors, allAppointments]);

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

  async function fetchAllAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, doctor_id, appointment_date")
      .neq("status", "Cancelled");
    if (!error) setAllAppointments(data || []);
  }

  async function checkWorkloadBalance() {
    setBalancerLoading(true);
    setBalancerResult(null);
    const result = await runAgent4(form, doctors, allAppointments);
    setBalancerResult(result);
    setBalancerLoading(false);
    setBalancerChecked(true);
  }

  function applyBalancerSuggestion() {
    if (!balancerResult) return;
    setForm(prev => ({
      ...prev,
      doctor_id: String(balancerResult.recommended_doctor_id),
    }));
    setBalancerResult(null);
    setBalancerChecked(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (["appointment_date", "doctor_id", "department"].includes(name)) {
      setBalancerResult(null);
      setBalancerChecked(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.from("appointments").insert([form]);
    setLoading(false);
    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Appointment booked successfully!");
      setTimeout(() => navigate("/appointments"), 1500);
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <button
            onClick={() => navigate(isAgentPrefilled ? "/appointment-router" : "/appointments")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to {isAgentPrefilled ? "AI Router" : "Appointments"}
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Book Appointment</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule a new appointment for a patient.</p>
        </div>

        {/* Agent 1 pre-fill banner */}
        {isAgentPrefilled && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
            <span className="text-lg mt-0.5">🤖</span>
            <div>
              <p className="text-sm font-semibold text-blue-700">Pre-filled by AI Appointment Router</p>
              <p className="text-xs text-blue-500 mt-0.5">
                Review the details below and adjust if needed before confirming.
              </p>
            </div>
          </div>
        )}

        {/* Agent 4 loading banner */}
        {balancerLoading && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
            <span className="animate-pulse text-lg">⚖️</span>
            <p className="text-sm text-amber-700 font-medium">Agent 4 is checking doctor workloads...</p>
          </div>
        )}

        {/* Agent 4 imbalance detected */}
        {balancerResult && !balancerResult.is_same_as_selected && (
          <div className="mb-4 px-4 py-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">⚖️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700">Agent 4 — Workload Imbalance Detected</p>
                <p className="text-xs text-amber-600 mt-0.5">{balancerResult.reason}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Suggested: <strong>{balancerResult.recommended_doctor_name}</strong> ({balancerResult.current_load} appointments on this date)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyBalancerSuggestion}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Switch to {balancerResult.recommended_doctor_name}
              </button>
              <button
                onClick={() => setBalancerResult(null)}
                className="px-4 py-1.5 bg-white border border-amber-200 hover:border-amber-400 text-amber-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Keep current doctor
              </button>
            </div>
          </div>
        )}

        {/* Agent 4 balanced */}
        {balancerResult?.is_same_as_selected && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-xs text-green-700 font-medium">
              Agent 4 — Workload balanced. {balancerResult.recommended_doctor_name} has the lightest load on this date.
            </p>
          </div>
        )}

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            message.includes("Error")
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
              <select name="patient_id" value={form.patient_id} onChange={handleChange} required className={inputClass}>
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
              <select name="doctor_id" value={form.doctor_id} onChange={handleChange} required className={inputClass}>
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.doctor_name} — {d.specialization}</option>
                ))}
              </select>
              {isAgentPrefilled && form.doctor_id && !balancerResult && (
                <p className="text-xs text-blue-500 mt-1">✓ Doctor recommended by AI agent</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input
                name="department" value={form.department} onChange={handleChange}
                placeholder="e.g. Cardiology" required className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date" name="appointment_date" value={form.appointment_date}
                  onChange={handleChange} required className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <input
                  type="time" name="appointment_time" value={form.appointment_time}
                  onChange={handleChange} required className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <textarea
                name="reason" value={form.reason} onChange={handleChange}
                rows={3} placeholder="Reason for visit..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={loading || balancerLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Booking..." : "Book Appointment"}
              </button>
              <button
                type="button"
                onClick={() => navigate(isAgentPrefilled ? "/appointment-router" : "/appointments")}
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