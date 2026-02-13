/**
 * Cyberpunk Lab - Notebook View (Best for Devs/Writers)
 * 
 * Features: Markdown editor with ghost text suggestions, live research blocks
 * Design: Clean editor with AI-powered completions
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Sparkles,
  Search,
  Save,
  Download
} from "lucide-react";
import { Streamdown } from "streamdown";

const mockContent = `# Quantum Mechanics - Lecture 4 Notes

## Wave-Particle Duality

Light and matter exhibit both wave-like and particle-like properties. This fundamental concept challenges our classical understanding of physics.

**Key Points:**
- Photons behave as both waves and particles
- Electrons show interference patterns
- Double-slit experiment demonstrates this duality

## Heisenberg Uncertainty Principle

The more precisely the position of a particle is determined, the less precisely its momentum can be known, and vice versa.

**Formula:**
\`\`\`
Δx · Δp ≥ ℏ/2
\`\`\`

Where:
- Δx = uncertainty in position
- Δp = uncertainty in momentum
- ℏ = reduced Planck constant

## Research Block: Applications

*Mavin is researching quantum computing applications...*

---

**Professor's Note:** This material will be on the midterm exam.
`;

export default function NotebookView() {
  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Main Editor */}
      <Card className="flex-1 bg-card/30 border-border/50 flex flex-col">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-neon-cyan" />
            <span className="text-sm font-semibold">Lecture_4_Notes.md</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-8">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-8">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="prose prose-invert max-w-none">
            <Streamdown>{mockContent}</Streamdown>
          </div>

          {/* Ghost Text Suggestion */}
          <div className="mt-4 p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-neon-cyan mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-neon-cyan font-semibold mb-1">AI Suggestion</p>
                <p className="text-sm text-muted-foreground">
                  Would you like me to add a section about quantum entanglement? It's closely related to these topics.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-neon-cyan/30">
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </Card>

      {/* Research Panel */}
      <Card className="w-80 bg-card/30 border-border/50 flex flex-col">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-neon-purple" />
            <span className="text-sm font-semibold">Research Assistant</span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Research Block */}
            <div className="p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3 w-3 text-neon-purple" />
                <span className="text-xs font-semibold text-neon-purple">Active Research</span>
              </div>
              <p className="text-sm text-foreground mb-2">Quantum Computing Applications</p>
              <p className="text-xs text-muted-foreground mb-3">
                Found 3 relevant papers and 2 articles
              </p>
              <Button size="sm" variant="outline" className="w-full border-neon-purple/30 text-xs">
                Insert Summary
              </Button>
            </div>

            {/* Source Links */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Sources</h4>
              <div className="space-y-2">
                {[
                  { title: "Introduction to Quantum Mechanics", source: "MIT OpenCourseWare" },
                  { title: "Heisenberg Principle Explained", source: "Physics Today" },
                  { title: "Wave-Particle Duality", source: "Stanford Encyclopedia" }
                ].map((source, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-2 bg-card/50 hover:bg-card/70 border border-border/50 rounded-lg transition-colors"
                  >
                    <p className="text-xs font-medium text-foreground">{source.title}</p>
                    <p className="text-xs text-muted-foreground">{source.source}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator className="bg-border/50" />

        <div className="p-3">
          <Button size="sm" className="w-full bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50">
            <Search className="h-3 w-3 mr-1" />
            New Research
          </Button>
        </div>
      </Card>
    </div>
  );
}
