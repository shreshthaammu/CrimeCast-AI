import { createContext, useContext, useState } from "react";

export type WorkspaceRole = "investigator" | "analyst" | "admin";

export type OperatorProfile = {
  name: string;
  badgeId: string;
  designation: string;
  email: string;
  role: WorkspaceRole;
};

type AuthContextValue = {
  user: OperatorProfile | null;
  login: (email: string, password: string, role: WorkspaceRole) => boolean;
  switchRole: (role: WorkspaceRole) => void;
  logout: () => void;
};

const accounts: Record<string, OperatorProfile> = {
  "a.rao@crimecast.gov.in": {
    name: "A. Rao",
    badgeId: "CYB-0042",
    designation: "Senior Field Investigator",
    email: "a.rao@crimecast.gov.in",
    role: "investigator",
  },
  "n.mehta@crimecast.gov.in": {
    name: "N. Mehta",
    badgeId: "INT-0118",
    designation: "Lead Intelligence Analyst",
    email: "n.mehta@crimecast.gov.in",
    role: "analyst",
  },
  "r.sen@crimecast.gov.in": {
    name: "R. Sen",
    badgeId: "CMD-0007",
    designation: "Command Administrator",
    email: "r.sen@crimecast.gov.in",
    role: "admin",
  },
};

const roleAccounts: Record<WorkspaceRole, OperatorProfile> = {
  investigator: accounts["a.rao@crimecast.gov.in"],
  analyst: accounts["n.mehta@crimecast.gov.in"],
  admin: accounts["r.sen@crimecast.gov.in"],
};

const STORAGE_KEY = "crimecast-operator-v2";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OperatorProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role && roleAccounts[parsed.role as WorkspaceRole]) {
          return parsed;
        }
      }
      return accounts["a.rao@crimecast.gov.in"];
    } catch {
      return accounts["a.rao@crimecast.gov.in"];
    }
  });

  const login = (email: string, password: string, role: WorkspaceRole) => {
    const normalized = email.trim().toLowerCase();
    const account = accounts[normalized] || roleAccounts[role];
    if (!password.trim() || account.role !== role) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    setUser(account);
    return true;
  };

  const switchRole = (newRole: WorkspaceRole) => {
    const account = roleAccounts[newRole] || accounts["a.rao@crimecast.gov.in"];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    setUser(account);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
