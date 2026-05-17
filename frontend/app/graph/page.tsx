"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import { useResult } from "../components/ResultContext";
import { GitBranch, Upload, Info } from "lucide-react";

const TYPE_STYLES: Record<string, { fill: string; stroke: string; text: string }> = {
  diagnosis: { fill: "#EEF3FF", stroke: "#0057FF", text: "#0057FF" },
  medication: { fill: "#ECFDF5", stroke: "#00875A", text: "#00875A" },
  lab: { fill: "#F5F3FF", stroke: "#6B21A8", text: "#6B21A8" },
  procedure: { fill: "#FFF3EC", stroke: "#D94F00", text: "#D94F00" },
  encounter: { fill: "#FFFBEB", stroke: "#B45309", text: "#B45309" },
  allergy: { fill: "#FFF5F5", stroke: "#E00000", text: "#E00000" },
  patient: { fill: "#111111", stroke: "#111111", text: "#FFFFFF" },
  risk: { fill: "#FFF5F5", stroke: "#E00000", text: "#E00000" },
};

interface GNode { id: string; label: string; type: string; x: number; y: number; r: number }
interface GLink { source: string; target: string; label?: string }

function buildGraph(result: NonNullable<ReturnType<typeof useResult>["result"]>) {
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  const seen = new Set<string>();

  const add = (id: string, label: string, type: string, r = 26) => {
    if (!seen.has(id)) { seen.add(id); nodes.push({ id, label, type, x: 0, y: 0, r }); }
  };

  add("patient", result.patient_name.split(" ")[0], "patient", 34);

  result.timeline.forEach((ev) => {
    const cat = ev.category?.toLowerCase() || "other";
    const short = ev.event.length > 18 ? ev.event.slice(0, 18) + "…" : ev.event;
    const id = `${cat}-${ev.event.slice(0, 12)}`;
    add(id, short, cat);
    links.push({ source: "patient", target: id, label: cat });
  });

  result.risks.forEach((r) => {
    const id = `risk-${r.type}`;
    add(id, r.type.slice(0, 14), "risk", 22);
    const peer = nodes.find((n) => n.type !== "risk" && n.type !== "patient");
    links.push({ source: peer?.id ?? "patient", target: id, label: "risk" });
  });

  const cx = 420, cy = 310, count = nodes.length;
  nodes.forEach((n, i) => {
    if (i === 0) { n.x = cx; n.y = cy; return; }
    const angle = (2 * Math.PI * (i - 1)) / (count - 1);
    const r = i % 2 === 0 ? 200 : 130;
    n.x = cx + r * Math.cos(angle);
    n.y = cy + r * Math.sin(angle);
  });

  return { nodes, links };
}

export default function GraphPage() {
  const { result } = useResult();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    if (!result) return { nodes: [], links: [] };
    return buildGraph(result);
  }, [result]);

  if (!result) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <GitBranch className="w-8 h-8 text-[#A0A0A0] mx-auto mb-3" />
          <p className="font-bold mb-1">No patient data loaded</p>
          <p className="text-sm text-[#5C5C5C] mb-6">Upload records to generate the intelligence graph.</p>
          <Link href="/upload" className="btn btn-red">
            <Upload className="w-4 h-4" /> Upload Records
          </Link>
        </div>
      </AppShell>
    );
  }

  const focus = selected || hovered;
  const relatedLinks = focus ? links.filter((l) => l.source === focus || l.target === focus) : [];
  const selectedNode = nodes.find((n) => n.id === focus);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="pb-5" style={{ borderBottom: "2px solid #111111" }}>
          <p className="label mb-1">Patient Intelligence Graph</p>
          <h1 className="text-2xl font-black">{result.patient_name}</h1>
          <p className="text-sm text-[#5C5C5C] mt-1">
            {nodes.length} nodes · {links.length} relationships
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_260px] gap-4">
          {/* Canvas */}
          <div style={{ border: "2px solid #111111", boxShadow: "4px 4px 0 #111111", background: "#FAFAFA", height: 600 }}>
            <svg width="100%" height="100%" viewBox="0 0 840 620" className="select-none">
              {links.map((link, i) => {
                const s = nodes.find((n) => n.id === link.source);
                const t = nodes.find((n) => n.id === link.target);
                if (!s || !t) return null;
                const related = relatedLinks.some((l) => l.source === link.source && l.target === link.target);
                return (
                  <line
                    key={i}
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={related ? "#E00000" : "#E8E8E8"}
                    strokeWidth={related ? 2 : 1}
                    opacity={focus && !related ? 0.15 : 1}
                  />
                );
              })}
              {nodes.map((node) => {
                const s = TYPE_STYLES[node.type] ?? TYPE_STYLES.diagnosis;
                const isActive = hovered === node.id || selected === node.id;
                const related = focus ? (node.id === focus || relatedLinks.some((l) => l.source === node.id || l.target === node.id)) : true;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(selected === node.id ? null : node.id)}
                    opacity={focus && !related ? 0.2 : 1}
                  >
                    <rect
                      x={-(node.r)} y={-(node.r * 0.7)}
                      width={node.r * 2} height={node.r * 1.4}
                      fill={s.fill}
                      stroke={isActive ? "#111111" : s.stroke}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fontSize={node.type === "patient" ? 11 : 8}
                      fontWeight={node.type === "patient" ? "800" : "600"}
                      fill={s.text}
                      className="pointer-events-none"
                      fontFamily="var(--font-geist-sans)"
                    >
                      {node.label.length > 14 ? node.label.slice(0, 14) + "…" : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side panel */}
          <div className="space-y-3">
            {/* Legend */}
            <div style={{ border: "2px solid #111111", padding: "16px" }}>
              <p className="label mb-3">Node Types</p>
              <div className="space-y-1.5">
                {Object.entries(TYPE_STYLES).slice(0, 7).map(([type, s]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-8 h-3" style={{ background: s.fill, border: `1.5px solid ${s.stroke}` }} />
                    <span className="text-xs font-medium capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node Detail */}
            {selectedNode ? (
              <div style={{ border: "2px solid #111111", boxShadow: "3px 3px 0 #111111", padding: "16px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3"
                    style={{ background: (TYPE_STYLES[selectedNode.type] ?? TYPE_STYLES.diagnosis).stroke }}
                  />
                  <p className="label capitalize">{selectedNode.type}</p>
                </div>
                <p className="font-bold text-sm mb-3">{selectedNode.label}</p>
                <p className="label mb-2">{relatedLinks.length} connection{relatedLinks.length !== 1 ? "s" : ""}</p>
                <div className="space-y-1">
                  {relatedLinks.map((l, i) => {
                    const otherId = l.source === selectedNode.id ? l.target : l.source;
                    const other = nodes.find((n) => n.id === otherId);
                    return (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-[#5C5C5C]">
                        <span className="mono">→</span>
                        <span>{other?.label ?? otherId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ border: "2px dashed #E8E8E8", padding: "16px" }}>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#A0A0A0] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#A0A0A0]">Click a node to explore its relationships. Hover to preview connections.</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ border: "2px solid #111111", padding: "16px" }}>
              <p className="label mb-3">Summary</p>
              <div className="space-y-2">
                {[["Nodes", nodes.length], ["Links", links.length], ...Object.entries(result.entity_counts)].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-xs" style={{ borderBottom: "1px solid #F4F4F4", paddingBottom: "6px" }}>
                    <span className="text-[#5C5C5C] capitalize">{k}</span>
                    <span className="font-black mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
