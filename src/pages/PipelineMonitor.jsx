import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function PipelineMonitor() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("pipeline-monitor")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "pipeline_logs",
      }, () => fetchLogs())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchLogs() {
    const { data } = await supabase
      .from("pipeline_logs")
      .select("*, patients(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs(data || []);
    setLoading(false);
  }

  const agentColors = {
    "Agent 1 — Appointment Router":   "bg-blue-100 text-blue-700 border-blue-200",
    "Agent 3 — Discharge Summary":    "bg-purple-100 text-purple-700 border-purple-200",
    "Agent 4 — Follow-up Scheduler":  "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const statusColors = {
    completed: "bg-emerald-100 text-emerald-700",
    failed:    "bg-red-100 text-red-700",
    running:   "bg-amber-100 text-amber-700",
  };

  // Group logs by patient
  const grouped = logs.reduce((acc, log) => {
    const key = log.patient_id;
    if (!acc[key]) acc[key] = { patient_name: log.patients?.full_name, logs: [] };
    acc[key].logs.push(log);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">🤖 Pipeline Monitor</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Live view of all AI agent activity across patients.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
            Live
          </span>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm animate-pulse">Loading pipeline logs...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <p className="text-slate-500 text-sm">No pipeline activity yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Logs appear here when a patient signs up and agents run automatically.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([patientId, { patient_name, logs: patientLogs }]) => (
            <div key={patientId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Patient header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{patient_name || "Unknown Patient"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{patientLogs.length} agent{patientLogs.length !== 1 ? "s" : ""} ran</p>
                </div>
                <button
                  onClick={() => navigate(`/patient/${patientId}`)}
                  className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  View Patient →
                </button>
              </div>

              {/* Pipeline steps */}
              <div className="p-6 space-y-4">
                {patientLogs.map((log, i) => (
                  <div key={log.id} className="flex gap-4">

                    {/* Step line */}
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </div>
                      {i < patientLogs.length - 1 && (
                        <div className="w-0.5 bg-slate-200 flex-1 mt-1" />
                      )}
                    </div>

                    {/* Log content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${agentColors[log.agent] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {log.agent}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[log.status] || "bg-slate-100 text-slate-600"}`}>
                          {log.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Input */}
                      {log.input && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Input</p>
                          <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                            {JSON.stringify(log.input, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Output */}
                      {log.output && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Output</p>
                          <pre className="text-xs text-blue-800 whitespace-pre-wrap">
                            {JSON.stringify(log.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))
        )}

      </div>
    </div>
  );
}