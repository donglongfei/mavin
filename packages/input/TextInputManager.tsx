/**
 * TextInputManager
 * 
 * Manages text input with markdown support and auto-resize.
 * Provides a clean interface for chat-style text input.
 */

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { useMavinStore } from '@mavin/shared';

interface TextInputManagerProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export const TextInputManager: React.FC<TextInputManagerProps> = ({
  placeholder = 'Type a message...',
  onSubmit,
  disabled = false,
  maxLength = 2000,
  className = '',
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateLastInputTimestamp = useMavinStore((state) => state.updateLastInputTimestamp);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
      adjustHeight();
      updateLastInputTimestamp();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`text-input-container ${className}`} style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{
          width: '100%',
          minHeight: '44px',
          maxHeight: '200px',
          padding: '12px 50px 12px 16px',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#e2e8f0',
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        }}
      />

      {/* Send button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        style={{
          position: 'absolute',
          right: '8px',
          bottom: '8px',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: 'none',
          background: value.trim() && !disabled
            ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
            : 'rgba(100, 116, 139, 0.3)',
          color: '#fff',
          cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          fontSize: '16px',
        }}
        onMouseEnter={(e) => {
          if (value.trim() && !disabled) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ↑
      </button>

      {/* Character counter */}
      {value.length > maxLength * 0.8 && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            right: '8px',
            fontSize: '11px',
            color: value.length >= maxLength ? '#ef4444' : '#94a3b8',
          }}
        >
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Text Input Hook
// ============================================================================

export function useTextInput() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (text: string, onSuccess?: (text: string) => void) => {
    setIsSubmitting(true);
    try {
      if (onSuccess) {
        await onSuccess(text);
      }
      setInputValue('');
    } catch (error) {
      console.error('Failed to submit text:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    inputValue,
    setInputValue,
    isSubmitting,
    handleSubmit,
  };
}
