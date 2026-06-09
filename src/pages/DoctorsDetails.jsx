import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => { fetchDoctor(); fetchAppointments(); }, [id]);

  async function fetchDoctor() {
    const { data, error } = await supabase
      .from("doctors").select("*").eq("id", id).single();
    if (error) { alert(error.message); return; }
    setDoctor(data);
  }

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select(`id, department, appointment_date, appointment_time, reason, status, patients ( full_name )`)
      .eq("doctor_id", id)
      .order("appointment_date", { ascending: false });
    if (error) { alert(error.message); return; }
    setAppointments(data);
  }

  const statusBadge = (status) => {
    const map = {
      Booked:    "bg-blue-50 text-blue-600",
      Completed: "bg-green-50 text-green-700",
      Pending:   "bg-yellow-50 text-yellow-700",
      Cancelled: "bg-red-50 text-red-600",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  const availabilityBadge = (status) => {
    const map = {
      Available:   "bg-green-50 text-green-700",
      Unavailable: "bg-red-50 text-red-600",
      "On Leave":  "bg-yellow-50 text-yellow-700",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading doctor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate("/doctors")}
          className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Back to Doctors
        </button>

        {/* Doctor card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{doctor.doctor_name}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{doctor.specialization}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${availabilityBadge(doctor.availability)}`}>
              {doctor.availability}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Phone:</span> {doctor.phone}
          </div>
        </div>

        {/* Appointments */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Appointments</h2>
          <span className="text-xs text-slate-400">{appointments.length} total</span>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 text-sm">
            No appointments found for this doctor.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-slate-800 text-sm">
                    {a.patients?.full_name || "Unknown Patient"}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(a.status)}`}>
                    {a.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span><span className="font-medium text-slate-600">Dept:</span> {a.department}</span>
                  <span><span className="font-medium text-slate-600">Date:</span> {a.appointment_date}</span>
                  <span><span className="font-medium text-slate-600">Time:</span> {a.appointment_time}</span>
                  <span><span className="font-medium text-slate-600">Reason:</span> {a.reason}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}