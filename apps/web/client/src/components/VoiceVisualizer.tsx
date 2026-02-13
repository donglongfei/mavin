/**
 * Cyberpunk Lab - Voice Visualizer Component
 * 
 * Features: Real-time audio waveform visualization
 * Design: Animated bars with neon colors
 */

import { useEffect, useState } from "react";

interface VoiceVisualizerProps {
  isActive: boolean;
  color?: "cyan" | "purple" | "orange";
}

export default function VoiceVisualizer({ isActive, color = "cyan" }: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(40).fill(30));

  useEffect(() => {
    if (!isActive) {
      setBars(Array(40).fill(30));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 60 + 20));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const colorClass = {
    cyan: "bg-neon-cyan",
    purple: "bg-neon-purple",
    orange: "bg-neon-orange"
  }[color];

  return (
    <div className="h-full flex items-center justify-center gap-1 px-2">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1 ${colorClass} rounded-full transition-all duration-100`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
