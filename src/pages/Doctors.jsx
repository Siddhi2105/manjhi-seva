import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Doctors() {

  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // FETCH DOCTORS
  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {

    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setDoctors(data);
  }

  // DELETE DOCTOR
  async function deleteDoctor(id) {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this doctor?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Doctor deleted successfully!");
    fetchDoctors();
  }

  // SEARCH FILTER
  const filteredDoctors = doctors.filter((doctor) =>
    doctor.doctor_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "30px" }}>

      <h1>Doctors List</h1>

      <br />

      {/* ADD DOCTOR BUTTON */}
      <Link to="/add-doctor">
        <button style={addBtn}>
          + Add New Doctor
        </button>
      </Link>

      <br /><br />

      {/* SEARCH BOX */}
      <input
        type="text"
        placeholder="Search doctor..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={searchBox}
      />

      <br /><br />

      {/* TABLE */}
      <table style={table}>

        <thead>
          <tr style={{ backgroundColor: "#eee" }}>
            <th style={th}>Doctor Name</th>
            <th style={th}>Specialization</th>
            <th style={th}>Phone</th>
            <th style={th}>Availability</th>
            <th style={th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredDoctors.length === 0 ? (

            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                No doctors found
              </td>
            </tr>

          ) : (

            filteredDoctors.map((doctor) => (
              <tr key={doctor.id}>

                <td style={td}>{doctor.doctor_name}</td>
                <td style={td}>{doctor.specialization}</td>
                <td style={td}>{doctor.phone}</td>
                <td style={td}>{doctor.availability}</td>

                {/* ACTION BUTTONS */}
                <td style={td}>

                  {/* VIEW BUTTON */}
                  <Link to={`/doctor/${doctor.id}`}>
                    <button style={viewBtn}>View</button>
                  </Link>

                  {" "}

                  {/* EDIT BUTTON */}
                  <button
                    style={editBtn}
                    onClick={() => navigate(`/doctors/edit/${doctor.id}`)}
                  >
                    Edit
                  </button>

                  {" "}

                  {/* DELETE BUTTON */}
                  <button
                    style={deleteBtn}
                    onClick={() => deleteDoctor(doctor.id)}
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

// STYLES

const searchBox = {
  padding: "10px",
  width: "300px",
  fontSize: "16px",
};

const addBtn = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
};

const viewBtn = {
  padding: "6px 12px",
  cursor: "pointer",
  backgroundColor: "#2b7cff",
  color: "white",
  border: "none",
};

const editBtn = {
  padding: "6px 12px",
  cursor: "pointer",
  backgroundColor: "#f59e0b",
  color: "white",
  border: "none",
};

const deleteBtn = {
  padding: "6px 12px",
  cursor: "pointer",
  backgroundColor: "red",
  color: "white",
  border: "none",
};

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