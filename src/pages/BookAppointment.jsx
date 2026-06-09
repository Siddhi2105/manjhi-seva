import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function BookAppointment() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    patient_id: "", department: "", doctor_id: "",
    appointment_date: "", appointment_time: "", reason: "", status: "Booked",
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchDoctors(); fetchPatients(); }, []);

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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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
            onClick={() => navigate("/appointments")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back to Appointments
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Book Appointment</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule a new appointment for a patient.</p>
        </div>

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
                type="submit" disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Booking..." : "Book Appointment"}
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