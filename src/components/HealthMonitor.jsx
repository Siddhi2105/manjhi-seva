import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function HealthMonitor() {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("HealthMonitor mounted — setting up realtime...");

    const channel = supabase
      .channel("health-monitor-v3")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "health_records" },
        (payload) => {
          console.log("🔴 NEW HEALTH RECORD:", payload.new);
          analyzeRecord(payload.new);
        }
      )
      .subscribe((status) => {
        console.log("HealthMonitor status:", status);
      });

    return () => supabase.removeChannel(channel);
  }, []);

  async function analyzeRecord(record) {
    console.log("🤖 Analyzing...");

    const prompt = `You are a medical monitoring AI at Manjhi Seva hospital. Analyze these vitals.

Vitals:
- Temperature: ${record.temperature || "N/A"}
- Blood Pressure: ${record.bp || "N/A"}
- Sugar: ${record.sugar || "N/A"}
- SpO2: ${record.spo2 || "N/A"}
- Pulse: ${record.pulse || "N/A"}
- Risk Level: ${record.risk_level || "N/A"}
- Notes: ${record.notes || "N/A"}

Only alert if vitals are genuinely dangerous. Do NOT alert for Low/normal vitals.

Respond ONLY in this exact JSON:
{
  "should_alert": true or false,
  "alert_level": "Medium" or "High" or "Emergency" or null,
  "reason": "what is abnormal",
  "recommended_action": "what staff should do"
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      if (data.error) { console.error("Groq error:", data.error); return; }

      const raw = data.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      console.log("🤖 Decision:", result);

      if (!result.should_alert) { console.log("✅ No alert needed."); return; }

      // Save alert to health_records row
      const { error: updateError } = await supabase
        .from("health_records")
        .update({
          alert_level: result.alert_level,
          alert_reason: result.reason,
          alert_action: result.recommended_action,
          alert_acknowledged: false,
        })
        .eq("id", record.id);

      console.log("Update error:", updateError);
      if (updateError) { console.error("❌ Update error:", updateError); return; }

      console.log("✅ Alert saved");

      // Show toast
      const alertId = Date.now();
      setAlerts(prev => [...prev, {
        id: alertId,
        alert_level: result.alert_level,
        reason: result.reason,
        recommended_action: result.recommended_action,
        patient_id: record.patient_id,
        record_id: record.id,
      }]);

      if (result.alert_level !== "Emergency") {
        setTimeout(() => dismissAlert(alertId), 12000);
      }

    } catch (err) {
      console.error("❌ HealthMonitor error:", err);
    }
  }

  function dismissAlert(id) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  const alertStyles = {
    Medium: {
      bar: "bg-amber-500",
      card: "bg-amber-50 border-amber-300",
      text: "text-amber-800",
      badge: "bg-amber-100 text-amber-700",
      icon: "⚠️",
    },
    High: {
      bar: "bg-orange-500",
      card: "bg-orange-50 border-orange-300",
      text: "text-orange-800",
      badge: "bg-orange-100 text-orange-700",
      icon: "🔶",
    },
    Emergency: {
      bar: "bg-red-600",
      card: "bg-red-50 border-red-400",
      text: "text-red-800",
      badge: "bg-red-100 text-red-700",
      icon: "🚨",
    },
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {alerts.map(alert => {
        const style = alertStyles[alert.alert_level] || alertStyles.Medium;
        return (
          <div
            key={alert.id}
            className={`rounded-xl border shadow-lg overflow-hidden pointer-events-auto ${style.card}`}
          >
            <div className={`h-1 w-full ${style.bar}`} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.icon}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {alert.alert_level} Alert
                  </span>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
              <p className={`text-sm font-medium ${style.text} mb-1`}>{alert.reason}</p>
              <p className="text-xs text-slate-600 mb-3">
                <strong>Action:</strong> {alert.recommended_action}
              </p>
              <button
                onClick={() => navigate(`/patient/${alert.patient_id}`)}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
              >
                View Patient →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}