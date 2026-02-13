/**
 * Cyberpunk Lab - Audio Player Card Widget
 * 
 * Features: Waveform visualization, chapter markers, transcribe button
 * Design: Neon cyan accents with glassmorphic card
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  FileText
} from "lucide-react";
import { useState } from "react";

interface AudioPlayerCardProps {
  title: string;
  duration: string;
  chapters?: { time: string; label: string }[];
}

export default function AudioPlayerCard({ 
  title, 
  duration, 
  chapters = [] 
}: AudioPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <Card className="p-4 bg-card/50 border-neon-cyan/30 hover:border-neon-cyan/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
            <Volume2 className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{duration}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-neon-cyan/30">
          <FileText className="h-3 w-3 mr-1" />
          Transcribe
        </Button>
      </div>

      {/* Waveform Visualization (Simulated) */}
      <div className="mb-4 h-16 bg-card/50 rounded-lg border border-border/50 overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
          {Array.from({ length: 60 }).map((_, i) => {
            const height = Math.random() * 60 + 20;
            const isActive = i < (currentTime / 100) * 60;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${
                  isActive ? "bg-neon-cyan" : "bg-muted"
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Progress Slider */}
      <div className="mb-4">
        <Slider
          value={[currentTime]}
          onValueChange={(value) => setCurrentTime(value[0])}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0:00</span>
          <span>{duration}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          className="h-10 w-10 bg-neon-cyan hover:bg-neon-cyan/80 text-background glow-cyan"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Chapter Markers */}
      {chapters.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Chapters</h4>
          <div className="space-y-1">
            {chapters.map((chapter, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-card/50 transition-colors text-left"
              >
                <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                  {chapter.time}
                </Badge>
                <span className="text-xs text-foreground/80">{chapter.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
