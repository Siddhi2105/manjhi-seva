import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AppointmentsList() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            fetchAppointments();
          }
          if (payload.eventType === "DELETE") {
            setAppointments((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, appointment_date, appointment_time, department,
        reason, status, created_at,
        patients ( full_name ),
        doctors ( doctor_name, specialization )
      `)
      .order("appointment_date", { ascending: false });

    if (error) { console.error(error); }
    else { setAppointments(data); }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) alert(error.message);
  }

  const statusBadge = (status) => {
    const map = {
      Booked:    "bg-blue-50 text-blue-600",
      Pending:   "bg-yellow-50 text-yellow-700",
      Completed: "bg-green-50 text-green-700",
      Cancelled: "bg-red-50 text-red-600",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-semibold">Live</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-1">{appointments.length} appointment(s) found</p>
        </div>
        <Link to="/book-appointment">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            + Book Appointment
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="px-6 py-3">Patient</th>
              <th className="px-6 py-3">Doctor</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-slate-400 text-sm">
                  No appointments found
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {appt.patients?.full_name || "Unknown"}
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-slate-800 font-medium">{appt.doctors?.doctor_name || "Unknown"}</p>
                    <p className="text-xs text-slate-400">{appt.doctors?.specialization}</p>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{appt.department}</td>
                  <td className="px-6 py-3 text-slate-600">{appt.appointment_date}</td>
                  <td className="px-6 py-3 text-slate-600">{appt.appointment_time}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(appt.status)}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/appointments/edit/${appt.id}`)}
                        className="px-3 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(appt.id)}
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
    </div>
  );
}