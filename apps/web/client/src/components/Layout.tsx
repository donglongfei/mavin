/**
 * Cyberpunk Lab Design System - Three-Pane Cockpit Layout
 * 
 * Design Philosophy: Glassmorphic layers with neon cyan/purple accents
 * Layout: Left (Context Manager) | Middle (Dynamic Workspace) | Right (AI Copilot)
 * Colors: Deep indigo black base, cyan for AI, purple for user, orange for recording
 */

import { ReactNode } from "react";

interface LayoutProps {
  leftPane: ReactNode;
  middlePane: ReactNode;
  rightPane: ReactNode;
}

export default function Layout({ leftPane, middlePane, rightPane }: LayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background grid-pattern flex">
      {/* Left Pane - Context Manager (Navigation) */}
      <aside className="w-64 glass border-r border-border/50 flex flex-col relative">
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-neon-cyan/50 to-transparent" />
        {leftPane}
      </aside>

      {/* Middle Pane - Dynamic Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {middlePane}
      </main>

      {/* Right Pane - AI Copilot */}
      <aside className="w-96 glass border-l border-border/50 flex flex-col relative scan-line">
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-neon-purple/50 to-transparent" />
        {rightPane}
      </aside>
    </div>
  );
}
