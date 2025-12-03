import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { useToast } from "../components/ToastProvider";


import AppLayout from "../components/AppLayout";
import EditEmployeeModal from "../components/EditEmployeeModal";

import {
  EMPLOYEES_QUERY,
  FLAG_EMPLOYEE_MUTATION,
  DELETE_EMPLOYEE_MUTATION,
  UPDATE_EMPLOYEE_MUTATION,
} from "../gql";

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid #eee",
        background: "white",
        fontSize: 12,
        fontWeight: 700,
        opacity: 0.9,
        gap: 6,
      }}
    >
      {children}
    </span>
  );
}

function KebabMenu({ canAdmin, onView, onEdit, onFlag, onDelete, flagLabel = "Flag" }) {
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      // close when clicking outside
      if (!e.target.closest?.("[data-kebab-root='true']")) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = (fn) => {
    setOpen(false);
    fn();
  };

  return (
    <div data-kebab-root="true" style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Actions"
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          border: "1px solid #eee",
          background: "white",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ⋮
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: 0,
            top: 46,
            width: 190,
            background: "white",
            border: "1px solid #eee",
            borderRadius: 14,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            padding: 8,
            display: "grid",
            gap: 6,
            zIndex: 10,
          }}
        >
          <button onClick={() => run(onView)} style={menuBtnStyle}>
            View
          </button>

          <button
            onClick={() => run(onEdit)}
            style={{ ...menuBtnStyle, opacity: canAdmin ? 1 : 0.45, cursor: canAdmin ? "pointer" : "not-allowed" }}
            disabled={!canAdmin}
          >
            Edit
          </button>

          <button
            onClick={() => run(onFlag)}
            style={{ ...menuBtnStyle, opacity: canAdmin ? 1 : 0.45, cursor: canAdmin ? "pointer" : "not-allowed" }}
            disabled={!canAdmin}
          >
            {flagLabel}
          </button>

          <button
            onClick={() => run(onDelete)}
            style={{
              ...menuBtnStyle,
              color: "#b00020",
              opacity: canAdmin ? 1 : 0.45,
              cursor: canAdmin ? "pointer" : "not-allowed",
            }}
            disabled={!canAdmin}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const menuBtnStyle = {
  width: "100%",
  textAlign: "left",
  background: "white",
  border: "1px solid #eee",
  borderRadius: 12,
  padding: "10px 10px",
  cursor: "pointer",
  fontWeight: 700,
};

