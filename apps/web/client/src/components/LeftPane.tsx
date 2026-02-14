/**
 * Cyberpunk Lab - Left Pane (Context Manager)
 *
 * Features: Global search, Project spheres, Live recording button
 * Design: Glassmorphic with cyan accents, hexagonal icons
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Radio,
  Folder,
  BookOpen,
  Palette,
  Code2,
  FileText,
  Beaker,
  Settings,
  FolderOpen,
  User
} from "lucide-react";
import { useState } from "react";
import ServiceStatusPanel from "./ServiceStatusPanel";
import { AvatarSettings } from "./AvatarSettings";

interface Project {
  id: string;
  name: string;
  category: string;
  icon: typeof BookOpen;
}

const mockProjects: Project[] = [
  { id: "1", name: "Physics 101", category: "Studies", icon: BookOpen },
  { id: "2", name: "History Notes", category: "Studies", icon: FileText },
  { id: "3", name: "Sci-Fi Novel", category: "Creative", icon: Palette },
  { id: "4", name: "Concept Art", category: "Creative", icon: Palette },
  { id: "5", name: "Mavin Dev", category: "Coding", icon: Code2 },
  { id: "6", name: "AI Research", category: "Research", icon: Beaker },
];

const categories = [
  { name: "Studies", icon: BookOpen, color: "text-neon-cyan" },
  { name: "Creative", icon: Palette, color: "text-neon-purple" },
  { name: "Coding", icon: Code2, color: "text-neon-cyan" },
  { name: "Research", icon: Beaker, color: "text-neon-purple" },
];

export default function LeftPane() {
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<'projects' | 'services'>('projects');
  const [avatarSettingsOpen, setAvatarSettingsOpen] = useState(false);

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
  };

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedProjects = categories.map(category => ({
    ...category,
    projects: filteredProjects.filter(p => p.category === category.name)
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 hexagon bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <span className="text-xs font-bold orbitron">M</span>
          </div>
          <h1 className="text-lg font-bold orbitron tracking-wider">MAVIN</h1>
        </div>

        {/* View Toggle & Avatar Settings */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-card/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${currentView === 'projects' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground'}`}
              onClick={() => setCurrentView('projects')}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${currentView === 'services' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground'}`}
              onClick={() => setCurrentView('services')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Avatar Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"
            onClick={() => setAvatarSettingsOpen(true)}
            title="Avatar Settings"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'projects' ? (
        <div className="flex flex-col flex-1 p-4 gap-4 overflow-hidden">
          {/* Live Recording Button */}
          <Button
            size="lg"
            className={`w-full orbitron font-semibold transition-all duration-300 ${
              isRecording
                ? "bg-neon-orange text-background pulse-recording"
                : "bg-card hover:bg-card/80 text-foreground border border-neon-orange/50 hover:border-neon-orange"
            }`}
            onClick={handleRecordingToggle}
          >
            <Radio className={`mr-2 h-5 w-5 ${isRecording ? "animate-pulse" : ""}`} />
            {isRecording ? "STOP CAPTURE" : "START CAPTURE"}
          </Button>

          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects... (⌘K)"
              className="pl-9 bg-card/50 border-border/50 focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Separator className="bg-border/50" />

          {/* Project Spheres */}
          <ScrollArea className="flex-1">
            <div className="space-y-6">
              {groupedProjects.map((category) => (
                category.projects.length > 0 && (
                  <div key={category.name}>
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className={`h-4 w-4 ${category.color}`} />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {category.name}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {category.projects.map((project) => {
                        const Icon = project.icon;
                        return (
                          <button
                            key={project.id}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-md bg-card border border-border/50 flex items-center justify-center group-hover:border-neon-cyan/50 transition-colors">
                              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                            </div>
                            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                              {project.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <ServiceStatusPanel />
      )}

      {/* Avatar Settings Dialog */}
      <AvatarSettings
        open={avatarSettingsOpen}
        onOpenChange={setAvatarSettingsOpen}
      />
    </div>
  );
}
