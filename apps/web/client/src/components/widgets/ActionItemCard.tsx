/**
 * Cyberpunk Lab - Action Item Card Widget
 * 
 * Features: Checkbox list with calendar integration
 * Design: Purple accents for user actions
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

interface ActionItemCardProps {
  title: string;
  items: ActionItem[];
}

export default function ActionItemCard({ title, items: initialItems }: ActionItemCardProps) {
  const [items, setItems] = useState(initialItems);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  return (
    <Card className="p-4 bg-card/50 border-neon-purple/30 hover:border-neon-purple/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {totalCount} completed
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-neon-purple/30">
          <Calendar className="h-3 w-3 mr-1" />
          Add to Calendar
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-2 bg-card/50 rounded-full overflow-hidden border border-border/50">
        <div 
          className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan transition-all duration-500"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-card/50 transition-colors"
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem(item.id)}
              className="mt-0.5 data-[state=checked]:bg-neon-purple data-[state=checked]:border-neon-purple"
            />
            <div className="flex-1">
              <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item.text}
              </p>
              {item.dueDate && (
                <Badge variant="outline" className="mt-1 text-xs border-neon-orange/30 text-neon-orange">
                  Due: {item.dueDate}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
