/**
 * Full Service Status Panel
 * Detailed view of all backend services with logs and controls
 */

import { useState, useEffect } from 'react';
import { ServiceHealth, ServiceHealthAPI, SystemHealth } from '@/services/serviceHealth';
import {
  Activity,
  Server,
  Mic,
  MessageSquare,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

export default function ServiceStatusPanel() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [restarting, setRestarting] = useState<Set<string>>(new Set());

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const health = await ServiceHealthAPI.getSystemHealth();
      setSystemHealth(health);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch service status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (serviceName: string) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceName)) {
        next.delete(serviceName);
      } else {
        next.add(serviceName);
      }
      return next;
    });
  };

  const handleRestart = async (serviceName: string) => {
    try {
      setRestarting((prev) => new Set(prev).add(serviceName));
      await ServiceHealthAPI.restartService(serviceName);

      // Wait a moment then refresh
      setTimeout(async () => {
        await fetchStatus();
        setRestarting((prev) => {
          const next = new Set(prev);
          next.delete(serviceName);
          return next;
        });
      }, 2000);
    } catch (err: any) {
      console.error('Failed to restart service:', err);
      setRestarting((prev) => {
        const next = new Set(prev);
        next.delete(serviceName);
        return next;
      });
    }
  };

  const getServiceIcon = (type: ServiceHealth['type']) => {
    switch (type) {
      case 'ai':
        return <MessageSquare className="h-4 w-4" />;
      case 'tts':
        return <Activity className="h-4 w-4" />;
      case 'asr':
        return <Mic className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'unavailable':
        return <MinusCircle className="h-4 w-4 text-gray-500" />;
      case 'starting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">Failed to load services</p>
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!systemHealth) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-neon-cyan" />
            <div>
              <h2 className="font-semibold orbitron text-sm">Service Status</h2>
              <p className="text-xs text-muted-foreground">
                Backend Health Monitor
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="p-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">System Health</span>
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-2',
            systemHealth.overall === 'healthy' && 'bg-green-500/20 text-green-500',
            systemHealth.overall === 'degraded' && 'bg-yellow-500/20 text-yellow-500',
            systemHealth.overall === 'error' && 'bg-red-500/20 text-red-500',
          )}>
            {systemHealth.overall === 'healthy' && <CheckCircle2 className="h-3 w-3" />}
            {systemHealth.overall === 'degraded' && <AlertTriangle className="h-3 w-3" />}
            {systemHealth.overall === 'error' && <XCircle className="h-3 w-3" />}
            {systemHealth.overall}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-lg font-semibold">{systemHealth.stats.total}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-green-500">Healthy</div>
            <div className="text-lg font-semibold text-green-500">
              {systemHealth.stats.healthy}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-yellow-500">Degraded</div>
            <div className="text-lg font-semibold text-yellow-500">
              {systemHealth.stats.degraded}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-red-500">Error</div>
            <div className="text-lg font-semibold text-red-500">
              {systemHealth.stats.error}
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {systemHealth.services.map((service) => {
            const isExpanded = expandedServices.has(service.name);
            const isRestarting = restarting.has(service.name);

            return (
              <div
                key={service.name}
                className="rounded-lg border border-border/50 bg-card/30 overflow-hidden"
              >
                {/* Service Header */}
                <div
                  className="p-3 cursor-pointer hover:bg-card/50 transition-colors"
                  onClick={() => toggleExpand(service.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(service.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(service.type)}
                          <span className="font-medium text-sm">
                            {service.displayName}
                          </span>
                        </div>
                        {service.error && (
                          <p className="text-xs text-red-500 mt-1 line-clamp-1">
                            {service.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-semibold uppercase px-2 py-1 rounded-full',
                        service.status === 'healthy' && 'bg-green-500/20 text-green-500',
                        service.status === 'degraded' && 'bg-yellow-500/20 text-yellow-500',
                        service.status === 'error' && 'bg-red-500/20 text-red-500',
                        service.status === 'unavailable' && 'bg-gray-500/20 text-gray-500',
                        service.status === 'starting' && 'bg-blue-500/20 text-blue-500',
                      )}>
                        {service.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-3 bg-background/50 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-medium">{service.type.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="ml-2 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatUptime(service.uptime)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Last Check:</span>
                        <span className="ml-2 font-medium">
                          {service.lastCheck.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {service.metadata && Object.keys(service.metadata).length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-xs font-semibold mb-2">Details</div>
                          <div className="space-y-1 text-xs">
                            {Object.entries(service.metadata).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="text-muted-foreground min-w-[80px]">
                                  {key}:
                                </span>
                                <span className="font-mono">
                                  {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {service.error && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-xs font-semibold text-red-500 mb-1">Error</div>
                          <p className="text-xs text-red-500 font-mono bg-red-500/10 p-2 rounded">
                            {service.error}
                          </p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestart(service.name);
                      }}
                      disabled={isRestarting}
                    >
                      {isRestarting ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Restarting...
                        </>
                      ) : (
                        <>
                          <RotateCw className="h-3 w-3 mr-2" />
                          Restart Service
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 flex-shrink-0 text-center">
        <p className="text-xs text-muted-foreground">
          Auto-refresh every 30 seconds
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Last updated: {systemHealth.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
