/**
 * Prototype Page
 * 
 * Demonstrates the three display modes with smooth transitions.
 * This is M0.3: Prototype 1 - Display Mode Transitions
 */

import React from 'react';
import { UniversalShell } from '../../../../../packages/display/UniversalShell';
import { ModeLayoutManager } from '../../../../../packages/display/ModeLayoutManager';
import { useMavinStore } from '../../../../../packages/shared/store';
import type { DisplayMode } from '../../../../../packages/shared/types';
import { Button } from '@/components/ui/button';

export default function Prototype() {
  const displayMode = useMavinStore((state) => state.display.currentMode);
  const setDisplayMode = useMavinStore((state) => state.setDisplayMode);
  const setTransitioning = useMavinStore((state) => state.setTransitioning);

  const handleModeChange = (mode: DisplayMode) => {
    setTransitioning(true);
    setDisplayMode(mode);
    setTimeout(() => setTransitioning(false), 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background content (simulates main app) */}
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Mavin Display Mode Prototype
        </h1>
        
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-purple-500/30 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Current Mode: {displayMode.toUpperCase()}</h2>
            
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => handleModeChange('focus')}
                variant={displayMode === 'focus' ? 'default' : 'outline'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Focus Mode
              </Button>
              <Button
                onClick={() => handleModeChange('companion')}
                variant={displayMode === 'companion' ? 'default' : 'outline'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Companion Mode
              </Button>
              <Button
                onClick={() => handleModeChange('ghost')}
                variant={displayMode === 'ghost' ? 'default' : 'outline'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Ghost Mode
              </Button>
            </div>

            <div className="space-y-4 text-slate-300">
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Focus Mode</h3>
                <p>Full-featured interface occupying 30% of the right side. Best for deep conversations and complex tasks.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Companion Mode</h3>
                <p>Compact corner widget (200x250px) for passive monitoring. Perfect for lectures and background assistance.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Ghost Mode</h3>
                <p>Minimal 80px orb that stays out of the way. Ideal when you need maximum focus on your work.</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-purple-500/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Design Features</h2>
            <ul className="space-y-2 text-slate-300 list-disc list-inside">
              <li>Smooth transitions with Framer Motion (300ms)</li>
              <li>Glassmorphism effect with backdrop blur</li>
              <li>Neon purple borders with glow effects</li>
              <li>Scanline animation for cyberpunk aesthetic</li>
              <li>Fixed positioning with proper z-index management</li>
              <li>Responsive behavior (adapts to screen size)</li>
            </ul>
          </div>

          <div className="p-6 bg-slate-900 border border-purple-500/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Performance Metrics</h2>
            <div className="space-y-2 text-slate-300">
              <p><strong>Target:</strong> 60fps transitions</p>
              <p><strong>Technique:</strong> GPU-accelerated transforms (translate, scale, opacity)</p>
              <p><strong>Optimization:</strong> AnimatePresence for smooth mount/unmount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mavin Interface */}
      <UniversalShell>
        <ModeLayoutManager>
          <MavinContent mode={displayMode} />
        </ModeLayoutManager>
      </UniversalShell>
    </div>
  );
}

// ============================================================================
// Mavin Content Component
// ============================================================================

interface MavinContentProps {
  mode: DisplayMode;
}

const MavinContent: React.FC<MavinContentProps> = ({ mode }) => {
  if (mode === 'ghost') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse" />
      </div>
    );
  }

  if (mode === 'companion') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <span className="text-sm font-semibold">Mavin</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-center text-slate-400">
          Companion mode active
        </div>
      </div>
    );
  }

  // Focus mode
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
        <div>
          <h3 className="font-semibold text-lg">Mavin</h3>
          <p className="text-xs text-slate-400">Your AI Companion</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
          <p className="text-sm">
            Hello! I'm Mavin, your digital companion. This is Focus Mode, where we can have in-depth conversations.
          </p>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
          <p className="text-sm text-slate-400">
            Try switching to Companion or Ghost mode using the buttons on the left.
          </p>
        </div>
      </div>

      <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-purple-500/20">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
        />
      </div>
    </div>
  );
};
