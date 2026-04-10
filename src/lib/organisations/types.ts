import type { ModuleId } from "@/lib/knowledge-base/types";

export interface OrgContact {
  name: string;
  role: string;
  email: string;
}

export interface Organisation {
  id: string;
  name: string;
  shortName: string;
  odsCode: string;
  region: string;
  status?: "active" | "inactive" | "onboarding";
  activeModules: ModuleId[];
  contacts: OrgContact[];
  onboardedAt: string;
  lastActivityAt: string;
  notes?: string;
}
