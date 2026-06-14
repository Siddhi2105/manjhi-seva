import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" },
        () => fetchAlerts()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchAlerts() {
    const { data, error } = await supabase
      .from("alerts")
      .select("*, patients(full_name, village, age)")
      .order("created_at", { ascending: false });

    if (error) { console.error(error); }
    else { setAlerts(data); }
    setLoading(false);
  }

  async function markRead(id) {
    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
  }

  async function markAllRead() {
    await supabase.from("alerts").update({ is_read: true }).eq("is_read", false);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }

  const severityStyles = {
    Low:       "bg-green-50 text-green-700 border-green-200",
    Medium:    "bg-yellow-50 text-yellow-700 border-yellow-200",
    High:      "bg-orange-50 text-orange-700 border-orange-200",
    Emergency: "bg-red-50 text-red-700 border-red-200",
  };

  const severityDot = {
    Low:       "bg-green-500",
    Medium:    "bg-yellow-500",
    High:      "bg-orange-500",
    Emergency: "bg-red-500",
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm animate-pulse">Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Risk Alerts</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
              {/* Live indicator */}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-600 font-semibold">Live</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Patients flagged by Agent 6 for deteriorating vitals.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Alerts list */}
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
            <p className="text-slate-400 text-sm">No alerts yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Agent 6 will flag patients here when vitals show a deteriorating trend.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border shadow-sm p-5 transition-opacity ${
                  alert.is_read ? "opacity-60" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Severity dot */}
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${severityDot[alert.severity] || "bg-slate-400"}`} />

                    <div className="flex-1">
                      {/* Patient + severity */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {alert.patients?.full_name || "Unknown Patient"}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityStyles[alert.severity] || "bg-slate-100 text-slate-600"}`}>
                          {alert.severity}
                        </span>
                        {!alert.is_read && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
                            New
                          </span>
                        )}
                      </div>

                      {/* Patient meta */}
                      <p className="text-xs text-slate-400 mb-2">
                        {alert.patients?.age} yrs · {alert.patients?.village || "N/A"} ·{" "}
                        {new Date(alert.created_at).toLocaleString()}
                      </p>

                      {/* Alert message */}
                      <p className="text-sm text-slate-700">{alert.message}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/patient/${alert.patient_id}`)}
                      className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md transition-colors cursor-pointer"
                    >
                      View Patient
                    </button>
                    {!alert.is_read && (
                      <button
                        onClick={() => markRead(alert.id)}
                        className="px-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}