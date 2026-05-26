import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function PatientDetails() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Fetch Patient
  async function fetchPatient() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return alert(error.message);
    setPatient(data);
  }

  // Fetch Health Records
  async function fetchHealthRecords() {
    const { data, error } = await supabase
      .from("health_records")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);
    setHealthRecords(data);
  }

  // Fetch Appointments
  async function fetchAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", id)
      .order("appointment_date", { ascending: false });

    if (error) return alert(error.message);
    setAppointments(data);
  }

  useEffect(() => {
    fetchPatient();
    fetchHealthRecords();
    fetchAppointments();
  }, []);

  if (!patient) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading patient...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Patient Details</h1>

      {/* Patient Card */}
      <div
        style={{
          border: "1px solid gray",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "500px",
        }}
      >
        <h2>{patient.full_name}</h2>
        <p><strong>Age:</strong> {patient.age}</p>
        <p><strong>Gender:</strong> {patient.gender}</p>
        <p><strong>Phone:</strong> {patient.phone}</p>
        <p><strong>Village:</strong> {patient.village}</p>
        <p><strong>Symptoms:</strong> {patient.symptoms}</p>
        <p><strong>Patient ID:</strong> {patient.id}</p>
      </div>

      <br />

      {/* ACTION BUTTONS */}
      <Link to={`/add-health-record?patient=${patient.id}`}>
        <button>Add Health Record</button>
      </Link>

      <br /><br />

      <Link to={`/book-appointment?patient=${patient.id}`}>
        <button>Book Appointment</button>
      </Link>

      <br /><br />

      <Link to={`/symptom-checker?patient=${patient.id}`}>
        <button>AI Symptom Checker</button>
      </Link>

      <br /><br />

      {/* HEALTH RECORDS */}
      <h2>Health Records</h2>

      {healthRecords.length === 0 ? (
        <p>No health records added yet.</p>
      ) : (
        healthRecords.map((record) => (
          <div
            key={record.id}
            style={{
              border:
                record.risk_level === "Emergency"
                  ? "2px solid red"
                  : record.risk_level === "High"
                  ? "2px solid orange"
                  : record.risk_level === "Medium"
                  ? "2px solid gold"
                  : "2px solid green",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "10px",
              maxWidth: "500px",
            }}
          >
            <p><strong>Temperature:</strong> {record.temperature}</p>
            <p><strong>BP:</strong> {record.bp}</p>
            <p><strong>Sugar:</strong> {record.sugar}</p>
            <p><strong>SpO2:</strong> {record.spo2}</p>
            <p><strong>Pulse:</strong> {record.pulse}</p>
            <p><strong>Risk Level:</strong> {record.risk_level}</p>
            <p><strong>Notes:</strong> {record.notes}</p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(record.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}

      <br />

      {/* APPOINTMENTS */}
      <h2>Appointments</h2>

      {appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment.id}
            style={{
              border: "1px solid #999",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "10px",
              maxWidth: "500px",
            }}
          >
            <p><strong>Department:</strong> {appointment.department}</p>
            <p><strong>Doctor:</strong> {appointment.doctor_name}</p>
            <p><strong>Date:</strong> {appointment.appointment_date}</p>
            <p><strong>Time:</strong> {appointment.appointment_time}</p>
            <p><strong>Status:</strong> {appointment.status}</p>
          </div>
        ))
      )}
    </div>
  );
}