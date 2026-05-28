import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState({
    doctor_name: "",
    specialization: "",
    phone: "",
    availability: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  async function fetchDoctor() {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setDoctor(data);
  }

  async function updateDoctor(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("doctors")
      .update({
        doctor_name: doctor.doctor_name,
        specialization: doctor.specialization,
        phone: doctor.phone,
        availability: doctor.availability,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Doctor updated successfully!");
    navigate("/doctors");
  }

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Edit Doctor</h2>

      <form onSubmit={updateDoctor}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Doctor Name</label>
          <input
            value={doctor.doctor_name}
            onChange={(e) => setDoctor({ ...doctor, doctor_name: e.target.value })}
            placeholder="Doctor Name"
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Specialization</label>
          <input
            value={doctor.specialization}
            onChange={(e) => setDoctor({ ...doctor, specialization: e.target.value })}
            placeholder="Specialization"
            required
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Phone</label>
          <input
            value={doctor.phone}
            onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
            placeholder="Phone"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Availability</label>
          <select
            value={doctor.availability}
            onChange={(e) => setDoctor({ ...doctor, availability: e.target.value })}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          >
            <option value="">Select</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Update Doctor"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/doctors")}
            style={{ background: "none", border: "1px solid #ccc", padding: "8px 16px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}