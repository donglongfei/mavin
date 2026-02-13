/**
 * Cyberpunk Lab - Canvas View (Best for Artists)
 * 
 * Features: Infinite whiteboard with draggable cards, mood board layout
 * Design: Non-linear thinking space with floating elements
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Image as ImageIcon, 
  Palette, 
  Sparkles,
  Plus,
  Move
} from "lucide-react";

interface CanvasItem {
  id: string;
  type: "image" | "text" | "reference";
  title: string;
  content: string;
  position: { x: number; y: number };
  imageUrl?: string;
}

const mockCanvasItems: CanvasItem[] = [
  {
    id: "1",
    type: "image",
    title: "Character Concept",
    content: "Cyberpunk warrior design",
    position: { x: 100, y: 100 },
    imageUrl: "https://private-us-east-1.manuscdn.com/sessionFile/E5kZLvn0ZX2tiR2Gu5TkGV/sandbox/xCaJ8YSjBMejzEZDLSaSNI-img-2_1770949902000_na1fn_YWktYXNzaXN0YW50LXZpc3VhbA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRTVrWkx2bjBaWDJ0aVIyR3U1VGtHVi9zYW5kYm94L3hDYUo4WVNqQk1lanpFWkRMU2FTTkktaW1nLTJfMTc3MDk0OTkwMjAwMF9uYTFmbl9ZV2t0WVhOemFYTjBZVzUwTFhacGMzVmhiQS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oPIFO7Ue6cMUZBFCDUZdrPToML9F3t475hklBxKic298t5S85B~KXrSwJOpO0ECqolKBLK~kYl2E509tjmpcmol5grezW79jo3ol8bxS5KWo6LCmb4AxPlsbi3WgValP7RmIh2ibjPpaWtoWft4h2w6VZArBDEvkMRMKvGc61lfFduWSvQKp2thYcWJEsUHAtvWHJ-F6H0HyyC~zqfCFCKXITJ1oVS20YHSe3OEvjmS4KcdqxzGanseQIfXyo4eA50OuspcQSw4ZqYIo~dM1Wrttb30sr3qpnj5pNtK2Nnr4l~msEPKPMIAfuzNUvf28h85neGe93~lfEAnfFCbUww__"
  },
  {
    id: "2",
    type: "text",
    title: "Story Notes",
    content: "Protagonist discovers hidden AI network in abandoned city sector",
    position: { x: 400, y: 150 }
  },
  {
    id: "3",
    type: "reference",
    title: "Color Palette",
    content: "Neon cyan, purple, orange - cyberpunk aesthetic",
    position: { x: 100, y: 400 }
  }
];

export default function CanvasView() {
  return (
    <div className="relative h-[calc(100vh-200px)] bg-card/20 rounded-lg border border-border/50 overflow-hidden">
      {/* Canvas Background Grid */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button size="sm" className="bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50">
          <Plus className="h-4 w-4 mr-1" />
          Add Image
        </Button>
        <Button size="sm" className="bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50">
          <Palette className="h-4 w-4 mr-1" />
          Add Note
        </Button>
        <Button size="sm" className="bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Generate
        </Button>
      </div>

      {/* Canvas Items */}
      <div className="relative w-full h-full p-8">
        {mockCanvasItems.map((item) => (
          <Card
            key={item.id}
            className="absolute w-64 bg-card/80 backdrop-blur-sm border-border/50 hover:border-neon-cyan/50 transition-all cursor-move group"
            style={{
              left: `${item.position.x}px`,
              top: `${item.position.y}px`
            }}
          >
            {/* Move Handle */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-cyan/20 rounded-full border border-neon-cyan/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Move className="h-3 w-3 text-neon-cyan" />
            </div>

            <div className="p-4">
              {item.type === "image" && item.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-border/50">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                {item.type === "image" && <ImageIcon className="h-4 w-4 text-neon-cyan" />}
                {item.type === "text" && <Palette className="h-4 w-4 text-neon-purple" />}
                {item.type === "reference" && <Sparkles className="h-4 w-4 text-neon-orange" />}
                <h3 className="font-semibold text-sm">{item.title}</h3>
              </div>

              <p className="text-sm text-muted-foreground">{item.content}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Drag cards to arrange • Click + to add new elements • Ask Mavin to generate references
        </p>
      </div>
    </div>
  );
}
