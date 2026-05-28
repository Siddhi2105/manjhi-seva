import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function BookAppointment() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    patient_id: "",
    department: "",
    doctor_id: "",       // ← was doctor_name, now doctor_id
    appointment_date: "",
    appointment_time: "",
    reason: "",
    status: "Booked",
  });

  // Dropdown data
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch doctors and patients when page loads
  useEffect(() => {
    fetchDoctors();
    fetchPatients();
  }, []);

  async function fetchDoctors() {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, doctor_name, specialization")
      .order("doctor_name");

    if (error) {
      console.error("Error fetching doctors:", error);
    } else {
      setDoctors(data);
    }
  }

  async function fetchPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name")
      .order("full_name");

    if (error) {
      console.error("Error fetching patients:", error);
    } else {
      setPatients(data);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("appointments")
      .insert([form]);   // form now contains doctor_id, not doctor_name

    setLoading(false);

    if (error) {
      setMessage("Error booking appointment: " + error.message);
    } else {
      setMessage("Appointment booked successfully!");
      setTimeout(() => navigate("/appointments"), 1500);
    }
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Book Appointment</h2>

      {message && (
        <p style={{ color: message.includes("Error") ? "red" : "green" }}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>

        {/* Patient dropdown — also relational now */}
        <div style={{ marginBottom: "1rem" }}>
          <label>Patient</label>
          <select
            name="patient_id"
            value={form.patient_id}
            onChange={handleChange}
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

        {/* Doctor dropdown — now stores doctor_id */}
        <div style={{ marginBottom: "1rem" }}>
          <label>Doctor</label>
          <select
            name="doctor_id"
            value={form.doctor_id}
            onChange={handleChange}
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
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Date</label>
          <input
            type="date"
            name="appointment_date"
            value={form.appointment_date}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Time</label>
          <input
            type="time"
            name="appointment_time"
            value={form.appointment_time}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Reason</label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows={3}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}