export default function Employees() {
  const { push } = useToast();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "unknown";
  const isAdmin = role === "admin";

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "tile"
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState(null);

  const variables = useMemo(
    () => ({
      pagination: { page, pageSize },
      sort: { sortBy: "UPDATED_AT", sortDirection: "DESC" },
      filter: null,
    }),
    [page]
  );

  const { data, loading, error, refetch } = useQuery(EMPLOYEES_QUERY, {
    variables,
    skip: !token,
    fetchPolicy: "cache-and-network",
  });

  const [flagEmployee] = useMutation(FLAG_EMPLOYEE_MUTATION);
  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE_MUTATION);
  const [updateEmployee, { loading: updating }] = useMutation(
    UPDATE_EMPLOYEE_MUTATION
  );

  const items = data?.employees?.items ?? [];
  const pageInfo = data?.employees?.pageInfo;

  const openEdit = (emp) => {
    setActiveEmployee(emp);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setActiveEmployee(null);
  };

  const doFlagToggle = async (emp) => {
  try {
    const nextFlag = !emp.flagged;

    await flagEmployee({
      variables: { id: emp.id, flagged: nextFlag },
      optimisticResponse: {
        flagEmployee: {
          __typename: "Employee",
          id: emp.id,
          flagged: nextFlag,
          updatedAt: new Date().toISOString(),
        },
      },
      update: (cache, { data }) => {
        // Update the employee object in cache
        cache.modify({
          id: cache.identify({ __typename: "Employee", id: emp.id }),
          fields: {
            flagged: () => data?.flagEmployee?.flagged ?? nextFlag,
            updatedAt: () => data?.flagEmployee?.updatedAt ?? new Date().toISOString(),
          },
        });
      },
    });

    push({
      type: "success",
      title: "Updated",
      message: `${emp.name} ${nextFlag ? "flagged" : "unflagged"}.`,
    });
  } catch (e) {
    push({ type: "error", title: "Action failed", message: e.message });
  }
};

  const doDelete = async (emp) => {
  const ok = confirm(`Delete ${emp.name}? This cannot be undone.`);
  if (!ok) return;

  try {
    await deleteEmployee({
      variables: { id: emp.id },
      optimisticResponse: { deleteEmployee: true },
      update: (cache) => {
        // Remove from employees list in the cache for current query variables
        cache.modify({
          fields: {
            employees(existingConn, { readField }) {
              if (!existingConn?.items) return existingConn;

              const nextItems = existingConn.items.filter(
                (ref) => readField("id", ref) !== emp.id
              );

              const totalCount = (existingConn.pageInfo?.totalCount ?? nextItems.length) - 1;

              return {
                ...existingConn,
                items: nextItems,
                pageInfo: {
                  ...existingConn.pageInfo,
                  totalCount: Math.max(0, totalCount),
                },
              };
            },
          },
        });

        cache.evict({ id: cache.identify({ __typename: "Employee", id: emp.id }) });
        cache.gc();
      },
    });

    push({ type: "success", title: "Deleted", message: `${emp.name} removed.` });
  } catch (e) {
    push({ type: "error", title: "Delete failed", message: e.message });
  }
};


  const saveEdit = async (next) => {
  try {
    if (!next.name?.trim()) throw new Error("Name is required.");
    if (!Number.isInteger(next.age) || next.age < 0 || next.age > 120) {
      throw new Error("Age must be an integer between 0 and 120.");
    }
    if (!next.class?.trim()) throw new Error("Class is required.");
    if (!Number.isInteger(next.attendance) || next.attendance < 0 || next.attendance > 100) {
      throw new Error("Attendance must be an integer between 0 and 100.");
    }
    if (!Array.isArray(next.subjects) || next.subjects.length === 0) {
      throw new Error("Subjects must include at least one subject.");
    }

    const optimistic = {
      __typename: "Employee",
      id: activeEmployee.id,
      name: next.name.trim(),
      age: next.age,
      class: next.class.trim(),
      subjects: next.subjects,
      attendance: next.attendance,
      flagged: activeEmployee.flagged,
      updatedAt: new Date().toISOString(),
    };

    await updateEmployee({
      variables: {
        id: activeEmployee.id,
        input: {
          name: optimistic.name,
          age: optimistic.age,
          class: optimistic.class,
          attendance: optimistic.attendance,
          subjects: optimistic.subjects,
        },
      },
      optimisticResponse: {
        updateEmployee: optimistic,
      },
    });

    closeEdit();
    push({ type: "success", title: "Saved", message: "Employee updated." });
  } catch (e) {
    push({ type: "error", title: "Save failed", message: e.message });
  }
};


  if (!token) {
    return (
      <AppLayout>
        <div style={{ padding: 16 }}>
          <h2>Employees</h2>
          <p>You are not logged in.</p>
          <button onClick={() => navigate("/")} style={{ padding: "10px 12px" }}>
            Go to Login
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: "6px 0 8px", letterSpacing: -0.2 }}>
            Employees
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill>View: {viewMode}</Pill>
            <Pill>Role: {role}</Pill>
            <Pill>Page Size: {pageSize}</Pill>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => refetch()} style={topBtnStyle}>
            Refresh
          </button>

          <button
            onClick={() => setViewMode((v) => (v === "grid" ? "tile" : "grid"))}
            style={topBtnStyle}
          >
            Toggle {viewMode === "grid" ? "Tile" : "Grid"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading && <div style={{ opacity: 0.8 }}>Loading...</div>}
        {error && <div style={{ color: "crimson" }}>{error.message}</div>}
      </div>

      {/* GRID VIEW (10 columns) */}
      {viewMode === "grid" && (
        <div style={{ marginTop: 14, overflowX: "auto" }}>
          <div
            style={{
              minWidth: 1100,
              border: "1px solid #eee",
              borderRadius: 18,
              overflow: "hidden",
              background: "white",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                padding: 12,
                background: "#fafafa",
                fontWeight: 900,
              }}
            >
              <div>ID</div>
              <div>Name</div>
              <div>Age</div>
              <div>Class</div>
              <div>Subjects</div>
              <div>Attendance</div>
              <div>Flagged</div>
              <div>Updated</div>
              <div>Actions</div>
              <div>View</div>
            </div>

            {items.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  padding: 12,
                  borderTop: "1px solid #f0f0f0",
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 12,
                    opacity: 0.8,
                  }}
                >
                  {e.id}
                </div>
                <div style={{ fontWeight: 800 }}>{e.name}</div>
                <div>{e.age}</div>
                <div>
                  <Pill>{e.class}</Pill>
                </div>
                <div style={{ opacity: 0.85 }}>
                  {e.subjects.slice(0, 2).join(", ")}
                  {e.subjects.length > 2 ? "…" : ""}
                </div>
                <div>{e.attendance}%</div>
                <div>{e.flagged ? "Yes" : "No"}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {new Date(e.updatedAt).toLocaleString()}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={smallBtnStyle}
                    disabled={!isAdmin}
                    title={isAdmin ? "" : "Admin only"}
                    onClick={() => openEdit(e)}
                  >
                    Edit
                  </button>

                  <button
                    style={smallBtnStyle}
                    disabled={!isAdmin}
                    title={isAdmin ? "" : "Admin only"}
                    onClick={() => doFlagToggle(e)}
                  >
                    {e.flagged ? "Unflag" : "Flag"}
                  </button>

                  <button
                    style={{ ...smallBtnStyle, color: "#b00020" }}
                    disabled={!isAdmin}
                    title={isAdmin ? "" : "Admin only"}
                    onClick={() => doDelete(e)}
                  >
                    Delete
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => navigate(`/employees/${e.id}`)}
                    style={smallBtnStyle}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TILE VIEW */}
      {viewMode === "tile" && (
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((e) => (
            <div
              key={e.id}
              onClick={() => navigate(`/employees/${e.id}`)}
              role="button"
              tabIndex={0}
              style={{
                background: "white",
                border: "1px solid #eee",
                borderRadius: 18,
                padding: 14,
                cursor: "pointer",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 16,
                      letterSpacing: -0.2,
                    }}
                  >
                    {e.name}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Pill>Class {e.class}</Pill>
                    <Pill>{e.attendance}% attendance</Pill>
                    {e.flagged && <Pill>Flagged</Pill>}
                  </div>
                </div>

                <KebabMenu
                  canAdmin={isAdmin}
                  flagLabel={e.flagged ? "Unflag" : "Flag"}
                  onView={() => navigate(`/employees/${e.id}`)}
                  onEdit={() => openEdit(e)}
                  onFlag={() => doFlagToggle(e)}
                  onDelete={() => doDelete(e)}
                />

              </div>

              <div style={{ fontSize: 13, opacity: 0.85 }}>
                <b>Subjects:</b> {e.subjects.join(", ")}
              </div>

              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Updated: {new Date(e.updatedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageInfo && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            Total: {pageInfo.totalCount} • Page {pageInfo.page} • Page Size{" "}
            {pageInfo.pageSize}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={topBtnStyle}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pageInfo.hasNextPage}
              style={topBtnStyle}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditEmployeeModal
        open={editOpen}
        employee={activeEmployee}
        onClose={closeEdit}
        onSave={saveEdit}
      />

      {updating && (
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          Saving changes...
        </div>
      )}
    </AppLayout>
  );
}

const topBtnStyle = {
  border: "1px solid #eee",
  background: "white",
  padding: "10px 12px",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 700,
};

const smallBtnStyle = {
  border: "1px solid #eee",
  background: "white",
  padding: "8px 10px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12,
};

const gridCols = "150px 180px 70px 90px 200px 120px 90px 190px 220px 90px";
