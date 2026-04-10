export type AuditEventType =
  | "fact.created"
  | "fact.updated"
  | "document.created"
  | "document.generated"
  | "document.section_approved"
  | "document.approved"
  | "document.submitted"
  | "document.stale"
  | "prompt.created"
  | "prompt.approved"
  | "prompt.rejected"
  | "prompt.version_created"
  | "generation.completed"
  | "org.created"
  | "org.module_changed"
  | "user.login"
  | "user.logout";

export type AuditEventCategory =
  | "knowledge-base"
  | "document"
  | "prompt"
  | "generation"
  | "organisation"
  | "auth";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  category: AuditEventCategory;
  actor: string;
  actorRole: "admin" | "editor" | "viewer" | "system";
  timestamp: string;
  // Human-readable summary
  summary: string;
  // Structured detail payload
  detail: Record<string, string | number | boolean | null>;
  // Related entity references
  relatedEntityType?: "fact" | "document" | "prompt" | "organisation" | "generation";
  relatedEntityId?: string;
  relatedEntityLabel?: string;
}

export const EVENT_CATEGORY_META: Record<
  AuditEventCategory,
  { label: string; style: string; dot: string }
> = {
  "knowledge-base": { label: "Knowledge Base", style: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  document:         { label: "Document",        style: "bg-teal-50 text-teal-700 border-teal-200",   dot: "bg-teal-500" },
  prompt:           { label: "Prompt",          style: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  generation:       { label: "Generation",      style: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  organisation:     { label: "Organisation",    style: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  auth:             { label: "Auth",            style: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

export const EVENT_TYPE_LABELS: Record<AuditEventType, string> = {
  "fact.created":              "Fact Created",
  "fact.updated":              "Fact Updated",
  "document.created":          "Document Created",
  "document.generated":        "Document Generated",
  "document.section_approved": "Section Approved",
  "document.approved":         "Document Approved",
  "document.submitted":        "Document Submitted",
  "document.stale":            "Document Marked Stale",
  "prompt.created":            "Prompt Created",
  "prompt.approved":           "Prompt Approved",
  "prompt.rejected":           "Prompt Rejected",
  "prompt.version_created":    "Prompt Version Created",
  "generation.completed":      "Generation Completed",
  "org.created":               "Organisation Added",
  "org.module_changed":        "Module Activation Changed",
  "user.login":                "User Login",
  "user.logout":               "User Logout",
};
