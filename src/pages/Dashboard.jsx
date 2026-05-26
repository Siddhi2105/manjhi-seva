import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard() {

  const navigate = useNavigate();

  const [totalPatients, setTotalPatients] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {

    // patients count
    const { data: patients } = await supabase
      .from("patients")
      .select("*");

    // appointments count
    const { data: appointments } = await supabase
      .from("appointments")
      .select("*");

    setTotalPatients(patients?.length || 0);
    setTotalAppointments(appointments?.length || 0);

    // completed appointments
    const completed = appointments?.filter(
      (a) => a.status === "Completed"
    );

    setCompletedAppointments(completed?.length || 0);

    // pending appointments
    const pending = appointments?.filter(
      (a) => a.status === "Pending"
    );

    setPendingAppointments(pending?.length || 0);
  }

  async function handleLogout() {

    await supabase.auth.signOut();

    alert("Logged out!");

    navigate("/");
  }

  return (
    <div style={{ padding: "30px" }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>🏥 Manjhi Seva Dashboard</h1>

        <button onClick={handleLogout} style={logoutBtn}>
          Logout
        </button>
      </div>

      <p>Hospital Management System</p>

      <br />

      {/* ANALYTICS CARDS */}

      <div style={cardContainer}>

        <div style={card}>
          <h2>{totalPatients}</h2>
          <p>Total Patients</p>
        </div>

        <div style={card}>
          <h2>{totalAppointments}</h2>
          <p>Total Appointments</p>
        </div>

        <div
          style={{
            ...card,
            backgroundColor: "#d1e7dd",
          }}
        >
          <h2>{completedAppointments}</h2>
          <p>Completed</p>
        </div>

        <div
          style={{
            ...card,
            backgroundColor: "#ffe69c",
          }}
        >
          <h2>{pendingAppointments}</h2>
          <p>Pending</p>
        </div>

      </div>

      <br /><br />

      {/* NAVIGATION BUTTONS */}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

        <Link to="/patients">
          <button style={btn}>Patients</button>
        </Link>

        <Link to="/add-patient">
          <button style={btn}>Add Patient</button>
        </Link>

        <Link to="/appointments">
          <button style={btn}>Appointments</button>
        </Link>

        <Link to="/symptom-checker">
          <button style={btn}>AI Symptom Checker</button>
        </Link>

      </div>
    </div>
  );
}

/* STYLES */

const btn = {
  padding: "20px",
  fontSize: "18px",
  cursor: "pointer",
};

const logoutBtn = {
  padding: "10px 16px",
  backgroundColor: "red",
  color: "white",
  border: "none",
  cursor: "pointer",
};

const cardContainer = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
};

const card = {
  backgroundColor: "#eee",
  padding: "25px",
  borderRadius: "10px",
  minWidth: "220px",
};