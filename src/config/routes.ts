export const ROUTES = {
  DASHBOARD: "/",
  KNOWLEDGE_BASE: "/knowledge-base",
  SOURCE_DOCS: "/source-docs",
  DOCUMENTS: "/documents",
  ORGANISATIONS: "/organisations",
  PATHWAYS: "/pathways",
  HAZARD_LOG: "/hazard-log",
  EU_ACCREDITATION: "/eu-accreditation",
  EU_TEMPLATES: "/eu-templates",
  BUSINESS_CASE_BUILDER: "/business-case-builder",
  PROMPTS: "/prompts",
  INGESTION: "/ingestion",
  AUDIT: "/audit",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
