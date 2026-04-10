export type IngestionStatus =
  | "uploading"
  | "processing"
  | "mapping"
  | "review"
  | "complete"
  | "failed";

export type QuestionStatus = "pending" | "drafted" | "approved" | "rejected";

export interface ExtractedQuestion {
  id: string;
  jobId: string;
  index: number;
  sectionLabel?: string;
  questionRef?: string;
  questionText: string;
  status: QuestionStatus;
  mappedFactKeys: string[];
  mappedFactValues?: Record<string, string>; // key → resolved value
  promptKey?: string;
  draftAnswer?: string;
  approvedAnswer?: string;
  reviewNote?: string;
}

export interface IngestionJob {
  id: string;
  filename: string;
  documentType: string;
  orgId?: string;
  orgName?: string;
  status: IngestionStatus;
  uploadedAt: string;
  processedAt?: string;
  uploadedBy: string;
  totalQuestions: number;
  draftedCount: number;
  approvedCount: number;
  failureReason?: string;
}

// ── Display meta ──────────────────────────────────────────────────────────────

export const INGESTION_STATUS_META: Record<
  IngestionStatus,
  { label: string; style: string; dot: string }
> = {
  uploading:  { label: "Uploading",   style: "border-blue-200 bg-blue-50 text-blue-700",   dot: "bg-blue-400" },
  processing: { label: "Processing",  style: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  mapping:    { label: "Mapping",     style: "border-purple-200 bg-purple-50 text-purple-700", dot: "bg-purple-400" },
  review:     { label: "In Review",   style: "border-indigo-200 bg-indigo-50 text-indigo-700", dot: "bg-indigo-400" },
  complete:   { label: "Complete",    style: "border-green-200 bg-green-50 text-green-700", dot: "bg-green-400" },
  failed:     { label: "Failed",      style: "border-red-200 bg-red-50 text-red-700",      dot: "bg-red-400" },
};

export const QUESTION_STATUS_META: Record<
  QuestionStatus,
  { label: string; style: string; dotClass: string }
> = {
  pending:  { label: "Pending",  style: "text-slate-400",  dotClass: "bg-slate-300" },
  drafted:  { label: "Drafted",  style: "text-amber-600",  dotClass: "bg-amber-400" },
  approved: { label: "Approved", style: "text-green-600",  dotClass: "bg-green-500" },
  rejected: { label: "Rejected", style: "text-red-500",    dotClass: "bg-red-400" },
};
