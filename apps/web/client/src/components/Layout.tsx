/**
 * Cyberpunk Lab Design System - Three-Pane Cockpit Layout
 *
 * Design Philosophy: Glassmorphic layers with neon cyan/purple accents
 * Layout: Left (Context Manager) | Middle (Dynamic Workspace) | Right (AI Copilot - RESIZABLE)
 * Colors: Deep indigo black base, cyan for AI, purple for user, orange for recording
 */

import { ReactNode } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface LayoutProps {
  leftPane: ReactNode;
  middlePane: ReactNode;
  rightPane: ReactNode;
}

export default function Layout({ leftPane, middlePane, rightPane }: LayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background grid-pattern">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Pane - Context Manager (Navigation) - Fixed width */}
        <ResizablePanel defaultSize={15} minSize={12} maxSize={25} className="relative">
          <aside className="h-full glass border-r border-border/50 flex flex-col relative">
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-neon-cyan/50 to-transparent" />
            {leftPane}
          </aside>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border/30 hover:bg-neon-cyan/30 transition-colors" />

        {/* Middle Pane - Dynamic Workspace */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <main className="h-full flex flex-col overflow-hidden relative">
            {middlePane}
          </main>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border/30 hover:bg-neon-purple/50 transition-colors glow-purple-subtle" />

        {/* Right Pane - AI Copilot - WIDER and RESIZABLE */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="relative">
          <aside className="h-full glass border-l border-border/50 flex flex-col relative scan-line">
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-neon-purple/50 to-transparent" />
            {rightPane}
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
