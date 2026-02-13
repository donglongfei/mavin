/**
 * Cyberpunk Lab - Timeline View (Best for Students)
 * 
 * Features: Vertical timeline with audio/note/snapshot/summary cards
 * Design: Glowing cyan timeline with hexagonal markers, card-based layout
 */

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  FileText, 
  Camera, 
  Sparkles,
  Play,
  Download
} from "lucide-react";

interface TimelineItem {
  id: string;
  time: string;
  type: "audio" | "note" | "snapshot" | "summary";
  title: string;
  content: string;
  duration?: string;
}

const mockTimelineItems: TimelineItem[] = [
  {
    id: "1",
    time: "09:00 AM",
    type: "audio",
    title: "Lecture Recording Started",
    content: "Recording of Quantum Mechanics lecture",
    duration: "45:30"
  },
  {
    id: "2",
    time: "09:15 AM",
    type: "note",
    title: "Important Note",
    content: "Prof said this will be on the test: Wave-particle duality is fundamental"
  },
  {
    id: "3",
    time: "09:45 AM",
    type: "snapshot",
    title: "Blackboard Capture",
    content: "Heisenberg uncertainty principle equations"
  },
  {
    id: "4",
    time: "10:30 AM",
    type: "summary",
    title: "AI-Generated Summary",
    content: "Key topics: Quantum mechanics fundamentals, wave-particle duality, uncertainty principle. Professor emphasized exam relevance."
  }
];

const typeConfig = {
  audio: { icon: Mic, color: "text-neon-cyan", bgColor: "bg-neon-cyan/10", borderColor: "border-neon-cyan/30" },
  note: { icon: FileText, color: "text-neon-purple", bgColor: "bg-neon-purple/10", borderColor: "border-neon-purple/30" },
  snapshot: { icon: Camera, color: "text-neon-orange", bgColor: "bg-neon-orange/10", borderColor: "border-neon-orange/30" },
  summary: { icon: Sparkles, color: "text-neon-cyan", bgColor: "bg-neon-cyan/10", borderColor: "border-neon-cyan/30" }
};

export default function TimelineView() {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="relative pl-8 pr-4 py-4">
        {/* Vertical Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan via-neon-purple to-neon-cyan" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {mockTimelineItems.map((item, index) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative">
                {/* Timeline Marker (Hexagon) */}
                <div className={`absolute -left-[1.85rem] top-4 w-6 h-6 hexagon ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>

                {/* Timeline Card */}
                <Card className={`p-4 bg-card/50 border ${config.borderColor} hover:bg-card/70 transition-colors`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>
                        {item.time}
                      </Badge>
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                    </div>
                    {item.duration && (
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{item.content}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {item.type === "audio" && (
                      <>
                        <Button size="sm" variant="outline" className="border-border/50">
                          <Play className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                        <Button size="sm" variant="outline" className="border-border/50">
                          Transcribe
                        </Button>
                      </>
                    )}
                    {item.type === "snapshot" && (
                      <Button size="sm" variant="outline" className="border-border/50">
                        View Image
                      </Button>
                    )}
                    {item.type === "summary" && (
                      <Button size="sm" variant="outline" className="border-border/50">
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
