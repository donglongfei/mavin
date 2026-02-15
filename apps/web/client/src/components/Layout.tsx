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
  isLeftPanelCollapsed?: boolean;
}

export default function Layout({ leftPane, middlePane, rightPane, isLeftPanelCollapsed = false }: LayoutProps) {
  // Calculate panel sizes based on collapse state
  const leftPanelSize = isLeftPanelCollapsed ? 5 : 25;
  const middlePanelSize = isLeftPanelCollapsed ? 70 : 50;
  const rightPanelSize = 25;

  return (
    <div className="h-screen w-screen overflow-hidden bg-background grid-pattern">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full"
        key={isLeftPanelCollapsed ? 'collapsed' : 'expanded'}
      >
        {/* Left Pane - Context Manager (Navigation) - 1/4 width when expanded, minimal when collapsed */}
        <ResizablePanel
          defaultSize={leftPanelSize}
          minSize={isLeftPanelCollapsed ? 5 : 15}
          maxSize={isLeftPanelCollapsed ? 5 : 35}
          collapsible={false}
          className="relative"
        >
          <aside className="h-full glass border-r border-border/50 flex flex-col relative">
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-neon-cyan/50 to-transparent" />
            {leftPane}
          </aside>
        </ResizablePanel>

        <ResizableHandle withHandle className="w-1 bg-border/30 hover:bg-neon-cyan/30 transition-colors" />

        {/* Middle Pane - Dynamic Workspace - 2/4 width */}
        <ResizablePanel defaultSize={middlePanelSize} minSize={30}>
          <main className="h-full flex flex-col overflow-hidden relative">
            {middlePane}
          </main>
        </ResizablePanel>

        <ResizableHandle withHandle className="w-1 bg-border/30 hover:bg-neon-purple/50 transition-colors glow-purple-subtle" />

        {/* Right Pane - AI Copilot - 1/4 width */}
        <ResizablePanel
          defaultSize={rightPanelSize}
          minSize={20}
          maxSize={40}
          collapsible={true}
          collapsedSize={0}
          className="relative"
        >
          <aside className="h-full glass border-l border-border/50 flex flex-col relative scan-line">
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-neon-purple/50 to-transparent" />
            {rightPane}
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
