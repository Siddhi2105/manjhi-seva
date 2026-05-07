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
    // Get logged in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/");
      return;
    }

    // Fetch profile from profiles table
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

          <p>
            <strong>Role:</strong> {profile.role}
          </p>

          <p>
            <strong>Village:</strong> {profile.village}
          </p>

          <p>
            <strong>Phone:</strong> {profile.phone}
          </p>
        </div>
      )}

      <br />

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}