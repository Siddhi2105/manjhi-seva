import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState({
    patient_id: "",
    doctor_id: "",
    department: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    status: "",
  });

  // These are for the dropdowns
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAppointment();
    fetchDoctors();
    fetchPatients();
  }, [id]);

  async function fetchAppointment() {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setAppointment(data);
  }

  async function fetchDoctors() {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, doctor_name, specialization")
      .order("doctor_name");

    if (!error) setDoctors(data);
  }

  async function fetchPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name")
      .order("full_name");

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

    if (error) {
      alert(error.message);
      return;
    }

    alert("Appointment updated successfully!");
    navigate("/appointments");
  }

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Edit Appointment</h2>

      <form onSubmit={updateAppointment}>

        <div style={{ marginBottom: "1rem" }}>
          <label>Patient</label>
          <select
            value={appointment.patient_id}
            onChange={(e) => setAppointment({ ...appointment, patient_id: e.target.value })}
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          >
            <option value="">Select a patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Doctor</label>
          <select
            value={appointment.doctor_id}
            onChange={(e) => setAppointment({ ...appointment, doctor_id: e.target.value })}
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          >
            <option value="">Select a doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.doctor_name} — {d.specialization}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Department</label>
          <input
            value={appointment.department}
            onChange={(e) => setAppointment({ ...appointment, department: e.target.value })}
            placeholder="Department"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Date</label>
          <input
            type="date"
            value={appointment.appointment_date}
            onChange={(e) => setAppointment({ ...appointment, appointment_date: e.target.value })}
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Time</label>
          <input
            type="time"
            value={appointment.appointment_time}
            onChange={(e) => setAppointment({ ...appointment, appointment_time: e.target.value })}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Reason</label>
          <textarea
            value={appointment.reason}
            onChange={(e) => setAppointment({ ...appointment, reason: e.target.value })}
            rows={3}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Status</label>
          <select
            value={appointment.status}
            onChange={(e) => setAppointment({ ...appointment, status: e.target.value })}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          >
            <option value="Booked">Booked</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Update Appointment"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/appointments")}
            style={{ background: "none", border: "1px solid #ccc", padding: "8px 16px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}