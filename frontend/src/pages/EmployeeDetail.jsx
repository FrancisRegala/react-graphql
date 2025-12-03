import React from "react";
import { useQuery } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router-dom";
import { EMPLOYEE_QUERY } from "../gql";
import AppLayout from "../components/AppLayout";

export default function EmployeeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const { data, loading, error } = useQuery(EMPLOYEE_QUERY, {
    variables: { id },
    skip: !token,
  });

  const e = data?.employee;

  return (
    <AppLayout>
      {!token ? (
        <div style={{ padding: 16 }}>
          <h2>Employee</h2>
          <p>You are not logged in.</p>
          <button onClick={() => navigate("/")} style={{ padding: "10px 12px" }}>
            Go to Login
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => navigate("/employees")}
            style={{
              border: "1px solid #eee",
              background: "white",
              padding: "10px 12px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ← Back
          </button>

          <div style={{ marginTop: 14 }}>
            {loading && <div style={{ opacity: 0.8 }}>Loading...</div>}
            {error && <div style={{ color: "crimson" }}>{error.message}</div>}
          </div>

          {e && (
            <div style={{ marginTop: 14, background: "white", border: "1px solid #eee", borderRadius: 18, padding: 16 }}>
              <h1 style={{ marginTop: 0, marginBottom: 10, letterSpacing: -0.3 }}>{e.name}</h1>

              <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                <div><b>ID:</b> {e.id}</div>
                <div><b>Age:</b> {e.age}</div>
                <div><b>Class:</b> {e.class}</div>
                <div><b>Attendance:</b> {e.attendance}%</div>
                <div><b>Flagged:</b> {String(e.flagged)}</div>
                <div><b>Subjects:</b> {e.subjects.join(", ")}</div>
                <div><b>Created:</b> {new Date(e.createdAt).toLocaleString()}</div>
                <div><b>Updated:</b> {new Date(e.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
