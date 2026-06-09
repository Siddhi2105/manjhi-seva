import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);

    const safeRole = role === "admin" ? "receptionist" : role;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { alert(error.message); setLoading(false); return; }

    const user = data.user;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([{ id: user.id, full_name: fullName, phone, village, role: safeRole }]);

    if (profileError) { alert(profileError.message); setLoading(false); return; }

    if (safeRole === "patient") {
      const { error: patientError } = await supabase
        .from("patients")
        .insert([{ full_name: fullName, phone, village, age: parseInt(age), gender, user_id: user.id }]);
      if (patientError) { alert(patientError.message); setLoading(false); return; }
    }

    if (safeRole === "doctor") {
      const { data: doctorRow, error: findError } = await supabase
        .from("doctors").select("id").eq("phone", phone).single();
      if (findError || !doctorRow) {
        alert("No doctor record found with this phone number. Please ask admin to create your doctor profile first.");
        setLoading(false); return;
      }
      const { error: linkError } = await supabase
        .from("doctors").update({ user_id: user.id }).eq("id", doctorRow.id);
      if (linkError) { alert(linkError.message); setLoading(false); return; }
    }

    if (safeRole === "receptionist" || safeRole === "sevak") {
      const { data: staffRow, error: findError } = await supabase
        .from("staff").select("id").eq("phone", phone).eq("role", safeRole).single();
      if (findError || !staffRow) {
        alert(`No ${safeRole} record found with this phone number. Please ask admin to register you first.`);
        setLoading(false); return;
      }
      const { error: linkError } = await supabase
        .from("staff").update({ user_id: user.id }).eq("id", staffRow.id);
      if (linkError) { alert(linkError.message); setLoading(false); return; }
    }

    alert("Signup successful!");
    navigate("/");
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const selectClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Brand ── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Manjhi Seva</h1>
          <p className="text-slate-500 mt-2 text-sm">
            AI-Powered Hospital Management System
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Create your account</h2>
          <p className="text-slate-500 text-sm mb-6">
            Get started with Manjhi Seva in a few quick steps.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">

            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="text"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Village</label>
              <input
                type="text"
                placeholder="Village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={selectClass}
              >
                <option value="patient">Patient</option>
                <option value="sevak">Sevak</option>
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Age and gender only for patients */}
            {role === "patient" && (
              <>
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={selectClass}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Manjhi Seva — Empowering Rural Healthcare
        </p>

      </div>
    </div>
  );
}