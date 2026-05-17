"use client";

import Link from "next/link";
import AppShell from "../components/AppShell";
import { useResult } from "../components/ResultContext";
import { Stethoscope, Upload, AlertTriangle, Pill, FlaskConical, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const SEV: Record<string, { border: string; bg: string; text: string; tag: string; tagText: string }> = {
  high: { border: "#E00000", bg: "#FFF5F5", text: "#111111", tag: "#E00000", tagText: "#FFFFFF" },
  medium: { border: "#D94F00", bg: "#FFF3EC", text: "#111111", tag: "#D94F00", tagText: "#FFFFFF" },
  low: { border: "#0057FF", bg: "#EEF3FF", text: "#111111", tag: "#0057FF", tagText: "#FFFFFF" },
};

export default function PhysicianPage() {
  const { result } = useResult();

  if (!result) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <Stethoscope className="w-8 h-8 text-[#A0A0A0] mx-auto mb-3" />
          <p className="font-bold mb-1">No patient data loaded</p>
          <p className="text-sm text-[#5C5C5C] mb-6">Upload records to generate the physician intelligence view.</p>
          <Link href="/upload" className="btn btn-red">
            <Upload className="w-4 h-4" /> Upload Records
          </Link>
        </div>
      </AppShell>
    );
  }

  const highRisks = result.risks.filter((r) => r.severity?.toLowerCase() === "high");
  const medRisks = result.risks.filter((r) => r.severity?.toLowerCase() === "medium");
  const lowRisks = result.risks.filter((r) => r.severity?.toLowerCase() === "low");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-5" style={{ borderBottom: "2px solid #111111" }}>
          <div>
            <p className="label mb-1">Physician Intelligence View</p>
            <h1 className="text-2xl font-black">{result.patient_name}</h1>
            <p className="text-sm text-[#5C5C5C] mt-1">
              {result.documents_processed} source documents · {result.timeline.length} clinical events
            </p>
          </div>
          {highRisks.length > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ border: "2px solid #E00000", background: "#FFF5F5" }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "#E00000" }} />
              <span className="text-sm font-black" style={{ color: "#E00000" }}>
                {highRisks.length} CRITICAL RISK{highRisks.length !== 1 ? "S" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Clinical Summary */}
        <div className="p-5" style={{ border: "2px solid #111111", boxShadow: "4px 4px 0 #111111" }}>
          <p className="label mb-3">AI Clinical Summary</p>
          <p className="text-sm leading-relaxed text-[#111111]">
            {result.clinical_summary || "No summary generated."}
          </p>
          <div
            className="mt-4 pt-4 grid grid-cols-2 gap-4"
            style={{ borderTop: "1.5px solid #E8E8E8" }}
          >
            <div>
              <p className="label mb-1">Primary Diagnosis</p>
              <p className="text-sm font-black" style={{ color: "#0057FF" }}>{result.primary_diagnosis || "—"}</p>
            </div>
            <div>
              <p className="label mb-1">Care Trajectory</p>
              <p className="text-sm font-black" style={{ color: "#D94F00" }}>{result.care_trajectory || "—"}</p>
            </div>
          </div>
        </div>

        {/* Risk Summary bar */}
        <div className="grid grid-cols-3 gap-0" style={{ border: "2px solid #111111" }}>
          {[
            { label: "Critical", count: highRisks.length, color: "#E00000" },
            { label: "Medium", count: medRisks.length, color: "#D94F00" },
            { label: "Low", count: lowRisks.length, color: "#0057FF" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="p-4 text-center"
              style={{ borderRight: i < 2 ? "2px solid #111111" : "none" }}
            >
              <p className="text-3xl font-black mono" style={{ color: s.color }}>{s.count}</p>
              <p className="label mt-1">{s.label} risk{s.count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>

        {/* Risk List */}
        <div>
          <p className="label mb-3">Risk Intelligence</p>
          <div className="space-y-0">
            {result.risks.length === 0 ? (
              <div
                className="flex items-center gap-3 p-4"
                style={{ border: "2px solid #111111", background: "#ECFDF5" }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: "#00875A" }} />
                <p className="text-sm font-medium">No clinical risks identified across available records.</p>
              </div>
            ) : (
              result.risks.map((r, i) => {
                const cfg = SEV[r.severity?.toLowerCase()] ?? SEV.low;
                return (
                  <div
                    key={i}
                    className="p-4"
                    style={{
                      border: `2px solid #111111`,
                      borderLeft: `4px solid ${cfg.border}`,
                      background: cfg.bg,
                      marginBottom: i < result.risks.length - 1 ? "-2px" : 0,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="tag"
                            style={{ background: cfg.tag, color: cfg.tagText, borderColor: cfg.tag }}
                          >
                            {r.severity?.toUpperCase()}
                          </span>
                          <p className="text-sm font-black capitalize">{r.type}</p>
                        </div>
                        <p className="text-sm leading-relaxed">{r.description}</p>
                        {r.recommendation && (
                          <p className="text-xs text-[#5C5C5C] mt-2 italic">
                            Recommendation: {r.recommendation}
                          </p>
                        )}
                      </div>
                      {r.severity?.toLowerCase() === "high" && (
                        <AlertTriangle className="w-4 h-4 ml-auto shrink-0" style={{ color: "#E00000" }} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-0" style={{ border: "2px solid #111111" }}>
          {/* Medications */}
          <div className="p-5" style={{ borderRight: "2px solid #111111" }}>
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: "1.5px solid #E8E8E8", paddingBottom: "12px" }}>
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4" style={{ color: "#00875A" }} />
                <p className="label">Active Medications</p>
              </div>
              <span className="mono text-xs font-black">{result.entity_counts?.medications ?? 0}</span>
            </div>
            <div className="space-y-0">
              {result.timeline.filter((e) => e.category?.toLowerCase() === "medication").slice(0, 5).map((e, i, arr) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #F4F4F4" : "none" }}
                >
                  <div className="w-1.5 h-1.5 shrink-0" style={{ background: "#00875A" }} />
                  <p className="text-xs flex-1 truncate">{e.event}</p>
                  <p className="text-xs mono text-[#A0A0A0]">{e.date}</p>
                </div>
              ))}
              {(result.entity_counts?.medications ?? 0) === 0 && (
                <p className="text-xs text-[#A0A0A0]">No medications extracted.</p>
              )}
            </div>
          </div>

          {/* Labs */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: "1.5px solid #E8E8E8", paddingBottom: "12px" }}>
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" style={{ color: "#6B21A8" }} />
                <p className="label">Lab Findings</p>
              </div>
              <span className="mono text-xs font-black">{result.entity_counts?.labs ?? 0}</span>
            </div>
            <div className="space-y-0">
              {result.timeline.filter((e) => e.category?.toLowerCase() === "lab").slice(0, 5).map((e, i, arr) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #F4F4F4" : "none" }}
                >
                  <div className="w-1.5 h-1.5 shrink-0" style={{ background: "#6B21A8" }} />
                  <p className="text-xs flex-1 truncate">{e.event}</p>
                  <p className="text-xs mono text-[#A0A0A0]">{e.date}</p>
                </div>
              ))}
              {(result.entity_counts?.labs ?? 0) === 0 && (
                <p className="text-xs text-[#A0A0A0]">No lab results extracted.</p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline snapshot */}
        <div className="p-5" style={{ border: "2px solid #111111" }}>
          <div className="flex items-center justify-between mb-4" style={{ borderBottom: "1.5px solid #E8E8E8", paddingBottom: "12px" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A0A0A0]" />
              <p className="label">Clinical Timeline Snapshot</p>
            </div>
            <Link href="/timeline" className="btn btn-ghost text-xs py-1 px-2">
              Full timeline <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {result.timeline.slice(0, 5).map((ev, i, arr) => (
              <div
                key={i}
                className="flex items-start gap-4 py-2"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #F4F4F4" : "none" }}
              >
                <p className="text-xs mono text-[#A0A0A0] w-24 shrink-0 pt-0.5">{ev.date}</p>
                <p className="text-xs flex-1">{ev.event}</p>
                <span className="text-xs text-[#A0A0A0] capitalize shrink-0">{ev.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FHIR status */}
        <div
          className="flex items-center justify-between p-4"
          style={{ border: "2px solid #111111", background: "#FAFAFA" }}
        >
          <div>
            <p className="label mb-0.5">FHIR R4 Bundle</p>
            <p className="text-xs text-[#5C5C5C]">{result.fhir_bundle?.entry?.length ?? 0} resources · interoperability-ready</p>
          </div>
          {result.fhir_server?.posted ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" style={{ color: "#00875A" }} />
              <span className="text-xs font-bold" style={{ color: "#00875A" }}>POSTED TO FHIR SERVER</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-[#A0A0A0]" />
              <span className="text-xs font-bold text-[#A0A0A0]">LOCAL MODE</span>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
