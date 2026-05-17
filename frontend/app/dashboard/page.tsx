"use client";

import Link from "next/link";
import AppShell from "../components/AppShell";
import { useResult } from "../components/ResultContext";
import { Upload, Clock, GitBranch, Brain, Stethoscope, User, Activity, ChevronRight } from "lucide-react";

const QUICK_LINKS = [
  { href: "/upload", label: "Upload Records", icon: Upload, desc: "Add new clinical documents" },
  { href: "/timeline", label: "Patient Timeline", icon: Clock, desc: "Longitudinal event history" },
  { href: "/graph", label: "Intelligence Graph", icon: GitBranch, desc: "Relationship visualization" },
  { href: "/agents", label: "Agent Analysis", icon: Brain, desc: "Multi-agent reasoning" },
  { href: "/physician", label: "Physician View", icon: Stethoscope, desc: "Clinical intelligence" },
  { href: "/patient", label: "Patient View", icon: User, desc: "Plain-language insights" },
];

const SEV_COLOR: Record<string, string> = {
  high: "#E00000",
  medium: "#D94F00",
  low: "#0057FF",
};

export default function DashboardPage() {
  const { result } = useResult();

  if (!result) {
    return (
      <AppShell>
        <div className="space-y-8">
          <div style={{ borderBottom: "2px solid #111111", paddingBottom: "20px" }}>
            <p className="label mb-1">Dashboard</p>
            <h1 className="text-2xl font-black">Patient Intelligence Hub</h1>
            <p className="text-sm text-[#5C5C5C] mt-1">Upload clinical records to begin analysis.</p>
          </div>

          <div
            className="p-12 text-center"
            style={{ border: "2px dashed #111111" }}
          >
            <div
              className="w-10 h-10 flex items-center justify-center mx-auto mb-4"
              style={{ border: "2px solid #111111", background: "#F4F4F4" }}
            >
              <Activity className="w-5 h-5 text-[#A0A0A0]" />
            </div>
            <p className="font-bold mb-1">No patient data loaded</p>
            <p className="text-sm text-[#5C5C5C] mb-6">Upload fragmented healthcare records to reconstruct a complete patient intelligence profile.</p>
            <Link href="/upload" className="btn btn-red">
              <Upload className="w-4 h-4" /> Upload Records
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-0" style={{ border: "2px solid #111111", boxShadow: "4px 4px 0 #111111" }}>
            {QUICK_LINKS.map(({ href, label, icon: Icon, desc }, i) => {
              const isRight = (i + 1) % 3 === 0;
              const isBottom = i >= 3;
              return (
                <Link
                  key={href}
                  href={href}
                  className="p-5 group flex items-start gap-3 hover:bg-[#FAFAFA] transition-colors"
                  style={{
                    borderRight: !isRight ? "2px solid #111111" : "none",
                    borderBottom: !isBottom ? "2px solid #111111" : "none",
                  }}
                >
                  <div
                    className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ border: "2px solid #111111" }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs text-[#5C5C5C]">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#E8E8E8] group-hover:text-[#111111] transition-colors ml-auto shrink-0 mt-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </AppShell>
    );
  }

  const highRisks = result.risks.filter((r) => r.severity?.toLowerCase() === "high");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-5" style={{ borderBottom: "2px solid #111111" }}>
          <div>
            <p className="label mb-1">Patient Intelligence</p>
            <h1 className="text-2xl font-black">{result.patient_name}</h1>
            <p className="text-sm text-[#5C5C5C] mt-1">
              {result.documents_processed} documents · {result.timeline.length} events · {result.risks.length} risks
            </p>
          </div>
          <Link href="/upload" className="btn btn-ghost text-xs">
            <Upload className="w-3.5 h-3.5" /> New analysis
          </Link>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={{ border: "2px solid #111111", boxShadow: "4px 4px 0 #111111" }}>
          {[
            { label: "Primary Diagnosis", value: result.primary_diagnosis || "—", color: "#111111" },
            { label: "Care Trajectory", value: result.care_trajectory || "—", color: "#D94F00" },
            { label: "Critical Risks", value: String(highRisks.length), color: highRisks.length > 0 ? "#E00000" : "#111111" },
            { label: "Documents", value: String(result.documents_processed), color: "#111111" },
          ].map((kpi, i) => (
            <div
              key={kpi.label}
              className="p-5"
              style={{ borderRight: i < 3 ? "2px solid #111111" : "none" }}
            >
              <p className="label mb-2">{kpi.label}</p>
              <p className="text-base font-black leading-tight mono" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Entity Counts */}
        <div className="p-5" style={{ border: "2px solid #111111" }}>
          <p className="label mb-4">Extracted Entities</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(result.entity_counts).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-2xl font-black mono" style={{ color: "#E00000" }}>{v}</p>
                <p className="label mt-1">{k}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-0" style={{ border: "2px solid #111111", boxShadow: "4px 4px 0 #111111" }}>
          {/* Risks */}
          <div className="p-5" style={{ borderRight: "2px solid #111111" }}>
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: "1.5px solid #E8E8E8", paddingBottom: "12px" }}>
              <p className="label">Risk Flags</p>
              <Link href="/physician" className="text-xs font-bold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0">
              {result.risks.slice(0, 4).map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-2.5"
                  style={{ borderBottom: i < Math.min(3, result.risks.length - 1) ? "1px solid #E8E8E8" : "none" }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: SEV_COLOR[r.severity?.toLowerCase()] ?? "#A0A0A0" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold capitalize">{r.type}</p>
                    <p className="text-xs text-[#5C5C5C] truncate">{r.description}</p>
                  </div>
                  <span
                    className="tag shrink-0 text-white"
                    style={{ background: SEV_COLOR[r.severity?.toLowerCase()] ?? "#A0A0A0", borderColor: SEV_COLOR[r.severity?.toLowerCase()] ?? "#A0A0A0" }}
                  >
                    {r.severity?.toUpperCase()}
                  </span>
                </div>
              ))}
              {result.risks.length === 0 && (
                <p className="text-sm text-[#A0A0A0] py-4 text-center">No risks identified</p>
              )}
            </div>
          </div>

          {/* Timeline Preview */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: "1.5px solid #E8E8E8", paddingBottom: "12px" }}>
              <p className="label">Recent Events</p>
              <Link href="/timeline" className="text-xs font-bold hover:underline flex items-center gap-1">
                Full timeline <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0">
              {result.timeline.slice(0, 4).map((ev, i) => (
                <div
                  key={i}
                  className="flex gap-3 py-2.5"
                  style={{ borderBottom: i < 3 ? "1px solid #E8E8E8" : "none" }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: "#E00000" }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs mono text-[#A0A0A0]">{ev.date}</p>
                    <p className="text-xs font-medium truncate">{ev.event}</p>
                    <p className="text-xs text-[#A0A0A0] capitalize">{ev.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nav Grid */}
        <div>
          <p className="label mb-3">Explore Intelligence</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0" style={{ border: "2px solid #111111" }}>
            {QUICK_LINKS.filter((l) => l.href !== "/upload").map(({ href, label, icon: Icon, desc }, i) => {
              const isRight = (i + 1) % 3 === 0;
              const isBottom = i >= 3;
              return (
                <Link
                  key={href}
                  href={href}
                  className="p-4 group flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors"
                  style={{
                    borderRight: !isRight ? "2px solid #111111" : "none",
                    borderBottom: !isBottom ? "2px solid #111111" : "none",
                  }}
                >
                  <div className="w-7 h-7 flex items-center justify-center shrink-0" style={{ border: "2px solid #111111", background: "#FFF5F5" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: "#E00000" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs text-[#5C5C5C] truncate">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#E8E8E8] group-hover:text-[#111111] ml-auto shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
