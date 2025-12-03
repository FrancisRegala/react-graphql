import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Stub from "./pages/Stub";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/employees/:id" element={<EmployeeDetail />} />

      <Route path="/settings/profile" element={<Stub title="Profile Settings" />} />
      <Route path="/settings/security" element={<Stub title="Security Settings" />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
