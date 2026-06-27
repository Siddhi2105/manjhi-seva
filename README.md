# 🏥 Manjhi Seva

> **An AI-Powered Rural Healthcare ERP designed to digitize hospital operations and improve healthcare accessibility in underserved communities.**

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4?logo=tailwindcss\&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql\&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-AI-FF6B00)
![LLaMA](https://img.shields.io/badge/LLaMA%203.3-70B-blueviolet)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa\&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel\&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Live Demo:** https://manjhi-seva-y1wu.vercel.app/

---

## Overview

Manjhi Seva is a full-stack Healthcare ERP platform built to modernize hospital operations in rural and underserved communities. It combines hospital management workflows with AI-powered clinical assistance, enabling healthcare professionals to efficiently manage patients, appointments, electronic health records, and administrative operations through a unified web platform.

Designed with scalability, accessibility, and real-time collaboration in mind, the platform helps healthcare centers with limited digital infrastructure deliver more efficient and organized patient care.

---

## Key Features

### Multi-Role Access Control

Dedicated dashboards with secure role-based access for:

* Administrator
* Doctor
* Staff / Nurse
* Receptionist
* Patient

Each role has access only to the resources relevant to its responsibilities.

---

### AI-Powered Healthcare Assistance

#### AI Appointment Router

Automatically analyzes patient symptoms and routes appointments to the appropriate department using **Groq LLaMA-3.3-70B**.

#### AI Symptom Checker

Provides structured medical insights including:

* Risk Level
* Recommended Department
* Possible Medical Conditions
* Clinical Notes

#### AI Medical Summary Generator

Automatically generates discharge summaries and patient reports from recorded health data.

---

### Hospital Management Modules

* Patient Registration
* Appointment Scheduling
* Doctor & Staff Management
* Electronic Health Records (EHR)
* Medical Report Generation
* Discharge Summary Management
* Notification & Alert System
* Administrative Dashboard
* PDF Report Export

---

## Technical Highlights

* Role-Based Access Control (RBAC)
* Secure Authentication & Authorization
* Row-Level Security (RLS)
* Real-time Database Synchronization
* Progressive Web App (PWA)
* Secure File Storage
* AI-assisted Clinical Workflows
* PDF Report Generation
* Responsive Design for Desktop and Mobile

---

## System Architecture

```text
                     User
                       │
                       ▼
                React Frontend
                       │
                       ▼
                 Supabase Backend
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Authentication   PostgreSQL     Storage
        │              │              │
        └──────────────┼──────────────┘
                       │
                Realtime Updates
                       │
                       ▼
               AI Service (Groq)
                       │
                       ▼
 Appointment Routing • Symptom Analysis
      • Medical Summary Generation
```

---

## Technology Stack

| Category                    | Technologies                       |
| --------------------------- | ---------------------------------- |
| **Frontend**                | React.js, Vite                     |
| **Styling**                 | Tailwind CSS v4                    |
| **Backend**                 | Supabase                           |
| **Database**                | PostgreSQL                         |
| **Authentication**          | Supabase Auth                      |
| **Storage**                 | Supabase Storage                   |
| **Realtime**                | Supabase Realtime                  |
| **Artificial Intelligence** | Groq API (LLaMA-3.3-70B Versatile) |
| **PDF Generation**          | jsPDF                              |
| **Deployment**              | Vercel                             |

---

## Project Structure

```text
src/
├── components/
│   ├── Navbar
│   ├── Sidebar
│   └── Shared UI Components
│
├── pages/
│   ├── AdminPanel.jsx
│   ├── DoctorPortal.jsx
│   ├── StaffPortal.jsx
│   ├── ReceptionistPortal.jsx
│   ├── PatientPortal.jsx
│   ├── AppointmentRouter.jsx
│   ├── SymptomChecker.jsx
│   └── ...
│
├── utils/
│   └── generatePatientPDF.js
│
├── supabaseClient.js
├── App.jsx
└── main.jsx
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/Siddhi2105/manjhi-seva.git

cd manjhi-seva
```

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm run dev
```

> **Note:** Before running the application, configure the required environment variables and connect the project to your own Supabase instance and AI service credentials.

---

## Application Workflow

```text
Patient Registration
        │
        ▼
Appointment Booking
        │
        ▼
AI Appointment Routing
        │
        ▼
Doctor Consultation
        │
        ▼
Electronic Health Record
        │
        ▼
AI Medical Summary
        │
        ▼
PDF Discharge Report
```

---

## Future Enhancements

* Electronic Prescription System
* Laboratory Information Management
* Pharmacy & Inventory Module
* Telemedicine Integration
* SMS & WhatsApp Notifications
* Multi-language Support
* Offline Synchronization for Rural Clinics
* Healthcare Analytics Dashboard
* Predictive Disease Risk Analysis
* Voice-based Patient Registration

---

## License

This project is licensed under the **MIT License**.
