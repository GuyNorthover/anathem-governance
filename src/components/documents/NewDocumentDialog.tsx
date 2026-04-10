"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";

interface DocType {
  id: string;
  display_name: string;
  type_key: string;
}

interface Org {
  id: string;
  name: string;
}

interface NewDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewDocumentDialog({ open, onClose, onCreated }: NewDocumentDialogProps) {
  const router = useRouter();
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from("document_types").select("id, display_name, type_key").eq("is_active", true).order("display_name"),
      supabase.from("organisations").select("id, name").eq("status", "active").order("name"),
    ]).then(([{ data: dt }, { data: og }]) => {
      setDocTypes(dt ?? []);
      setOrgs(og ?? []);
    });
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedDocType("");
      setSelectedOrg("");
      setError("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!selectedDocType || !selectedOrg) {
      setError("Please select both a document type and an organisation.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const now = new Date().toISOString();
      const { data: inserted, error: insertErr } = await supabase
        .from("document_instances")
        .insert({
          org_id: selectedOrg,
          document_type_id: selectedDocType,
          status: "draft",
          stale_reason: null,
          created_at: now,
          updated_at: now,
          submitted_at: null,
          approved_at: null,
          generated_at: null,
        })
        .select("id")
        .single();

      if (insertErr || !inserted) throw new Error(insertErr?.message ?? "Insert failed");

      await supabase.from("audit_log").insert({
        id: crypto.randomUUID(),
        event_type: "document.created",
        actor_id: null,
        payload: {
          category: "document",
          summary: `New document created for ${orgs.find((o) => o.id === selectedOrg)?.name}`,
          document_instance_id: inserted.id,
          document_type_id: selectedDocType,
          org_id: selectedOrg,
        },
        created_at: now,
      });

      onCreated();
      router.push(`/documents/${inserted.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Document</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Document type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-slate-700">Document type</Label>
            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a document type…" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Organisation */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-slate-700">Organisation</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select an NHS trust…" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={saving || !selectedDocType || !selectedOrg}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Create Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
