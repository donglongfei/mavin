/**
 * AnimationController
 * 
 * Manages avatar state transitions and animations.
 * Automatically updates avatar state based on AI activity.
 */

import { useEffect } from 'react';
import { useMavinStore } from '@mavin/shared';
import type { AvatarState } from '@mavin/shared';

export const AnimationController: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setAvatarState = useMavinStore((state) => state.setAvatarState);
  const isListening = useMavinStore((state) => state.input.isListening);
  const isSpeaking = useMavinStore((state) => state.output.isSpeaking);
  const pendingRequests = useMavinStore((state) => state.ai.pendingRequests);

  useEffect(() => {
    // Priority: speaking > listening > thinking > idle
    let newState: AvatarState;

    if (isSpeaking) {
      newState = 'speaking';
    } else if (isListening) {
      newState = 'listening';
    } else if (pendingRequests > 0) {
      newState = 'thinking';
    } else {
      newState = 'idle';
    }

    setAvatarState(newState);
  }, [isListening, isSpeaking, pendingRequests, setAvatarState]);

  return <>{children}</>;
};
