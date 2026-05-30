import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Navbar from "./components/Navbar";

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
import EditHealthRecord from "./pages/EditHealthRecord";

function AppRoutes({ session }) {
  const location = useLocation();
  const authPages = ["/", "/signup"];
  const showNavbar = session && !authPages.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}

      <main className="app-shell">
        <div className="app-container">
          <Routes>
            <Route
              path="/"
              element={session ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/signup"
              element={session ? <Navigate to="/dashboard" replace /> : <Signup />}
            />

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
                <Route path="/health-record/edit/:id" element={<EditHealthRecord />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/" replace />} />
            )}
          </Routes>
        </div>
      </main>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <h2>Loading...</h2>;

  return (
    <BrowserRouter>
      <AppRoutes session={session} />
    </BrowserRouter>
  );
}
