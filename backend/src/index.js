import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

/**
 * In-memory datastore (POC)
 */
const db = {
  employees: [
    {
      id: "emp_1e8f9b2a-1234-4bcd-9abc-1ef234567890",
      name: "Ava Johnson",
      age: 28,
      class: "A",
      subjects: ["Math", "English", "Science"],
      attendance: 96,
      flagged: false,
      createdAt: new Date("2025-12-01T10:00:00Z").toISOString(),
      updatedAt: new Date("2025-12-01T10:00:00Z").toISOString(),
    },
    {
      id: "emp_2e8f9b2a-1234-4bcd-9abc-1ef234567890",
      name: "Noah Santos",
      age: 34,
      class: "B",
      subjects: ["History", "Math"],
      attendance: 89,
      flagged: true,
      createdAt: new Date("2025-12-01T11:00:00Z").toISOString(),
      updatedAt: new Date("2025-12-02T08:30:00Z").toISOString(),
    },
    {
      id: "emp_9993e780-4f30-443d-9abc-1ef234567890",
      name: "Mia Chen",
      age: 23,
      class: "A",
      subjects: ["Design", "English"],
      attendance: 92,
      flagged: false,
      createdAt: new Date("2025-12-02T12:15:00Z").toISOString(),
      updatedAt: new Date("2025-12-02T12:15:00Z").toISOString(),
    },
  ],
};

/**
 * POC users (in-memory).
 * In real life: DB + hashed passwords.
 */
const users = [
  { id: "u_admin_1", email: "admin@demo.com", password: "admin123", role: "admin" },
  { id: "u_emp_1", email: "employee@demo.com", password: "employee123", role: "employee" },
];

const typeDefs = `#graphql
  enum Role {
    admin
    employee
  }

  enum SortBy {
    NAME
    AGE
    CLASS
    ATTENDANCE
    UPDATED_AT
  }

  enum SortDirection {
    ASC
    DESC
  }

  input EmployeeFilterInput {
    nameContains: String
    classEquals: String
    minAge: Int
    maxAge: Int
    subjectIn: String
    flagged: Boolean
  }

  input EmployeeSortInput {
    sortBy: SortBy = UPDATED_AT
    sortDirection: SortDirection = DESC
  }

  input PaginationInput {
    page: Int = 1
    pageSize: Int = 10
  }

  type Employee {
    id: ID!
    name: String!
    age: Int!
    class: String!
    subjects: [String!]!
    attendance: Int!
    flagged: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type PageInfo {
    page: Int!
    pageSize: Int!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type EmployeeConnection {
    items: [Employee!]!
    pageInfo: PageInfo!
  }

  input AddEmployeeInput {
    name: String!
    age: Int!
    class: String!
    subjects: [String!]!
    attendance: Int!
  }

  input UpdateEmployeeInput {
    name: String
    age: Int
    class: String
    subjects: [String!]
    attendance: Int
    flagged: Boolean
  }

  type AuthPayload {
    token: String!
    role: Role!
    userId: ID!
  }

  type Query {
    employees(
      filter: EmployeeFilterInput
      sort: EmployeeSortInput
      pagination: PaginationInput
    ): EmployeeConnection!

    employee(id: ID!): Employee
    me: AuthPayload
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!

    addEmployee(input: AddEmployeeInput!): Employee!
    updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean!
    flagEmployee(id: ID!, flagged: Boolean!): Employee!
  }
`;

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeString(s) {
  return String(s ?? "").trim();
}

function validateAttendance(attendance) {
  if (!Number.isInteger(attendance) || attendance < 0 || attendance > 100) {
    throw new Error("attendance must be an integer between 0 and 100");
  }
}

function validateSubjects(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error("subjects must be a non-empty array of strings");
  }
  for (const s of subjects) {
    if (!normalizeString(s)) throw new Error("subjects cannot include empty strings");
  }
}

function validateClass(cls) {
  const c = normalizeString(cls);
  if (!c) throw new Error("class is required");
}

function applyFilters(list, filter) {
  if (!filter) return list;

  const nameContains = normalizeString(filter.nameContains).toLowerCase();
  const classEquals = normalizeString(filter.classEquals);
  const subjectIn = normalizeString(filter.subjectIn).toLowerCase();
  const minAge = Number.isInteger(filter.minAge) ? filter.minAge : null;
  const maxAge = Number.isInteger(filter.maxAge) ? filter.maxAge : null;
  const flagged = typeof filter.flagged === "boolean" ? filter.flagged : null;

  return list.filter((e) => {
    if (nameContains && !e.name.toLowerCase().includes(nameContains)) return false;
    if (classEquals && e.class !== classEquals) return false;
    if (minAge !== null && e.age < minAge) return false;
    if (maxAge !== null && e.age > maxAge) return false;
    if (flagged !== null && e.flagged !== flagged) return false;

    if (subjectIn) {
      const hasSubject = e.subjects.some((s) => s.toLowerCase() === subjectIn);
      if (!hasSubject) return false;
    }

    return true;
  });
}

