import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddPatient from "./pages/AddPatient";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import AddHealthRecord from "./pages/AddHealthRecord";
import Appointments from "./pages/Appointments";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-patient" element={<AddPatient />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patient/:id" element={<PatientDetails />} />
        <Route path="/add-health-record" element={<AddHealthRecord />} />
        <Route path="/appointments" element={<Appointments />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;