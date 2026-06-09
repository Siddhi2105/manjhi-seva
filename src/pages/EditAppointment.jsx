import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState({
    patient_id: "", doctor_id: "", department: "",
    appointment_date: "", appointment_time: "", reason: "", status: "",
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAppointment(); fetchDoctors(); fetchPatients(); }, [id]);

  async function fetchAppointment() {
    const { data, error } = await supabase
      .from("appointments").select("*").eq("id", id).single();
    if (error) { alert(error.message); return; }
    setAppointment(data);
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
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {saving ? "Saving..." : "Update Appointment"}
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