import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddDoctor() {

  const navigate = useNavigate();

  const [doctorName, setDoctorName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [availability, setAvailability] = useState("");

  async function handleAddDoctor(e) {

    e.preventDefault();

    const { error } = await supabase
      .from("doctors")
      .insert([
        {
          doctor_name: doctorName,
          specialization,
          phone,
          availability,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Doctor added successfully!");

    navigate("/doctors");
  }

  return (
    <div style={{ padding: "30px" }}>

      <h1>Add Doctor</h1>

      <form
        onSubmit={handleAddDoctor}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          maxWidth: "400px",
        }}
      >

        <input
          type="text"
          placeholder="Doctor Name"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          required
          style={input}
        />

        <input
          type="text"
          placeholder="Specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          required
          style={input}
        />

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={input}
        />

        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          required
          style={input}
        >
          <option value="">Select Availability</option>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Full Day">Full Day</option>
        </select>

        <button type="submit" style={btn}>
          Add Doctor
        </button>

      </form>
    </div>
  );
}

const input = {
  padding: "12px",
  fontSize: "16px",
};

const btn = {
  padding: "12px",
  fontSize: "16px",
  cursor: "pointer",
};