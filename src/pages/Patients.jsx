import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPatients(data);
  }

  // 🗑️ DELETE PATIENT FROM SUPABASE
  async function deletePatient(id) {
    const confirmDelete = window.confirm("Delete this patient?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Patient deleted");
    fetchPatients(); // refresh list
  }

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "30px" }}>
      <h1>👨‍⚕️ Patients List</h1>

      <br />

      <Link to="/add-patient">
        <button style={addBtn}>+ Add New Patient</button>
      </Link>

      <br /><br />

      <input
        type="text"
        placeholder="🔍 Search patient by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={searchBox}
      />

      <br /><br />

      <table style={table}>
        <thead>
          <tr style={{ backgroundColor: "#eee" }}>
            <th style={th}>Name</th>
            <th style={th}>Age</th>
            <th style={th}>Gender</th>
            <th style={th}>Phone</th>
            <th style={th}>Village</th>
            <th style={th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredPatients.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                No patients found
              </td>
            </tr>
          ) : (
            filteredPatients.map((patient) => (
              <tr key={patient.id}>
                <td style={td}>{patient.full_name}</td>
                <td style={td}>{patient.age}</td>
                <td style={td}>{patient.gender}</td>
                <td style={td}>{patient.phone}</td>
                <td style={td}>{patient.village}</td>

                <td style={td}>
                  <Link to={`/patient/${patient.id}`}>
                    <button style={viewBtn}>View</button>
                  </Link>

                  <Link to={`/edit-patient/${patient.id}`}>
                    <button style={editBtn}>Edit</button>
                  </Link>

                  <button
                    style={deleteBtn}
                    onClick={() => deletePatient(patient.id)}
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

/* 🎨 STYLES */

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
};

const editBtn = {
  padding: "6px 12px",
  marginLeft: "6px",
  cursor: "pointer",
};

const deleteBtn = {
  padding: "6px 12px",
  marginLeft: "6px",
  backgroundColor: "#ff4d4d",
  color: "white",
  border: "none",
  cursor: "pointer",
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