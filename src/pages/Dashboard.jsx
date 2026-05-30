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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Dashboard</h1>
          <p className="page-subtitle">A clean view of your patient and appointment metrics.</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <strong>{totalPatients}</strong>
          <p>Total Patients</p>
        </div>

        <div className="card">
          <strong>{totalAppointments}</strong>
          <p>Total Appointments</p>
        </div>

        <div className="card success">
          <strong>{completedAppointments}</strong>
          <p>Completed</p>
        </div>

        <div className="card warning">
          <strong>{pendingAppointments}</strong>
          <p>Pending</p>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: "2rem" }}>
        <Link to="/doctors">
          <button type="button">Doctors</button>
        </Link>
        <Link to="/patients">
          <button type="button">Patients</button>
        </Link>
        <Link to="/add-patient">
          <button type="button">Add Patient</button>
        </Link>
        <Link to="/appointments">
          <button type="button">Appointments</button>
        </Link>
        <Link to="/symptom-checker">
          <button type="button">AI Symptom Checker</button>
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