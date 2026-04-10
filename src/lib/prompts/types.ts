export type PromptStatus = "suggested" | "approved" | "rejected";
export type OutputFormat = "prose" | "structured" | "table" | "list";

export type PromptCategory =
  | "clinical-safety"
  | "intended-purpose"
  | "data-flows"
  | "risk-management"
  | "evidence"
  | "avt-registry"
  | "ig-questionnaire"
  | "ingestion-mapping"
  | "ingestion-drafting";

export interface PromptVersion {
  id: string;
  versionNumber: number;
  promptText: string;
  systemContext?: string;
  changeNotes: string;
  createdBy: string;
  createdAt: string;
}

export interface Prompt {
  id: string;
  promptKey: string;
  displayName: string;
  purpose: string;
  targetSection: string;
  inputFactKeys: string[];
  outputFormat: OutputFormat;
  category: PromptCategory;
  status: PromptStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  currentVersion: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  versions: PromptVersion[];
}

export const CATEGORY_META: Record<
  PromptCategory,
  { label: string; style: string }
> = {
  "clinical-safety":   { label: "Clinical Safety",    style: "bg-blue-50 text-blue-700 border-blue-200" },
  "intended-purpose":  { label: "Intended Purpose",   style: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "data-flows":        { label: "Data Flows",         style: "bg-teal-50 text-teal-700 border-teal-200" },
  "risk-management":   { label: "Risk Management",    style: "bg-red-50 text-red-700 border-red-200" },
  "evidence":          { label: "Evidence",           style: "bg-green-50 text-green-700 border-green-200" },
  "avt-registry":      { label: "AVT Registry",       style: "bg-purple-50 text-purple-700 border-purple-200" },
  "ig-questionnaire":  { label: "IG Questionnaire",   style: "bg-orange-50 text-orange-700 border-orange-200" },
  "ingestion-mapping": { label: "Ingestion — Mapping",  style: "bg-slate-100 text-slate-600 border-slate-200" },
  "ingestion-drafting":{ label: "Ingestion — Drafting", style: "bg-pink-50 text-pink-700 border-pink-200" },
};

export const STATUS_META: Record<
  PromptStatus,
  { label: string; style: string; dot: string }
> = {
  suggested: { label: "Pending Review", style: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  approved:  { label: "Approved",       style: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  rejected:  { label: "Rejected",       style: "bg-red-50 text-red-700 border-red-200",       dot: "bg-red-500" },
};
