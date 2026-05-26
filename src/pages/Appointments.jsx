import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Appointments() {

  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // runs automatically when page opens
  useEffect(() => {
    fetchAppointments();
  }, []);

  // fetch all appointments from supabase
  async function fetchAppointments() {

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setAppointments(data);
  }

  // delete appointment
  async function deleteAppointment(id) {

    const confirmDelete = window.confirm(
      "Delete this appointment?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Appointment deleted");

    fetchAppointments();
  }

  // update appointment status
  async function updateStatus(id, newStatus) {

    const { error } = await supabase
      .from("appointments")
      .update({
        status: newStatus,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchAppointments();
  }

  // search filter
  const filteredAppointments = appointments.filter((appointment) =>
    appointment.doctor_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "30px" }}>

      <h1>📅 Appointments Dashboard</h1>

      <br />

      <input
        type="text"
        placeholder="Search by doctor name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: "10px",
          width: "300px",
        }}
      />

      <br /><br />

      <table style={table}>

        <thead>
          <tr style={{ backgroundColor: "#eee" }}>
            <th style={th}>Department</th>
            <th style={th}>Doctor</th>
            <th style={th}>Date</th>
            <th style={th}>Time</th>
            <th style={th}>Reason</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredAppointments.length === 0 ? (

            <tr>
              <td
                colSpan="7"
                style={{
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No appointments found
              </td>
            </tr>

          ) : (

            filteredAppointments.map((appointment) => (

              <tr key={appointment.id}>

                <td style={td}>
                  {appointment.department}
                </td>

                <td style={td}>
                  {appointment.doctor_name}
                </td>

                <td style={td}>
                  {appointment.appointment_date}
                </td>

                <td style={td}>
                  {appointment.appointment_time}
                </td>

                <td style={td}>
                  {appointment.reason}
                </td>

                <td
  style={{
    ...td,

   backgroundColor:
  appointment.status === "Pending"
    ? "#ffe69c"
    : appointment.status === "Approved"
    ? "#cfe2ff"
    : appointment.status === "Completed"
    ? "#d1e7dd"
    : appointment.status === "Cancelled"
    ? "#f8d7da"
    : "white",

    color:
  appointment.status === "Pending"
    ? "#7a4b00"
    : appointment.status === "Approved"
    ? "#084298"
    : appointment.status === "Completed"
    ? "#0f5132"
    : appointment.status === "Cancelled"
    ? "#842029"
    : "black",
  }}
>

  <select
    value={appointment.status}
    onChange={(e) =>
      updateStatus(
        appointment.id,
        e.target.value
      )
    }
  >
    <option>Pending</option>
    <option>Approved</option>
    <option>Completed</option>
    <option>Cancelled</option>
  </select>

</td>

                <td style={td}>

                  <button
                    style={deleteBtn}
                    onClick={() =>
                      deleteAppointment(appointment.id)
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))
          )}

        </tbody>
      </table>
    </div>
  );
}

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  border: "1px solid #ccc",
  padding: "12px",
};

const td = {
  border: "1px solid #ccc",
  padding: "10px",
};

const deleteBtn = {
  backgroundColor: "red",
  color: "white",
  border: "none",
  padding: "8px 12px",
  cursor: "pointer",
};