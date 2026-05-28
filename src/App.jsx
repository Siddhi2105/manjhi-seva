import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import PatientDetails from "./pages/PatientDetails";
import AddHealthRecord from "./pages/AddHealthRecord";
import SymptomChecker from "./pages/SymptomChecker";
import Appointments from "./pages/Appointments";
import BookAppointment from "./pages/BookAppointment";
import EditPatient from "./pages/EditPatient";
import Doctors from "./pages/Doctors";
import AddDoctor from "./pages/AddDoctor";
import DoctorsDetails from "./pages/DoctorsDetails";
import EditDoctor from "./pages/EditDoctor";
import EditAppointment from "./pages/EditAppointment";


export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 CHECK USER LOGIN STATUS
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // ⏳ Wait until Supabase checks login
  if (loading) return <h2>Loading...</h2>;

  return (
    <BrowserRouter>
      <Routes>

        {/* 🔴 DEFAULT PAGE = LOGIN */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🔐 PROTECTED ROUTES */}
        {session ? (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/add-patient" element={<AddPatient />} />
            <Route path="/patient/:id" element={<PatientDetails />} />
            <Route path="/add-health-record" element={<AddHealthRecord />} />
            <Route path="/symptom-checker" element={<SymptomChecker />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/edit-patient/:id" element={<EditPatient />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/add-doctor" element={<AddDoctor />} />
            <Route path="/doctor/:id" element={<DoctorsDetails />} />
            <Route path="/doctors/edit/:id" element={<EditDoctor />} />
            <Route path="/appointments/edit/:id" element={<EditAppointment />} />

          </>
        ) : (
          // ❌ If not logged in → redirect to login
          <Route path="*" element={<Navigate to="/" />} />
          
        )}

      </Routes>
    </BrowserRouter>
  );
}