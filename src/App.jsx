import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Navbar from "./components/Navbar";

import AdminPanel from "./pages/AdminPanel";
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
import PatientPortal from "./pages/PatientPortal";
import DoctorPortal from "./pages/DoctorPortal";
import AddStaff from "./pages/AddStaff";
import AppointmentRouter from "./pages/AppointmentRouter";
import DischargeSummary from "./pages/DischargeSummary";
import PipelineMonitor from "./pages/PipelineMonitor";
import Alerts from "./pages/Alerts";


function RoleRoute({ role, allowed, children }) {
  if (role === null) return <div className="p-5"><p>Loading...</p></div>;
  if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes({ session, role }) {
  const location = useLocation();
  const authPages = ["/", "/signup"];
  const showNavbar = session && !authPages.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar role={role} />}
      <main className="app-shell">
        <div className="app-container">
          <Routes>
            <Route
              path="/"
              element={
                !session
                  ? <Login />
                  : role === null
                  ? <div className="p-5"><p>Loading...</p></div>
                  : <Navigate to={
                      role === "patient" ? "/my-portal" :
                      role === "doctor" ? "/doctor-portal" :
                      "/dashboard"
                    } replace />
              }
            />
            <Route
              path="/signup"
              element={session ? <Navigate to="/dashboard" replace /> : <Signup />}
            />

            {session ? (
              <>
                <Route path="/dashboard" element={
                  role === "patient"
                    ? <Navigate to="/my-portal" replace />
                    : role === "doctor"
                    ? <Navigate to="/doctor-portal" replace />
                    : <Dashboard role={role} />
                } />

                <Route path="/my-portal" element={
                  <RoleRoute role={role} allowed={["patient"]}>
                    <PatientPortal session={session} />
                  </RoleRoute>
                } />

                <Route path="/doctor-portal" element={
                  <RoleRoute role={role} allowed={["doctor"]}>
                    <DoctorPortal session={session} />
                  </RoleRoute>
                } />

                <Route path="/patients" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <Patients />
                  </RoleRoute>
                } />
                <Route path="/patient/:id" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <PatientDetails role={role} />
                  </RoleRoute>
                } />
                <Route path="/appointments" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <Appointments />
                  </RoleRoute>
                } />
                <Route path="/add-patient" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <AddPatient />
                  </RoleRoute>
                } />
                <Route path="/edit-patient/:id" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <EditPatient />
                  </RoleRoute>
                } />
                <Route path="/add-health-record" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <AddHealthRecord />
                  </RoleRoute>
                } />
                <Route path="/health-record/edit/:id" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <EditHealthRecord />
                  </RoleRoute>
                } />
                <Route path="/book-appointment" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <BookAppointment />
                  </RoleRoute>
                } />
                <Route path="/appointments/edit/:id" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <EditAppointment />
                  </RoleRoute>
                } />

                <Route path="/admin" element={
                  <RoleRoute role={role} allowed={["admin"]}>
                    <AdminPanel />
                  </RoleRoute>
                } />
                <Route path="/add-staff" element={
                  <RoleRoute role={role} allowed={["admin"]}>
                    <AddStaff />
                  </RoleRoute>
                } />
                <Route path="/doctors" element={
                  <RoleRoute role={role} allowed={["admin"]}>
                    <Doctors />
                  </RoleRoute>
                } />
                <Route path="/add-doctor" element={
                  <RoleRoute role={role} allowed={["admin"]}>
                    <AddDoctor />
                  </RoleRoute>
                } />
                <Route path="/doctor/:id" element={
                  <RoleRoute role={role} allowed={["admin"]}>
                    <DoctorsDetails />
                  </RoleRoute>
                } />
                <Route path="/doctors/edit/:id" element={
                  <RoleRoute role={role} allowed={["admin"]}>
                    <EditDoctor />
                  </RoleRoute>
                } />

                {/* ── Pipeline Monitor — admin only ── */}
                <Route path="/pipeline" element={
                  <RoleRoute role={role} allowed={["admin"]}>
                    <PipelineMonitor />
                  </RoleRoute>
                } />
                <Route path="/alerts" element={
  <RoleRoute role={role} allowed={["admin", "doctor"]}>
    <Alerts />
  </RoleRoute>
} />


                <Route path="/symptom-checker" element={
                  <RoleRoute role={role} allowed={["admin", "doctor", "receptionist", "sevak", "patient"]}>
                    <SymptomChecker />
                  </RoleRoute>
                } />
                <Route path="/appointment-router" element={
                  <RoleRoute role={role} allowed={["admin", "receptionist", "sevak"]}>
                    <AppointmentRouter />
                  </RoleRoute>
                } />
                <Route path="/discharge/:patientId" element={
                  <RoleRoute role={role} allowed={["admin", "doctor", "receptionist"]}>
                    <DischargeSummary />
                  </RoleRoute>
                } />

                <Route path="*" element={
                  role === null
                    ? <div className="p-5"><p>Loading...</p></div>
                    : <Navigate to={
                        role === "patient" ? "/my-portal" :
                        role === "doctor" ? "/doctor-portal" :
                        "/dashboard"
                      } replace />
                } />
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
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from("profiles").select("role").eq("id", session.user.id).single()
          .then(({ data }) => {
            setRole(data?.role || null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        supabase
          .from("profiles").select("role").eq("id", session.user.id).single()
          .then(({ data }) => { setRole(data?.role || null); });
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-5"><p>Loading...</p></div>;

  return (
    <BrowserRouter>
      <AppRoutes session={session} role={role} />
    </BrowserRouter>
  );
}