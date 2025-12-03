import React from "react";
import AppLayout from "../components/AppLayout";

export default function Stub({ title }) {
  return (
    <AppLayout>
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 18, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p style={{ opacity: 0.8 }}>Stub page for navigation.</p>
      </div>
    </AppLayout>
  );
}
