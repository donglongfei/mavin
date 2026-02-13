/**
 * Cyberpunk Lab - Deep Dive Card Widget
 * 
 * Features: Research progress indicator with source links
 * Design: Cyan accents with animated loading states
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  FileText, 
  ExternalLink,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface ResearchStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
}

interface Source {
  title: string;
  url: string;
  type: string;
}

interface DeepDiveCardProps {
  query: string;
  steps: ResearchStep[];
  sources?: Source[];
  summary?: string;
}

export default function DeepDiveCard({ 
  query, 
  steps, 
  sources = [], 
  summary 
}: DeepDiveCardProps) {
  const isCompleted = steps.every(step => step.status === "completed");

  return (
    <Card className="p-4 bg-card/50 border-neon-cyan/30 hover:border-neon-cyan/50 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
          <Search className="h-5 w-5 text-neon-cyan" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Deep Research</h3>
          <p className="text-xs text-muted-foreground">{query}</p>
        </div>
      </div>

      {/* Research Steps */}
      <div className="space-y-3 mb-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {step.status === "completed" && (
                <CheckCircle2 className="h-4 w-4 text-neon-cyan" />
              )}
              {step.status === "active" && (
                <Loader2 className="h-4 w-4 text-neon-cyan animate-spin" />
              )}
              {step.status === "pending" && (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
            </div>
            <span className={`text-sm ${
              step.status === "completed" 
                ? "text-foreground" 
                : step.status === "active"
                ? "text-neon-cyan"
                : "text-muted-foreground"
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {summary && isCompleted && (
        <>
          <Separator className="my-4 bg-border/50" />
          <div className="p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg mb-4">
            <h4 className="text-xs font-semibold text-neon-cyan mb-2">Summary</h4>
            <p className="text-sm text-foreground/80">{summary}</p>
          </div>
        </>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <>
          <Separator className="my-4 bg-border/50" />
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Sources ({sources.length})
            </h4>
            <div className="space-y-2">
              {sources.map((source, i) => (
                <button
                  key={i}
                  className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-card/50 transition-colors text-left group"
                >
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate group-hover:text-neon-cyan transition-colors">
                      {source.title}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs border-border/50">
                      {source.type}
                    </Badge>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Action Button */}
      {isCompleted && (
        <Button 
          size="sm" 
          className="w-full mt-4 bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50"
        >
          Insert into Document
        </Button>
      )}
    </Card>
  );
}
