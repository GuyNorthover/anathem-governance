export type FactTier = "global" | "module" | "org_instance";
export type FactDomain = "clinical" | "technical" | "data" | "legal" | "evidence";
export type FactValueType = "string" | "number" | "boolean" | "date" | "list";
export type ModuleId =
  | "mental-health"
  | "police"
  | "neurodevelopmental"
  | "patient-crm";

export interface FactVersion {
  id: string;
  value: string;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export interface Fact {
  id: string;
  key: string;
  value: string;
  valueType: FactValueType;
  domain: FactDomain;
  tier: FactTier;
  module?: ModuleId;
  orgId?: string;
  orgName?: string;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  dependentDocumentCount: number;
  relatedFactKeys: string[];
  versions: FactVersion[];
}

export const MODULE_LABELS: Record<ModuleId, string> = {
  "mental-health": "Mental Health",
  police: "Police",
  neurodevelopmental: "Neurodevelopmental",
  "patient-crm": "Patient CRM",
};

export const DOMAIN_LABELS: Record<FactDomain, string> = {
  clinical: "Clinical",
  technical: "Technical",
  data: "Data",
  legal: "Legal",
  evidence: "Evidence",
};

export const TIER_LABELS: Record<FactTier, string> = {
  global: "Global",
  module: "Module",
  org_instance: "Org-Instance",
};
