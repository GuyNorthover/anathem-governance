"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgContextValue {
  activeOrgId: string | null;
  activeOrgName: string | null;
  setActiveOrg: (id: string, name: string) => void;
  clearActiveOrg: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const OrgContext = createContext<OrgContextValue>({
  activeOrgId:   null,
  activeOrgName: null,
  setActiveOrg:  () => {},
  clearActiveOrg: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrgId,   setActiveOrgId]   = useState<string | null>(null);
  const [activeOrgName, setActiveOrgName] = useState<string | null>(null);

  // Restore persisted selection from sessionStorage on mount
  useEffect(() => {
    const id   = sessionStorage.getItem("gov_activeOrgId");
    const name = sessionStorage.getItem("gov_activeOrgName");
    if (id && name) {
      setActiveOrgId(id);
      setActiveOrgName(name);
    }
  }, []);

  function setActiveOrg(id: string, name: string) {
    setActiveOrgId(id);
    setActiveOrgName(name);
    sessionStorage.setItem("gov_activeOrgId",   id);
    sessionStorage.setItem("gov_activeOrgName", name);
  }

  function clearActiveOrg() {
    setActiveOrgId(null);
    setActiveOrgName(null);
    sessionStorage.removeItem("gov_activeOrgId");
    sessionStorage.removeItem("gov_activeOrgName");
  }

  return (
    <OrgContext.Provider value={{ activeOrgId, activeOrgName, setActiveOrg, clearActiveOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOrgContext(): OrgContextValue {
  return useContext(OrgContext);
}
