import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { alert(error.message); return; }
    setPatients(data);
  }

  async function deletePatient(id) {
    const confirmDelete = window.confirm("Delete this patient?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) { alert(error.message); return; }
    fetchPatients();
  }

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage patient records and keep your care team organized.
          </p>
        </div>
        <Link to="/add-patient">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            + Add New Patient
          </button>
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search patient by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Age</th>
              <th className="px-6 py-3">Gender</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Village</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400 text-sm">
                  No patients found
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">{patient.full_name}</td>
                  <td className="px-6 py-3 text-slate-600">{patient.age}</td>
                  <td className="px-6 py-3 text-slate-600">{patient.gender}</td>
                  <td className="px-6 py-3 text-slate-600">{patient.phone}</td>
                  <td className="px-6 py-3 text-slate-600">{patient.village}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <Link to={`/patient/${patient.id}`}>
                        <button className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition-colors cursor-pointer">
                          View
                        </button>
                      </Link>
                      <Link to={`/edit-patient/${patient.id}`}>
                        <button className="px-3 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium rounded-md transition-colors cursor-pointer">
                          Edit
                        </button>
                      </Link>
                      <button
                        onClick={() => deletePatient(patient.id)}
                        className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Count ── */}
      <p className="text-xs text-slate-400 mt-3">
        Showing {filteredPatients.length} of {patients.length} patients
      </p>

    </div>
  );
}