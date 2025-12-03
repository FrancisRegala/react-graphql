import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: active ? "#111" : "#444",
        fontWeight: active ? 700 : 600,
        padding: "10px 12px",
        borderRadius: 10,
        background: active ? "rgba(0,0,0,0.06)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSub, setOpenSub] = useState(null);

  const role = localStorage.getItem("role") || "unknown";
  const token = localStorage.getItem("token");

  const menu = useMemo(
    () => [
      { label: "Dashboard", to: "/employees" },
      {
        label: "Employees",
        sub: [
          { label: "List", to: "/employees" },
          { label: "Flagged (filter later)", to: "/employees?flagged=1" },
        ],
      },
      {
        label: "Settings",
        sub: [
          { label: "Profile (stub)", to: "/settings/profile" },
          { label: "Security (stub)", to: "/settings/security" },
        ],
      },
    ],
    []
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "white",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "12px 16px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Left: hamburger + brand (HUGS LEFT EDGE) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "start" }}>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                border: "1px solid #eee",
                background: "white",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ☰
            </button>

            <div style={{ display: "grid" }}>
              <div style={{ fontWeight: 800, lineHeight: 1.1 }}>Employee POC</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Role: {role}</div>
            </div>
          </div>

          {/* Center: horizontal menu (CENTERED) */}
          <nav style={{ display: "flex", gap: 6, alignItems: "center", justifySelf: "center" }}>
            {/* <NavLink to="/employees">Employees</NavLink> */}
            {/* <NavLink to="/employees">Reports</NavLink>
            <NavLink to="/employees">Activity</NavLink> */}
          </nav>

          {/* Right: Logout (HUGS RIGHT EDGE) */}
          <div style={{ display: "flex", justifyContent: "flex-end", justifySelf: "end" }}>
            {token ? (
              <button
                onClick={logout}
                style={{
                  border: "1px solid #eee",
                  background: "white",
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("/")}
                style={{
                  border: "1px solid #eee",
                  background: "white",
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>


      {/* Drawer */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 60,
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 320,
              height: "100vh",
              background: "white",
              zIndex: 70,
              borderRight: "1px solid #eee",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>Menu</div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid #eee",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div style={{ borderTop: "1px solid #f0f0f0" }} />

            <div style={{ display: "grid", gap: 8 }}>
              {menu.map((item) => {
                const hasSub = Array.isArray(item.sub);
                const isOpen = openSub === item.label;

                if (!hasSub) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      style={{
                        textDecoration: "none",
                        color: "#111",
                        fontWeight: 700,
                        padding: "12px 12px",
                        borderRadius: 12,
                        background: "rgba(0,0,0,0.04)",
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={item.label} style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
                    <button
                      onClick={() => setOpenSub(isOpen ? null : item.label)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 12px",
                        background: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 800,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ opacity: 0.7 }}>{isOpen ? "▾" : "▸"}</span>
                    </button>

                    {/* 1-level deep submenu only */}
                    {isOpen && (
                      <div style={{ padding: 10, background: "#fafafa", display: "grid", gap: 6 }}>
                        {item.sub.map((sub) => (
                          <Link
                            key={sub.label}
                            to={sub.to}
                            onClick={() => setDrawerOpen(false)}
                            style={{
                              textDecoration: "none",
                              color: "#222",
                              padding: "10px 10px",
                              borderRadius: 12,
                              background: "white",
                              border: "1px solid #eee",
                              fontWeight: 600,
                            }}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.7 }}>
              POC navigation with one-level submenus
            </div>
          </aside>
        </>
      )}

      {/* Page content */}
      <main style={{ maxWidth: "100%", margin: "0 auto", padding: "18px 16px 40px" }}>
        {children}
      </main>

    </div>
  );
}
