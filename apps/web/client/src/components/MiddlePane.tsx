/**
 * Cyberpunk Lab - Middle Pane (Dynamic Workspace)
 * 
 * Features: View mode selector (Timeline/Canvas/Notebook), Dynamic content area
 * Design: Main workspace with grid pattern, view-specific layouts
 */

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Layout, FileText } from "lucide-react";
import TimelineView from "./views/TimelineView";
import CanvasView from "./views/CanvasView";
import NotebookView from "./views/NotebookView";
import HeroSection from "./HeroSection";

interface MiddlePaneProps {
  currentProject?: string;
  currentProjectId?: string;
}

export default function MiddlePane({ currentProject = "", currentProjectId = "" }: MiddlePaneProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 p-2">
        {/* Hero Section */}
        <HeroSection />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* View Selector */}
        <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold">{currentProject || "No Project Selected"}</h2>
            <p className="text-xs text-muted-foreground">
              {currentProject ? "Project Timeline & Activities" : "Select a project from the left panel"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-6 text-xs px-2 border-border/50" disabled={!currentProject}>
              Export
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs px-2 border-border/50" disabled={!currentProject}>
              Share
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-card/50 border border-border/50 h-8">
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan text-xs"
            >
              <Clock className="h-3 w-3 mr-1.5" />
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="canvas"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple text-xs"
            >
              <Layout className="h-3 w-3 mr-1.5" />
              Canvas
            </TabsTrigger>
            <TabsTrigger
              value="notebook"
              className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan text-xs"
            >
              <FileText className="h-3 w-3 mr-1.5" />
              Notebook
            </TabsTrigger>
          </TabsList>

          {/* View Content */}
          <div className="mt-2">
            <TabsContent value="timeline" className="m-0">
              <TimelineView projectId={currentProjectId} />
            </TabsContent>
            <TabsContent value="canvas" className="m-0">
              <CanvasView />
            </TabsContent>
            <TabsContent value="notebook" className="m-0">
              <NotebookView />
            </TabsContent>
          </div>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
