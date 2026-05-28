import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Status color helper
function statusColor(status) {
  const colors = {
    Booked: "#2563eb",
    Pending: "#d97706",
    Completed: "#16a34a",
    Cancelled: "#dc2626",
  };
  return colors[status] || "#6b7280";
}

export default function AppointmentsList() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        department,
        reason,
        status,
        created_at,
        patients ( full_name ),
        doctors ( doctor_name, specialization )
      `)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
    } else {
      setAppointments(data);
    }

    setLoading(false);
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this appointment?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (!error) {
      setAppointments(appointments.filter((a) => a.id !== id));
    }
  }

  if (loading) return <p>Loading appointments...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Appointments</h2>
      <p style={{ color: "#6b7280" }}>{appointments.length} appointments found</p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Patient</th>
            <th style={{ padding: "8px" }}>Doctor</th>
            <th style={{ padding: "8px" }}>Department</th>
            <th style={{ padding: "8px" }}>Date</th>
            <th style={{ padding: "8px" }}>Time</th>
            <th style={{ padding: "8px" }}>Status</th>
            <th style={{ padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id} style={{ borderBottom: "1px solid #f3f4f6" }}>

              <td style={{ padding: "8px" }}>
                {appt.patients?.full_name || "Unknown patient"}
              </td>

              <td style={{ padding: "8px" }}>
                <div>{appt.doctors?.doctor_name || "Unknown doctor"}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {appt.doctors?.specialization}
                </div>
              </td>

              <td style={{ padding: "8px" }}>{appt.department}</td>
              <td style={{ padding: "8px" }}>{appt.appointment_date}</td>
              <td style={{ padding: "8px" }}>{appt.appointment_time}</td>

              <td style={{ padding: "8px" }}>
                <span style={{
                  background: statusColor(appt.status),
                  color: "white",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}>
                  {appt.status}
                </span>
              </td>

              {/* ACTIONS */}
              <td style={{ padding: "8px", display: "flex", gap: "8px" }}>

                {/* EDIT BUTTON */}
                <button
                  onClick={() => navigate(`/appointments/edit/${appt.id}`)}
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => handleDelete(appt.id)}
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}