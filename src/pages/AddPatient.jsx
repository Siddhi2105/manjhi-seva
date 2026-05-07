import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddPatient() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [symptoms, setSymptoms] = useState("");

async function handleSubmit(e) {
  e.preventDefault();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

if (userError || !user) {
  alert("Please login first");
  navigate("/");
  return;
}

  console.log("Logged in user:", user.id);

  const { data, error } = await supabase
    .from("patients")
    .insert([
      {
        full_name: fullName,
        age: Number(age),
        gender,
        phone,
        village,
        symptoms,
        created_by: user.id,
      },
    ])
    .select();

  if (error) {
    console.error("Insert error:", error);
    alert(error.message);
    return;
  }

  console.log("Inserted patient:", data);
  alert("Patient added successfully!");
  navigate("/patients");
}

  return (
    <div style={{ padding: "20px" }}>
      <h1>Add Patient</h1>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <br /><br />

        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <br /><br />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <br /><br />

        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <br /><br />

        <input
          type="text"
          placeholder="Village"
          value={village}
          onChange={(e) => setVillage(e.target.value)}
        />

        <br /><br />

        <textarea
          placeholder="Symptoms"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          Add Patient
        </button>

      </form>
    </div>
  );
}