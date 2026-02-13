/**
 * UniversalShell Component
 * 
 * Fixed positioning container that holds the Mavin interface.
 * Provides the base layer for all display modes.
 * 
 * Design Philosophy (Cyberpunk Lab):
 * - Fixed positioning with proper z-index management
 * - Neon purple borders and glow effects
 * - Scanline animation overlay
 * - Dark indigo-black background
 */

import React from 'react';
import { useMavinStore } from '@mavin/shared';

interface UniversalShellProps {
  children: React.ReactNode;
}

export const UniversalShell: React.FC<UniversalShellProps> = ({ children }) => {
  const displayMode = useMavinStore((state) => state.display.currentMode);

  return (
    <div
      className="universal-shell"
      data-mode={displayMode}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        pointerEvents: 'none', // Allow clicks to pass through to content below
        zIndex: 9999,
      }}
    >
      {/* Scanline overlay effect */}
      <div
        className="scanline-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            rgba(139, 92, 246, 0.03) 0px,
            rgba(139, 92, 246, 0.03) 1px,
            transparent 1px,
            transparent 2px
          )`,
          pointerEvents: 'none',
          animation: 'scanline 8s linear infinite',
        }}
      />

      {/* Main content container */}
      <div
        className="shell-content"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          pointerEvents: 'auto', // Re-enable pointer events for Mavin UI
        }}
      >
        {children}
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .universal-shell {
          font-family: 'Orbitron', 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};
