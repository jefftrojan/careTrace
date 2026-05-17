"use client";

import Link from "next/link";
import AppShell from "../components/AppShell";
import { useResult } from "../components/ResultContext";
import { User, Upload, Heart, Pill, AlertCircle, CheckCircle2, TrendingUp, Info } from "lucide-react";

function simplify(text: string): string {
  return text
    .replace(/hypertension/gi, "high blood pressure")
    .replace(/renal/gi, "kidney")
    .replace(/creatinine/gi, "kidney waste marker (creatinine)")
    .replace(/elevated/gi, "higher than normal")
    .replace(/reduced/gi, "lower than expected")
    .replace(/myocardial infarction/gi, "heart attack")
    .replace(/dyslipidemia/gi, "high cholesterol")
    .replace(/diabetes mellitus/gi, "diabetes")
    .replace(/hypertensive/gi, "related to high blood pressure")
    .replace(/proteinuria/gi, "protein in the urine")
    .replace(/bilateral/gi, "on both sides")
    .replace(/chronic/gi, "long-term")
    .replace(/acute/gi, "sudden")
    .replace(/etiology/gi, "cause")
    .replace(/prognosis/gi, "expected outlook");
}

const SEV_CFG: Record<string, { icon: typeof AlertCircle; color: string; bg: string; border: string; label: string }> = {
  high: { icon: AlertCircle, color: "#E00000", bg: "#FFF5F5", border: "#E00000", label: "Needs urgent attention" },
  medium: { icon: Info, color: "#D94F00", bg: "#FFF3EC", border: "#D94F00", label: "Worth monitoring" },
  low: { icon: CheckCircle2, color: "#0057FF", bg: "#EEF3FF", border: "#0057FF", label: "Mild concern" },
};

export default function PatientPage() {
  const { result } = useResult();

  if (!result) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <User className="w-8 h-8 text-[#A0A0A0] mx-auto mb-3" />
          <p className="font-bold mb-1">No health data loaded</p>
          <p className="text-sm text-[#5C5C5C] mb-6">Upload your medical records to see your health insights in plain language.</p>
          <Link href="/upload" className="btn btn-red">
            <Upload className="w-4 h-4" /> Upload Records
          </Link>
        </div>
      </AppShell>
    );
  }

  const patientSummary = result.patient_summary ?? simplify(result.clinical_summary);
  const highRisks = result.risks.filter((r) => r.severity?.toLowerCase() === "high");

  return (
    <AppShell>
      <div className="space-y-6 max-w-xl mx-auto">
        {/* Header */}
        <div className="pb-5" style={{ borderBottom: "2px solid #111111" }}>
          <p className="label mb-1">Patient View</p>
          <h1 className="text-2xl font-black">{result.patient_name}</h1>
          <p className="text-sm text-[#5C5C5C] mt-1">Your health insights in plain language</p>
        </div>

        {/* Summary card */}
        <div className="p-5" style={{ border: "2px solid #111111", boxShadow: "4px 4px 0 #111111", borderLeft: "6px solid #E00000" }}>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4" style={{ color: "#E00000" }} />
            <p className="text-sm font-black">Your Health Summary</p>
          </div>
          <p className="text-sm leading-relaxed text-[#111111]">
            {patientSummary || "Your medical records have been analyzed. See your health insights below."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-0" style={{ border: "2px solid #111111", boxShadow: "4px 4px 0 #111111" }}>
          {[
            { value: result.documents_processed, label: "Records reviewed" },
            { value: result.timeline.length, label: "Health events" },
            { value: highRisks.length, label: "Urgent items", red: highRisks.length > 0 },
          ].map((s, i) => (
            <div
              key={s.label}
              className="p-5 text-center"
              style={{
                borderRight: i < 2 ? "2px solid #111111" : "none",
                background: s.red ? "#FFF5F5" : "transparent",
              }}
            >
              <p
                className="text-3xl font-black mono"
                style={{ color: s.red ? "#E00000" : "#111111" }}
              >
                {s.value}
              </p>
              <p className="label mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main condition */}
        {result.primary_diagnosis && (
          <div className="p-5" style={{ border: "2px solid #111111" }}>
            <p className="label mb-2">Your main health condition</p>
            <p className="text-base font-black">{simplify(result.primary_diagnosis)}</p>
            {result.care_trajectory && (
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1.5px solid #E8E8E8" }}>
                <TrendingUp className="w-4 h-4" style={{ color: "#D94F00" }} />
                <p className="text-sm font-bold" style={{ color: "#D94F00" }}>{result.care_trajectory}</p>
              </div>
            )}
          </div>
        )}

        {/* Concerns */}
        {result.risks.length > 0 && (
          <div>
            <p className="label mb-3">Things to pay attention to</p>
            <div className="space-y-0">
              {result.risks.map((r, i) => {
                const cfg = SEV_CFG[r.severity?.toLowerCase()] ?? SEV_CFG.low;
                const SevIcon = cfg.icon;
                return (
                  <div
                    key={i}
                    className="p-4"
                    style={{
                      border: "2px solid #111111",
                      borderLeft: `5px solid ${cfg.border}`,
                      background: cfg.bg,
                      marginBottom: i < result.risks.length - 1 ? "-2px" : 0,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <SevIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black" style={{ color: cfg.color }}>{cfg.label}</span>
                          <span className="text-xs text-[#A0A0A0]">·</span>
                          <span className="text-xs font-medium text-[#5C5C5C] capitalize">{r.type}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{simplify(r.description)}</p>
                        {r.recommendation && (
                          <p className="text-xs text-[#5C5C5C] mt-2">
                            <span className="font-bold">What to do:</span> {simplify(r.recommendation)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Medications */}
        {(result.entity_counts?.medications ?? 0) > 0 && (
          <div className="p-5" style={{ border: "2px solid #111111" }}>
            <div className="flex items-center gap-2 mb-4" style={{ borderBottom: "1.5px solid #E8E8E8", paddingBottom: "12px" }}>
              <Pill className="w-4 h-4" style={{ color: "#00875A" }} />
              <p className="label">Your Medications</p>
            </div>
            <div className="space-y-0">
              {result.timeline.filter((e) => e.category?.toLowerCase() === "medication").slice(0, 6).map((e, i, arr) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #F4F4F4" : "none" }}
                >
                  <div className="w-2 h-2 shrink-0" style={{ background: "#00875A" }} />
                  <p className="text-sm flex-1">{simplify(e.event)}</p>
                  <p className="text-xs mono text-[#A0A0A0]">{e.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="p-5" style={{ border: "2px solid #111111" }}>
          <p className="label mb-4">Your Recent Health History</p>
          <div style={{ borderLeft: "3px solid #E8E8E8", paddingLeft: "16px" }}>
            {result.timeline.slice(0, 5).map((ev, i, arr) => (
              <div
                key={i}
                className="relative py-3"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #F4F4F4" : "none" }}
              >
                <div
                  className="absolute w-2.5 h-2.5 -left-[23px] top-4"
                  style={{ border: "2px solid #111111", background: "#E00000" }}
                />
                <p className="text-xs text-[#A0A0A0] mb-0.5">{ev.date}</p>
                <p className="text-sm">{simplify(ev.event)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4" style={{ border: "1.5px solid #E8E8E8", background: "#FAFAFA" }}>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            This information is generated from your uploaded medical documents using AI analysis.
            It is intended to help you understand your health history — not to replace professional
            medical advice. Always consult your doctor before making any health decisions.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
