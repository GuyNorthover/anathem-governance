import type { ModuleId } from "@/lib/knowledge-base/types";

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "submitted"
  | "stale";

export type SectionStatus = "draft" | "approved";

export interface DocumentSection {
  id: string;
  title: string;
  factKeys: string[];
  promptId: string;
  generatedContent: string;
  approvedContent: string | null;
  status: SectionStatus;
  generatedAt: string;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface DocumentInstance {
  id: string;
  docTypeId: string;
  docTypeName: string;
  docTypeCategory: DocumentCategory;
  orgId: string;
  orgName: string;
  activeModules: ModuleId[];
  status: DocumentStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  staleFactKey?: string;
  staleFactChangedAt?: string;
  sections: DocumentSection[];
}

export type DocumentCategory =
  | "clinical-safety"
  | "ig"
  | "procurement"
  | "regulatory"
  | "nhse";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  "clinical-safety": "Clinical Safety",
  ig: "IG",
  procurement: "Procurement",
  regulatory: "Regulatory",
  nhse: "NHSE",
};

export const CATEGORY_STYLES: Record<DocumentCategory, string> = {
  "clinical-safety": "bg-blue-50 text-blue-700 border-blue-200",
  ig: "bg-purple-50 text-purple-700 border-purple-200",
  procurement: "bg-teal-50 text-teal-700 border-teal-200",
  regulatory: "bg-orange-50 text-orange-700 border-orange-200",
  nhse: "bg-green-50 text-green-700 border-green-200",
};

export const STATUS_STYLES: Record<DocumentStatus, { pill: string; dot: string; label: string }> = {
  draft: { pill: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: "Draft" },
  pending_review: { pill: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400", label: "Pending Review" },
  approved: { pill: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500", label: "Approved" },
  submitted: { pill: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Submitted" },
  stale: { pill: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Stale" },
};
