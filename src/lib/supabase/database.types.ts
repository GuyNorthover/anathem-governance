export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      facts: {
        Row: {
          id: string;
          fact_key: string;
          display_name: string;
          description: string;
          tier: "global" | "module" | "org_instance";
          domain: "clinical" | "technical" | "data" | "legal" | "evidence";
          value_type: "string" | "boolean" | "number" | "date" | "url";
          current_value: string;
          module_id: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["facts"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["facts"]["Insert"]>;
      };
      fact_versions: {
        Row: {
          id: string;
          fact_id: string;
          version_number: number;
          value: string;
          changed_by: string | null;
          changed_at: string;
          change_reason: string;
        };
        Insert: Database["public"]["Tables"]["fact_versions"]["Row"];
        Update: Partial<Database["public"]["Tables"]["fact_versions"]["Row"]>;
      };
      organisations: {
        Row: {
          id: string;
          name: string;
          ods_code: string;
          region: string;
          status: "active" | "inactive" | "onboarding";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organisations"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["organisations"]["Insert"]>;
      };
      org_facts: {
        Row: {
          id: string;
          org_id: string;
          fact_id: string;
          value: string;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["org_facts"]["Row"];
        Update: Partial<Database["public"]["Tables"]["org_facts"]["Row"]>;
      };
      org_modules: {
        Row: {
          id: string;
          org_id: string;
          module_id: string;
          activated_at: string | null;
          deactivated_at: string | null;
        };
        Insert: Database["public"]["Tables"]["org_modules"]["Row"];
        Update: Partial<Database["public"]["Tables"]["org_modules"]["Row"]>;
      };
      modules: {
        Row: {
          id: string;
          module_key: string;
          display_name: string;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // read-only seed data
        Update: never;
      };
      document_types: {
        Row: {
          id: string;
          type_key: string;
          display_name: string;
          description: string;
          framework: string;
          version: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // read-only seed data
        Update: never;
      };
      document_instances: {
        Row: {
          id: string;
          org_id: string | null;
          document_type_id: string;
          status: "draft" | "pending_review" | "approved" | "submitted" | "stale";
          stale_reason: string | null;
          created_at: string;
          updated_at: string;
          submitted_at: string | null;
          approved_at: string | null;
          generated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["document_instances"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["document_instances"]["Insert"]>;
      };
      document_sections: {
        Row: {
          id: string;
          document_instance_id: string;
          title: string;
          content: string | null;
          prompt_id: string | null;
          prompt_version_number: number | null;
          fact_keys_used: string[];
          status: "draft" | "approved";
          generated_at: string;
          approved_at: string | null;
          approved_by: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["document_sections"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["document_sections"]["Insert"]>;
      };
      prompts: {
        Row: {
          id: string;
          prompt_key: string;
          display_name: string;
          status: "approved" | "suggested" | "rejected";
          target_section: string;
          output_format: "prose" | "list" | "table" | "structured";
          purpose: string;
          input_fact_keys: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prompts"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["prompts"]["Insert"]>;
      };
      prompt_versions: {
        Row: {
          id: string;
          prompt_id: string;
          version_number: number;
          prompt_text: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prompt_versions"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["prompt_versions"]["Insert"]>;
      };
      audit_log: {
        Row: {
          id: string;
          event_type: string;
          actor_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["audit_log"]["Row"];
        Update: never; // immutable
      };
      ingestion_jobs: {
        Row: {
          id: string;
          file_name: string;
          file_path: string;
          org_id: string | null;
          status: "uploading" | "processing" | "mapping" | "review" | "complete" | "failed";
          uploaded_by: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ingestion_jobs"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["ingestion_jobs"]["Insert"]>;
      };
      ingestion_question_mappings: {
        Row: {
          id: string;
          ingestion_job_id: string;
          question_text: string;
          status: "pending" | "drafted" | "approved" | "rejected";
          matched_fact_keys: string[];
          prompt_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ingestion_question_mappings"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["ingestion_question_mappings"]["Insert"]>;
      };
      users: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
    };
  };
}

// Convenience row types
export type FactRow = Database["public"]["Tables"]["facts"]["Row"];
export type FactVersionRow = Database["public"]["Tables"]["fact_versions"]["Row"];
export type OrgRow = Database["public"]["Tables"]["organisations"]["Row"];
export type OrgFactRow = Database["public"]["Tables"]["org_facts"]["Row"];
export type OrgModuleRow = Database["public"]["Tables"]["org_modules"]["Row"];
export type ModuleRow = Database["public"]["Tables"]["modules"]["Row"];
export type DocumentTypeRow = Database["public"]["Tables"]["document_types"]["Row"];
export type DocumentInstanceRow = Database["public"]["Tables"]["document_instances"]["Row"];
export type DocumentSectionRow = Database["public"]["Tables"]["document_sections"]["Row"];
export type DocumentSectionInsert = Database["public"]["Tables"]["document_sections"]["Insert"];
export type PromptRow = Database["public"]["Tables"]["prompts"]["Row"];
export type PromptVersionRow = Database["public"]["Tables"]["prompt_versions"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];
export type IngestionJobRow = Database["public"]["Tables"]["ingestion_jobs"]["Row"];
export type IngestionQuestionRow = Database["public"]["Tables"]["ingestion_question_mappings"]["Row"];
