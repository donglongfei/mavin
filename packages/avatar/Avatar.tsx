/**
 * Avatar Component
 * 
 * Digital human avatar with state-based animations.
 * Supports multiple skins and emotions.
 * 
 * Design Philosophy (Cyberpunk Lab):
 * - Neon glow effects
 * - Smooth state transitions
 * - Breathing animation in idle state
 * - Responsive to AI state changes
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMavinStore, useAvatarState, useIsSpeaking, useIsListening } from '@mavin/shared';
import type { AvatarState, EmotionName } from '@mavin/shared';

interface AvatarProps {
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  size = 'medium', 
  showStatus = true,
  className = '' 
}) => {
  const avatarState = useAvatarState();
  const isSpeaking = useIsSpeaking();
  const isListening = useIsListening();
  const emotion = useMavinStore((state) => state.avatar.emotion);
  const skin = useMavinStore((state) => state.avatar.skin);

  // Determine current state based on flags
  const currentState: AvatarState = isSpeaking 
    ? 'speaking' 
    : isListening 
    ? 'listening' 
    : avatarState;

  const sizeConfig = getSizeConfig(size);
  const stateConfig = getStateConfig(currentState);

  return (
    <div className={`avatar-container ${className}`} style={{ position: 'relative' }}>
      {/* Main avatar circle */}
      <motion.div
        className="avatar-circle"
        animate={stateConfig.animation}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: sizeConfig.size,
          height: sizeConfig.size,
          borderRadius: '50%',
          background: getGradient(skin, emotion),
          boxShadow: stateConfig.glow,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Inner glow layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)',
          }}
        />

        {/* Scanline effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              rgba(139, 92, 246, 0.05) 0px,
              rgba(139, 92, 246, 0.05) 1px,
              transparent 1px,
              transparent 2px
            )`,
            animation: 'scanline 4s linear infinite',
          }}
        />

        {/* State indicator */}
        {showStatus && (
          <div
            style={{
              position: 'absolute',
              bottom: sizeConfig.statusBottom,
              right: sizeConfig.statusRight,
              width: sizeConfig.statusSize,
              height: sizeConfig.statusSize,
              borderRadius: '50%',
              background: stateConfig.statusColor,
              border: '2px solid rgba(15, 23, 42, 0.9)',
              boxShadow: `0 0 10px ${stateConfig.statusColor}`,
            }}
          />
        )}
      </motion.div>

      {/* Voice visualizer for speaking state */}
      {currentState === 'speaking' && (
        <VoiceWaveform size={sizeConfig.size} />
      )}

      {/* Listening ripple effect */}
      {currentState === 'listening' && (
        <ListeningRipple size={sizeConfig.size} />
      )}

      {/* Thinking particles */}
      {currentState === 'thinking' && (
        <ThinkingParticles size={sizeConfig.size} />
      )}

      <style jsx>{`
        @keyframes scanline {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Size Configurations
// ============================================================================

interface SizeConfig {
  size: number;
  statusSize: number;
  statusBottom: number;
  statusRight: number;
}

function getSizeConfig(size: 'small' | 'medium' | 'large'): SizeConfig {
  switch (size) {
    case 'small':
      return { size: 48, statusSize: 10, statusBottom: 2, statusRight: 2 };
    case 'medium':
      return { size: 96, statusSize: 16, statusBottom: 4, statusRight: 4 };
    case 'large':
      return { size: 160, statusSize: 24, statusBottom: 8, statusRight: 8 };
  }
}

// ============================================================================
// State Configurations
// ============================================================================

interface StateConfig {
  animation: any;
  glow: string;
  statusColor: string;
}

function getStateConfig(state: AvatarState): StateConfig {
  switch (state) {
    case 'idle':
      return {
        animation: { scale: [1, 1.02, 1] },
        glow: '0 0 30px rgba(139, 92, 246, 0.5)',
        statusColor: '#8b5cf6', // Purple
      };
    case 'listening':
      return {
        animation: { scale: [1, 1.05, 1] },
        glow: '0 0 40px rgba(251, 146, 60, 0.6)',
        statusColor: '#fb923c', // Orange
      };
    case 'thinking':
      return {
        animation: { rotate: [0, 5, -5, 0] },
        glow: '0 0 35px rgba(59, 130, 246, 0.5)',
        statusColor: '#3b82f6', // Blue
      };
    case 'speaking':
      return {
        animation: { scale: [1, 1.08, 1] },
        glow: '0 0 50px rgba(236, 72, 153, 0.7)',
        statusColor: '#ec4899', // Pink
      };
    default:
      return getStateConfig('idle');
  }
}

// ============================================================================
// Gradient Configurations
// ============================================================================

function getGradient(skin: string, emotion: EmotionName): string {
  // Base gradients by skin
  const skinGradients: Record<string, string> = {
    professional: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cartoon: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    minimal: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  };

  // Emotion modifiers (overlay)
  const emotionOverlays: Record<EmotionName, string> = {
    neutral: 'rgba(139, 92, 246, 0.3)',
    happy: 'rgba(251, 191, 36, 0.3)',
    sad: 'rgba(59, 130, 246, 0.3)',
    surprised: 'rgba(236, 72, 153, 0.3)',
    confused: 'rgba(168, 85, 247, 0.3)',
  };

  const baseGradient = skinGradients[skin] || skinGradients.professional;
  const overlay = emotionOverlays[emotion];

  return `${baseGradient}, ${overlay}`;
}

// ============================================================================
// Effect Components
// ============================================================================

const VoiceWaveform: React.FC<{ size: number }> = ({ size }) => {
  const bars = 8;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: -20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 4,
        alignItems: 'flex-end',
        height: 20,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: [8, 16, 8],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          style={{
            width: 3,
            background: 'linear-gradient(to top, #ec4899, #8b5cf6)',
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};

const ListeningRipple: React.FC<{ size: number }> = ({ size }) => {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size,
            height: size,
            borderRadius: '50%',
            border: '2px solid rgba(251, 146, 60, 0.5)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
};

const ThinkingParticles: React.FC<{ size: number }> = ({ size }) => {
  const particles = 6;
  return (
    <>
      {Array.from({ length: particles }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [-10, -30, -10],
            x: [0, Math.sin(i) * 15, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
          style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#3b82f6',
            boxShadow: '0 0 8px #3b82f6',
          }}
        />
      ))}
    </>
  );
};