function applySort(list, sort) {
  const sortBy = sort?.sortBy ?? "UPDATED_AT";
  const sortDirection = sort?.sortDirection ?? "DESC";
  const dir = sortDirection === "ASC" ? 1 : -1;

  return [...list].sort((a, b) => {
    let av;
    let bv;

    switch (sortBy) {
      case "NAME":
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
        break;
      case "AGE":
        av = a.age;
        bv = b.age;
        break;
      case "CLASS":
        av = a.class;
        bv = b.class;
        break;
      case "ATTENDANCE":
        av = a.attendance;
        bv = b.attendance;
        break;
      case "UPDATED_AT":
      default:
        av = a.updatedAt;
        bv = b.updatedAt;
        break;
    }

    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

function applyPagination(list, pagination) {
  const page = clampInt(pagination?.page ?? 1, 1, 1_000_000);
  const pageSize = clampInt(pagination?.pageSize ?? 10, 1, 100);
  const totalCount = list.length;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: list.slice(start, end),
    pageInfo: {
      page,
      pageSize,
      totalCount,
      hasNextPage: end < totalCount,
    },
  };
}

/**
 * Auth helpers
 */
function signToken({ userId, role }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in environment");

  // Keep it simple for POC
  return jwt.sign({ sub: userId, role }, secret, { expiresIn: "7d" });
}

function getUserFromAuthHeader(authHeader) {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  try {
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function requireAuth(ctx) {
  if (!ctx.user) throw new Error("Not authenticated");
}

function requireRole(ctx, allowedRoles = []) {
  requireAuth(ctx);
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new Error("Not authorized");
  }
}

const resolvers = {
  Query: {
    employees: (_, args, ctx) => {
      // both roles can query
      requireRole(ctx, ["admin", "employee"]);
      const filtered = applyFilters(db.employees, args.filter);
      const sorted = applySort(filtered, args.sort);
      return applyPagination(sorted, args.pagination);
    },

    employee: (_, { id }, ctx) => {
      requireRole(ctx, ["admin", "employee"]);
      return db.employees.find((e) => e.id === id) ?? null;
    },

    me: (_, __, ctx) => {
      if (!ctx.user) return null;
      return {
        token: ctx.token, // same token you sent
        role: ctx.user.role,
        userId: ctx.user.id,
      };
    },
  },

  Mutation: {
    login: (_, { email, password }) => {
      const e = normalizeString(email).toLowerCase();
      const p = normalizeString(password);

      const user = users.find((u) => u.email === e && u.password === p);
      if (!user) throw new Error("Invalid email or password");

      const token = signToken({ userId: user.id, role: user.role });
      return { token, role: user.role, userId: user.id };
    },

    addEmployee: (_, { input }, ctx) => {
      requireRole(ctx, ["admin"]);

      const name = normalizeString(input.name);
      if (!name) throw new Error("name is required");

      if (!Number.isInteger(input.age) || input.age < 0 || input.age > 120) {
        throw new Error("age must be a valid integer (0-120)");
      }

      validateClass(input.class);
      validateSubjects(input.subjects);
      validateAttendance(input.attendance);

      const now = new Date().toISOString();

      const employee = {
        id: `emp_${randomUUID()}`,
        name,
        age: input.age,
        class: normalizeString(input.class),
        subjects: input.subjects.map((s) => normalizeString(s)),
        attendance: input.attendance,
        flagged: false,
        createdAt: now,
        updatedAt: now,
      };

      db.employees.unshift(employee);
      return employee;
    },

    updateEmployee: (_, { id, input }, ctx) => {
      requireRole(ctx, ["admin"]);

      const idx = db.employees.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error("Employee not found");

      const current = db.employees[idx];
      const next = { ...current };

      if (input.name !== undefined) {
        const nm = normalizeString(input.name);
        if (!nm) throw new Error("name cannot be empty");
        next.name = nm;
      }

      if (input.age !== undefined) {
        if (!Number.isInteger(input.age) || input.age < 0 || input.age > 120) {
          throw new Error("age must be a valid integer (0-120)");
        }
        next.age = input.age;
      }

      if (input.class !== undefined) {
        validateClass(input.class);
        next.class = normalizeString(input.class);
      }

      if (input.subjects !== undefined) {
        validateSubjects(input.subjects);
        next.subjects = input.subjects.map((s) => normalizeString(s));
      }

      if (input.attendance !== undefined) {
        validateAttendance(input.attendance);
        next.attendance = input.attendance;
      }

      if (input.flagged !== undefined) {
        next.flagged = Boolean(input.flagged);
      }

      next.updatedAt = new Date().toISOString();
      db.employees[idx] = next;
      return next;
    },

    deleteEmployee: (_, { id }, ctx) => {
      requireRole(ctx, ["admin"]);

      const idx = db.employees.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      db.employees.splice(idx, 1);
      return true;
    },

    flagEmployee: (_, { id, flagged }, ctx) => {
      requireRole(ctx, ["admin"]);

      const idx = db.employees.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error("Employee not found");

      const next = {
        ...db.employees[idx],
        flagged: Boolean(flagged),
        updatedAt: new Date().toISOString(),
      };

      db.employees[idx] = next;
      return next;
    },
  },
};

async function start() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const PORT = Number(process.env.PORT || 4000);
  const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: async ({ req }) => {
      const auth = req.headers.authorization;
      const user = getUserFromAuthHeader(auth);
      const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
      return { req, user, token };
    },
    cors: {
      origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN,
      credentials: true,
    },
  });

  console.log(`✅ Apollo GraphQL ready at ${url}`);
  console.log("🔐 Demo users:");
  console.log("   admin@demo.com / admin123");
  console.log("   employee@demo.com / employee123");
}

start().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
