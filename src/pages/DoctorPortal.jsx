import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function DoctorPortal() {
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [patientUploads, setPatientUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityMsg, setAvailabilityMsg] = useState("");
  const [activeTab, setActiveTab] = useState("appointments");

  useEffect(() => {
    loadDoctorPortal();
  }, []);

  async function loadDoctorPortal() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: doc } = await supabase
      .from("doctors")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!doc) { setLoading(false); return; }
    setDoctor(doc);

    const { data: appts } = await supabase
      .from("appointments")
      .select("*, patients(id, full_name, age, gender, phone, village)")
      .eq("doctor_id", doc.id)
      .order("appointment_date", { ascending: false });

    setAppointments(appts || []);

    // Unique patients from appointments
    const seen = new Set();
    const uniquePatients = [];
    (appts || []).forEach((a) => {
      if (a.patients && !seen.has(a.patients.id)) {
        seen.add(a.patients.id);
        uniquePatients.push(a.patients);
      }
    });
    setPatients(uniquePatients);
    setLoading(false);
  }

  async function loadPatientDetails(patient) {
    setSelectedPatient(patient);
    const [{ data: recs }, { data: files }] = await Promise.all([
      supabase.from("health_records").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
      supabase.from("patient_uploads").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
    ]);
    setPatientRecords(recs || []);
    setPatientUploads(files || []);
  }

  async function updateAvailability(status) {
    if (!doctor) return;
    const { error } = await supabase.from("doctors").update({ availability: status }).eq("id", doctor.id);
    if (error) { setAvailabilityMsg("Update failed: " + error.message); return; }
    setDoctor({ ...doctor, availability: status });
    setAvailabilityMsg("Availability updated.");
    setTimeout(() => setAvailabilityMsg(""), 2000);
  }

  async function viewFile(path) {
    const { data, error } = await supabase.storage.from("patient-documents").createSignedUrl(path, 60);
    if (error) { alert("Could not open file."); return; }
    window.open(data.signedUrl, "_blank");
  }

  const riskBorder = { Low: "border-l-emerald-500", Medium: "border-l-amber-500", High: "border-l-orange-500", Emergency: "border-l-red-500" };
  const riskBadge = { Low: "bg-emerald-50 text-emerald-700", Medium: "bg-amber-50 text-amber-700", High: "bg-orange-50 text-orange-700", Emergency: "bg-red-50 text-red-700" };
  const statusBadge = {
    Booked: "bg-blue-50 text-blue-700",
    Pending: "bg-amber-50 text-amber-700",
    Completed: "bg-emerald-50 text-emerald-700",
    Cancelled: "bg-red-50 text-red-700",
  };
  const availabilityColors = {
    Available: "bg-emerald-600 hover:bg-emerald-700",
    Unavailable: "bg-slate-500 hover:bg-slate-600",
    "On Leave": "bg-amber-500 hover:bg-amber-600",
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Loading your portal...</p>
    </div>
  );

  if (!doctor) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-700 font-medium">No doctor profile linked.</p>
        <p className="text-slate-500 text-sm mt-1">Contact admin to link your account.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Doctor Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dr. {doctor.doctor_name}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {doctor.specialization}
                {doctor.phone && ` · ${doctor.phone}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                doctor.availability === "Available" ? "bg-emerald-50 text-emerald-700" :
                doctor.availability === "On Leave" ? "bg-amber-50 text-amber-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {doctor.availability}
              </span>
              <div className="flex gap-2 flex-wrap justify-end">
                {["Available", "Unavailable", "On Leave"].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateAvailability(s)}
                    className={`px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer ${availabilityColors[s]}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {availabilityMsg && <p className="text-xs text-emerald-600">{availabilityMsg}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            ["Appointments", appointments.length],
            ["Patients", patients.length],
            ["Today", appointments.filter(a => a.appointment_date === new Date().toISOString().split("T")[0]).length],
          ].map(([label, val]) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-2xl font-bold text-slate-800">{val}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6">
          {["appointments", "patients"].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedPatient(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize cursor-pointer
                ${activeTab === tab ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No appointments assigned.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Patient", "Date", "Time", "Department", "Reason", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{a.patients?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{a.appointment_date}</td>
                      <td className="px-4 py-3 text-slate-600">{a.appointment_time}</td>
                      <td className="px-4 py-3 text-slate-600">{a.department}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{a.reason || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[a.status] || "bg-slate-100 text-slate-600"}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === "patients" && !selectedPatient && (
          <div className="space-y-3">
            {patients.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">No patients assigned.</div>
            ) : patients.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">{p.full_name}</p>
                  <p className="text-sm text-slate-500">{p.age && `${p.age} yrs`}{p.gender && ` · ${p.gender}`}{p.phone && ` · ${p.phone}`}</p>
                </div>
                <button
                  onClick={() => loadPatientDetails(p)}
                  className="px-4 py-1.5 text-sm bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  View Records
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Patient Detail View */}
        {activeTab === "patients" && selectedPatient && (
          <div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="mb-4 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              ← Back to patients
            </button>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
              <h2 className="text-lg font-bold text-slate-800">{selectedPatient.full_name}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedPatient.age && `${selectedPatient.age} yrs`}
                {selectedPatient.gender && ` · ${selectedPatient.gender}`}
                {selectedPatient.phone && ` · ${selectedPatient.phone}`}
                {selectedPatient.village && ` · ${selectedPatient.village}`}
              </p>
            </div>

            {/* Health Records */}
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Health Records</h3>
            <div className="space-y-3 mb-6">
              {patientRecords.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-sm">No health records.</div>
              ) : patientRecords.map((r) => (
                <div key={r.id} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${riskBorder[r.risk_level] || "border-l-slate-300"} shadow-sm p-4`}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${riskBadge[r.risk_level] || "bg-slate-100 text-slate-600"}`}>{r.risk_level}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[["BP", r.bp], ["Temp", r.temperature], ["Sugar", r.sugar], ["SpO2", r.spo2], ["Pulse", r.pulse]].map(([l, v]) => (
                      <div key={l}>
                        <p className="text-xs text-slate-400">{l}</p>
                        <p className="text-sm font-medium text-slate-700">{v || "—"}</p>
                      </div>
                    ))}
                  </div>
                  {r.notes && <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">{r.notes}</p>}
                </div>
              ))}
            </div>

            {/* Uploaded Documents */}
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {patientUploads.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-sm">No documents uploaded.</div>
              ) : patientUploads.map((f) => (
                <div key={f.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{f.file_name}</p>
                    <p className="text-xs text-slate-400">{new Date(f.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <button
                    onClick={() => viewFile(f.file_path)}
                    className="px-3 py-1.5 text-sm bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}