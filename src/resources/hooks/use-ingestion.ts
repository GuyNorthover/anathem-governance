"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { IngestionJobRow, IngestionQuestionRow } from "@/lib/supabase/database.types";
import { PLACEHOLDER_INGESTION_JOBS, PLACEHOLDER_QUESTIONS } from "@/lib/ingestion/data";
import type { IngestionJob, ExtractedQuestion } from "@/lib/ingestion/types";

function rowToJob(row: IngestionJobRow): IngestionJob {
  return {
    id: row.id,
    filename: row.file_name,
    documentType: row.file_path, // file_path used as document type label until schema clarified
    orgId: row.org_id ?? undefined,
    status: row.status,
    uploadedAt: row.created_at,
    uploadedBy: row.uploaded_by,
    totalQuestions: 0,
    draftedCount: 0,
    approvedCount: 0,
    failureReason: row.error_message ?? undefined,
  };
}

function rowToQuestion(row: IngestionQuestionRow): ExtractedQuestion {
  return {
    id: row.id,
    jobId: row.ingestion_job_id,
    index: 0,
    questionText: row.question_text,
    status: row.status,
    mappedFactKeys: row.matched_fact_keys,
    promptKey: row.prompt_id ?? undefined,
  };
}

export function useIngestionJobs() {
  const [data, setData] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data: rows, error: err }, { data: qCounts }] = await Promise.all([
      supabase.from("ingestion_jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("ingestion_question_mappings").select("ingestion_job_id, status"),
    ]);

    if (err) {
      setError(err.message);
      setData(PLACEHOLDER_INGESTION_JOBS);
    } else if (!rows || rows.length === 0) {
      setData(PLACEHOLDER_INGESTION_JOBS);
    } else {
      // Build question count maps per job
      const totalMap: Record<string, number> = {};
      const draftedMap: Record<string, number> = {};
      const approvedMap: Record<string, number> = {};
      for (const q of qCounts ?? []) {
        totalMap[q.ingestion_job_id] = (totalMap[q.ingestion_job_id] ?? 0) + 1;
        if (q.status === "drafted") draftedMap[q.ingestion_job_id] = (draftedMap[q.ingestion_job_id] ?? 0) + 1;
        if (q.status === "approved") approvedMap[q.ingestion_job_id] = (approvedMap[q.ingestion_job_id] ?? 0) + 1;
      }
      setData(rows.map((row) => ({
        ...rowToJob(row),
        totalQuestions: totalMap[row.id] ?? 0,
        draftedCount: draftedMap[row.id] ?? 0,
        approvedCount: approvedMap[row.id] ?? 0,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useIngestionDetail(jobId: string) {
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data: jobRow, error: e1 }, { data: qRows, error: e2 }] = await Promise.all([
      supabase.from("ingestion_jobs").select("*").eq("id", jobId).single(),
      supabase.from("ingestion_question_mappings").select("*").eq("ingestion_job_id", jobId),
    ]);

    if (e1 || !jobRow) {
      const placeholder = PLACEHOLDER_INGESTION_JOBS.find((j) => j.id === jobId) ?? null;
      setJob(placeholder);
      setQuestions(PLACEHOLDER_QUESTIONS[jobId] ?? []);
    } else {
      setJob(rowToJob(jobRow));
      setQuestions(e2 || !qRows || qRows.length === 0
        ? (PLACEHOLDER_QUESTIONS[jobId] ?? [])
        : qRows.map(rowToQuestion));
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  async function approveQuestion(questionId: string, _answer: string) {
    const { error } = await supabase
      .from("ingestion_question_mappings")
      .update({ status: "approved" })
      .eq("id", questionId);
    if (!error) {
      setQuestions((prev) =>
        prev.map((q) => q.id === questionId ? { ...q, status: "approved" as const, approvedAnswer: _answer } : q)
      );
    }
    return error;
  }

  async function rejectQuestion(questionId: string, note: string) {
    const { error } = await supabase
      .from("ingestion_question_mappings")
      .update({ status: "rejected" })
      .eq("id", questionId);
    if (!error) {
      setQuestions((prev) =>
        prev.map((q) => q.id === questionId ? { ...q, status: "rejected" as const, reviewNote: note } : q)
      );
    }
    return error;
  }

  async function updateDraft(questionId: string, answer: string) {
    // draft_answer column doesn't exist in real schema — update local state only
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, draftAnswer: answer, approvedAnswer: undefined, status: "drafted" as const } : q
      )
    );
    return null;
  }

  async function generateDraft(questionId: string, orgId?: string) {
    const res = await fetch("/api/ingest/generate-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, orgId: orgId ?? null }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error ?? "Generation failed" };

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              draftAnswer: json.draft,
              mappedFactValues: json.resolvedFacts ?? {},
              status: "drafted" as const,
            }
          : q
      )
    );
    return { draft: json.draft as string };
  }

  return { job, questions, setQuestions, loading, error, reload: load, approveQuestion, rejectQuestion, updateDraft, generateDraft };
}
