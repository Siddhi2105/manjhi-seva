import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function PatientDetails() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);

  useEffect(() => {
    fetchPatient();
  }, []);

  async function fetchPatient() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setPatient(data);
  }

  if (!patient) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading patient...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Patient Details</h1>

      <div
        style={{
          border: "1px solid gray",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "500px",
        }}
      >
        <h2>{patient.full_name}</h2>

        <p>
          <strong>Age:</strong> {patient.age}
        </p>

        <p>
          <strong>Gender:</strong> {patient.gender}
        </p>

        <p>
          <strong>Phone:</strong> {patient.phone}
        </p>

        <p>
          <strong>Village:</strong> {patient.village}
        </p>

        <p>
          <strong>Symptoms:</strong> {patient.symptoms}
        </p>

        <p>
          <strong>Patient ID:</strong> {patient.id}
        </p>
      </div>
      <br />

<Link to={`/add-health-record?patient=${patient.id}`}>
  <button>Add Health Record</button>
</Link>
    </div>
  );
}