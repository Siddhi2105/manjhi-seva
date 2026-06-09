import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchDoctors(); }, []);

  async function fetchDoctors() {
    const { data, error } = await supabase
      .from("doctors").select("*").order("created_at", { ascending: false });
    if (error) { alert(error.message); return; }
    setDoctors(data);
  }

  async function deleteDoctor(id) {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    fetchDoctors();
  }

  const availabilityBadge = (status) => {
    const map = {
      Available: "bg-green-50 text-green-700",
      Unavailable: "bg-red-50 text-red-600",
      "On Leave": "bg-yellow-50 text-yellow-700",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  const filtered = doctors.filter((d) =>
    d.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
          <p className="text-slate-500 text-sm mt-1">{doctors.length} doctor(s) registered</p>
        </div>
        <Link to="/add-doctor">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            + Add Doctor
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by doctor name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-3">Doctor Name</th>
              <th className="px-6 py-3">Specialization</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Availability</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-slate-400 text-sm">
                  No doctors found
                </td>
              </tr>
            ) : (
              filtered.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">{doctor.doctor_name}</td>
                  <td className="px-6 py-3 text-slate-600">{doctor.specialization}</td>
                  <td className="px-6 py-3 text-slate-600">{doctor.phone}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${availabilityBadge(doctor.availability)}`}>
                      {doctor.availability}
                    </span>
                  </td>
                  <td className="px-6 py-3 flex gap-2">
                    <Link to={`/doctor/${doctor.id}`}>
                      <button className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition-colors cursor-pointer">
                        View
                      </button>
                    </Link>
                    <button
                      onClick={() => navigate(`/doctors/edit/${doctor.id}`)}
                      className="px-3 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteDoctor(doctor.id)}
                      className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}