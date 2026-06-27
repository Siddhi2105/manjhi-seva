# 🏥 Manjhi Seva- AI Powered Rural Healthcare ERP

> Bridging the healthcare gap in rural India through intelligent hospital management.

**Live Demo:** [manjhi-seva-y1wu.vercel.app](https://manjhi-seva-y1wu.vercel.app/)

---

## About

Manjhi Seva is a full-stack Healthcare ERP system designed for rural Indian hospitals that lack access to modern digital infrastructure. It combines real-time hospital management with AI-powered clinical tools — built to work with low-resource staff and multilingual patients in mind.

The platform supports five distinct roles with tailored portals, real-time data sync, AI-assisted triage, and automated PDF report generation.

---

## Features

### Role-Based Access Control (5 Roles)
- **Admin** — Full system control, staff and doctor management
- **Doctor** — Patient records, appointments, discharge summaries, AI medical summaries
- **Staff/Nurse** — Patient intake, health record entry, alerts
- **Patient** — View own records, appointments, symptom checker
- **Receptionist** — Appointment booking, patient registration

### AI Capabilities
- **AI Appointment Router** — Triages patients and routes them to the correct department using Groq LLaMA-3.3-70b
- **AI Symptom Checker** — Analyzes symptoms and returns structured risk level, department, possible conditions, and clinical notes
- **AI Medical Summary Generator** — Auto-generates discharge summaries from health records

### Core Modules
- Patient registration and profile management
- Doctor and staff management
- Appointment booking and editing
- Health records with risk level tagging
- Discharge summary generation
- Real-time alerts and notifications
- PDF report export for patient records
- Pipeline monitoring dashboard

### Technical Highlights
- Real-time data sync via Supabase WebSocket subscriptions
- Row-Level Security (RLS) for data isolation per role
- Secure document storage via Supabase Storage
- Progressive Web App (PWA) support — installable on mobile
- PDF generation with jsPDF

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS v4 |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| AI | Groq API — LLaMA-3.3-70b-versatile |
| PDF | jsPDF |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js v18+
- A Supabase project
- A Groq API key

### Installation

```bash
git clone https://github.com/Siddhi2105/manjhi-seva.git
cd manjhi-seva
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### Run Locally

```bash
npm run dev
```

---

## Project Structure

```
src/
├── components/        # Navbar, shared UI
├── pages/             # All route-level pages
│   ├── AdminPanel.jsx
│   ├── DoctorPortal.jsx
│   ├── PatientPortal.jsx
│   ├── AppointmentRouter.jsx
│   ├── SymptomChecker.jsx
│   └── ...
├── utils/
│   └── generatePatientPDF.js
├── App.jsx
├── main.jsx
└── supabaseClient.js
```

---

## Contributors

| Name | GitHub |
|---|---|
| Siddhi Chordia | [@Siddhi2105](https://github.com/Siddhi2105) |
| Sumit Kumar Panja | [@ArtsWallah](https://github.com/ArtsWallah) |

---

## License

This project is open source and available under the [MIT License](LICENSE).
