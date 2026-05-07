import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Step 2: Insert profile data
    const user = data.user;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          full_name: fullName,
          phone,
          village,
          role,
        },
      ]);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    alert("Signup successful!");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Signup</h1>

      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="patient">Patient</option>
          <option value="sevak">Sevak</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>

        <br /><br />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          Signup
        </button>
      </form>
    </div>
  );
}