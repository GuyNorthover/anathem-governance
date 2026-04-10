"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  Position,
  Handle,
  NodeProps,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertCircle, Ban, MinusCircle, Clock } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type StepType = "action" | "decision" | "milestone" | "submission" | "approval";
type StepStatus = "not_started" | "in_progress" | "complete" | "blocked" | "not_applicable";
type Confidence = "high" | "medium" | "low";

export interface PathwayStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  step_type: StepType;
  is_mandatory: boolean;
  estimated_duration: string | null;
  regulatory_reference: string | null;
  dependencies: number[];
  confidence?: Confidence;
}

export interface StepProgress {
  step_id: string;
  status: StepStatus;
  notes: string;
  assigned_to: string;
  completion_date: string | null;
}

interface StepNodeData {
  step: PathwayStep;
  progress: StepProgress | null;
  showProgress: boolean;
  onStatusChange: (stepId: string, status: StepStatus) => void;
  onNotesChange: (stepId: string, notes: string) => void;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<StepType, { border: string; bg: string; badge: string; label: string }> = {
  action:     { border: "border-blue-300",   bg: "bg-blue-50",    badge: "bg-blue-100 text-blue-700",   label: "Action" },
  decision:   { border: "border-amber-300",  bg: "bg-amber-50",   badge: "bg-amber-100 text-amber-700", label: "Decision" },
  milestone:  { border: "border-violet-300", bg: "bg-violet-50",  badge: "bg-violet-100 text-violet-700", label: "Milestone" },
  submission: { border: "border-emerald-300",bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", label: "Submission" },
  approval:   { border: "border-green-300",  bg: "bg-green-50",   badge: "bg-green-100 text-green-700", label: "Approval" },
};

const STATUS_STYLES: Record<StepStatus, { ring: string; label: string }> = {
  not_started:    { ring: "ring-slate-200",  label: "Not started" },
  in_progress:    { ring: "ring-blue-400",   label: "In progress" },
  complete:       { ring: "ring-emerald-400",label: "Complete" },
  blocked:        { ring: "ring-red-400",    label: "Blocked" },
  not_applicable: { ring: "ring-slate-300",  label: "N/A" },
};

function StatusIcon({ status }: { status: StepStatus }) {
  const cls = "h-3.5 w-3.5 flex-shrink-0";
  switch (status) {
    case "complete":       return <CheckCircle2 className={cn(cls, "text-emerald-500")} />;
    case "in_progress":    return <Clock className={cn(cls, "text-blue-500")} />;
    case "blocked":        return <AlertCircle className={cn(cls, "text-red-500")} />;
    case "not_applicable": return <Ban className={cn(cls, "text-slate-400")} />;
    default:               return <Circle className={cn(cls, "text-slate-300")} />;
  }
}

// ── Regular step node ─────────────────────────────────────────────────────────

function StepNode({ data }: NodeProps<StepNodeData>) {
  const { step, progress, showProgress, onStatusChange, onNotesChange } = data;
  const typeStyle = TYPE_STYLES[step.step_type];
  const status = progress?.status ?? "not_started";
  const statusStyle = STATUS_STYLES[status];

  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-white shadow-sm transition-shadow hover:shadow-md",
        typeStyle.border,
        showProgress && `ring-2 ${statusStyle.ring}`,
        status === "not_applicable" && "opacity-60"
      )}
      style={{ width: 300 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />

      <div className={cn("rounded-t-xl px-4 py-2.5", typeStyle.bg)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">#{step.step_number}</span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", typeStyle.badge)}>
              {typeStyle.label}
            </span>
            {!step.is_mandatory && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                Optional
              </span>
            )}
          </div>
          {showProgress && <StatusIcon status={status} />}
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-800 leading-snug">{step.title}</p>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2">
        {step.description && (
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{step.description}</p>
        )}
        {step.regulatory_reference && (
          <p className="text-[10px] font-mono text-slate-400">{step.regulatory_reference}</p>
        )}
        {step.estimated_duration && (
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {step.estimated_duration}
          </p>
        )}

