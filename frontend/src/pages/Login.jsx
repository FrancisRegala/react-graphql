import React, { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { LOGIN_MUTATION } from "../gql";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);

  const roleHint = useMemo(
    () => ({
      admin: { email: "admin@demo.com", password: "admin123" },
      employee: { email: "employee@demo.com", password: "employee123" },
    }),
    []
  );

  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem("token", data.login.token);
      localStorage.setItem("role", data.login.role);
      localStorage.setItem("userId", data.login.userId);
      navigate("/employees");
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    login({ variables: { email, password } });
  };

  const fillDemo = (which) => {
    setEmail(roleHint[which].email);
    setPassword(roleHint[which].password);
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      <div style={styles.shell}>
        <div style={styles.brand}>
          <div style={styles.logo}>WM</div>
          <div style={{ display: "grid" }}>
            <div style={styles.brandTitle}>Employee Portal</div>
            <div style={styles.brandSub}>Sign in to continue</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={{ marginBottom: 14 }}>
            <div style={styles.title}>Login</div>
            <div style={styles.subtitle}>
              Use the demo accounts or enter credentials
            </div>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={styles.label}>
              <span style={styles.labelText}>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Password</span>
              <div style={styles.passwordRow}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...styles.input, margin: 0, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.ghostBtn}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div style={styles.errorBox}>
                <b>Login failed.</b> {error.message}
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>Demo accounts</span>
              <span style={styles.dividerLine} />
            </div>

            <div style={styles.demoGrid}>
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                style={styles.demoBtn}
              >
                Use Admin
                <span style={styles.demoSub}>Full access</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("employee")}
                style={styles.demoBtn}
              >
                Use Employee
                <span style={styles.demoSub}>Read only</span>
              </button>
            </div>

            <div style={styles.footnote}>
              Tip: Admin can add, update, flag, and delete employees. Employee can only view.
            </div>
          </form>
        </div>

        <div style={styles.footer}>
          Employee POC • React + Apollo GraphQL
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fafafa",
    display: "grid",
    placeItems: "center",
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    inset: -200,
    background:
      "radial-gradient(circle at 20% 20%, rgba(120, 92, 255, 0.12), transparent 40%), radial-gradient(circle at 80% 30%, rgba(255, 92, 180, 0.10), transparent 45%), radial-gradient(circle at 50% 80%, rgba(0, 120, 255, 0.10), transparent 45%)",
    pointerEvents: "none",
  },
  shell: {
    width: "100%",
    maxWidth: 460,
    position: "relative",
    zIndex: 1,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    padding: "0 4px",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "white",
    border: "1px solid #eee",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    letterSpacing: -0.5,
  },
  brandTitle: { fontWeight: 900, fontSize: 16, letterSpacing: -0.2 },
  brandSub: { fontSize: 13, opacity: 0.75 },

  card: {
    background: "white",
    border: "1px solid #eee",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 18px 60px rgba(0,0,0,0.06)",
  },
  title: { fontSize: 22, fontWeight: 900, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, opacity: 0.75, marginTop: 4 },

  label: { display: "grid", gap: 6 },
  labelText: { fontSize: 12, fontWeight: 800, opacity: 0.8 },
  input: {
    border: "1px solid #e8e8e8",
    background: "white",
    borderRadius: 14,
    padding: "12px 12px",
    outline: "none",
    fontSize: 14,
  },
  passwordRow: { display: "flex", gap: 10, alignItems: "center" },
  ghostBtn: {
    border: "1px solid #eee",
    background: "white",
    borderRadius: 14,
    padding: "11px 12px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  errorBox: {
    border: "1px solid rgba(176,0,32,0.25)",
    background: "rgba(176,0,32,0.06)",
    color: "#7a0014",
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.35,
  },

  primaryBtn: {
    border: "1px solid #111",
    background: "#111",
    color: "white",
    borderRadius: 14,
    padding: "12px 12px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 14,
  },

  divider: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  dividerLine: { height: 1, background: "#eee" },
  dividerText: { fontSize: 12, fontWeight: 800, opacity: 0.65 },

  demoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  demoBtn: {
    border: "1px solid #eee",
    background: "#fafafa",
    borderRadius: 14,
    padding: "12px 12px",
    cursor: "pointer",
    fontWeight: 900,
    textAlign: "left",
    display: "grid",
    gap: 4,
  },
  demoSub: { fontSize: 12, opacity: 0.75, fontWeight: 700 },

  footnote: { fontSize: 12, opacity: 0.7, lineHeight: 1.4, marginTop: 2 },

  footer: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginTop: 14,
    padding: "0 4px",
  },
};
