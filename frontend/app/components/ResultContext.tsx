"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface TimelineEvent {
  date: string;
  event: string;
  category: string;
  significance?: string;
}

export interface Risk {
  type: string;
  description: string;
  severity: string;
  recommendation?: string;
}

export interface ReconstructResult {
  patient_name: string;
  patient_id?: string;
  documents_processed: number;
  timeline: TimelineEvent[];
  risks: Risk[];
  clinical_summary: string;
  patient_summary?: string;
  primary_diagnosis: string;
  care_trajectory: string;
  entity_counts: Record<string, number>;
  fhir_bundle: { entry?: unknown[] };
  fhir_server?: { status?: number; posted?: boolean; error?: string };
}

interface ResultContextType {
  result: ReconstructResult | null;
  setResult: (r: ReconstructResult | null) => void;
}

const ResultContext = createContext<ResultContextType>({
  result: null,
  setResult: () => {},
});

// Module-level cache — survives page navigation within the same session
let _cache: ReconstructResult | null = null;

const KEY = "caretrace_result";

export function ResultProvider({ children }: { children: ReactNode }) {
  const [result, setResultState] = useState<ReconstructResult | null>(null);

  // On mount: restore from cache or localStorage
  useEffect(() => {
    if (_cache) {
      setResultState(_cache);
      return;
    }
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        _cache = JSON.parse(raw);
        setResultState(_cache);
      }
    } catch {}
  }, []);

  const setResult = (r: ReconstructResult | null) => {
    _cache = r;
    setResultState(r);
    try {
      if (r) localStorage.setItem(KEY, JSON.stringify(r));
      else localStorage.removeItem(KEY);
    } catch {}
  };

  return (
    <ResultContext.Provider value={{ result, setResult }}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResult() {
  return useContext(ResultContext);
}
