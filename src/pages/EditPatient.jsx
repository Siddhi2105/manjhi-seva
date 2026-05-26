import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState({
    full_name: "",
    age: "",
    gender: "",
    phone: "",
    village: "",
    symptoms: "",
  });

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

  async function updatePatient(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("patients")
      .update(patient)
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Patient updated successfully!");
    navigate(`/patient/${id}`);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Edit Patient</h1>

      <form onSubmit={updatePatient}>
        <input
          value={patient.full_name}
          onChange={(e) => setPatient({ ...patient, full_name: e.target.value })}
          placeholder="Full Name"
        /><br /><br />

        <input
          value={patient.age}
          onChange={(e) => setPatient({ ...patient, age: e.target.value })}
          placeholder="Age"
        /><br /><br />

        <input
          value={patient.gender}
          onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
          placeholder="Gender"
        /><br /><br />

        <input
          value={patient.phone}
          onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
          placeholder="Phone"
        /><br /><br />

        <input
          value={patient.village}
          onChange={(e) => setPatient({ ...patient, village: e.target.value })}
          placeholder="Village"
        /><br /><br />

        <textarea
          value={patient.symptoms}
          onChange={(e) => setPatient({ ...patient, symptoms: e.target.value })}
          placeholder="Symptoms"
        /><br /><br />

        <button type="submit">Update Patient</button>
      </form>
    </div>
  );
}