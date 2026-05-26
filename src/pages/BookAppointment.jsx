import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");
  const navigate = useNavigate();

  const [department, setDepartment] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function bookAppointment(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("appointments").insert([
      {
        patient_id: patientId,
        department: department,
        doctor_name: doctorName,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason,
        status: "Booked",
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Appointment booked successfully!");
    navigate("/appointments");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Book Appointment</h1>
        <p style={styles.subtitle}>Fill details to schedule a visit</p>

        <form onSubmit={bookAppointment} style={styles.form}>
          {/* Department */}
          <div style={styles.inputGroup}>
            <label>Department</label>
            <select
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              <option>General</option>
              <option>Cardiology</option>
              <option>Dermatology</option>
              <option>Orthopedic</option>
              <option>ENT</option>
              <option>Neurology</option>
            </select>
          </div>

          {/* Doctor */}
          <div style={styles.inputGroup}>
            <label>Doctor Name</label>
            <input
              type="text"
              placeholder="Dr. Sharma"
              required
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          {/* Date + Time */}
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label>Appointment Date</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label>Appointment Time</label>
              <input
                type="time"
                required
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>
          </div>

          {/* Reason */}
          <div style={styles.inputGroup}>
            <label>Reason / Symptoms</label>
            <textarea
              placeholder="Describe the problem..."
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button style={styles.button} disabled={loading}>
            {loading ? "Booking..." : "Confirm Appointment"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#f4f7fb",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "12px",
    width: "420px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },
  title: { marginBottom: "5px" },
  subtitle: { color: "gray", marginBottom: "25px" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "flex", gap: "15px" },
  button: {
    marginTop: "10px",
    padding: "12px",
    background: "#2b7cff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
};