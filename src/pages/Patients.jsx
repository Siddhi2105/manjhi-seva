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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Patients List</h1>

      <br />

      <input
        type="text"
        placeholder="Search patient by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: "10px",
          width: "300px",
          marginBottom: "20px",
        }}
      />

      {patients.length === 0 ? (
        <p>No patients found</p>
      ) : (
        patients
          .filter((patient) =>
            patient.full_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
          .map((patient) => (
            <div
              key={patient.id}
              style={{
                border: "1px solid gray",
                padding: "15px",
                marginBottom: "10px",
                borderRadius: "10px",
              }}
            >
              <h3>{patient.full_name}</h3>

              <p>
                <strong>Age:</strong> {patient.age}
              </p>

              <p>
                <strong>Gender:</strong> {patient.gender}
              </p>

              <p>
                <strong>Village:</strong> {patient.village}
              </p>

              <p>
                <strong>Symptoms:</strong> {patient.symptoms}
              </p>

              <p>
                <strong>Phone:</strong> {patient.phone}
              </p>

              <br />

              <Link to={`/patient/${patient.id}`}>
                <button>View Details</button>
              </Link>
            </div>
          ))
      )}
    </div>
  );
}