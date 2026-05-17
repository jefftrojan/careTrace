"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Upload, Clock, GitBranch, Brain, Stethoscope, User, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/graph", label: "Graph", icon: GitBranch },
  { href: "/agents", label: "Agents", icon: Brain },
  { href: "/physician", label: "Physician", icon: Stethoscope },
  { href: "/patient", label: "Patient", icon: User },
];

export default function AppNav() {
  const pathname = usePathname();
  return (
    <header style={{ borderBottom: "2px solid #111111", background: "#fff" }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div style={{ border: "2px solid #111111", background: "#E00000" }} className="w-7 h-7 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#111111]">CareTrace OS</span>
        </Link>

        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wide whitespace-nowrap transition-colors"
                style={{
                  background: active ? "#111111" : "transparent",
                  color: active ? "#ffffff" : "#5C5C5C",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-bold tracking-wide px-2 py-0.5"
            style={{ border: "1.5px solid #111111", background: "#F4F4F4", color: "#5C5C5C" }}
          >
            AI ACTIVE
          </span>
        </div>
      </div>
    </header>
  );
}
