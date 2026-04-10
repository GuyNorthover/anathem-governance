"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { OrgRow, OrgModuleRow, ModuleRow } from "@/lib/supabase/database.types";
import { PLACEHOLDER_ORGS } from "@/lib/organisations/data";
import type { Organisation } from "@/lib/organisations/types";
import type { ModuleId } from "@/lib/knowledge-base/types";

// Cache modules lookup
let modulesCache: ModuleRow[] | null = null;
async function getModules(): Promise<ModuleRow[]> {
  if (modulesCache) return modulesCache;
  const { data } = await supabase.from("modules").select("*");
  modulesCache = data ?? [];
  return modulesCache;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso ?? "—"; }
}

function rowToOrg(
  row: OrgRow,
  orgModules: OrgModuleRow[],
  allModules: ModuleRow[]
): Organisation {
  const moduleMap = new Map(allModules.map((m) => [m.id, m.module_key as ModuleId]));
  const activeModules = orgModules
    .filter((om) => !om.deactivated_at)
    .map((om) => moduleMap.get(om.module_id))
    .filter((m): m is ModuleId => !!m);

  return {
    id: row.id,
    name: row.name,
    shortName: row.ods_code,
    odsCode: row.ods_code,
    region: row.region,
    status: row.status,
    activeModules,
    contacts: [],
    onboardedAt: formatDate(row.created_at),
    lastActivityAt: formatDate(row.updated_at),
  };
}

export function useOrganisations() {
  const [data, setData] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data: rows, error: err }, { data: orgModuleRows }, allModules] = await Promise.all([
      supabase.from("organisations").select("*").order("name"),
      supabase.from("org_modules").select("*"),
      getModules(),
    ]);

    if (err) {
      setError(err.message);
      setData(PLACEHOLDER_ORGS);
    } else if (!rows || rows.length === 0) {
      setData(PLACEHOLDER_ORGS);
    } else {
      const modulesByOrg = (orgModuleRows ?? []).reduce<Record<string, OrgModuleRow[]>>((acc, om) => {
        (acc[om.org_id] ??= []).push(om);
        return acc;
      }, {});
      setData(rows.map((row) => rowToOrg(row, modulesByOrg[row.id] ?? [], allModules)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleModule(orgId: string, moduleKey: string, activate: boolean) {
    const allModules = await getModules();
    const mod = allModules.find((m) => m.module_key === moduleKey);
    if (!mod) return null;

    if (activate) {
      // Check if a row already exists (may be deactivated)
      const { data: existing } = await supabase
        .from("org_modules")
        .select("id")
        .eq("org_id", orgId)
        .eq("module_id", mod.id)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("org_modules")
          .update({ deactivated_at: null, activated_at: new Date().toISOString() })
          .eq("id", existing.id));
      } else {
        ({ error } = await supabase.from("org_modules").insert({
          id: crypto.randomUUID(),
          org_id: orgId,
          module_id: mod.id,
          activated_at: new Date().toISOString(),
          deactivated_at: null,
        }));
      }
      if (!error) load();
      return error ?? null;
    } else {
      const { error } = await supabase
        .from("org_modules")
        .update({ deactivated_at: new Date().toISOString() })
        .eq("org_id", orgId)
        .eq("module_id", mod.id);
      if (!error) load();
      return error ?? null;
    }
  }

  return { data, loading, error, reload: load, toggleModule };
}

export function useOrganisation(id: string) {
  const { data, loading, error, reload } = useOrganisations();
  return { data: data.find((o) => o.id === id) ?? null, loading, error, reload };
}
