import React, { useEffect, useMemo, useState } from "react";

export default function EditEmployeeModal({ open, employee, onClose, onSave }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [cls, setCls] = useState("");
  const [attendance, setAttendance] = useState("");
  const [subjectsText, setSubjectsText] = useState("");

  useEffect(() => {
    if (!employee) return;
    setName(employee.name ?? "");
    setAge(String(employee.age ?? ""));
    setCls(employee.class ?? "");
    setAttendance(String(employee.attendance ?? ""));
    setSubjectsText(Array.isArray(employee.subjects) ? employee.subjects.join(", ") : "");
  }, [employee]);

  const parsedSubjects = useMemo(() => {
    return subjectsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [subjectsText]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          zIndex: 110,
          padding: 16,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: "white",
            border: "1px solid #eee",
            borderRadius: 20,
            boxShadow: "0 20px 80px rgba(0,0,0,0.18)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.2 }}>Edit Employee</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{employee?.id}</div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: "1px solid #eee",
                background: "white",
                cursor: "pointer",
                fontSize: 18,
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Age">
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  inputMode="numeric"
                  style={styles.input}
                />
              </Field>

              <Field label="Class">
                <input value={cls} onChange={(e) => setCls(e.target.value)} style={styles.input} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Attendance (0-100)">
                <input
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  inputMode="numeric"
                  style={styles.input}
                />
              </Field>

              <Field label="Flag (optional)">
                <div style={{ fontSize: 12, opacity: 0.7, paddingTop: 10 }}>
                  Use kebab action to flag/unflag
                </div>
              </Field>
            </div>

            <Field label="Subjects (comma-separated)">
              <input
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                style={styles.input}
                placeholder="Math, English, Science"
              />
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                Parsed: {parsedSubjects.length ? parsedSubjects.join(", ") : "None"}
              </div>
            </Field>
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={onClose} style={styles.secondaryBtn}>
              Cancel
            </button>
            <button
              onClick={() => {
                // minimal validation before sending
                const next = {
                  name: name.trim(),
                  age: Number(age),
                  class: cls.trim(),
                  attendance: Number(attendance),
                  subjects: parsedSubjects,
                };
                onSave(next);
              }}
              style={styles.primaryBtn}
            >
              Save changes
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

const styles = {
  input: {
    border: "1px solid #e8e8e8",
    background: "white",
    borderRadius: 14,
    padding: "12px 12px",
    outline: "none",
    fontSize: 14,
    width: "100%",
  },
  primaryBtn: {
    border: "1px solid #111",
    background: "#111",
    color: "white",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
    fontWeight: 900,
  },
  secondaryBtn: {
    border: "1px solid #eee",
    background: "white",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
    fontWeight: 900,
  },
};
