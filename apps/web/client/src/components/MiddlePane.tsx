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

export default function MiddlePane() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Hero Section */}
        <HeroSection />
        
        {/* View Selector */}
        <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Physics 101</h2>
            <p className="text-sm text-muted-foreground">Lecture 4 - Quantum Mechanics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border/50">
              Export
            </Button>
            <Button variant="outline" size="sm" className="border-border/50">
              Share
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-card/50 border border-border/50">
            <TabsTrigger 
              value="timeline" 
              className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
            >
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger 
              value="canvas"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple"
            >
              <Layout className="h-4 w-4 mr-2" />
              Canvas
            </TabsTrigger>
            <TabsTrigger 
              value="notebook"
              className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
            >
              <FileText className="h-4 w-4 mr-2" />
              Notebook
            </TabsTrigger>
          </TabsList>

          {/* View Content */}
          <div className="mt-4">
            <TabsContent value="timeline" className="m-0">
              <TimelineView />
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
