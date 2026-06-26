import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function generatePatientPDF(patient, healthRecords, appointments, uploads) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(30, 41, 59); // dark navy
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Manjhi Seva", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Hospital Management System", 14, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);

  y = 55;

  // ── Patient Info ─────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 14, y);
  y += 6;

  doc.setDrawColor(30, 41, 59);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  const patientInfo = [
    ["Full Name", patient.full_name || "—"],
    ["Age", patient.age ? `${patient.age} years` : "—"],
    ["Gender", patient.gender || "—"],
    ["Phone", patient.phone || "—"],
    ["Village", patient.village || "—"],
    ["Reported Symptoms", patient.symptoms || "None"],
  ];

  autoTable(doc, {
    startY: y,
    body: patientInfo,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60, textColor: [71, 85, 105] },
      1: { textColor: [30, 41, 59] },
    },
  });

  y = doc.lastAutoTable.finalY + 14;

  // ── Health Records ────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Health Records", 14, y);
  y += 6;

  doc.line(14, y, pageWidth - 14, y);
  y += 4;

  if (healthRecords.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("No health records found.", 14, y + 6);
    y += 16;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Date", "Temp", "BP", "Sugar", "SpO2", "Pulse", "Risk", "Notes"]],
      body: healthRecords.map((r) => [
        new Date(r.created_at).toLocaleDateString(),
        r.temperature || "—",
        r.bp || "—",
        r.sugar || "—",
        r.spo2 || "—",
        r.pulse || "—",
        r.risk_level || "—",
        r.notes
          ? r.notes.length > 40
            ? r.notes.substring(0, 40) + "..."
            : r.notes
          : "—",
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // ── Appointments ──────────────────────────────────────
  // Check if we need a new page
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Appointments", 14, y);
  y += 6;

  doc.line(14, y, pageWidth - 14, y);
  y += 4;

  if (appointments.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("No appointments found.", 14, y + 6);
    y += 16;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Date", "Time", "Department", "Doctor", "Status", "Reason"]],
      body: appointments.map((a) => [
        a.appointment_date || "—",
        a.appointment_time || "—",
        a.department || "—",
        a.doctors?.doctor_name || "—",
        a.status || "—",
        a.reason
          ? a.reason.length > 30
            ? a.reason.substring(0, 30) + "..."
            : a.reason
          : "—",
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // ── Uploaded Documents ────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Uploaded Documents", 14, y);
  y += 6;

  doc.line(14, y, pageWidth - 14, y);
  y += 4;

  if (!uploads || uploads.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("No documents uploaded.", 14, y + 6);
    y += 16;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["File Name", "Type", "Notes", "Uploaded On"]],
      body: uploads.map((f) => [
        f.file_name || "—",
        f.file_type || "—",
        f.notes || "—",
        new Date(f.created_at).toLocaleDateString(),
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // ── Footer ────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Manjhi Seva — Confidential Medical Record — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // ── Save ──────────────────────────────────────────────
  doc.save(`${patient.full_name}_medical_report_${new Date().toISOString().split("T")[0]}.pdf`);
}