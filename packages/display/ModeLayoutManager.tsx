/**
 * ModeLayoutManager Component
 * 
 * Manages the layout for each display mode:
 * - Focus Mode: 30% right panel (400px wide)
 * - Companion Mode: 150x200px corner widget (bottom-right)
 * - Ghost Mode: 80px orb (bottom-right)
 * 
 * Design Philosophy (Cyberpunk Lab):
 * - Neon purple borders with glow
 * - Dark translucent backgrounds (glassmorphism)
 * - Smooth transitions between modes
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMavinStore } from '@mavin/shared';
import type { DisplayMode } from '@mavin/shared';

interface ModeLayoutManagerProps {
  children: React.ReactNode;
}

export const ModeLayoutManager: React.FC<ModeLayoutManagerProps> = ({ children }) => {
  const displayMode = useMavinStore((state) => state.display.currentMode);
  const isTransitioning = useMavinStore((state) => state.display.isTransitioning);

  const layoutConfig = getLayoutConfig(displayMode);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayMode}
        className={`mode-layout mode-${displayMode}`}
        initial={layoutConfig.initial}
        animate={layoutConfig.animate}
        exit={layoutConfig.exit}
        transition={layoutConfig.transition}
        style={{
          position: 'fixed',
          ...layoutConfig.style,
          background: 'rgba(15, 23, 42, 0.95)', // Dark indigo-black with transparency
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139, 92, 246, 0.3)', // Neon purple border
          boxShadow: `
            0 0 20px rgba(139, 92, 246, 0.4),
            inset 0 0 20px rgba(139, 92, 246, 0.1)
          `,
          borderRadius: layoutConfig.borderRadius,
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
            filter: 'blur(8px)',
            zIndex: -1,
            borderRadius: layoutConfig.borderRadius,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            padding: layoutConfig.padding,
            color: '#e2e8f0', // Light text
          }}
        >
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// Layout Configurations
// ============================================================================

interface LayoutConfig {
  style: React.CSSProperties;
  initial: any;
  animate: any;
  exit: any;
  transition: any;
  borderRadius: string;
  padding: string;
}

function getLayoutConfig(mode: DisplayMode): LayoutConfig {
  switch (mode) {
    case 'focus':
      return {
        style: {
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '30vw',
        },
        initial: { x: 400, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 400, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
        borderRadius: '0',
        padding: '24px',
      };

    case 'companion':
      return {
        style: {
          bottom: '24px',
          right: '24px',
          width: '200px',
          height: '250px',
        },
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
        borderRadius: '16px',
        padding: '16px',
      };

    case 'ghost':
      return {
        style: {
          bottom: '24px',
          right: '24px',
          width: '80px',
          height: '80px',
        },
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 },
        transition: { duration: 0.2, ease: 'easeOut' },
        borderRadius: '50%',
        padding: '8px',
      };

    default:
      return getLayoutConfig('focus');
  }
}
