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

  // delete patient from supabase
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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patient records, search quickly, and keep your care team organized.</p>
        </div>

        <Link to="/add-patient">
          <button type="button">+ Add New Patient</button>
        </Link>
      </div>

      <div className="form-group" style={{ marginTop: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search patient by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Village</th>
              <th>Action</th>
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
                  <td>{patient.full_name}</td>
                  <td>{patient.age}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.village}</td>

                  <td>
                    <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                      <Link to={`/patient/${patient.id}`}>
                        <button type="button">View</button>
                      </Link>
                      <Link to={`/edit-patient/${patient.id}`}>
                        <button type="button">Edit</button>
                      </Link>
                      <button type="button" className="danger" onClick={() => deletePatient(patient.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