        {/* Progress controls */}
        {showProgress && (
          <div className="mt-1 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            <select
              value={status}
              onChange={(e) => onStatusChange(step.id, e.target.value as StepStatus)}
              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="complete">Complete</option>
              <option value="blocked">Blocked</option>
              <option value="not_applicable">Not applicable</option>
            </select>
            <textarea
              value={progress?.notes ?? ""}
              onChange={(e) => onNotesChange(step.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Notes…"
              rows={2}
              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

// ── Decision (diamond) node ───────────────────────────────────────────────────

function DecisionNode({ data }: NodeProps<StepNodeData>) {
  const { step, progress, showProgress, onStatusChange, onNotesChange } = data;
  const status = progress?.status ?? "not_started";
  const statusStyle = STATUS_STYLES[status];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        status === "not_applicable" && "opacity-60"
      )}
      style={{ width: 220 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />

      {/* Diamond */}
      <div
        className={cn(
          "flex items-center justify-center border-2 border-amber-300 bg-amber-50 shadow-sm",
          showProgress && `ring-2 ${statusStyle.ring}`
        )}
        style={{
          width: 140,
          height: 140,
          transform: "rotate(45deg)",
          borderRadius: 12,
        }}
      />
      {/* Content overlay (counter-rotated) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-4"
        style={{ top: 0, height: 140 }}
      >
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] font-bold text-slate-400">#{step.step_number}</span>
          {showProgress && <StatusIcon status={status} />}
        </div>
        <p className="text-[11px] font-semibold text-amber-800 text-center leading-snug line-clamp-3">
          {step.title}
        </p>
        <span className="mt-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
          Decision
        </span>
      </div>

      {/* Progress controls below diamond */}
      {showProgress && (
        <div className="mt-2 w-full flex flex-col gap-1.5 px-1">
          <select
            value={status}
            onChange={(e) => onStatusChange(step.id, e.target.value as StepStatus)}
            className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="complete">Complete</option>
            <option value="blocked">Blocked</option>
            <option value="not_applicable">Not applicable</option>
          </select>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-amber-400" style={{ bottom: showProgress ? -8 : -8 }} />
    </div>
  );
}

const nodeTypes = { step: StepNode, decision: DecisionNode };

// ── Layout algorithm ──────────────────────────────────────────────────────────

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  edgePairs: { from: string; to: string }[];
}

function buildLayout(steps: PathwayStep[]): LayoutResult {
  if (steps.length === 0) return { positions: new Map(), edgePairs: [] };

  const stepByNumber = new Map(steps.map((s) => [s.step_number, s]));

  // Build edge pairs: source step id → target step id
  const edgePairs: { from: string; to: string }[] = [];
  for (const step of steps) {
    const deps = Array.isArray(step.dependencies) ? step.dependencies : [];
    if (deps.length > 0) {
      for (const depNum of deps) {
        const dep = stepByNumber.get(depNum);
        if (dep) edgePairs.push({ from: dep.id, to: step.id });
      }
    } else if (step.step_number > 1) {
      const prev = stepByNumber.get(step.step_number - 1);
      if (prev) edgePairs.push({ from: prev.id, to: step.id });
    }
  }

  // Compute topological layers via BFS
  const inDeg = new Map(steps.map((s) => [s.id, 0]));
  const adj = new Map(steps.map((s) => [s.id, [] as string[]]));
  for (const { from, to } of edgePairs) {
    adj.get(from)!.push(to);
    inDeg.set(to, (inDeg.get(to) ?? 0) + 1);
  }

  const layer = new Map<string, number>();
  const queue = steps.filter((s) => inDeg.get(s.id) === 0).map((s) => s.id);
  queue.forEach((id) => layer.set(id, 0));

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const curLayer = layer.get(cur) ?? 0;
    for (const next of adj.get(cur) ?? []) {
      layer.set(next, Math.max(layer.get(next) ?? 0, curLayer + 1));
      inDeg.set(next, (inDeg.get(next) ?? 0) - 1);
      if (inDeg.get(next) === 0) queue.push(next);
    }
  }

  // Group by layer, sort by step_number within layer
  const byLayer = new Map<number, PathwayStep[]>();
  for (const step of steps) {
    const l = layer.get(step.id) ?? 0;
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l)!.push(step);
  }
  for (const layerSteps of Array.from(byLayer.values())) {
    layerSteps.sort((a: PathwayStep, b: PathwayStep) => a.step_number - b.step_number);
  }

  // Position nodes
  const NODE_Y_GAP = 260;
  const NODE_X_GAP = 380;

  const positions = new Map<string, { x: number; y: number }>();
  const maxLayer = Math.max(...Array.from(layer.values()));

  for (let l = 0; l <= maxLayer; l++) {
    const layerSteps = byLayer.get(l) ?? [];
    const totalWidth = (layerSteps.length - 1) * NODE_X_GAP;
    layerSteps.forEach((step, i) => {
      positions.set(step.id, {
        x: i * NODE_X_GAP - totalWidth / 2,
        y: l * NODE_Y_GAP,
      });
    });
  }

  return { positions, edgePairs };
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  steps: PathwayStep[];
  progressMap: Map<string, StepProgress>;
  showProgress: boolean;
  onStatusChange: (stepId: string, status: StepStatus) => void;
  onNotesChange: (stepId: string, notes: string) => void;
}

export function PathwayFlowchart({
  steps,
  progressMap,
  showProgress,
  onStatusChange,
  onNotesChange,
}: Props) {
  const { positions, edgePairs } = useMemo(() => buildLayout(steps), [steps]);

  const initialNodes: Node[] = useMemo(
    () =>
      steps.map((step) => {
        const pos = positions?.get(step.id) ?? { x: 0, y: step.step_number * 260 };
        return {
          id: step.id,
          type: step.step_type === "decision" ? "decision" : "step",
          position: pos,
          data: {
            step,
            progress: progressMap.get(step.id) ?? null,
            showProgress,
            onStatusChange,
            onNotesChange,
          } satisfies StepNodeData,
        };
      }),
    [steps, progressMap, showProgress, onStatusChange, onNotesChange, positions]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      (edgePairs ?? []).map(({ from, to }, i) => ({
        id: `e-${from}-${to}-${i}`,
        source: from,
        target: to,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        style: { stroke: "#94a3b8", strokeWidth: 2 },
        type: "smoothstep",
      })),
    [edgePairs]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when progressMap changes (statuses update)
  const syncedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          progress: progressMap.get(n.id) ?? null,
          showProgress,
        },
      })),
    [nodes, progressMap, showProgress]
  );

  if (steps.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No steps found in this pathway.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={syncedNodes}
      edges={initialEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={1.5}
      attributionPosition="bottom-right"
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
    </ReactFlow>
  );
}
