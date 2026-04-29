"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(0.985 0.008 75)" }}>
      <Sidebar
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header onMenuToggle={() => setIsMobileOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
