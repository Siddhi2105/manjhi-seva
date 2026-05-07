import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setProfile(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      {profile && (
        <div>
          <h2>Welcome {profile.full_name}</h2>
          <p><strong>Role:</strong> {profile.role}</p>
          <p><strong>Village:</strong> {profile.village}</p>
          <p><strong>Phone:</strong> {profile.phone}</p>
        </div>
      )}

      <br />

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/add-patient")}>Add Patient</button>
        <button onClick={() => navigate("/patients")}>View Patients</button>
        <button onClick={() => navigate("/add-health-record")}>Add Health Record</button>
        <button onClick={() => navigate("/appointments")}>Appointments</button>
      </div>

      <br /><br />

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}