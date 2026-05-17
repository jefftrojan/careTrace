"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import { useResult } from "../components/ResultContext";
import { Upload, FileText, X, Loader2, Activity, CheckCircle2, AlertCircle, Cpu } from "lucide-react";

const PIPELINE_STEPS = [
  { id: "extract", label: "Entity Extraction", desc: "OCR & NLP processing" },
  { id: "fhir", label: "FHIR Bundle Build", desc: "R4 resource generation" },
  { id: "timeline", label: "Timeline Construction", desc: "Chronological ordering" },
  { id: "agents", label: "Multi-Agent Analysis", desc: "Risk & medication review" },
  { id: "summary", label: "Summary Generation", desc: "Physician & patient views" },
];

export default function UploadPage() {
  const router = useRouter();
  const { setResult } = useResult();
  const [files, setFiles] = useState<File[]>([]);
  const [patientName, setPatientName] = useState("James Okonkwo");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleReconstruct = async () => {
    if (!files.length || !patientName.trim()) return;
    setLoading(true);
    setError(null);
    setCurrentStep(0);

    const form = new FormData();
    form.append("patient_name", patientName);
    files.forEach((f) => form.append("files", f));

    // Advance through steps in sync with real API phases
    // Steps 0-2 happen fast (local), step 3-4 require AI — show them in sequence
    const advanceTo = (step: number) => setCurrentStep(step);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Start the API call
      const fetchPromise = fetch(`${apiUrl}/api/reconstruct`, { method: "POST", body: form });

      // Animate first 3 steps quickly (document parsing phase)
      advanceTo(0);
      await new Promise((r) => setTimeout(r, 500));
      advanceTo(1);
      await new Promise((r) => setTimeout(r, 500));
      advanceTo(2);

      // Step 3 (agents) and 4 (summary) depend on AI — hold here until API returns
      const res = await fetchPromise;

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      advanceTo(3);
      await new Promise((r) => setTimeout(r, 300));
      advanceTo(4);
      await new Promise((r) => setTimeout(r, 300));

      setResult(data);
      setCurrentStep(PIPELINE_STEPS.length);
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reconstruction failed. Check backend connection.");
      setCurrentStep(-1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-0">
        {/* Page header */}
        <div className="pb-6" style={{ borderBottom: "2px solid #111111", marginBottom: "24px" }}>
          <p className="label mb-1">Document Upload</p>
          <h1 className="text-2xl font-black">Upload Clinical Records</h1>
          <p className="text-sm text-[#5C5C5C] mt-1">
            Drop fragmented healthcare documents to reconstruct a longitudinal patient intelligence profile.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className="p-10 text-center cursor-pointer transition-colors mb-6"
          style={{
            border: `2px dashed ${dragOver ? "#E00000" : "#111111"}`,
            background: dragOver ? "#FFF5F5" : "#FAFAFA",
          }}
        >
          <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: dragOver ? "#E00000" : "#A0A0A0" }} />
          <p className="font-bold text-sm mb-1">Drop clinical documents here</p>
          <p className="text-xs text-[#5C5C5C]">
            Discharge summaries · Lab reports · Prescriptions · Referral notes · Radiology reports
          </p>
          <p className="text-xs text-[#A0A0A0] mt-1">Any text file — drag & drop or click to browse</p>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-6">
            <p className="label mb-3">{files.length} file{files.length > 1 ? "s" : ""} queued</p>
            <div className="space-y-0">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2.5"
                  style={{
                    border: "1.5px solid #111111",
                    borderBottom: i < files.length - 1 ? "none" : "1.5px solid #111111",
                    background: "#FAFAFA",
                  }}
                >
                  <FileText className="w-4 h-4 shrink-0" style={{ color: "#E00000" }} />
                  <span className="flex-1 text-sm font-medium truncate">{f.name}</span>
                  <span className="text-xs mono text-[#A0A0A0]">{(f.size / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="ml-2 text-[#A0A0A0] hover:text-[#E00000] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Name */}
        <div className="mb-6">
          <label className="label block mb-2">Patient Name</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Full patient name"
            className="w-full px-3.5 py-2.5 text-sm font-medium focus:outline-none"
            style={{
              border: "2px solid #111111",
              background: "#fff",
            }}
          />
        </div>

        {/* Pipeline Visualization */}
        {loading && (
          <div className="mb-6 p-5" style={{ border: "2px solid #111111", background: "#FAFAFA" }}>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4" style={{ color: "#E00000" }} />
              <p className="text-xs font-bold uppercase tracking-widest">Processing Pipeline</p>
            </div>
            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 flex items-center justify-center shrink-0"
                      style={{
                        border: "2px solid #111111",
                        background: done ? "#111111" : active ? "#E00000" : "#fff",
                      }}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      ) : active ? (
                        <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${done ? "text-[#111111]" : active ? "text-[#E00000]" : "text-[#A0A0A0]"}`}>
                        {step.label}
                      </p>
                      {active && (
                        <p className="text-xs text-[#5C5C5C]">
                          {currentStep === 2 ? "Calling AI — this takes 20–40s…" : step.desc}
                        </p>
                      )}
                    </div>
                    {done && <span className="text-xs mono text-[#A0A0A0]">done</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 mb-6"
            style={{ border: "2px solid #E00000", background: "#FFF5F5" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#E00000" }} />
            <p className="text-sm font-medium" style={{ color: "#E00000" }}>{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleReconstruct}
          disabled={!files.length || !patientName.trim() || loading}
          className="btn btn-red w-full py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ boxShadow: "4px 4px 0 #111111" }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Reconstructing clinical timeline…</>
          ) : (
            <><Activity className="w-4 h-4" /> Reconstruct Patient Intelligence</>
          )}
        </button>

        <p className="text-center text-xs text-[#A0A0A0] mt-4 mono">
          Records processed locally · FHIR R4 compatible · Zero data retention
        </p>
      </div>
    </AppShell>
  );
}
