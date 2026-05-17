"use client";

import Link from "next/link";
import { Activity, ArrowRight, Brain, FileText, GitBranch, Shield, Zap, Users, Database } from "lucide-react";

const features = [
  { icon: FileText, title: "Record Ingestion", description: "PDFs, scanned reports, prescriptions, discharge summaries, lab reports, handwritten notes." },
  { icon: Activity, title: "Longitudinal Timeline", description: "Continuously evolving patient history — diagnoses, medications, labs, encounters in order." },
  { icon: GitBranch, title: "Intelligence Graph", description: "Relationship graph connecting conditions, symptoms, medications, providers, and risk factors." },
  { icon: Brain, title: "Multi-Agent Reasoning", description: "Specialized AI agents for medications, risk detection, lab analysis, and clinical summaries." },
  { icon: Shield, title: "Risk Detection", description: "Surface hidden medical risks across fragmented records with full source citations." },
  { icon: Database, title: "FHIR Interoperability", description: "FHIR R4-compatible output, structured JSON export, and healthcare system integration APIs." },
];

const stats = [
  { value: "6+", label: "Specialized AI Agents" },
  { value: "FHIR R4", label: "Interoperability" },
  { value: "100%", label: "Explainable" },
  { value: "2 Modes", label: "Physician + Patient" },
];

const problems = [
  "Fragmented records across hospitals and clinics",
  "Information overload leading to missed diagnoses",
  "No longitudinal view of disease progression",
  "Medication conflicts from incomplete histories",
  "Physician burnout from unstructured clinical notes",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col">
      {/* Nav */}
      <header style={{ borderBottom: "2px solid #111111" }} className="sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div style={{ border: "2px solid #111111", background: "#E00000" }} className="w-7 h-7 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">CareTrace OS</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/dashboard" className="btn btn-ghost text-xs">
              Dashboard
            </Link>
            <Link href="/upload" className="btn btn-red text-xs">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section style={{ borderBottom: "2px solid #111111" }}>
          <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-6 px-3 py-1.5"
                style={{ border: "2px solid #111111", background: "#FFF5F5", color: "#E00000" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E00000]" />
                Healthcare Memory Infrastructure
              </div>
              <h1 className="text-5xl font-black tracking-tight leading-[1.1] mb-6">
                Healthcare<br />
                Memory<br />
                <span style={{ color: "#E00000" }}>Infrastructure.</span>
              </h1>
              <p className="text-[#5C5C5C] text-base leading-relaxed mb-8 max-w-md">
                CareTrace OS transforms fragmented medical records into a continuously evolving patient memory graph.
                Critical context is never lost. Warning signs are never missed.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/upload" className="btn btn-red">
                  Analyze Records <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/dashboard" className="btn">
                  View Dashboard
                </Link>
              </div>
            </div>

            {/* Stats block */}
            <div className="grid grid-cols-2 gap-0">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="p-6"
                  style={{
                    borderRight: i % 2 === 0 ? "2px solid #111111" : "none",
                    borderBottom: i < 2 ? "2px solid #111111" : "none",
                    border: "2px solid #111111",
                    marginRight: i % 2 === 0 ? "-2px" : 0,
                    marginBottom: i < 2 ? "-2px" : 0,
                  }}
                >
                  <p className="text-3xl font-black mono mb-1">{s.value}</p>
                  <p className="label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem */}
        <section style={{ borderBottom: "2px solid #111111" }}>
          <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
            <div>
              <p className="label mb-3">The Problem</p>
              <h2 className="text-3xl font-black leading-tight mb-4">
                Medical history<br />is fragmented.
              </h2>
              <p className="text-[#5C5C5C] leading-relaxed">
                Patients carry disconnected PDFs, prescriptions, lab reports, and discharge summaries across
                multiple providers. Critical context gets lost. Important warning signs are missed.
                Doctors rarely have a complete longitudinal picture.
              </p>
            </div>
            <div className="space-y-0">
              {problems.map((item, i) => (
                <div
                  key={item}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < problems.length - 1 ? "1.5px solid #E8E8E8" : "none", borderLeft: "4px solid #E00000" }}
                >
                  <span className="font-black mono text-xs text-[#A0A0A0] mt-0.5 shrink-0">0{i + 1}</span>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ borderBottom: "2px solid #111111" }}>
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex items-baseline justify-between mb-10" style={{ borderBottom: "2px solid #111111", paddingBottom: "16px" }}>
              <h2 className="text-2xl font-black">Capabilities</h2>
              <p className="label">Healthcare memory infrastructure</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
              {features.map((f, i) => {
                const Icon = f.icon;
                const isLastRow = i >= features.length - (features.length % 3 || 3);
                const isLastCol = (i + 1) % 3 === 0;
                return (
                  <div
                    key={f.title}
                    className="p-6"
                    style={{
                      borderRight: !isLastCol ? "2px solid #111111" : "none",
                      borderBottom: !isLastRow ? "2px solid #111111" : "none",
                    }}
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center mb-4"
                      style={{ border: "2px solid #111111", background: "#FFF5F5" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#E00000" }} />
                    </div>
                    <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                    <p className="text-xs text-[#5C5C5C] leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dual Mode */}
        <section style={{ borderBottom: "2px solid #111111" }}>
          <div className="max-w-7xl mx-auto px-6 py-16">
            <p className="label mb-8">Built For</p>
            <div className="grid md:grid-cols-2 gap-0" style={{ border: "2px solid #111111", boxShadow: "6px 6px 0 #111111" }}>
              <div className="p-8" style={{ borderRight: "2px solid #111111" }}>
                <div className="w-8 h-8 flex items-center justify-center mb-4" style={{ border: "2px solid #111111", background: "#111111" }}>
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-black mb-3">Physician Mode</h3>
                <p className="text-sm text-[#5C5C5C] leading-relaxed mb-6">
                  Risk flags, active medications, abnormal labs, and AI-generated physician-ready summaries.
                  Optimized for fast clinical comprehension with low cognitive load.
                </p>
                <Link href="/physician" className="btn btn-black text-xs">
                  View Physician Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="p-8">
                <div className="w-8 h-8 flex items-center justify-center mb-4" style={{ border: "2px solid #111111", background: "#E00000" }}>
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-black mb-3">Patient Mode</h3>
                <p className="text-sm text-[#5C5C5C] leading-relaxed mb-6">
                  Medical terminology, lab results, diagnoses, and medications translated into plain,
                  accessible language. Healthcare made understandable.
                </p>
                <Link href="/patient" className="btn btn-red text-xs">
                  View Patient Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="max-w-2xl">
              <p className="label mb-4">Get Started</p>
              <h2 className="text-4xl font-black leading-tight mb-4">
                No critical medical<br />context should ever<br />be lost again.
              </h2>
              <p className="text-[#5C5C5C] mb-8 leading-relaxed">
                Upload fragmented healthcare documents and watch CareTrace OS reconstruct
                a complete, intelligent patient history in seconds.
              </p>
              <Link href="/upload" className="btn btn-red">
                Start Reconstruction <Zap className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "2px solid #111111", background: "#111111" }} className="text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide">CARETRACE OS — HEALTHCARE MEMORY INFRASTRUCTURE</span>
          <span className="text-xs text-[#5C5C5C] mono">2026</span>
        </div>
      </footer>
    </div>
  );
}
