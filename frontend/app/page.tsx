"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Activity,
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Heart,
} from "lucide-react";

interface TimelineEvent {
  date: string;
  event: string;
  category: string;
  significance?: string;
}

interface Risk {
  type: string;
  description: string;
  severity: string;
  recommendation?: string;
}

interface ReconstructResult {
  patient_name: string;
  patient_id?: string;
  documents_processed: number;
  timeline: TimelineEvent[];
  risks: Risk[];
  clinical_summary: string;
  primary_diagnosis: string;
  care_trajectory: string;
  entity_counts: Record<string, number>;
  fhir_bundle: { entry?: unknown[] };
  fhir_server?: { status?: number; posted?: boolean; error?: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  diagnosis: "bg-blue-500",
  medication: "bg-green-500",
  lab: "bg-purple-500",
  procedure: "bg-yellow-500",
  encounter: "bg-orange-500",
  default: "bg-gray-400",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "border-red-500 bg-red-950 text-red-200",
  medium: "border-yellow-500 bg-yellow-950 text-yellow-200",
  low: "border-blue-500 bg-blue-950 text-blue-200",
  default: "border-slate-600 bg-slate-800 text-slate-300",
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [patientName, setPatientName] = useState("James Okonkwo");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconstructResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "risks" | "fhir" | "summary">("timeline");
  const [showFhir, setShowFhir] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleReconstruct = async () => {
    if (!files.length || !patientName.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("patient_name", patientName);
    files.forEach((f) => form.append("files", f));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/reconstruct`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ReconstructResult = await res.json();
      setResult(data);
      setActiveTab("timeline");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reconstruction failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">CareTrace</span>
          <span className="text-slate-500 text-sm ml-2">Clinical Timeline Reconstruction</span>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Powered by Ollama · fully local · zero data egress
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">Clinical Documents</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-600 group-hover:text-emerald-400 mx-auto mb-3 transition-colors" />
              <p className="text-slate-400 text-sm">
                Drop discharge summaries, lab reports, referral notes, medication lists
              </p>
              <p className="text-slate-600 text-xs mt-1">Any text file · drag & drop or click</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
            </div>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 text-sm">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="flex-1 truncate text-slate-300">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition-colors">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              onClick={handleReconstruct}
              disabled={!files.length || !patientName.trim() || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Reconstructing…</>
              ) : (
                <><Activity className="w-4 h-4" /> Reconstruct Timeline</>
              )}
            </button>

            {result && (
              <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-xs">
                <p className="text-slate-400 font-medium uppercase tracking-wide">Extracted</p>
                {Object.entries(result.entity_counts).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-slate-300">
                    <span className="capitalize">{k}</span>
                    <span className="font-mono text-emerald-400">{v}</span>
                  </div>
                ))}
                {result.fhir_server?.posted && (
                  <div className="flex items-center gap-1.5 text-emerald-400 pt-1 border-t border-slate-700 mt-2">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Posted to FHIR server (HTTP {result.fhir_server.status})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4 text-red-300 text-sm">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="bg-slate-800 rounded-xl p-5 flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Patient</p>
                <p className="text-lg font-semibold">{result.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Primary Diagnosis</p>
                <p className="text-base font-medium text-emerald-400">{result.primary_diagnosis || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Documents</p>
                <p className="text-base font-medium text-slate-300">{result.documents_processed} processed</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Risk Flags</p>
                <p className="text-base font-medium text-red-400">{result.risks.length} identified</p>
              </div>
              {result.care_trajectory && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Trajectory</p>
                  <p className="text-base font-medium text-yellow-400">{result.care_trajectory}</p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-900 rounded-lg p-1 w-fit">
              {(["timeline", "risks", "summary", "fhir"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                    activeTab === tab ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "risks" && result.risks.length > 0 ? `risks (${result.risks.length})` : tab}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {activeTab === "timeline" && (
              <div>
                {result.timeline.length === 0 ? (
                  <p className="text-slate-500 text-sm p-4">No timeline events extracted.</p>
                ) : (
                  result.timeline.map((ev, i) => {
                    const dot = CATEGORY_COLORS[ev.category?.toLowerCase()] ?? CATEGORY_COLORS.default;
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dot}`} />
                          {i < result.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-800 my-1" />}
                        </div>
                        <div className="pb-6">
                          <p className="text-xs text-slate-500 font-mono">{ev.date}</p>
                          <p className="text-sm text-slate-200 font-medium mt-0.5">{ev.event}</p>
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                            {ev.category}
                          </span>
                          {ev.significance && <p className="text-xs text-slate-500 mt-1">{ev.significance}</p>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Risks */}
            {activeTab === "risks" && (
              <div className="space-y-3">
                {result.risks.length === 0 ? (
                  <p className="text-slate-500 text-sm p-4">No risks identified.</p>
                ) : (
                  result.risks.map((r, i) => {
                    const cls = SEVERITY_COLORS[r.severity?.toLowerCase()] ?? SEVERITY_COLORS.default;
                    return (
                      <div key={i} className={`border-l-4 rounded-r-lg p-4 ${cls}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-semibold text-sm capitalize">{r.type}</span>
                          <span className="ml-auto text-xs uppercase font-mono opacity-70">{r.severity}</span>
                        </div>
                        <p className="text-sm">{r.description}</p>
                        {r.recommendation && (
                          <p className="text-xs opacity-80 mt-1.5 italic">→ {r.recommendation}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Summary */}
            {activeTab === "summary" && (
              <div className="bg-slate-800 rounded-xl p-6 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Clinical Summary</p>
                  <p className="text-slate-200 leading-relaxed">{result.clinical_summary || "No summary generated."}</p>
                </div>
                {result.primary_diagnosis && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Primary Diagnosis</p>
                    <p className="text-emerald-400 font-medium">{result.primary_diagnosis}</p>
                  </div>
                )}
                {result.care_trajectory && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Care Trajectory</p>
                    <p className="text-yellow-400">{result.care_trajectory}</p>
                  </div>
                )}
              </div>
            )}

            {/* FHIR */}
            {activeTab === "fhir" && (
              <div className="bg-slate-900 rounded-xl border border-slate-800">
                <button
                  onClick={() => setShowFhir(!showFhir)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm text-slate-300 hover:text-slate-100 transition-colors"
                >
                  <span>FHIR R4 Bundle — {result.fhir_bundle?.entry?.length ?? 0} resources</span>
                  {showFhir ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showFhir && (
                  <pre className="px-5 pb-5 text-xs text-emerald-300 overflow-auto max-h-[500px] font-mono">
                    {JSON.stringify(result.fhir_bundle, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
