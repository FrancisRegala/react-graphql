import React, { useMemo, useState } from "react";

export default function AddEmployeeModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [cls, setCls] = useState("");
  const [attendance, setAttendance] = useState("");
  const [subjectsText, setSubjectsText] = useState("");

  const subjects = useMemo(
    () => subjectsText.split(",").map((s) => s.trim()).filter(Boolean),
    [subjectsText]
  );

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={overlay} />
      <div style={centerWrap}>
        <div style={card}>
          <div style={header}>
            <div>
              <div style={title}>Add Employee</div>
              <div style={sub}>Admin only</div>
            </div>
            <button onClick={onClose} style={xBtn} aria-label="Close">✕</button>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Age">
                <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" style={input} />
              </Field>
              <Field label="Class">
                <input value={cls} onChange={(e) => setCls(e.target.value)} style={input} />
              </Field>
            </div>

            <Field label="Attendance (0-100)">
              <input
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                inputMode="numeric"
                style={input}
              />
            </Field>

            <Field label="Subjects (comma-separated)">
              <input
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                placeholder="Math, English, Science"
                style={input}
              />
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                Parsed: {subjects.length ? subjects.join(", ") : "None"}
              </div>
            </Field>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button onClick={onClose} style={secondaryBtn}>Cancel</button>
            <button
              onClick={() => onCreate({
                name: name.trim(),
                age: Number(age),
                class: cls.trim(),
                attendance: Number(attendance),
                subjects,
              })}
              style={primaryBtn}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>{label}</span>
      {children}
    </label>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 };
const centerWrap = { position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: 110, padding: 16 };
const card = { width: "100%", maxWidth: 560, background: "white", border: "1px solid #eee", borderRadius: 20, boxShadow: "0 20px 80px rgba(0,0,0,0.18)", padding: 16 };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 };
const title = { fontWeight: 900, fontSize: 18, letterSpacing: -0.2 };
const sub = { fontSize: 12, opacity: 0.7 };
const xBtn = { width: 42, height: 42, borderRadius: 14, border: "1px solid #eee", background: "white", cursor: "pointer", fontSize: 18 };
const input = { border: "1px solid #e8e8e8", background: "white", borderRadius: 14, padding: "12px 12px", outline: "none", fontSize: 14, width: "100%" };
const primaryBtn = { border: "1px solid #111", background: "#111", color: "white", borderRadius: 14, padding: "12px 14px", cursor: "pointer", fontWeight: 900 };
const secondaryBtn = { border: "1px solid #eee", background: "white", borderRadius: 14, padding: "12px 14px", cursor: "pointer", fontWeight: 900 };
