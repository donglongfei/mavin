/**
 * NotificationManager
 * 
 * Displays notifications in a queue with auto-dismiss.
 * Supports different priority levels and types.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMavinStore, useNotifications } from '@mavin/shared';
import type { Notification } from '@mavin/shared';

interface NotificationManagerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  position = 'top-right',
  maxVisible = 3,
}) => {
  const notifications = useNotifications();
  const removeNotification = useMavinStore((state) => state.removeNotification);

  // Auto-dismiss notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.autoDismiss !== false) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration || 5000);

        return () => clearTimeout(timeout);
      }
    });
  }, [notifications, removeNotification]);

  const positionStyles = getPositionStyles(position);
  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Notification Item Component
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const config = getNotificationConfig(notification.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        marginBottom: '12px',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          minWidth: '300px',
          maxWidth: '400px',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${config.borderColor}`,
          borderRadius: '12px',
          boxShadow: `0 0 20px ${config.glowColor}, inset 0 0 20px rgba(139, 92, 246, 0.1)`,
          color: '#e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Icon */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: config.iconBackground,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {config.icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {notification.title && (
              <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
                {notification.title}
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
              {notification.message}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onDismiss}
            style={{
              width: '20px',
              height: '20px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '16px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function getPositionStyles(position: string) {
  switch (position) {
    case 'top-right':
      return { top: '24px', right: '24px' };
    case 'top-left':
      return { top: '24px', left: '24px' };
    case 'bottom-right':
      return { bottom: '24px', right: '24px' };
    case 'bottom-left':
      return { bottom: '24px', left: '24px' };
    default:
      return { top: '24px', right: '24px' };
  }
}

interface NotificationConfig {
  borderColor: string;
  glowColor: string;
  iconBackground: string;
  icon: string;
}

function getNotificationConfig(priority: 'low' | 'medium' | 'high' | 'urgent'): NotificationConfig {
  switch (priority) {
    case 'low':
      return {
        borderColor: 'rgba(59, 130, 246, 0.3)',
        glowColor: 'rgba(59, 130, 246, 0.2)',
        iconBackground: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        icon: 'ℹ️',
      };
    case 'medium':
      return {
        borderColor: 'rgba(139, 92, 246, 0.3)',
        glowColor: 'rgba(139, 92, 246, 0.2)',
        iconBackground: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        icon: '💬',
      };
    case 'high':
      return {
        borderColor: 'rgba(251, 146, 60, 0.3)',
        glowColor: 'rgba(251, 146, 60, 0.2)',
        iconBackground: 'linear-gradient(135deg, #fb923c, #f97316)',
        icon: '⚠️',
      };
    case 'urgent':
      return {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        glowColor: 'rgba(239, 68, 68, 0.2)',
        iconBackground: 'linear-gradient(135deg, #ef4444, #dc2626)',
        icon: '🚨',
      };
    default:
      return getNotificationConfig('medium');
  }
}

// ============================================================================
// Notification Hook
// ============================================================================

export function useNotification() {
  const addNotification = useMavinStore((state) => state.addNotification);
  const removeNotification = useMavinStore((state) => state.removeNotification);

  const notify = (
    message: string,
    options?: {
      title?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      duration?: number;
      autoDismiss?: boolean;
    }
  ) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      title: options?.title,
      priority: options?.priority || 'medium',
      timestamp: Date.now(),
      duration: options?.duration,
      autoDismiss: options?.autoDismiss,
    };

    addNotification(notification);
    return notification.id;
  };

  return {
    notify,
    dismiss: removeNotification,
  };
}
