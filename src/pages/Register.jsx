import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function signUp(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return alert(error.message);

    alert("Account created! Please login.");
    navigate("/login");
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Doctor Register</h1>

      <form onSubmit={signUp}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br /><br />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br /><br />

        <button>Sign Up</button>
      </form>

      <br />
      <Link to="/login">Already have account? Login</Link>
    </div>
  );
}