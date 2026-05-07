import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Appointments() {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const patientId = searchParams.get("patient");

  const [department, setDepartment] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  // Safety check
  if (!patientId) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>No Patient Selected</h1>

        <p>
          Please go to Patients List and select a patient first.
        </p>

        <button onClick={() => navigate("/patients")}>
          Go to Patients
        </button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("appointments")
      .insert([
        {
          patient_id: patientId,
          department,
          doctor_name: doctorName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: "Booked",
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Appointment booked successfully!");

    navigate(`/patient/${patientId}`);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Book Appointment</h1>

      <form onSubmit={handleSubmit}>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
        >
          <option value="">Select Department</option>

          <option value="General Medicine">
            General Medicine
          </option>

          <option value="Pediatrics">
            Pediatrics
          </option>

          <option value="Women Health">
            Women Health
          </option>

          <option value="Cardiology">
            Cardiology
          </option>

        </select>

        <br /><br />

        <input
          type="text"
          placeholder="Doctor Name"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="date"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="time"
          value={appointmentTime}
          onChange={(e) => setAppointmentTime(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit">
          Book Appointment
        </button>

      </form>
    </div>
  );
}