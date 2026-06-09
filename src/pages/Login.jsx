import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Logo / Brand ── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Manjhi Seva</h1>
          <p className="text-slate-500 mt-2 text-sm">
            AI-Powered Hospital Management System
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign in to access the hospital dashboard.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New user?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Manjhi Seva — Empowering Rural Healthcare
        </p>

      </div>
    </div>
  );
}