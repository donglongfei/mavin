/**
 * Service Status Component
 * Displays real-time health status for backend services
 */

import { useEffect, useState } from 'react';
import { ServiceHealth, ServiceHealthAPI } from '@/services/serviceHealth';
import { Activity, Server, Mic, MessageSquare, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface ServiceStatusProps {
  compact?: boolean;
  showLabels?: boolean;
  refreshInterval?: number; // in milliseconds, default 30000 (30s)
}

export default function ServiceStatus({
  compact = false,
  showLabels = true,
  refreshInterval = 30000
}: ServiceStatusProps) {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const health = await ServiceHealthAPI.getSystemHealth();
      setServices(health.services);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch service status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up polling
    const interval = setInterval(fetchStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'unavailable':
        return 'bg-gray-500';
      case 'starting':
        return 'bg-blue-500 animate-pulse';
      default:
        return 'bg-gray-400';
    }
  };

  const getServiceIcon = (type: ServiceHealth['type']) => {
    switch (type) {
      case 'ai':
        return <MessageSquare className="h-3 w-3" />;
      case 'tts':
        return <Activity className="h-3 w-3" />;
      case 'asr':
        return <Mic className="h-3 w-3" />;
      default:
        return <Server className="h-3 w-3" />;
    }
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Loading services...</span>
      </div>
    );
  }

  if (error && services.length === 0) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs">Service check failed</span>
      </div>
    );
  }

  if (compact) {
    // Compact mode: Just status dots
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1.5">
          {services.map((service) => (
            <Tooltip key={service.name}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    getStatusColor(service.status)
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(service.type)}
                    <span className="font-semibold">{service.displayName}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Status: <span className={cn(
                      'font-semibold',
                      service.status === 'healthy' && 'text-green-500',
                      service.status === 'degraded' && 'text-yellow-500',
                      service.status === 'error' && 'text-red-500',
                      service.status === 'unavailable' && 'text-gray-500',
                    )}>{service.status}</span>
                  </div>
                  {service.uptime && (
                    <div className="text-muted-foreground">
                      Uptime: {formatUptime(service.uptime)}
                    </div>
                  )}
                  {service.error && (
                    <div className="text-red-500 text-[10px] max-w-[200px]">
                      {service.error}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-1"
            onClick={fetchStatus}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </TooltipProvider>
    );
  }

  // Full mode: Service cards
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-neon-cyan" />
          <h3 className="text-sm font-semibold">Services</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={fetchStatus}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </Button>
      </div>

      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-card/30"
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                getStatusColor(service.status)
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {getServiceIcon(service.type)}
                <span className="text-xs font-medium truncate">
                  {service.displayName}
                </span>
              </div>
              {service.error && (
                <p className="text-[10px] text-red-500 truncate mt-0.5">
                  {service.error}
                </p>
              )}
              {service.uptime && !service.error && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Up: {formatUptime(service.uptime)}
                </p>
              )}
            </div>
            <span className={cn(
              'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
              service.status === 'healthy' && 'bg-green-500/20 text-green-500',
              service.status === 'degraded' && 'bg-yellow-500/20 text-yellow-500',
              service.status === 'error' && 'bg-red-500/20 text-red-500',
              service.status === 'unavailable' && 'bg-gray-500/20 text-gray-500',
              service.status === 'starting' && 'bg-blue-500/20 text-blue-500',
            )}>
              {service.status}
            </span>
          </div>
        ))}
      </div>

      {lastUpdate && (
        <p className="text-[10px] text-muted-foreground text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
