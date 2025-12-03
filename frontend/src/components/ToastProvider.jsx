import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    const t = { id, type: "info", title: "", message: "", duration: 2500, ...toast };
    setToasts((prev) => [...prev, t]);
    window.setTimeout(() => remove(id), t.duration);
  }, [remove]);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={styles.wrap}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...typeStyles[t.type] }}>
            {t.title && <div style={styles.title}>{t.title}</div>}
            <div style={styles.msg}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}

const styles = {
  wrap: {
    position: "fixed",
    right: 16,
    bottom: 16,
    display: "grid",
    gap: 10,
    zIndex: 9999,
    width: 320,
    maxWidth: "calc(100vw - 32px)",
  },
  toast: {
    borderRadius: 16,
    padding: 12,
    border: "1px solid #eee",
    background: "white",
    boxShadow: "0 16px 60px rgba(0,0,0,0.12)",
  },
  title: { fontWeight: 900, marginBottom: 4, fontSize: 13 },
  msg: { opacity: 0.85, fontSize: 13, lineHeight: 1.35 },
};

const typeStyles = {
  info: { borderColor: "#eee" },
  success: { borderColor: "rgba(0,160,90,0.25)", background: "rgba(0,160,90,0.06)" },
  error: { borderColor: "rgba(176,0,32,0.25)", background: "rgba(176,0,32,0.06)" },
  warn: { borderColor: "rgba(255,160,0,0.25)", background: "rgba(255,160,0,0.08)" },
};
