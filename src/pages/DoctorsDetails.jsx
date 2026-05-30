import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function DoctorDetails() {

  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);

  // FETCH BOTH AT THE SAME TIME
  useEffect(() => {
    fetchDoctor();
    fetchAppointments();
  }, [id]);

  // FETCH DOCTOR DETAILS
  async function fetchDoctor() {

    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setDoctor(data);
  }

  // FETCH APPOINTMENTS BY doctor_id
  async function fetchAppointments() {

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        department,
        appointment_date,
        appointment_time,
        reason,
        status,
        patients ( full_name )
      `)
      .eq("doctor_id", id)
      .order("appointment_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setAppointments(data);
  }

  if (!doctor) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading doctor...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>

      <h1>Doctor Details</h1>

      {/* DOCTOR CARD */}
      <div style={card}>

        <h2>{doctor.doctor_name}</h2>

        <p>
          <strong>Specialization:</strong> {doctor.specialization}
        </p>

        <p>
          <strong>Phone:</strong> {doctor.phone}
        </p>

        <p>
          <strong>Availability:</strong> {doctor.availability}
        </p>

      </div>

      <br />

      <h2>Appointments</h2>
      <p style={{ color: "#6b7280", marginBottom: "12px" }}>
        {appointments.length} appointment(s) found
      </p>

      {appointments.length === 0 ? (

        <p>No appointments found.</p>

      ) : (

        appointments.map((appointment) => (

          <div key={appointment.id} style={appointmentCard}>

            <p>
              <strong>Patient:</strong>{" "}
              {appointment.patients?.full_name || "Unknown patient"}
            </p>

            <p>
              <strong>Department:</strong> {appointment.department}
            </p>

            <p>
              <strong>Date:</strong> {appointment.appointment_date}
            </p>

            <p>
              <strong>Time:</strong> {appointment.appointment_time}
            </p>

            <p>
              <strong>Reason:</strong> {appointment.reason}
            </p>

            <p>
              <strong>Status:</strong> {appointment.status}
            </p>

          </div>
        ))
      )}

    </div>
  );
}

const card = {
  border: "1px solid #ccc",
  padding: "20px",
  borderRadius: "10px",
  maxWidth: "500px",
};

const appointmentCard = {
  border: "1px solid #999",
  padding: "15px",
  marginBottom: "10px",
  borderRadius: "10px",
  maxWidth: "500px",
};