"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import { useResult } from "../components/ResultContext";
import { Upload, Clock, ChevronDown, ChevronUp } from "lucide-react";

const CAT_COLOR: Record<string, string> = {
  diagnosis: "#0057FF",
  medication: "#00875A",
  lab: "#6B21A8",
  procedure: "#D94F00",
  encounter: "#B45309",
  default: "#5C5C5C",
};

const CAT_BG: Record<string, string> = {
  diagnosis: "#EEF3FF",
  medication: "#ECFDF5",
  lab: "#F5F3FF",
  procedure: "#FFF3EC",
  encounter: "#FFFBEB",
  default: "#F4F4F4",
};

export default function TimelinePage() {
  const { result } = useResult();
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!result) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <Clock className="w-8 h-8 text-[#A0A0A0] mx-auto mb-3" />
          <p className="font-bold mb-1">No patient data loaded</p>
          <p className="text-sm text-[#5C5C5C] mb-6">Upload records to generate a longitudinal timeline.</p>
          <Link href="/upload" className="btn btn-red">
            <Upload className="w-4 h-4" /> Upload Records
          </Link>
        </div>
      </AppShell>
    );
  }

  const categories = ["all", ...Array.from(new Set(result.timeline.map((e) => e.category?.toLowerCase() || "other")))];
  const filtered = filter === "all" ? result.timeline : result.timeline.filter((e) => e.category?.toLowerCase() === filter);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-5" style={{ borderBottom: "2px solid #111111" }}>
          <p className="label mb-1">Longitudinal Timeline</p>
          <h1 className="text-2xl font-black">{result.patient_name}</h1>
          <p className="text-sm text-[#5C5C5C] mt-1">
            {result.timeline.length} events across {result.documents_processed} documents
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => {
            const active = filter === cat;
            const color = CAT_COLOR[cat] ?? CAT_COLOR.default;
            const bg = CAT_BG[cat] ?? CAT_BG.default;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="tag transition-colors capitalize cursor-pointer"
                style={{
                  background: active ? (cat === "all" ? "#111111" : color) : "transparent",
                  color: active ? (cat === "all" ? "#fff" : "#fff") : "#5C5C5C",
                  borderColor: active ? (cat === "all" ? "#111111" : color) : "#E8E8E8",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Timeline list */}
        <div style={{ borderLeft: "3px solid #111111", paddingLeft: "24px" }}>
          <div className="space-y-0">
            {filtered.map((ev, i) => {
              const cat = ev.category?.toLowerCase() || "default";
              const color = CAT_COLOR[cat] ?? CAT_COLOR.default;
              const bg = CAT_BG[cat] ?? CAT_BG.default;
              const isExpanded = expanded === i;
              return (
                <div key={i} className="relative pb-0">
                  {/* Dot on the left line */}
                  <div
                    className="absolute w-3 h-3 -left-[30px] top-4"
                    style={{ border: "2px solid #111111", background: color }}
                  />
                  <button
                    onClick={() => setExpanded(isExpanded ? null : i)}
                    className="w-full text-left py-4 group"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #E8E8E8" : "none" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs mono text-[#A0A0A0] mb-0.5">{ev.date}</p>
                        <p className="text-sm font-bold leading-snug group-hover:underline">{ev.event}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-4">
                        <span
                          className="tag capitalize"
                          style={{ color, background: bg, borderColor: color, borderWidth: "1.5px" }}
                        >
                          {ev.category}
                        </span>
                        {ev.significance && (
                          isExpanded
                            ? <ChevronUp className="w-4 h-4 text-[#A0A0A0]" />
                            : <ChevronDown className="w-4 h-4 text-[#A0A0A0]" />
                        )}
                      </div>
                    </div>
                  </button>
                  {isExpanded && ev.significance && (
                    <div
                      className="mb-4 p-3 text-xs text-[#5C5C5C] leading-relaxed"
                      style={{ borderLeft: `3px solid ${color}`, background: bg }}
                    >
                      {ev.significance}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-[#A0A0A0] py-10">No events in this category.</p>
        )}
      </div>
    </AppShell>
  );
}
