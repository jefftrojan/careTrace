"use client";

import { ResultProvider } from "./components/ResultContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <ResultProvider>{children}</ResultProvider>;
}
